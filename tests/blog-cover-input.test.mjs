import assert from "node:assert/strict";
import test from "node:test";

import { normalizeOptionalBlogCoverEntry } from "../src/lib/blog/cover-input.ts";
import { validateBlogCover } from "../src/lib/blog/validation.ts";

test("an absent optional cover and empty multipart placeholders do not become uploads", () => {
  assert.equal(normalizeOptionalBlogCoverEntry(null), null);
  for (const name of ["", "undefined"]) {
    for (const type of ["", "application/octet-stream"]) {
      assert.equal(normalizeOptionalBlogCoverEntry(new File([], name, { type })), null, `${name}/${type}`);
    }
  }
});

test("selected zero-byte photos still fail upload validation", () => {
  for (const [name, type] of [
    ["image.jpg", "image/jpeg"],
    ["portrait.png", "application/octet-stream"],
    ["undefined", "image/jpeg"],
    ["", "image/png"],
  ]) {
    const file = new File([], name, { type });
    assert.equal(normalizeOptionalBlogCoverEntry(file), file);
    assert.equal(validateBlogCover(file).valid, false);
  }
});

test("a genuine selected cover is preserved for content and signature checks", async () => {
  const file = new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], "cover.jpg", { type: "image/jpeg" });
  assert.equal(normalizeOptionalBlogCoverEntry(file), file);
  assert.equal(validateBlogCover(file, new Uint8Array(await file.arrayBuffer())).valid, true);
});
