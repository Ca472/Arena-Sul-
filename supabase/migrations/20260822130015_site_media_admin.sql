-- Client-managed photography for the Arena Sul institutional website.
-- Defaults remain in the application; this table stores only active overrides.

create table if not exists public.site_media (
  slot text primary key,
  storage_path text not null unique,
  original_name text not null check (char_length(original_name) between 1 and 255),
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  size_bytes bigint not null check (size_bytes between 1 and 10485760),
  width integer check (width is null or width between 1 and 50000),
  height integer check (height is null or height between 1 and 50000),
  updated_by uuid default auth.uid() references auth.users (id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint site_media_known_slot check (
    slot in (
      'team-julio-neto',
      'team-gett-lima',
      'team-edson-junior',
      'team-vinicius-alves',
      'team-wallacy',
      'home-about-overview',
      'home-tour-preview',
      'structure-sand-courts',
      'structure-aerial-view',
      'structure-sand-classes',
      'structure-barbecue',
      'structure-bar-kitchen',
      'structure-leisure',
      'structure-events',
      'modality-beach-tennis',
      'modality-futevolei',
      'modality-beach-volleyball',
      'modality-functional-class',
      'modality-society-football'
    )
  ),
  constraint site_media_path_matches_slot check (
    storage_path like slot || '/%'
  )
);

create index if not exists site_media_updated_by_idx
  on public.site_media (updated_by)
  where updated_by is not null;

drop trigger if exists site_media_set_updated_at on public.site_media;
create trigger site_media_set_updated_at
before update on public.site_media
for each row execute function public.set_updated_at();

alter table public.site_media enable row level security;

-- The browser never reads this table directly. Server-side code uses the
-- service role after the public route or an authenticated admin action has
-- selected the exact operation. This also keeps original filenames private.
revoke all privileges on table public.site_media
from public, anon, authenticated;
grant select, insert, update, delete on public.site_media to service_role;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'site-media',
  'site-media',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- No authenticated Storage policy is created. Uploads use short-lived signed
-- upload tokens minted by a Server Action only after checking public.admins.
-- Cleanup and replacement run with the server-only service role.
