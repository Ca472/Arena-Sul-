import assert from "node:assert/strict";
import test from "node:test";

import {
  GOOGLE_ADS_WHATSAPP_CONVERSION_SEND_TO,
  getGoogleAdsWhatsAppConversionParameters,
  isWhatsAppUrl,
  isWhatsAppUrlForNumber,
} from "../src/lib/google-ads/conversion.ts";
import { GOOGLE_ADS_TAG_ID } from "../src/lib/google-ads/consent.ts";

const arenaWhatsAppNumber = "551233071093";

test("uses the conversion label supplied for WhatsApp clicks", () => {
  assert.equal(
    GOOGLE_ADS_WHATSAPP_CONVERSION_SEND_TO,
    "AW-18397690648/Jok9CPrJ6-gcEJj22cRE",
  );
  assert.ok(
    GOOGLE_ADS_WHATSAPP_CONVERSION_SEND_TO.startsWith(
      `${GOOGLE_ADS_TAG_ID}/`,
    ),
  );
});

test("recognizes supported secure WhatsApp links", () => {
  for (const href of [
    "https://wa.me/551233071093?text=Ol%C3%A1",
    "https://api.whatsapp.com/send?phone=551233071093",
    "https://web.whatsapp.com/send?phone=551233071093",
  ]) {
    assert.equal(isWhatsAppUrl(href), true, href);
    assert.equal(isWhatsAppUrlForNumber(href, arenaWhatsAppNumber), true, href);
  }
});

test("does not classify unrelated or malformed links as WhatsApp", () => {
  for (const href of [
    "https://www.arenasulsports.com/",
    "https://wa.me.example.com/551233071093",
    "http://wa.me/551233071093",
    "javascript:void(0)",
    "not-a-url",
  ]) {
    assert.equal(isWhatsAppUrl(href), false, href);
    assert.equal(
      getGoogleAdsWhatsAppConversionParameters(href, arenaWhatsAppNumber),
      null,
      href,
    );
  }
});

test("ignores WhatsApp links for any number other than Arena Sul", () => {
  const otherNumberUrl = "https://wa.me/5511999999999?text=Ol%C3%A1";

  assert.equal(isWhatsAppUrl(otherNumberUrl), true);
  assert.equal(
    isWhatsAppUrlForNumber(otherNumberUrl, arenaWhatsAppNumber),
    false,
  );
  assert.equal(
    getGoogleAdsWhatsAppConversionParameters(
      otherNumberUrl,
      arenaWhatsAppNumber,
    ),
    null,
  );
});

test("builds conversion parameters only for a WhatsApp destination", () => {
  assert.deepEqual(
    getGoogleAdsWhatsAppConversionParameters(
      "https://wa.me/551233071093?text=Ol%C3%A1",
      arenaWhatsAppNumber,
    ),
    {
      send_to: GOOGLE_ADS_WHATSAPP_CONVERSION_SEND_TO,
    },
  );
});
