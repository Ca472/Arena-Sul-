import "server-only";

const DEFAULT_GRAPH_VERSION = "v26.0";
const DEFAULT_EXPECTED_USERNAME = "arenasulsports";

export type InstagramOAuthPublicConfig = {
  appId: string;
  redirectUri: string;
  expectedUsername: string;
  graphVersion: string;
};

export type InstagramOAuthSecretConfig = InstagramOAuthPublicConfig & {
  appSecret: string;
};

function normalizedGraphVersion() {
  const requested = process.env.INSTAGRAM_GRAPH_VERSION?.trim();
  return requested && /^v\d+\.\d+$/.test(requested)
    ? requested
    : DEFAULT_GRAPH_VERSION;
}

export function getInstagramOAuthPublicConfig(): InstagramOAuthPublicConfig | null {
  const appId = process.env.INSTAGRAM_APP_ID?.trim();
  const redirectUri = process.env.INSTAGRAM_OAUTH_REDIRECT_URI?.trim();
  const expectedUsername = (
    process.env.INSTAGRAM_EXPECTED_USERNAME?.trim() ||
    DEFAULT_EXPECTED_USERNAME
  ).toLowerCase();

  if (
    !appId ||
    !/^\d+$/.test(appId) ||
    !redirectUri ||
    !/^[a-z0-9._]+$/.test(expectedUsername)
  ) {
    return null;
  }

  try {
    const redirect = new URL(redirectUri);
    if (redirect.protocol !== "https:" || redirect.search || redirect.hash) {
      return null;
    }
  } catch {
    return null;
  }

  return {
    appId,
    redirectUri,
    expectedUsername,
    graphVersion: normalizedGraphVersion(),
  };
}

export function getInstagramOAuthSecretConfig(): InstagramOAuthSecretConfig | null {
  const publicConfig = getInstagramOAuthPublicConfig();
  const appSecret = process.env.INSTAGRAM_APP_SECRET?.trim();

  if (!publicConfig || !appSecret) {
    return null;
  }

  return { ...publicConfig, appSecret };
}

export function getInstagramPortalOrigin() {
  const config = getInstagramOAuthPublicConfig();
  return config ? new URL(config.redirectUri).origin : null;
}

