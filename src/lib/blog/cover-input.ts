type OptionalCoverFileMetadata = {
  name: string;
  size: number;
  type: string;
};

/**
 * An untouched optional file input can arrive through multipart/Server Actions
 * as a zero-byte File whose missing name was serialized as "undefined".
 * Named or image-typed zero-byte files remain selected files and must still
 * pass normal upload validation; this is not a blanket empty-file exception.
 */
export function normalizeOptionalBlogCoverEntry<T extends OptionalCoverFileMetadata>(entry: T | null): T | null {
  if (!entry) return null;
  const missingName = entry.name === "" || entry.name === "undefined";
  const genericType = entry.type === "" || entry.type === "application/octet-stream";
  return entry.size === 0 && missingName && genericType ? null : entry;
}
