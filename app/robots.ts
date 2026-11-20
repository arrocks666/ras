import type { MetadataRoute } from "next";

const BASE = "https://ratrisartistry.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/control-room",
          "/api/",
          "/cart",
          "/checkout",
          "/orders",
          "/tracking",
          "/forgot-password",
        ],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
