import { timingSafeEqual } from "node:crypto";
import {
  InstagramTokenRenewalError,
  type InstagramTokenRenewalResult,
} from "./token-renewal.ts";

const headers = {
  "Cache-Control": "private, no-store, max-age=0",
  "X-Robots-Tag": "noindex, nofollow",
};

export async function handleInstagramRenewalCron(
  request: Request,
  { secret, renew }: {
    secret: string | undefined;
    renew: () => Promise<InstagramTokenRenewalResult>;
  },
) {
  const authorization = request.headers.get("authorization") ?? "";
  const expected = secret ? `Bearer ${secret}` : "";
  if (!secret || Buffer.byteLength(authorization) !== Buffer.byteLength(expected) ||
      !timingSafeEqual(Buffer.from(authorization), Buffer.from(expected))) {
    return Response.json({ error: "unauthorized" }, { status: 401, headers });
  }

  try {
    const result = await renew();
    const needsAuthorization = result.status === "reauthorization-required" ||
      result.status === "not-connected";
    const log = needsAuthorization ? console.warn : console.info;
    log(JSON.stringify({ event: "instagram_token_renewal", ...result }));
    return Response.json(result, { status: needsAuthorization ? 409 : 200, headers });
  } catch (error) {
    // Never log the fetch error, URL, response body or access token.
    console.error(JSON.stringify({
      event: "instagram_token_renewal_failed",
      stage: error instanceof InstagramTokenRenewalError ? error.stage : "unknown",
      upstreamStatus: error instanceof InstagramTokenRenewalError ? error.upstreamStatus : undefined,
    }));
    return Response.json({ error: "renewal-failed" }, { status: 500, headers });
  }
}
