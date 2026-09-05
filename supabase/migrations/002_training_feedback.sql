create extension if not exists pgcrypto;

create table if not exists public.training_feedback (
  id uuid primary key default gen_random_uuid(),
  client_record_id uuid not null unique,
  image_path text not null unique,
  predicted_item_code text,
  corrected_item_code text not null check (corrected_item_code ~ '^[a-z0-9_]+$'),
  input_method text check (input_method is null or input_method in ('camera', 'upload', 'manual')),
  error_code text,
  note text check (note is null or char_length(note) <= 500),
  consent_version text not null check (consent_version = 'feedback-v1'),
  review_status text not null default 'pending' check (
    review_status in ('pending', 'accepted', 'relabeled', 'unknown', 'rejected')
  ),
  client_created_at timestamptz not null,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

-- Older revisions linked corrections to the optional reference-data table.
-- Keep this queue independent so it also works without running seed.sql.
alter table public.training_feedback
drop constraint if exists training_feedback_corrected_item_code_fkey;

create index if not exists training_feedback_review_queue_idx
on public.training_feedback (review_status, created_at desc);

alter table public.training_feedback enable row level security;

revoke all on table public.training_feedback from anon, authenticated;
grant insert on table public.training_feedback to anon, authenticated;

drop policy if exists "Users can submit consented training feedback" on public.training_feedback;
create policy "Users can submit consented training feedback"
on public.training_feedback for insert to anon, authenticated
with check (
  consent_version = 'feedback-v1'
  and review_status = 'pending'
  and image_path like 'pending/%'
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('training-feedback', 'training-feedback', false, 1048576, array['image/jpeg'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can upload private training feedback images" on storage.objects;
create policy "Users can upload private training feedback images"
on storage.objects for insert to anon, authenticated
with check (
  bucket_id = 'training-feedback'
  and name ~ '^pending/[0-9]{4}-[0-9]{2}-[0-9]{2}/[0-9a-f-]{36}[.]jpg$'
);

-- There is intentionally no public SELECT policy. Review images through the
-- Supabase dashboard or a future authenticated reviewer application.
