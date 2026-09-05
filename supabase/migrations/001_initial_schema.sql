create extension if not exists pgcrypto;

create table public.site_profiles (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name_vi text not null,
  name_en text not null,
  country text not null,
  city text not null,
  description_vi text not null,
  description_en text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.bins (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.site_profiles(id) on delete cascade,
  code text not null,
  name_vi text not null,
  name_en text not null,
  color_name text not null,
  color_hex text not null,
  icon_key text not null,
  description_vi text not null,
  description_en text not null,
  sort_order integer not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (site_id, code)
);

create table public.materials (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name_vi text not null,
  name_en text not null,
  description_vi text not null,
  description_en text not null
);

create table public.waste_items (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name_vi text not null,
  name_en text not null,
  primary_material_id uuid not null references public.materials(id),
  object_type text not null,
  hazard_flag boolean not null default false,
  special_handling boolean not null default false,
  image_key text not null,
  is_active boolean not null default true,
  verification_status text not null check (
    verification_status in ('BASED_ON_LOCAL_GUIDANCE', 'PENDING_CONFIRMATION', 'VERIFIED_GUIDANCE', 'SUSPENDED')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.item_aliases (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.waste_items(id) on delete cascade,
  language text not null check (language in ('vi', 'en')),
  alias text not null,
  normalized_alias text not null,
  unique (item_id, language, normalized_alias)
);

create table public.disposal_rules (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.site_profiles(id) on delete cascade,
  item_id uuid not null references public.waste_items(id) on delete cascade,
  condition_key text not null,
  destination_bin_id uuid not null references public.bins(id),
  instruction_short_vi text not null,
  instruction_short_en text not null,
  instruction_detailed_vi text not null,
  instruction_detailed_en text not null,
  preparation_steps_vi jsonb not null default '[]'::jsonb,
  preparation_steps_en jsonb not null default '[]'::jsonb,
  warning_vi text,
  warning_en text,
  component_actions jsonb not null default '[]'::jsonb,
  priority integer not null default 100,
  verification_status text not null check (
    verification_status in ('BASED_ON_LOCAL_GUIDANCE', 'PENDING_CONFIRMATION', 'VERIFIED_GUIDANCE', 'SUSPENDED')
  ),
  source_reference text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.condition_questions (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.waste_items(id) on delete cascade,
  question_key text not null,
  question_vi text not null,
  question_en text not null,
  options jsonb not null default '[]'::jsonb,
  sort_order integer not null default 1,
  is_active boolean not null default true
);

create table public.reuse_suggestions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  item_id uuid references public.waste_items(id) on delete cascade,
  material_id uuid references public.materials(id),
  title_vi text not null,
  title_en text not null,
  summary_vi text not null,
  summary_en text not null,
  required_condition text[],
  prohibited_condition text[],
  steps_vi jsonb not null default '[]'::jsonb,
  steps_en jsonb not null default '[]'::jsonb,
  safety_note_vi text not null,
  safety_note_en text not null,
  difficulty text not null,
  estimated_minutes integer not null,
  priority integer not null default 100,
  verification_status text not null check (
    verification_status in ('BASED_ON_LOCAL_GUIDANCE', 'PENDING_CONFIRMATION', 'VERIFIED_GUIDANCE', 'SUSPENDED')
  ),
  is_active boolean not null default true
);

create table public.scan_events (
  id uuid primary key default gen_random_uuid(),
  site_id uuid references public.site_profiles(id),
  predicted_item_code text,
  confirmed_item_id uuid references public.waste_items(id),
  input_method text not null check (input_method in ('camera', 'upload', 'manual')),
  result_status text not null,
  destination_bin_id uuid references public.bins(id),
  error_code text,
  created_at timestamptz not null default now()
);

create index item_aliases_normalized_alias_idx on public.item_aliases using gin (to_tsvector('simple', normalized_alias));
create index disposal_rules_lookup_idx on public.disposal_rules (site_id, item_id, condition_key, is_active, priority desc);
create index scan_events_created_at_idx on public.scan_events (created_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger site_profiles_updated_at before update on public.site_profiles
for each row execute function public.set_updated_at();

create trigger bins_updated_at before update on public.bins
for each row execute function public.set_updated_at();

create trigger waste_items_updated_at before update on public.waste_items
for each row execute function public.set_updated_at();

create trigger disposal_rules_updated_at before update on public.disposal_rules
for each row execute function public.set_updated_at();

alter table public.site_profiles enable row level security;
alter table public.bins enable row level security;
alter table public.materials enable row level security;
alter table public.waste_items enable row level security;
alter table public.item_aliases enable row level security;
alter table public.disposal_rules enable row level security;
alter table public.condition_questions enable row level security;
alter table public.reuse_suggestions enable row level security;
alter table public.scan_events enable row level security;

create policy "Public can read active site profiles"
on public.site_profiles for select to anon, authenticated
using (is_active = true);

create policy "Public can read active bins"
on public.bins for select to anon, authenticated
using (is_active = true);

create policy "Public can read materials"
on public.materials for select to anon, authenticated
using (true);

create policy "Public can read active waste items"
on public.waste_items for select to anon, authenticated
using (is_active = true);

create policy "Public can read aliases for active items"
on public.item_aliases for select to anon, authenticated
using (exists (select 1 from public.waste_items where waste_items.id = item_aliases.item_id and waste_items.is_active = true));

create policy "Public can read active disposal rules"
on public.disposal_rules for select to anon, authenticated
using (is_active = true);

create policy "Public can read active condition questions"
on public.condition_questions for select to anon, authenticated
using (is_active = true);

create policy "Public can read active reuse suggestions"
on public.reuse_suggestions for select to anon, authenticated
using (is_active = true);

create policy "Anonymous users can insert scan events only"
on public.scan_events for insert to anon
with check (true);
