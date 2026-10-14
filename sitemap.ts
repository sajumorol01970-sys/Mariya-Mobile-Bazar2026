import type { MetadataRoute } from "next";
import { listProducts } from "@/lib/queries";
import { getCategories } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.SITE_URL || "http://localhost:3000";
  const statics = ["", "/products", "/offers", "/track", "/contact", "/faq", "/policies/privacy", "/policies/terms", "/policies/returns"];

  try {
    const [items, cats] = await Promise.all([listProducts({ limit: 500 }), getCategories()]);
    return [
      ...statics.map((path) => ({
        url: `${base}${path}`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: path === "" ? 1 : 0.7,
      })),
      ...cats.map((c) => ({
        url: `${base}/products?category=${c.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
      ...items.map((p) => ({
        url: `${base}/products/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    ];
  } catch {
    return statics.map((path) => ({ url: `${base}${path}`, lastModified: new Date() }));
  }
}
