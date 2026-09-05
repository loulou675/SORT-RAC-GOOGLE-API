create table if not exists public.site_analytics_sessions (
  id uuid primary key,
  visitor_id uuid not null,
  started_at timestamptz not null,
  last_seen_at timestamptz not null,
  active_seconds integer not null default 0 check (active_seconds between 0 and 86400),
  page_views integer not null default 1 check (page_views between 1 and 10000),
  entry_path text not null check (char_length(entry_path) between 1 and 120),
  exit_path text not null check (char_length(exit_path) between 1 and 120),
  device_category text not null check (device_category in ('mobile', 'tablet', 'desktop')),
  referrer_host text check (referrer_host is null or char_length(referrer_host) <= 120),
  created_at timestamptz not null default now()
);

create table if not exists public.site_analytics_events (
  id uuid primary key,
  session_id uuid not null references public.site_analytics_sessions(id) on delete cascade,
  visitor_id uuid not null,
  occurred_at timestamptz not null,
  event_name text not null check (event_name in (
    'page_view',
    'feature_use',
    'scan_success',
    'scan_error',
    'feedback_submitted',
    'survey_submitted'
  )),
  feature_code text not null check (feature_code ~ '^[a-z0-9_]{1,48}$'),
  path text not null check (char_length(path) between 1 and 120),
  created_at timestamptz not null default now()
);

create index if not exists site_analytics_sessions_started_at_idx
  on public.site_analytics_sessions (started_at desc);
create index if not exists site_analytics_sessions_visitor_id_idx
  on public.site_analytics_sessions (visitor_id, started_at desc);
create index if not exists site_analytics_events_occurred_at_idx
  on public.site_analytics_events (occurred_at desc);
create index if not exists site_analytics_events_feature_code_idx
  on public.site_analytics_events (feature_code, occurred_at desc);

alter table public.site_analytics_sessions enable row level security;
alter table public.site_analytics_events enable row level security;

revoke all on table public.site_analytics_sessions from anon, authenticated;
revoke all on table public.site_analytics_events from anon, authenticated;

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
  p_referrer_host text default null
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
    or (p_referrer_host is not null and (
      char_length(p_referrer_host) > 120
      or p_referrer_host !~ '^[A-Za-z0-9.:-]+$'
    )) then
    raise exception 'Invalid analytics session payload';
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
    referrer_host
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
    nullif(lower(left(coalesce(p_referrer_host, ''), 120)), '')
  )
  on conflict (id) do update set
    last_seen_at = greatest(site_analytics_sessions.last_seen_at, excluded.last_seen_at),
    active_seconds = greatest(site_analytics_sessions.active_seconds, excluded.active_seconds),
    page_views = greatest(site_analytics_sessions.page_views, excluded.page_views),
    exit_path = excluded.exit_path;
end;
$$;

