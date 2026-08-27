import assert from "node:assert/strict";
import test from "node:test";

import {
  GOOGLE_ADS_TAG_ID,
  GOOGLE_CONSENT_STORAGE_KEY,
  buildGoogleConsentBootstrapScript,
  getGoogleConsentSignals,
  isGoogleAdsPublicPath,
  parseStoredGoogleConsent,
  serializeGoogleConsent,
} from "../src/lib/google-ads/consent.ts";

test("uses the Google Ads identifier supplied for Arena Sul", () => {
  assert.equal(GOOGLE_ADS_TAG_ID, "AW-18397690648");
});

test("defaults every Consent Mode v2 signal to denied", () => {
  assert.deepEqual(getGoogleConsentSignals(null), {
    ad_storage: "denied",
    analytics_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
});

test("grants every Consent Mode v2 signal only after acceptance", () => {
  assert.deepEqual(getGoogleConsentSignals("accepted"), {
    ad_storage: "granted",
    analytics_storage: "granted",
    ad_user_data: "granted",
    ad_personalization: "granted",
  });
  assert.deepEqual(
    getGoogleConsentSignals("rejected"),
    getGoogleConsentSignals(null),
  );
});

test("accepts only the current, valid stored preference format", () => {
  assert.equal(parseStoredGoogleConsent(serializeGoogleConsent("accepted")), "accepted");
  assert.equal(parseStoredGoogleConsent(serializeGoogleConsent("rejected")), "rejected");
  assert.equal(parseStoredGoogleConsent('{"choice":"accepted","version":0}'), null);
  assert.equal(parseStoredGoogleConsent('{"choice":"other","version":1}'), null);
  assert.equal(parseStoredGoogleConsent("not-json"), null);
  assert.equal(parseStoredGoogleConsent(null), null);
});

test("excludes administrative, authentication and integration pages", () => {
  for (const pathname of [
    "/admin",
    "/admin/login",
    "/auth/confirm",
    "/integracoes/instagram/autorizar",
  ]) {
    assert.equal(isGoogleAdsPublicPath(pathname), false, pathname);
  }

  for (const pathname of ["/", "/eventos", "/eventos/festa", "/privacidade"]) {
    assert.equal(isGoogleAdsPublicPath(pathname), true, pathname);
  }
});

test("bootstraps consent before the Google Ads configuration can run", () => {
  const script = buildGoogleConsentBootstrapScript();

  assert.match(script, /window\.dataLayer = window\.dataLayer \|\| \[\]/);
  assert.match(script, /window\.gtag\("consent", "default"/);
  assert.match(script, /ad_user_data: arenaSulConsentValue/);
  assert.match(script, /ad_personalization: arenaSulConsentValue/);
  assert.match(script, new RegExp(GOOGLE_CONSENT_STORAGE_KEY));
  assert.doesNotMatch(script, new RegExp(GOOGLE_ADS_TAG_ID));
});
