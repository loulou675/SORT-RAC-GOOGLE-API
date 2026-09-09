-- Keep ONNX and Google API telemetry in the same Supabase project while
-- retaining a strict per-site reporting boundary.

alter table public.site_analytics_sessions
  add column if not exists site_id text not null default 'onnx';

alter table public.site_analytics_events
  add column if not exists site_id text not null default 'onnx';

-- Google API tracking was not configured before this migration. All existing
-- telemetry therefore belongs to the established ONNX sorter.
update public.site_analytics_sessions
set site_id = 'onnx'
where site_id is null or site_id not in ('onnx', 'google_api');

update public.site_analytics_events
set site_id = 'onnx'
where site_id is null or site_id not in ('onnx', 'google_api');

alter table public.site_analytics_sessions
  drop constraint if exists site_analytics_sessions_site_id_check;

alter table public.site_analytics_sessions
  add constraint site_analytics_sessions_site_id_check
  check (site_id in ('onnx', 'google_api'));

alter table public.site_analytics_events
  drop constraint if exists site_analytics_events_site_id_check;

alter table public.site_analytics_events
  add constraint site_analytics_events_site_id_check
  check (site_id in ('onnx', 'google_api'));

create index if not exists site_analytics_sessions_site_id_started_at_idx
  on public.site_analytics_sessions (site_id, started_at desc);

create index if not exists site_analytics_events_site_id_occurred_at_idx
  on public.site_analytics_events (site_id, occurred_at desc);

