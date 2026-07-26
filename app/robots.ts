import type { MetadataRoute } from "next";

/** Default to no public crawl indexing for this private vault portal. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
  };
}
