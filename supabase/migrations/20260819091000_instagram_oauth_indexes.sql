-- Supports auth-user deletion without scanning every OAuth invitation.
create index if not exists instagram_oauth_invites_created_by_idx
  on public.instagram_oauth_invites (created_by)
  where created_by is not null;
