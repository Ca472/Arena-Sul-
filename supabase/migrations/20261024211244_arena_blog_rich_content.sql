-- Visual articles coexist with the original Markdown articles.
alter table public.blog_posts
  add column content_format text not null default 'markdown'
    check (content_format in ('markdown', 'richtext')),
  add column inline_image_paths text[] not null default '{}';

alter table public.blog_posts
  drop constraint blog_posts_content_check,
  add constraint blog_posts_content_check check (
    char_length(content) <= case when content_format = 'richtext' then 300000 else 80000 end
  ),
  add constraint blog_posts_rich_content_shape check (
    case when content_format = 'richtext' then coalesce((
      jsonb_typeof(content::jsonb) = 'object'
      and content::jsonb ->> 'type' = 'doc'
      and jsonb_typeof(content::jsonb -> 'content') = 'array'
    ), false) else true end
  ),
  add constraint blog_posts_inline_image_paths check (
    cardinality(inline_image_paths) <= 20
    and coalesce(array_ndims(inline_image_paths), 1) = 1
    and array_position(inline_image_paths, null) is null
    and (
      cardinality(inline_image_paths) = 0 or array_to_string(inline_image_paths, ',') ~ (
        '^' || id::text || '/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|png|webp)'
        || '(,' || id::text || '/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|png|webp))*$'
      )
    )
    and (content_format = 'richtext' or cardinality(inline_image_paths) = 0)
  ),
  drop constraint blog_posts_publication_state,
  add constraint blog_posts_publication_state check (
    (status = 'draft' and published_at is null)
    or (status = 'published' and published_at is not null
      and char_length(btrim(title)) >= 3
      and char_length(btrim(excerpt)) >= 20
      and (content_format = 'richtext' or char_length(btrim(content)) >= 80))
  );

-- The server derives image references from a validated document. These column
-- grants preserve the existing RLS boundary and keep audit identities private.
grant select (content_format, inline_image_paths) on public.blog_posts to anon, authenticated;
grant insert (content_format, inline_image_paths) on public.blog_posts to authenticated;
grant update (content_format, inline_image_paths) on public.blog_posts to authenticated;

drop policy "published blog covers are readable" on storage.objects;
create policy "published blog images are readable" on storage.objects for select
to anon, authenticated using (
  bucket_id = 'blog-images'
  and storage.allow_any_operation(array[
    'object.get_authenticated_info', 'object.get_authenticated', 'object.sign', 'object.sign_many'
  ])
  and exists (
    select 1 from public.blog_posts
    where (blog_posts.cover_storage_path = storage.objects.name
      or blog_posts.inline_image_paths @> array[storage.objects.name])
      and blog_posts.status = 'published' and blog_posts.published_at <= now()
  )
);