create or replace function public.record_site_feature(
  p_id uuid,
  p_session_id uuid,
  p_visitor_id uuid,
  p_occurred_at timestamptz,
  p_event_name text,
  p_feature_code text,
  p_path text
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
    or p_path !~ '^/[A-Za-z0-9_/#?=&.%-]{0,119}$' then
    raise exception 'Invalid analytics event payload';
  end if;

  insert into public.site_analytics_events (
    id,
    session_id,
    visitor_id,
    occurred_at,
    event_name,
    feature_code,
    path
  ) values (
    p_id,
    p_session_id,
    p_visitor_id,
    p_occurred_at,
    p_event_name,
    p_feature_code,
    left(p_path, 120)
  )
  on conflict (id) do nothing;
end;
$$;

create or replace function public.get_devstats(p_days integer default 30)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_days integer := least(greatest(coalesce(p_days, 30), 1), 90);
  v_today date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
  v_start date := (now() at time zone 'Asia/Ho_Chi_Minh')::date - (least(greatest(coalesce(p_days, 30), 1), 90) - 1);
  v_result jsonb;
begin
  with
  filtered_sessions as (
    select *
    from public.site_analytics_sessions
    where started_at >= (v_start::timestamp at time zone 'Asia/Ho_Chi_Minh')
  ),
  filtered_events as (
    select *
    from public.site_analytics_events
    where occurred_at >= (v_start::timestamp at time zone 'Asia/Ho_Chi_Minh')
  ),
  calendar as (
    select generate_series(v_start, v_today, interval '1 day')::date as day
  ),
  daily_sessions as (
    select
      (started_at at time zone 'Asia/Ho_Chi_Minh')::date as day,
      count(distinct visitor_id)::integer as visitors,
      count(*)::integer as sessions,
      coalesce(round(avg(active_seconds)), 0)::integer as avg_active_seconds
    from filtered_sessions
    group by (started_at at time zone 'Asia/Ho_Chi_Minh')::date
  ),
  daily_events as (
    select (occurred_at at time zone 'Asia/Ho_Chi_Minh')::date as day, count(*)::integer as feature_uses
    from filtered_events
    where event_name <> 'page_view'
    group by (occurred_at at time zone 'Asia/Ho_Chi_Minh')::date
  ),
  daily_json as (
    select jsonb_agg(jsonb_build_object(
      'date', to_char(calendar.day, 'YYYY-MM-DD'),
      'visitors', coalesce(daily_sessions.visitors, 0),
      'sessions', coalesce(daily_sessions.sessions, 0),
      'avgActiveSeconds', coalesce(daily_sessions.avg_active_seconds, 0),
      'featureUses', coalesce(daily_events.feature_uses, 0)
    ) order by calendar.day) as value
    from calendar
    left join daily_sessions using (day)
    left join daily_events using (day)
  ),
  feature_json as (
    select coalesce(jsonb_agg(jsonb_build_object('code', feature_code, 'uses', uses) order by uses desc, feature_code), '[]'::jsonb) as value
    from (
      select feature_code, count(*)::integer as uses
      from filtered_events
      where event_name <> 'page_view'
      group by feature_code
      order by uses desc, feature_code
      limit 8
    ) ranked_features
  ),
  page_json as (
    select coalesce(jsonb_agg(jsonb_build_object('path', path, 'views', views) order by views desc, path), '[]'::jsonb) as value
    from (
      select path, count(*)::integer as views
      from filtered_events
      where event_name = 'page_view'
      group by path
      order by views desc, path
      limit 8
    ) ranked_pages
  ),
  device_json as (
    select coalesce(jsonb_agg(jsonb_build_object('category', device_category, 'sessions', sessions) order by sessions desc, device_category), '[]'::jsonb) as value
    from (
      select device_category, count(*)::integer as sessions
      from filtered_sessions
      group by device_category
    ) devices
  ),
  source_json as (
    select coalesce(jsonb_agg(jsonb_build_object('host', host, 'sessions', sessions) order by sessions desc, host), '[]'::jsonb) as value
    from (
      select coalesce(referrer_host, 'Direct / unknown') as host, count(*)::integer as sessions
      from filtered_sessions
      group by coalesce(referrer_host, 'Direct / unknown')
      order by sessions desc, host
      limit 6
    ) sources
  )
  select jsonb_build_object(
    'periodDays', v_days,
    'generatedAt', now(),
    'totals', jsonb_build_object(
      'visitors', (select count(distinct visitor_id)::integer from filtered_sessions),
      'sessions', (select count(*)::integer from filtered_sessions),
      'avgActiveSeconds', (select coalesce(round(avg(active_seconds)), 0)::integer from filtered_sessions),
      'featureUses', (select count(*)::integer from filtered_events where event_name <> 'page_view')
    ),
    'daily', daily_json.value,
    'features', feature_json.value,
    'pages', page_json.value,
    'devices', device_json.value,
    'sources', source_json.value
  ) into v_result
  from daily_json, feature_json, page_json, device_json, source_json;

  return v_result;
end;
$$;

revoke all on function public.record_site_session(uuid, uuid, timestamptz, timestamptz, integer, integer, text, text, text, text) from public;
revoke all on function public.record_site_feature(uuid, uuid, uuid, timestamptz, text, text, text) from public;
revoke all on function public.get_devstats(integer) from public;

grant execute on function public.record_site_session(uuid, uuid, timestamptz, timestamptz, integer, integer, text, text, text, text) to anon, authenticated;
grant execute on function public.record_site_feature(uuid, uuid, uuid, timestamptz, text, text, text) to anon, authenticated;
grant execute on function public.get_devstats(integer) to anon, authenticated;
