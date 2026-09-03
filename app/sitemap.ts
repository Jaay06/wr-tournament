import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: getSiteUrl().toString(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: new URL("/rules", getSiteUrl()).toString(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: new URL("/tiers", getSiteUrl()).toString(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: new URL("/how-it-works", getSiteUrl()).toString(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];
}
