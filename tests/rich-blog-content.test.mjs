import assert from "node:assert/strict";
import test from "node:test";
import {
  BLOG_RICH_TEXT_MAX_IMAGES,
  BLOG_RICH_TEXT_MAX_PLAIN_LENGTH,
  BLOG_RICH_TEXT_MAX_SERIALIZED_LENGTH,
  parseBlogImageSource,
  parseRichTextContent,
  richTextPlainText,
  safeBlogLink,
} from "../src/lib/blog/rich-text.ts";
import { blogPostSchema } from "../src/lib/blog/validation.ts";

const id = "cf60ca12-348b-48f7-94d4-36eb2fb028b9";
const otherId = "df60ca12-348b-48f7-94d4-36eb2fb028b9";
const filename = "41a59f3c-4881-4c87-829f-3ad9d4355235.jpg";
const imageSrc = `/api/blog/images/${id}/${filename}`;
const doc = (...content) => JSON.stringify({ type: "doc", content });
const paragraph = (text, marks) => ({ type: "paragraph", content: text ? [{ type: "text", text, ...(marks ? { marks } : {}) }] : [] });
const image = (attrs = {}) => ({ type: "image", attrs: { src: imageSrc, ...attrs } });
const published = {
  id, title: "Esporte na Arena Sul", slug: "esporte-na-arena", excerpt: "Conheça as modalidades e os encontros da Arena Sul.",
  contentFormat: "richtext", content: "", status: "published", coverAlt: "", updatedAt: "",
};

test("round trips supported text styles, fonts, headings, lists and alignments", () => {
  const body = doc(
    { type: "heading", attrs: { level: 3, textAlign: "center" }, content: [{ type: "text", text: "Título" }] },
    paragraph("Texto destacado", [{ type: "bold" }, { type: "italic" }, { type: "underline" }, { type: "textStyle", attrs: { fontFamily: "'Georgia'", fontSize: "20px", color: "#FF914D" } }]),
    { type: "orderedList", attrs: { start: 2 }, content: [{ type: "listItem", content: [paragraph("Segundo item")] }] },
  );
  const result = parseRichTextContent(body);
  assert.equal(result.plainText, "Título\nTexto destacado\nSegundo item");
  assert.deepEqual(result.document.content[1].content[0].marks.at(-1), { type: "textStyle", attrs: { fontFamily: "Georgia", fontSize: "20px", color: "#ff914d" } });
  assert.deepEqual(parseRichTextContent(result.serialized).document, result.document);
  assert.equal(richTextPlainText(result.document), result.plainText);
});

test("rejects executable or malformed links instead of persisting unsafe marks", () => {
  for (const href of ["javascript:alert(1)", "JaVaScRiPt:alert(1)", "data:text/html,boom", "//evil.example/x", "https:\\evil.example", "/%5cevil.example", "https://safe.example/%0aevil", " https://safe.example", "https://user:password@safe.example/", "mailto:a@b.test?subject=%0dhello"]) {
    assert.equal(safeBlogLink(href), null, href);
    assert.throws(() => parseRichTextContent(doc(paragraph("Link", [{ type: "link", attrs: { href } }]))), /link do artigo é inválido/, href);
  }
  for (const href of ["https://www.arenasulsports.com/blog", "http://example.com/", "/#modalidades", "#quadras", "mailto:equipe@example.com?subject=Contato%20Arena"]) {
    assert.equal(safeBlogLink(href), href);
  }
});

test("drops arbitrary HTML attributes and unsupported style values", () => {
  const result = parseRichTextContent(doc({
    ...paragraph("<script>alert(1)</script>", [{ type: "textStyle", attrs: { fontFamily: "Arial; background:url(javascript:evil)", fontSize: "999px", color: "expression(alert(1))", style: "position:fixed" } }]),
    attrs: { onmouseover: "alert(1)", class: "evil", style: "position:fixed", textAlign: "center" },
  }));
  assert.equal(result.document.content[0].content[0].text, "<script>alert(1)</script>");
  assert.deepEqual(result.document.content[0].attrs, { textAlign: "center" });
  assert.equal(result.document.content[0].content[0].marks, undefined);
  assert.ok(!result.serialized.includes("onmouseover"));
  assert.ok(!result.serialized.includes("expression("));
});

test("rejects script, raw HTML, iframe and unknown node or mark types", () => {
  for (const type of ["script", "html", "iframe", "video", "doc"]) {
    assert.throws(() => parseRichTextContent(doc({ type, attrs: { src: "https://evil.example" } })));
  }
  assert.throws(() => parseRichTextContent(doc(paragraph("Texto", [{ type: "rawHtml", attrs: { html: "<script>evil</script>" } }]))));
  assert.throws(() => parseRichTextContent(JSON.stringify({ type: "paragraph", content: [] })));
  assert.throws(() => parseRichTextContent(doc({ type: "text", text: "Texto fora de um bloco" })));
});