-- Keep the original 10-argument function available for already-deployed
-- ONNX clients. New clients pass p_site_id explicitly through this overload.
create or replace function public.record_site_session(
  p_id uuid,
  p_visitor_id uuid,
  p_started_at timestamptz,
  p_last_seen_at timestamptz,
  p_active_seconds integer,
  p_page_views integer,
  p_entry_path text,
  p_exit_path text,
  p_device_category text,
  p_referrer_host text,
  p_site_id text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_started_at > now() + interval '5 minutes'
    or p_started_at < now() - interval '24 hours'
    or p_last_seen_at < p_started_at
    or p_last_seen_at > now() + interval '5 minutes'
    or p_active_seconds not between 0 and 86400
    or p_page_views not between 1 and 10000
    or p_entry_path !~ '^/[A-Za-z0-9_/#?=&.%-]{0,119}$'
    or p_exit_path !~ '^/[A-Za-z0-9_/#?=&.%-]{0,119}$'
    or p_device_category not in ('mobile', 'tablet', 'desktop')
    or p_site_id not in ('onnx', 'google_api')
    or (p_referrer_host is not null and (
      char_length(p_referrer_host) > 120
      or p_referrer_host !~ '^[A-Za-z0-9.:-]+$'
    )) then
    raise exception 'Invalid analytics session payload';
  end if;

  if exists (
    select 1
    from public.site_analytics_sessions
    where id = p_id and site_id <> p_site_id
  ) then
    raise exception 'Analytics session belongs to another site';
  end if;

  insert into public.site_analytics_sessions (
    id,
    visitor_id,
    started_at,
    last_seen_at,
    active_seconds,
    page_views,
    entry_path,
    exit_path,
    device_category,
    referrer_host,
    site_id
  ) values (
    p_id,
    p_visitor_id,
    p_started_at,
    p_last_seen_at,
    p_active_seconds,
    p_page_views,
    left(p_entry_path, 120),
    left(p_exit_path, 120),
    p_device_category,
    nullif(lower(left(coalesce(p_referrer_host, ''), 120)), ''),
    p_site_id
  )
  on conflict (id) do update set
    last_seen_at = greatest(site_analytics_sessions.last_seen_at, excluded.last_seen_at),
    active_seconds = greatest(site_analytics_sessions.active_seconds, excluded.active_seconds),
    page_views = greatest(site_analytics_sessions.page_views, excluded.page_views),
    exit_path = excluded.exit_path,
    site_id = excluded.site_id;
end;
$$;

create or replace function public.record_site_feature(
  p_id uuid,
  p_session_id uuid,
  p_visitor_id uuid,
  p_occurred_at timestamptz,
  p_event_name text,
  p_feature_code text,
  p_path text,
  p_site_id text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_occurred_at > now() + interval '5 minutes'
    or p_occurred_at < now() - interval '24 hours'
    or p_event_name not in (
      'page_view',
      'feature_use',
      'scan_success',
      'scan_error',
      'feedback_submitted',
      'survey_submitted'
    )
    or p_feature_code !~ '^[a-z0-9_]{1,48}$'
    or p_path !~ '^/[A-Za-z0-9_/#?=&.%-]{0,119}$'
    or p_site_id not in ('onnx', 'google_api') then
    raise exception 'Invalid analytics event payload';
  end if;

  if not exists (
    select 1
    from public.site_analytics_sessions
    where id = p_session_id and site_id = p_site_id
  ) then
    raise exception 'Analytics session is not available for this site';
  end if;

  insert into public.site_analytics_events (
    id,
    session_id,
    visitor_id,
    occurred_at,
    event_name,
    feature_code,
    path,
    site_id
  ) values (
    p_id,
    p_session_id,
    p_visitor_id,
    p_occurred_at,
    p_event_name,
    p_feature_code,
    left(p_path, 120),
    p_site_id
  )
  on conflict (id) do nothing;
end;
$$;

create or replace function public.get_devstats(
  p_days integer,
  p_site_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
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
  if p_site_id not in ('onnx', 'google_api') then
    raise exception 'Unknown analytics site';
  end if;

  v_start := v_today - (v_days - 1);
  v_start_at := v_start::timestamp at time zone 'Asia/Ho_Chi_Minh';

  with
    filtered_sessions as (
      select *
      from public.site_analytics_sessions
      where site_id = p_site_id and started_at >= v_start_at
    ),
    filtered_events as (
      select *
      from public.site_analytics_events
      where site_id = p_site_id and occurred_at >= v_start_at
    ),
    session_metrics as (
      select
        s.*,
        (
          s.page_views = 1
          and s.active_seconds < 10
          and not exists (
            select 1
            from filtered_events e
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
      where s.site_id = p_site_id
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
    select * from public.site_analytics_events where site_id = p_site_id and occurred_at >= v_start_at
  )
  select coalesce(jsonb_agg(
    jsonb_build_object('label', label, 'code', label, 'uses', uses) order by uses desc, label
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
    select * from public.site_analytics_events where site_id = p_site_id and occurred_at >= v_start_at
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
    select * from public.site_analytics_sessions where site_id = p_site_id and started_at >= v_start_at
  )
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'label', label,
      'category', label,
      'visitors', visitors,
      'sessions', sessions
    ) order by visitors desc, label
  ), '[]'::jsonb) into v_devices
  from (
    select
      device_category as label,
      count(distinct visitor_id)::integer as visitors,
      count(*)::integer as sessions
    from filtered_sessions
    group by device_category
    order by visitors desc, label
  ) ranked;

  with filtered_sessions as (
    select * from public.site_analytics_sessions where site_id = p_site_id and started_at >= v_start_at
  )
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'label', label,
      'host', label,
      'visitors', visitors,
      'sessions', sessions
    ) order by visitors desc, label
  ), '[]'::jsonb) into v_sources
  from (
    select
      coalesce(nullif(referrer_host, ''), 'Direct / unknown') as label,
      count(distinct visitor_id)::integer as visitors,
      count(*)::integer as sessions
    from filtered_sessions
    group by 1
    order by visitors desc, label
    limit 8
  ) ranked;

  with
    filtered_sessions as (
      select * from public.site_analytics_sessions where site_id = p_site_id and started_at >= v_start_at
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
      select * from public.site_analytics_sessions where site_id = p_site_id and started_at >= v_start_at
    ),
    filtered_events as (
      select * from public.site_analytics_events where site_id = p_site_id and occurred_at >= v_start_at
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
      where s.site_id = p_site_id
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
    select * from public.site_analytics_events where site_id = p_site_id and occurred_at >= v_start_at
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
    'siteId', p_site_id,
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

revoke all on function public.record_site_session(uuid, uuid, timestamptz, timestamptz, integer, integer, text, text, text, text, text) from public;
revoke all on function public.record_site_feature(uuid, uuid, uuid, timestamptz, text, text, text, text) from public;
revoke all on function public.get_devstats(integer, text) from public;

grant execute on function public.record_site_session(uuid, uuid, timestamptz, timestamptz, integer, integer, text, text, text, text, text) to anon, authenticated;
grant execute on function public.record_site_feature(uuid, uuid, uuid, timestamptz, text, text, text, text) to anon, authenticated;
grant execute on function public.get_devstats(integer, text) to anon, authenticated;

notify pgrst, 'reload schema';
