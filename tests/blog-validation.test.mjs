import assert from "node:assert/strict";
import test from "node:test";
import {
  BLOG_CONTENT_MAX_LENGTH,
  BLOG_COVER_MAX_BYTES,
  blogPostSchema,
  isValidBlogSlug,
  resolveBlogSlug,
  validateBlogCover,
} from "../src/lib/blog/validation.ts";

const base = {
  id: "cf60ca12-348b-48f7-94d4-36eb2fb028b9",
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  coverAlt: "",
  updatedAt: "",
  status: "draft",
};

test("allows incomplete drafts and validates every publishing requirement", () => {
  assert.equal(blogPostSchema.safeParse(base).success, true);
  const invalid = blogPostSchema.safeParse({ ...base, status: "published" });
  assert.equal(invalid.success, false);
  assert.deepEqual(Object.keys(invalid.error.flatten().fieldErrors).sort(), ["content", "excerpt", "title"]);
  assert.equal(blogPostSchema.safeParse({
    ...base,
    status: "published",
    title: "Beach Tennis",
    excerpt: "Conheça as aulas de Beach Tennis na Arena Sul.",
    content: "Descubra como começar no Beach Tennis. A Arena Sul oferece aulas para diferentes idades e níveis de experiência.",
  }).success, true);
});

test("rejects unsafe URLs and honors length limits even on a draft", () => {
  for (const slug of ["../admin", "a/b", "com espaço", "a--b", "-inicio", "fim-", "ação", "a", "Aulas"]) {
    assert.equal(isValidBlogSlug(slug), false, slug);
    assert.equal(blogPostSchema.safeParse({ ...base, slug }).success, false, slug);
  }
  assert.equal(blogPostSchema.safeParse({ ...base, title: "a".repeat(121) }).success, false);
  assert.equal(blogPostSchema.safeParse({ ...base, excerpt: "a".repeat(241) }).success, false);
  assert.equal(blogPostSchema.safeParse({ ...base, content: "a".repeat(BLOG_CONTENT_MAX_LENGTH + 1) }).success, false);
  assert.equal(blogPostSchema.safeParse({ ...base, coverAlt: "a".repeat(241) }).success, false);
});

test("generates safe distinct automatic URLs for repeated and empty titles", () => {
  const secondId = "df60ca12-348b-48f7-94d4-36eb2fb028b9";
  const first = resolveBlogSlug("", "Ação e diversão na Arena Sul!", base.id);
  const second = resolveBlogSlug("", "Ação e diversão na Arena Sul!", secondId);
  assert.match(first, /^acao-e-diversao-na-arena-sul-/);
  assert.notEqual(first, second);
  assert.equal(isValidBlogSlug(first), true);
  assert.equal(isValidBlogSlug(resolveBlogSlug("", "", base.id)), true);
  assert.equal(isValidBlogSlug(resolveBlogSlug("", "a".repeat(120), base.id)), true);
  assert.equal(resolveBlogSlug("aulas-de-tennis", "Outro título", base.id), "aulas-de-tennis");
});

test("rejects forged formats, SVG, empty images and inaccurate file lengths", () => {
  const svg = new TextEncoder().encode("<svg onload=alert(1)></svg>");
  assert.equal(validateBlogCover({ size: svg.length, type: "image/svg+xml" }, svg).valid, false);
  assert.equal(validateBlogCover({ size: svg.length, type: "image/png" }, svg).valid, false);
  assert.equal(validateBlogCover({ size: 0, type: "image/png" }).valid, false);
  const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
  assert.equal(validateBlogCover({ size: jpeg.length + 1, type: "image/jpeg" }, jpeg).valid, false);
  assert.equal(validateBlogCover({ size: jpeg.length, type: "image/png" }, jpeg).valid, false);
  assert.deepEqual(validateBlogCover({ size: jpeg.length, type: "image/jpeg" }, jpeg), {
    valid: true, mimeType: "image/jpeg", extension: "jpg",
  });
});

test("accepts the 3MiB boundary and refuses larger files before reading bytes", () => {
  const png = new Uint8Array(BLOG_COVER_MAX_BYTES);
  png.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  assert.equal(validateBlogCover({ size: png.length, type: "image/png" }, png).valid, true);
  assert.equal(validateBlogCover({ size: BLOG_COVER_MAX_BYTES + 1, type: "image/png" }).valid, false);
});

test("requires a valid editor revision when supplied", () => {
  assert.equal(blogPostSchema.safeParse({ ...base, updatedAt: "2026-10-24T19:58:48.123456+00:00" }).success, true);
  assert.equal(blogPostSchema.safeParse({ ...base, updatedAt: "ontem" }).success, false);
});
