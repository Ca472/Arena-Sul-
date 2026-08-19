export type InstagramAccountIdentity = {
  userId: string;
  username: string;
};

export function validateInstagramAccountIdentity(
  profile: { user_id: string | number; username: string },
  expectedUsername: string,
): InstagramAccountIdentity | null {
  const username = profile.username.trim().toLowerCase();

  if (username !== expectedUsername.trim().toLowerCase()) {
    return null;
  }

  return {
    userId: String(profile.user_id),
    username,
  };
}
