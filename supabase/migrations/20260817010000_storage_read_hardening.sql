-- Tighten public Storage reads while preserving the admin workflow for drafts.
--
-- Public visitors may resolve or download only files that are registered on a
-- published event. They cannot enumerate the bucket. Authenticated admins get
-- full read access so the dashboard can preview, update and remove draft media.

-- Projects created with broad default ACLs may grant API roles operations such
-- as TRUNCATE, which bypasses RLS. Rebuild the application-owner defaults
-- explicitly. Supabase executes migrations as `postgres`; that role cannot
-- change defaults owned by the platform-managed `supabase_admin` role.
alter default privileges for role postgres in schema public
  revoke all privileges on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all privileges on sequences from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;

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

create index if not exists events_created_by_idx
  on public.events (created_by)
  where created_by is not null;
create index if not exists events_updated_by_idx
  on public.events (updated_by)
  where updated_by is not null;
create index if not exists event_photos_created_by_idx
  on public.event_photos (created_by)
  where created_by is not null;
create index if not exists site_settings_updated_by_idx
  on public.site_settings (updated_by)
  where updated_by is not null;

revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.set_event_publication_state()
  from public, anon, authenticated;

drop policy if exists "admins can read own membership" on public.admins;

create policy "admins can read own membership"
on public.admins
for select
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "published event storage is readable" on storage.objects;

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

drop policy if exists "admins read event storage" on storage.objects;

create policy "admins read event storage"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'event-photos'
  and (select private.is_admin())
);

-- New Supabase projects may include this SECURITY DEFINER event-trigger helper.
-- It is an internal DDL helper, not an application RPC, so API roles do not
-- need permission to invoke it directly.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    execute
      'revoke execute on function public.rls_auto_enable() from public, anon, authenticated';
  end if;
end;
$$;
