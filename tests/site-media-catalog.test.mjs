import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  getDefaultSiteMediaMap,
  getSiteMediaExtension,
  hasExpectedSiteMediaSignature,
  isSiteMediaSlot,
  resolveSiteMediaMap,
  SITE_MEDIA_DEFINITIONS,
  SITE_MEDIA_SECTIONS,
} from "../src/lib/site-media/catalog.ts";

test("registers every editable photo position exactly once", () => {
  const keys = SITE_MEDIA_DEFINITIONS.map(({ key }) => key);

  assert.equal(keys.length, 19);
  assert.equal(new Set(keys).size, keys.length);
  assert.deepEqual(
    new Set(SITE_MEDIA_DEFINITIONS.map(({ section }) => section)),
    new Set(SITE_MEDIA_SECTIONS),
  );
});

test("keeps the database slot constraint synchronized with the catalog", () => {
  const migration = readFileSync(
    new URL(
      "../supabase/migrations/20260822130015_site_media_admin.sql",
      import.meta.url,
    ),
    "utf8",
  );
  const databaseSlots = [
    ...migration.matchAll(
      /'(team|home|structure|modality)-[a-z0-9-]+'/g,
    ),
  ].map(([match]) => match.slice(1, -1));
  const catalogSlots = SITE_MEDIA_DEFINITIONS.map(({ key }) => key);

  assert.deepEqual(databaseSlots.sort(), [...catalogSlots].sort());
});

test("keeps a local fallback for every editable position", () => {
  const defaults = getDefaultSiteMediaMap();

  for (const definition of SITE_MEDIA_DEFINITIONS) {
    assert.match(definition.defaultSrc, /^\/images\//);
    assert.equal(defaults[definition.key], definition.defaultSrc);
    assert.ok(definition.alt.length > 10);
    assert.ok(definition.recommendation.length > 10);
  }
});

test("accepts known overrides and ignores unknown database rows", () => {
  const resolved = resolveSiteMediaMap([
    {
      slot: "team-gett-lima",
      url: "https://example.supabase.co/storage/gett.jpg",
    },
    { slot: "not-a-real-slot", url: "https://example.com/ignored.jpg" },
    { slot: "team-wallacy", url: "   " },
  ]);

  assert.equal(
    resolved["team-gett-lima"],
    "https://example.supabase.co/storage/gett.jpg",
  );
  assert.equal(
    resolved["team-wallacy"],
    "/images/hero-futevolei-wallacy.jpg",
  );
  assert.equal(isSiteMediaSlot("team-gett-lima"), true);
  assert.equal(isSiteMediaSlot("not-a-real-slot"), false);
});

test("derives immutable file extensions from validated MIME types", () => {
  assert.equal(getSiteMediaExtension("image/jpeg"), "jpg");
  assert.equal(getSiteMediaExtension("image/png"), "png");
  assert.equal(getSiteMediaExtension("image/webp"), "webp");
});

test("verifies JPEG, PNG and WebP signatures before publishing", () => {
  assert.equal(
    hasExpectedSiteMediaSignature(
      new Uint8Array([0xff, 0xd8, 0xff, 0xe0]),
      "image/jpeg",
    ),
    true,
  );
  assert.equal(
    hasExpectedSiteMediaSignature(
      new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      "image/png",
    ),
    true,
  );
  assert.equal(
    hasExpectedSiteMediaSignature(
      new Uint8Array([
        0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
      ]),
      "image/webp",
    ),
    true,
  );
  assert.equal(
    hasExpectedSiteMediaSignature(
      new TextEncoder().encode("<svg onload=alert(1)></svg>"),
      "image/png",
    ),
    false,
  );
});
