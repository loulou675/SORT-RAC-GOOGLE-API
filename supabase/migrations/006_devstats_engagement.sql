-- Extend the anonymous DevStats aggregate with engagement and retention metrics.
-- This returns aggregate-only data; no visitor IDs, images, or personal details
-- are exposed to the client.

create or replace function public.get_devstats(p_days integer default 30)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_days integer := greatest(1, least(coalesce(p_days, 30), 90));
  v_today date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
  v_start date;
  v_start_at timestamptz;
  v_daily jsonb;
  v_features jsonb;
  v_pages jsonb;
  v_devices jsonb;
  v_sources jsonb;
  v_frequency jsonb;
  v_totals jsonb;
  v_scan jsonb;
begin
  v_start := v_today - (v_days - 1);
  v_start_at := v_start::timestamp at time zone 'Asia/Ho_Chi_Minh';

  with
    filtered_sessions as (
      select *
      from public.site_analytics_sessions
      where started_at >= v_start_at
    ),
    filtered_events as (
      select *
      from public.site_analytics_events
      where occurred_at >= v_start_at
    ),
    session_metrics as (
      select
        s.*,
        exists (
          select 1
          from filtered_events e
          where e.session_id = s.id
            and e.event_name <> 'page_view'
        ) as has_meaningful_action,
        (
          s.page_views = 1
          and s.active_seconds < 10
          and not exists (
            select 1
            from filtered_events e
            where e.session_id = s.id
              and e.event_name <> 'page_view'
          )
        ) as is_bounce
      from filtered_sessions s
    ),
    period_visitors as (
      select distinct visitor_id from session_metrics
    ),
    visitor_first_seen as (
      select s.visitor_id, min(s.started_at) as first_seen
      from public.site_analytics_sessions s
      join period_visitors p on p.visitor_id = s.visitor_id
      group by s.visitor_id
    ),
    visitor_period as (
      select
        s.visitor_id,
        count(*)::integer as sessions,
        min(f.first_seen) as first_seen
      from session_metrics s
      join visitor_first_seen f on f.visitor_id = s.visitor_id
      group by s.visitor_id
    ),
    daily_session_totals as (
      select
        (s.started_at at time zone 'Asia/Ho_Chi_Minh')::date as date,
        count(distinct s.visitor_id)::integer as visitors,
        count(*)::integer as sessions,
        round(coalesce(avg(s.active_seconds), 0))::integer as avg_active_seconds,
        count(*) filter (where s.is_bounce)::integer as bounced_sessions,
        count(distinct s.visitor_id) filter (
          where (f.first_seen at time zone 'Asia/Ho_Chi_Minh')::date = (s.started_at at time zone 'Asia/Ho_Chi_Minh')::date
        )::integer as new_visitors,
        count(distinct s.visitor_id) filter (
          where (f.first_seen at time zone 'Asia/Ho_Chi_Minh')::date < (s.started_at at time zone 'Asia/Ho_Chi_Minh')::date
        )::integer as returning_visitors
      from session_metrics s
      join visitor_first_seen f on f.visitor_id = s.visitor_id
      group by 1
    ),
    daily_event_totals as (
      select
        (occurred_at at time zone 'Asia/Ho_Chi_Minh')::date as date,
        count(*) filter (where event_name <> 'page_view')::integer as feature_uses
      from filtered_events
      group by 1
    ),
    daily_series as (
      select
        day::date as date,
        coalesce(s.visitors, 0) as visitors,
        coalesce(s.sessions, 0) as sessions,
        coalesce(s.avg_active_seconds, 0) as avg_active_seconds,
        coalesce(e.feature_uses, 0) as feature_uses,
        coalesce(s.new_visitors, 0) as new_visitors,
        coalesce(s.returning_visitors, 0) as returning_visitors,
        case
          when coalesce(s.sessions, 0) = 0 then 0
          else round((s.bounced_sessions::numeric / s.sessions) * 100, 1)
        end as bounce_rate
      from generate_series(v_start, v_today, interval '1 day') day
      left join daily_session_totals s on s.date = day::date
      left join daily_event_totals e on e.date = day::date
    )
  select jsonb_agg(
    jsonb_build_object(
      'date', date,
      'visitors', visitors,
      'sessions', sessions,
      'avgActiveSeconds', avg_active_seconds,
      'featureUses', feature_uses,
      'newVisitors', new_visitors,
      'returningVisitors', returning_visitors,
      'bounceRate', bounce_rate
    ) order by date
  ) into v_daily
  from daily_series;

  with filtered_events as (
    select * from public.site_analytics_events where occurred_at >= v_start_at
  )
  select coalesce(jsonb_agg(
    jsonb_build_object('label', label, 'uses', uses) order by uses desc, label
  ), '[]'::jsonb) into v_features
  from (
    select coalesce(nullif(feature_code, ''), event_name) as label, count(*)::integer as uses
    from filtered_events
    where event_name <> 'page_view'
    group by 1
    order by uses desc, label
    limit 8
  ) ranked;

  with filtered_events as (
    select * from public.site_analytics_events where occurred_at >= v_start_at
  )
  select coalesce(jsonb_agg(
    jsonb_build_object('path', path, 'views', views) order by views desc, path
  ), '[]'::jsonb) into v_pages
  from (
    select path, count(*)::integer as views
    from filtered_events
    where event_name = 'page_view'
    group by path
    order by views desc, path
    limit 8
  ) ranked;

  with filtered_sessions as (
    select * from public.site_analytics_sessions where started_at >= v_start_at
  )
  select coalesce(jsonb_agg(
    jsonb_build_object('label', label, 'visitors', visitors) order by visitors desc, label
  ), '[]'::jsonb) into v_devices
  from (
    select device_category as label, count(distinct visitor_id)::integer as visitors
    from filtered_sessions
    group by device_category
    order by visitors desc, label
  ) ranked;

  with filtered_sessions as (
    select * from public.site_analytics_sessions where started_at >= v_start_at
  )
  select coalesce(jsonb_agg(
    jsonb_build_object('label', label, 'visitors', visitors) order by visitors desc, label
  ), '[]'::jsonb) into v_sources
  from (
    select coalesce(nullif(referrer_host, ''), 'Direct / unknown') as label,
      count(distinct visitor_id)::integer as visitors
    from filtered_sessions
    group by 1
    order by visitors desc, label
    limit 8
  ) ranked;

  with
    filtered_sessions as (
      select * from public.site_analytics_sessions where started_at >= v_start_at
    ),
    visitor_period as (
      select visitor_id, count(*)::integer as sessions
      from filtered_sessions
      group by visitor_id
    ),
    frequency as (
      select 1 as position, '1 session' as bucket, count(*) filter (where sessions = 1)::integer as visitors from visitor_period
      union all
      select 2, '2-3 sessions', count(*) filter (where sessions between 2 and 3)::integer from visitor_period
      union all
      select 3, '4-7 sessions', count(*) filter (where sessions between 4 and 7)::integer from visitor_period
      union all
      select 4, '8+ sessions', count(*) filter (where sessions >= 8)::integer from visitor_period
    )
  select coalesce(jsonb_agg(
    jsonb_build_object('bucket', bucket, 'visitors', coalesce(visitors, 0)) order by position
  ), '[]'::jsonb) into v_frequency
  from frequency;

  with
    filtered_sessions as (
      select * from public.site_analytics_sessions where started_at >= v_start_at
    ),
    filtered_events as (
      select * from public.site_analytics_events where occurred_at >= v_start_at
    ),
    session_metrics as (
      select
        s.*,
        (
          s.page_views = 1
          and s.active_seconds < 10
          and not exists (
            select 1 from filtered_events e
            where e.session_id = s.id and e.event_name <> 'page_view'
          )
        ) as is_bounce
      from filtered_sessions s
    ),
    period_visitors as (
      select distinct visitor_id from session_metrics
    ),
    visitor_first_seen as (
      select s.visitor_id, min(s.started_at) as first_seen
      from public.site_analytics_sessions s
      join period_visitors p on p.visitor_id = s.visitor_id
      group by s.visitor_id
    ),
    visitor_period as (
      select s.visitor_id, count(*)::integer as sessions, f.first_seen
      from session_metrics s
      join visitor_first_seen f on f.visitor_id = s.visitor_id
      group by s.visitor_id, f.first_seen
    )
  select jsonb_build_object(
    'visitors', (select count(*)::integer from visitor_period),
    'sessions', (select count(*)::integer from session_metrics),
    'avgActiveSeconds', (select round(coalesce(avg(active_seconds), 0))::integer from session_metrics),
    'featureUses', (select count(*) filter (where event_name <> 'page_view')::integer from filtered_events),
    'newVisitors', (select count(*) filter (where first_seen >= v_start_at)::integer from visitor_period),
    'returningVisitors', (select count(*) filter (where first_seen < v_start_at)::integer from visitor_period),
    'repeatVisitors', (select count(*) filter (where sessions >= 2)::integer from visitor_period),
    'engagedSessions', (select count(*) filter (where not is_bounce)::integer from session_metrics),
    'bounceRate', coalesce((select round((count(*) filter (where is_bounce)::numeric / nullif(count(*), 0)) * 100, 1) from session_metrics), 0),
    'repeatVisitRate', coalesce((select round((count(*) filter (where sessions >= 2)::numeric / nullif(count(*), 0)) * 100, 1) from visitor_period), 0),
    'engagementRate', coalesce((select round((count(*) filter (where not is_bounce)::numeric / nullif(count(*), 0)) * 100, 1) from session_metrics), 0),
    'avgSessionsPerVisitor', coalesce((select round((count(*)::numeric / nullif((select count(*) from visitor_period), 0)), 2) from session_metrics), 0)
  ) into v_totals;

  with filtered_events as (
    select * from public.site_analytics_events where occurred_at >= v_start_at
  ),
  scan_counts as (
    select
      count(*) filter (where event_name = 'feature_use' and feature_code in ('camera_scan', 'image_upload'))::integer as scan_starts,
      count(*) filter (where event_name = 'scan_success')::integer as scan_successes,
      count(*) filter (where event_name = 'scan_error')::integer as scan_errors,
      count(*) filter (where event_name = 'feedback_submitted')::integer as feedback_submissions,
      count(*) filter (where event_name = 'survey_submitted')::integer as survey_submissions
    from filtered_events
  )
  select jsonb_build_object(
    'scanStarts', scan_starts,
    'scanSuccesses', scan_successes,
    'scanErrors', scan_errors,
    'scanSuccessRate', coalesce(round((scan_successes::numeric / nullif(scan_successes + scan_errors, 0)) * 100, 1), 0),
    'feedbackSubmissions', feedback_submissions,
    'surveySubmissions', survey_submissions
  ) into v_scan
  from scan_counts;

  return jsonb_build_object(
    'periodDays', v_days,
    'generatedAt', now(),
    'totals', coalesce(v_totals, '{}'::jsonb),
    'scan', coalesce(v_scan, '{}'::jsonb),
    'daily', coalesce(v_daily, '[]'::jsonb),
    'visitFrequency', coalesce(v_frequency, '[]'::jsonb),
    'features', coalesce(v_features, '[]'::jsonb),
    'pages', coalesce(v_pages, '[]'::jsonb),
    'devices', coalesce(v_devices, '[]'::jsonb),
    'sources', coalesce(v_sources, '[]'::jsonb)
  );
end;
$$;

grant execute on function public.get_devstats(integer) to anon, authenticated;
