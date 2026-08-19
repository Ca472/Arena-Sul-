type HeaderReader = Pick<Headers, "get">;

type OAuthStartRequest = {
  headers: HeaderReader;
  nextUrl: Pick<URL, "protocol">;
};

function singleHeaderValue(value: string | null) {
  if (value === null) {
    return null;
  }

  const normalized = value.trim();
  if (!normalized || normalized.includes(",")) {
    return null;
  }

  return normalized;
}

function normalizedRequestHost(value: string, protocol: string) {
  try {
    const parsed = new URL(`${protocol}//${value}`);
    if (
      parsed.username ||
      parsed.password ||
      parsed.pathname !== "/" ||
      parsed.search ||
      parsed.hash
    ) {
      return null;
    }

    return parsed.host.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Verifies the browser-side CSRF signals for the OAuth-starting POST.
 *
 * Browsers normally send Origin on form POSTs. Some embedded/private browser
 * modes omit it or serialize an opaque origin as `null`, so that narrow case
 * is accepted only when all navigation Fetch Metadata signals and the
 * proxy-resolved target origin match the sole configured portal origin. Any
 * other present but mismatched Origin never falls back to proxy headers.
 */
export function isTrustedInstagramOAuthStartRequest(
  request: OAuthStartRequest,
  portalOrigin: string | null,
) {
  if (!portalOrigin) {
    return false;
  }

  let expected: URL;
  try {
    expected = new URL(portalOrigin);
  } catch {
    return false;
  }

  const requestOrigin = request.headers.get("origin");
  const normalizedOrigin = requestOrigin?.trim();
  if (normalizedOrigin && normalizedOrigin !== "null") {
    return normalizedOrigin === expected.origin;
  }

  if (normalizedOrigin === "") {
    return false;
  }

  if (
    request.headers.get("sec-fetch-site")?.trim().toLowerCase() !==
      "same-origin" ||
    request.headers.get("sec-fetch-mode")?.trim().toLowerCase() !==
      "navigate" ||
    request.headers.get("sec-fetch-dest")?.trim().toLowerCase() !== "document"
  ) {
    return false;
  }

  const forwardedHostHeader = request.headers.get("x-forwarded-host");
  const hostValue =
    forwardedHostHeader !== null
      ? singleHeaderValue(forwardedHostHeader)
      : singleHeaderValue(request.headers.get("host"));

  if (!hostValue) {
    return false;
  }

  const effectiveHost = normalizedRequestHost(hostValue, expected.protocol);
  if (effectiveHost !== expected.host.toLowerCase()) {
    return false;
  }

  const forwardedProtocolHeader = request.headers.get("x-forwarded-proto");
  if (forwardedProtocolHeader !== null) {
    const forwardedProtocol = singleHeaderValue(forwardedProtocolHeader);
    if (`${forwardedProtocol?.toLowerCase()}:` !== expected.protocol) {
      return false;
    }
  } else if (request.nextUrl.protocol.toLowerCase() !== expected.protocol) {
    return false;
  }

  return true;
}
