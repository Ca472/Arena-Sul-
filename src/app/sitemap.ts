import type { MetadataRoute } from "next";

import { getPublishedEventIndex } from "@/lib/events/queries";
import { getPublishedBlogIndex } from "@/lib/blog/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.arenasulsports.com"
  ).replace(/\/$/, "");
  const [events, posts] = await Promise.all([
    getPublishedEventIndex(),
    getPublishedBlogIndex(),
  ]);
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
    {
      url: `${baseUrl}/blog`,
      ...(posts.length ? {
        lastModified: new Date(Math.max(...posts.map(({ updatedAt }) => new Date(updatedAt).getTime()))),
      } : {}),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/privacidade`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.35,
    },
    ...events.map(({ slug, updatedAt }) => ({
      url: `${baseUrl}/eventos/${slug}`,
      lastModified: new Date(updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.65,
    })),
    ...posts.map(({ slug, updatedAt }) => ({
      url: `${baseUrl}/blog/${slug}`,
      lastModified: new Date(updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
