import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const rootLayout = readFileSync("src/app/layout.tsx", "utf8");
const consentComponent = readFileSync(
  "src/components/google-ads-consent.tsx",
  "utf8",
);
const consentModule = readFileSync("src/lib/google-ads/consent.ts", "utf8");

test("places the synchronous consent default before page content", () => {
  const defaultIndex = rootLayout.indexOf('id="google-consent-default"');
  const contentIndex = rootLayout.indexOf("{children}");

  assert.notEqual(defaultIndex, -1);
  assert.notEqual(contentIndex, -1);
  assert.ok(defaultIndex < contentIndex);
  assert.match(rootLayout, /strategy="beforeInteractive"/);
});

test("loads and configures one Google Ads tag through next Script", () => {
  assert.equal(
    consentComponent.match(/googletagmanager\.com\/gtag\/js/g)?.length,
    1,
  );
  assert.equal(consentComponent.match(/id="google-ads-library"/g)?.length, 1);
  assert.equal(consentComponent.match(/id="google-ads-config"/g)?.length, 1);
  assert.match(consentComponent, /window\.gtag\("config"/);
});

test("keeps the public tag behind a sensitive-route guard", () => {
  const guardIndex = consentComponent.indexOf("if (!isPublicPath)");
  const tagIndex = consentComponent.indexOf('id="google-ads-library"');

  assert.notEqual(guardIndex, -1);
  assert.notEqual(tagIndex, -1);
  assert.ok(guardIndex < tagIndex);
  assert.match(consentModule, /\["\/admin", "\/auth", "\/integracoes"\]/);
});

test("provides equally explicit accept, reject and preference controls", () => {
  assert.match(consentComponent, />\s*Recusar\s*</);
  assert.match(consentComponent, />\s*Aceitar\s*</);
  assert.match(consentComponent, /Preferências de privacidade/);
  assert.match(consentComponent, /role="region"/);
  assert.match(consentComponent, /aria-labelledby="google-consent-title"/);
  assert.match(consentComponent, /aria-describedby="google-consent-description"/);
});
