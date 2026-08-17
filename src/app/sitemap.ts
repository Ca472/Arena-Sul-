import type { MetadataRoute } from "next";

import { getPublishedEventIndex } from "@/lib/events/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.arenasulsports.com"
  ).replace(/\/$/, "");
  const events = await getPublishedEventIndex();
  const now = new Date();

  return [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/eventos`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...events.map(({ slug, updatedAt }) => ({
      url: `${baseUrl}/eventos/${slug}`,
      lastModified: new Date(updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.65,
    })),
  ];
}
