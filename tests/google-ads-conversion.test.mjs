import assert from "node:assert/strict";
import test from "node:test";

import { GOOGLE_ADS_SITE_VISIT_CONVERSION_SEND_TO } from "../src/lib/google-ads/conversion.ts";
import { GOOGLE_ADS_TAG_ID } from "../src/lib/google-ads/consent.ts";

test("uses the conversion label supplied for public site visits", () => {
  assert.equal(
    GOOGLE_ADS_SITE_VISIT_CONVERSION_SEND_TO,
    "AW-18397690648/Jok9CPrJ6-gcEJj22cRE",
  );
  assert.ok(
    GOOGLE_ADS_SITE_VISIT_CONVERSION_SEND_TO.startsWith(
      `${GOOGLE_ADS_TAG_ID}/`,
    ),
  );
});
