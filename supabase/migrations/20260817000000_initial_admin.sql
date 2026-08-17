-- Arena Sul Sports — administrative CMS foundation
-- Run with `supabase db push` or paste into the Supabase SQL editor.

create extension if not exists pgcrypto;
create schema if not exists private;

-- Keep future objects private until a migration grants the exact API contract.
-- Supabase projects can be configured to auto-expose new tables/functions;
-- changing the default ACL here makes that setting fail closed for this app.
do $$
declare
  owner_role text;
begin
  foreach owner_role in array array['postgres', 'supabase_admin']
  loop
    if exists (select 1 from pg_roles where rolname = owner_role)
      and (
        current_user = owner_role
        or pg_has_role(current_user, owner_role, 'MEMBER')
      ) then
      execute format(
        'alter default privileges for role %I in schema public revoke all privileges on tables from anon, authenticated',
        owner_role
      );
      execute format(
        'alter default privileges for role %I in schema public revoke all privileges on sequences from anon, authenticated',
        owner_role
      );
      execute format(
        'alter default privileges for role %I in schema public revoke execute on functions from public, anon, authenticated',
        owner_role
      );
    end if;
  end loop;
end;
$$;

do $$
begin
  create type public.event_status as enum ('draft', 'published');
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  title text not null check (char_length(title) between 3 and 120),
  excerpt text check (excerpt is null or char_length(excerpt) <= 240),
  description text not null check (char_length(description) between 20 and 10000),
  location text check (location is null or char_length(location) <= 180),
  starts_at timestamptz not null,
  ends_at timestamptz,
  status public.event_status not null default 'draft',
  published_at timestamptz,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  updated_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_valid_dates check (ends_at is null or ends_at >= starts_at),
  constraint events_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create unique index if not exists events_slug_lower_unique
  on public.events (lower(slug));
create index if not exists events_public_listing_idx
  on public.events (status, published_at, starts_at desc);

create table if not exists public.event_photos (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  storage_path text not null unique,
  original_name text not null check (char_length(original_name) <= 255),
  alt_text text not null default '' check (char_length(alt_text) <= 240),
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  size_bytes bigint not null check (size_bytes between 0 and 10485760),
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  display_order integer not null default 0 check (display_order >= 0),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists event_photos_event_order_idx
  on public.event_photos (event_id, display_order, created_at);
create index if not exists events_created_by_idx
  on public.events (created_by)
  where created_by is not null;
create index if not exists events_updated_by_idx
  on public.events (updated_by)
  where updated_by is not null;
create index if not exists event_photos_created_by_idx
  on public.event_photos (created_by)
  where created_by is not null;

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  is_public boolean not null default false,
  updated_by uuid default auth.uid() references auth.users (id) on delete set null,
  updated_at timestamptz not null default now()
);

create index if not exists site_settings_updated_by_idx
  on public.site_settings (updated_by)
  where updated_by is not null;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admins
    where user_id = auth.uid()
  );
$$;

revoke all on function private.is_admin() from public;
revoke all on function private.is_admin() from anon;
grant usage on schema private to authenticated;
grant execute on function private.is_admin() to authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_event_publication_state()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'published'::public.event_status then
    if tg_op = 'INSERT' or old.status <> 'published'::public.event_status or new.published_at is null then
      new.published_at = now();
    end if;
  else
    new.published_at = null;
  end if;
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.set_event_publication_state()
  from public, anon, authenticated;

drop trigger if exists events_set_updated_at on public.events;
create trigger events_set_updated_at
before update on public.events
for each row execute function public.set_updated_at();

drop trigger if exists events_set_publication_state on public.events;
create trigger events_set_publication_state
before insert or update on public.events
for each row execute function public.set_event_publication_state();

drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at
before update on public.site_settings
for each row execute function public.set_updated_at();

alter table public.admins enable row level security;
alter table public.events enable row level security;
alter table public.event_photos enable row level security;
alter table public.site_settings enable row level security;

create policy "admins can read own membership"
on public.admins
for select
to authenticated
using (user_id = (select auth.uid()));

create policy "published events are public"
on public.events
for select
to anon, authenticated
using (
  status = 'published'::public.event_status
  and published_at is not null
  and published_at <= now()
);

create policy "admins manage events"
on public.events
for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "published event photos are public"
on public.event_photos
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.events
    where events.id = event_photos.event_id
      and events.status = 'published'::public.event_status
      and events.published_at is not null
      and events.published_at <= now()
  )
);

create policy "admins manage event photos"
on public.event_photos
for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "public settings are readable"
on public.site_settings
for select
to anon, authenticated
using (is_public = true);

create policy "admins manage site settings"
on public.site_settings
for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

-- Supabase projects can inherit broad default table grants for API roles.
-- Remove them completely before granting the narrow application contract
-- below. In particular, TRUNCATE is not constrained by row-level security.
revoke all privileges on table
  public.admins,
  public.events,
  public.event_photos,
  public.site_settings
from anon, authenticated;

grant select (
  id, slug, title, excerpt, description, location, starts_at, ends_at,
  status, published_at, created_at, updated_at
) on public.events to anon, authenticated;
grant select (
  id, event_id, storage_path, alt_text, mime_type, size_bytes, width, height,
  display_order, created_at
) on public.event_photos to anon, authenticated;
grant select (original_name) on public.event_photos to authenticated;
grant select (key, value, is_public, updated_at)
  on public.site_settings to anon, authenticated;
grant insert, update, delete
  on public.events, public.event_photos, public.site_settings to authenticated;
grant select on public.admins to authenticated;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'event-photos',
  'event-photos',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public reads require both a registered event_photos row and a published
-- parent event. Uploads that are still being staged, or become orphaned after
-- a failed save, remain private even when their folder belongs to an event
-- that is already published. Admins can access all files.
create policy "published event storage is readable"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'event-photos'
  and storage.allow_any_operation(
    array['object.get_authenticated_info', 'object.get_authenticated']
  )
  and exists (
    select 1
    from public.event_photos
    join public.events on events.id = event_photos.event_id
    where event_photos.storage_path = storage.objects.name
      and events.status = 'published'::public.event_status
      and events.published_at is not null
      and events.published_at <= now()
  )
);

create policy "admins read event storage"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'event-photos'
  and (select private.is_admin())
);

create policy "admins upload event photos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'event-photos'
  and (select private.is_admin())
  and (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
);

create policy "admins update event photos"
on storage.objects
for update
to authenticated
using (bucket_id = 'event-photos' and (select private.is_admin()))
with check (bucket_id = 'event-photos' and (select private.is_admin()));

create policy "admins delete event photos"
on storage.objects
for delete
to authenticated
using (bucket_id = 'event-photos' and (select private.is_admin()));

insert into public.site_settings (key, value, is_public)
values (
  'instagram',
  '{"handle":"@arenasulsports","url":"https://www.instagram.com/arenasulsports/"}'::jsonb,
  true
)
on conflict (key) do nothing;

-- This SECURITY DEFINER event-trigger helper belongs to Supabase's DDL
-- machinery and is not an application RPC. API roles do not need to invoke it.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    execute
      'revoke execute on function public.rls_auto_enable() from public, anon, authenticated';
  end if;
end;
$$;
