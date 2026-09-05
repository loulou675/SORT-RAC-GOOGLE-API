create table if not exists public.user_surveys (
  id uuid primary key,
  survey_version text not null check (survey_version = 'survey-v1'),
  client_created_at timestamptz not null,
  input_method text not null check (input_method in ('camera', 'upload', 'manual')),
  predicted_item_code text,
  destination_bin_code text,
  scanning_ease text not null,
  guidance_clarity text not null,
  result_trust text not null,
  confusion_point text not null,
  confusion_details text check (confusion_details is null or char_length(confusion_details) <= 500),
  improvement_priority text not null,
  created_at timestamptz not null default now()
);

alter table public.user_surveys enable row level security;

grant insert on table public.user_surveys to anon, authenticated;

drop policy if exists "Anyone can submit survey responses" on public.user_surveys;
create policy "Anyone can submit survey responses"
  on public.user_surveys
  for insert
  to anon, authenticated
  with check (true);