test("uses only stable image routes for the same post and derives unique private storage paths", () => {
  const result = parseRichTextContent(doc(image({ alt: "Turma na quadra", title: "Um encontro da equipe", width: 50, align: "right", onerror: "evil" }), image()), { postId: id });
  assert.deepEqual(result.imagePaths, [`${id}/${filename}`]);
  assert.equal(result.document.content[0].attrs.width, 50);
  assert.equal(result.document.content[0].attrs.align, "right");
  assert.ok(!result.serialized.includes("onerror"));
  assert.deepEqual(parseBlogImageSource(imageSrc.toUpperCase().replace("/API/BLOG/IMAGES/", "/api/blog/images/"), id), { src: imageSrc, storagePath: `${id}/${filename}` });
  assert.equal(parseBlogImageSource(imageSrc, otherId), null);
  for (const src of [imageSrc.replace(id, otherId), `${imageSrc}?token=anything`, `${imageSrc}#fragment`, "https://cdn.example/image.jpg", `https://www.arenasulsports.com${imageSrc}`, "data:image/svg+xml,evil", "/api/blog/images/../secret.jpg"]) {
    assert.throws(() => parseRichTextContent(doc(image({ src })), { postId: id }), /foto do artigo não pertence/);
  }
});

test("allows local raster previews only with the explicit demo flag", () => {
  const content = doc(image({ src: "blob:http://localhost:3010/7c1a4e12-3bd5-4f64-87de-e34679a14cd4" }));
  assert.throws(() => parseRichTextContent(content));
  const result = parseRichTextContent(content, { allowLocalImages: true });
  assert.deepEqual(result.imagePaths, []);
  assert.ok(result.document.content[0].attrs.src.startsWith("blob:"));
  assert.throws(() => parseRichTextContent(doc(image({ src: "javascript:evil" })), { allowLocalImages: true }));
});

test("enforces photo limits, caption limits and controlled presentation values", () => {
  assert.throws(() => parseRichTextContent(doc(...Array.from({ length: BLOG_RICH_TEXT_MAX_IMAGES + 1 }, () => image()))), /no máximo 20 fotos/);
  assert.throws(() => parseRichTextContent(doc(image({ alt: "a".repeat(241) }))), /descrição de cada foto/);
  assert.throws(() => parseRichTextContent(doc(image({ title: "a".repeat(501) }))), /legenda de cada foto/);
  const result = parseRichTextContent(doc(image({ width: "100%;position:fixed", align: "expression(evil)" })));
  assert.equal(result.document.content[0].attrs.width, 100);
  assert.equal(result.document.content[0].attrs.align, "center");
});

test("does not let JSON, blank paragraphs or image descriptions satisfy publishing requirements", () => {
  for (const content of [doc(paragraph("curto")), doc(...Array.from({ length: 100 }, () => paragraph(" "))), doc(image({ alt: "a".repeat(150), title: "b".repeat(150) }))]) {
    const result = blogPostSchema.safeParse({ ...published, content });
    assert.equal(result.success, false);
    assert.ok(result.error.flatten().fieldErrors.content?.some(message => message.includes("pelo menos 80 caracteres")));
  }
  const content = doc(paragraph("A Arena Sul reúne pessoas de diferentes idades para praticar esportes, aprender com a equipe e aproveitar momentos de convivência nas quadras."));
  assert.equal(blogPostSchema.safeParse({ ...published, content }).success, true);
  assert.equal(blogPostSchema.safeParse({ ...published, content: "", status: "draft" }).success, true);
  assert.equal(blogPostSchema.safeParse({ ...published, content: "<p>HTML bruto</p>" }).success, false);
});

test("accepts table data while restricting spans and ignoring arbitrary attributes", () => {
  const table = {
    type: "table", content: [{ type: "tableRow", content: [
      { type: "tableHeader", attrs: { colspan: 1, rowspan: 1, colwidth: [160], style: "position:fixed" }, content: [paragraph("Modalidade")] },
      { type: "tableCell", attrs: { colspan: 1, rowspan: null, colwidth: null }, content: [paragraph("Beach Tennis")] },
    ] }],
  };
  const result = parseRichTextContent(doc(table));
  assert.deepEqual(result.document.content[0].content[0].content[0].attrs, { colspan: 1, rowspan: 1, colwidth: [160] });
  assert.deepEqual(result.document.content[0].content[0].content[1].attrs, { colspan: 1, rowspan: 1 });
  table.content[0].content[0].attrs.colspan = 99;
  assert.throws(() => parseRichTextContent(doc(table)), /células grandes demais/);
});

test("rejects oversized text, serialized payloads, node counts and nesting depth", () => {
  assert.throws(() => parseRichTextContent(" ".repeat(BLOG_RICH_TEXT_MAX_SERIALIZED_LENGTH + 1)), /limite permitido/);
  assert.throws(() => parseRichTextContent(doc(paragraph("a".repeat(BLOG_RICH_TEXT_MAX_PLAIN_LENGTH + 1)))), /80 mil/);
  const tooManyNodes = doc({ type: "paragraph", content: Array.from({ length: 10_000 }, () => ({ type: "hardBreak" })) });
  assert.throws(() => parseRichTextContent(tooManyNodes), /elementos demais/);
  let nested = paragraph("Texto");
  for (let index = 0; index < 26; index++) nested = { type: "blockquote", content: [nested] };
  assert.throws(() => parseRichTextContent(doc(nested)), /estrutura muito profunda/);
  const tooManyMarks = doc(paragraph("Texto", Array.from({ length: 13 }, () => ({ type: "bold" }))));
  assert.throws(() => parseRichTextContent(tooManyMarks));
});
