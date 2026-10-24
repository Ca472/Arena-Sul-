-- Blog articles belong to the existing administrative CMS. Nothing is seeded.
create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  title text not null default '' check (char_length(title) <= 120),
  excerpt text not null default '' check (char_length(excerpt) <= 240),
  content text not null default '' check (char_length(content) <= 80000),
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  cover_storage_path text,
  cover_alt text not null default '' check (char_length(cover_alt) <= 240),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  updated_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blog_posts_slug_format check (
    char_length(slug) between 3 and 160 and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  constraint blog_posts_cover_path check (
    cover_storage_path is null or (
      split_part(cover_storage_path, '/', 1) = id::text
      and cover_storage_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp)$'
    )
  ),
  constraint blog_posts_publication_state check (
    (status = 'draft' and published_at is null)
    or (status = 'published' and published_at is not null
      and char_length(btrim(title)) >= 3
      and char_length(btrim(excerpt)) >= 20
      and char_length(btrim(content)) >= 80)
  )
);

create unique index blog_posts_slug_unique on public.blog_posts (slug);
create index blog_posts_public_listing_idx on public.blog_posts (published_at desc, id desc)
  where status = 'published';
create index blog_posts_admin_listing_idx on public.blog_posts (updated_at desc);
create index blog_posts_created_by_idx on public.blog_posts (created_by) where created_by is not null;
create index blog_posts_updated_by_idx on public.blog_posts (updated_by) where updated_by is not null;

create function private.set_blog_publication_state()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'published' then
    if tg_op = 'INSERT' then
      new.published_at = now();
    elsif old.status <> 'published' then
      new.published_at = now();
    else
      new.published_at = old.published_at;
    end if;
  else
    new.published_at = null;
  end if;
  return new;
end;
$$;
revoke all on function private.set_blog_publication_state() from public, anon, authenticated;

create trigger blog_posts_set_publication_state before insert or update on public.blog_posts
for each row execute function private.set_blog_publication_state();
create trigger blog_posts_set_updated_at before update on public.blog_posts
for each row execute function public.set_updated_at();

alter table public.blog_posts enable row level security;
create policy "published blog posts are public" on public.blog_posts for select
to anon, authenticated using (status = 'published' and published_at <= now());
create policy "admins manage blog posts" on public.blog_posts for all to authenticated
using ((select private.is_admin())) with check ((select private.is_admin()));

-- Avoid broad inherited grants such as TRUNCATE, and keep author IDs private.
revoke all privileges on public.blog_posts from public, anon, authenticated;
grant select (
  id, slug, title, excerpt, content, status, published_at, cover_storage_path,
  cover_alt, created_at, updated_at
) on public.blog_posts to anon, authenticated;
grant insert (
  id, slug, title, excerpt, content, status, cover_storage_path, cover_alt,
  created_by, updated_by
) on public.blog_posts to authenticated;
grant update (
  slug, title, excerpt, content, status, cover_storage_path, cover_alt, updated_by
) on public.blog_posts to authenticated;
grant delete on public.blog_posts to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('blog-images', 'blog-images', false, 3145728, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = excluded.public,
  file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- Public signing/download requires the exact live cover reference. Staged,
-- orphaned, removed and draft images cannot be listed, signed or downloaded.
create policy "published blog covers are readable" on storage.objects for select
to anon, authenticated using (
  bucket_id = 'blog-images'
  and storage.allow_any_operation(array[
    'object.get_authenticated_info', 'object.get_authenticated', 'object.sign', 'object.sign_many'
  ])
  and exists (
    select 1 from public.blog_posts
    where blog_posts.cover_storage_path = storage.objects.name
      and blog_posts.status = 'published' and blog_posts.published_at <= now()
  )
);
create policy "admins read blog covers" on storage.objects for select to authenticated
using (bucket_id = 'blog-images' and (select private.is_admin()));
create policy "admins upload blog covers" on storage.objects for insert to authenticated
with check (
  bucket_id = 'blog-images' and (select private.is_admin())
  and name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|png|webp)$'
);
create policy "admins update blog covers" on storage.objects for update to authenticated
using (bucket_id = 'blog-images' and (select private.is_admin()))
with check (
  bucket_id = 'blog-images' and (select private.is_admin())
  and name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|png|webp)$'
);
create policy "admins delete blog covers" on storage.objects for delete to authenticated
using (bucket_id = 'blog-images' and (select private.is_admin()));
