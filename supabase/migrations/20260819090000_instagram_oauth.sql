-- Secure, single-account Instagram Business Login state.
-- OAuth tokens are encrypted by the application before they reach Postgres.

create table if not exists public.instagram_oauth_invites (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique
    check (token_hash ~ '^[0-9a-f]{64}$'),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint instagram_oauth_invites_valid_expiry
    check (expires_at > created_at)
);

create index if not exists instagram_oauth_invites_pending_idx
  on public.instagram_oauth_invites (expires_at)
  where consumed_at is null;

create table if not exists public.instagram_oauth_states (
  id uuid primary key default gen_random_uuid(),
  invite_id uuid not null
    references public.instagram_oauth_invites (id) on delete cascade,
  state_hash text not null unique
    check (state_hash ~ '^[0-9a-f]{64}$'),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint instagram_oauth_states_valid_expiry
    check (expires_at > created_at)
);

create index if not exists instagram_oauth_states_pending_idx
  on public.instagram_oauth_states (expires_at)
  where consumed_at is null;

alter table public.instagram_oauth_states
  add constraint instagram_oauth_states_invite_id_key unique (invite_id);

create table if not exists public.instagram_connections (
  id text primary key default 'arena-sul'
    check (id = 'arena-sul'),
  instagram_user_id text not null unique
    check (instagram_user_id ~ '^[0-9]+$'),
  username text not null
    check (username = 'arenasulsports'),
  token_ciphertext text not null,
  token_iv text not null,
  token_auth_tag text not null,
  token_key_version smallint not null default 1
    check (token_key_version = 1),
  scopes text[] not null default '{}'::text[],
  expires_at timestamptz not null,
  connected_at timestamptz not null default now(),
  last_refreshed_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists instagram_connections_set_updated_at
  on public.instagram_connections;
create trigger instagram_connections_set_updated_at
before update on public.instagram_connections
for each row execute function public.set_updated_at();

create or replace function public.protect_instagram_connection_identity()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.instagram_user_id is distinct from old.instagram_user_id
    or new.username is distinct from old.username then
    raise exception 'instagram connection identity is immutable';
  end if;

  new.connected_at := old.connected_at;
  return new;
end;
$$;

drop trigger if exists instagram_connections_protect_identity
  on public.instagram_connections;
create trigger instagram_connections_protect_identity
before update on public.instagram_connections
for each row execute function public.protect_instagram_connection_identity();

create or replace function public.consume_instagram_oauth_invite(
  p_invite_hash text,
  p_state_hash text,
  p_state_expires_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_invite_id uuid;
begin
  if p_invite_hash !~ '^[0-9a-f]{64}$'
    or p_state_hash !~ '^[0-9a-f]{64}$'
    or p_state_expires_at <= now()
    or p_state_expires_at > now() + interval '30 minutes' then
    return null;
  end if;

  select id
  into v_invite_id
  from public.instagram_oauth_invites
  where token_hash = p_invite_hash
    and consumed_at is null
    and expires_at > now()
  for update;

  if v_invite_id is null then
    return null;
  end if;

  update public.instagram_oauth_invites
  set consumed_at = now()
  where id = v_invite_id;

  insert into public.instagram_oauth_states (
    invite_id,
    state_hash,
    expires_at
  ) values (
    v_invite_id,
    p_state_hash,
    p_state_expires_at
  );

  return v_invite_id;
end;
$$;

alter table public.instagram_oauth_invites enable row level security;
alter table public.instagram_oauth_states enable row level security;
alter table public.instagram_connections enable row level security;

-- These tables are intentionally inaccessible to browser API roles. The
-- dedicated server-only service client is the sole application reader/writer.
revoke all privileges on table
  public.instagram_oauth_invites,
  public.instagram_oauth_states,
  public.instagram_connections
from public, anon, authenticated;

grant select, insert, update, delete on table
  public.instagram_oauth_invites,
  public.instagram_oauth_states,
  public.instagram_connections
to service_role;

revoke all on function public.consume_instagram_oauth_invite(
  text,
  text,
  timestamptz
) from public, anon, authenticated;

grant execute on function public.consume_instagram_oauth_invite(
  text,
  text,
  timestamptz
) to service_role;
