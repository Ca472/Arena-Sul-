-- Only the latest generated authorization link remains usable.
create or replace function public.create_instagram_oauth_invite(
  p_token_hash text,
  p_expires_at timestamptz,
  p_created_by uuid
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_invite_id uuid;
begin
  if p_token_hash !~ '^[0-9a-f]{64}$'
    or p_expires_at <= now()
    or p_expires_at > now() + interval '2 days' then
    return null;
  end if;

  perform pg_advisory_xact_lock(hashtext('arena_sul_instagram_oauth_invite'));

  update public.instagram_oauth_invites
  set consumed_at = now()
  where consumed_at is null;

  insert into public.instagram_oauth_invites (
    token_hash,
    expires_at,
    created_by
  ) values (
    p_token_hash,
    p_expires_at,
    p_created_by
  )
  returning id into v_invite_id;

  return v_invite_id;
end;
$$;

revoke all on function public.create_instagram_oauth_invite(
  text,
  timestamptz,
  uuid
) from public, anon, authenticated;

grant execute on function public.create_instagram_oauth_invite(
  text,
  timestamptz,
  uuid
) to service_role;
