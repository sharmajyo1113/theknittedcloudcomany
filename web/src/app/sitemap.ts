import type { MetadataRoute } from "next";
import { fetchCategories, fetchProducts } from "@/lib/api";

const SITE_URL = "https://theknittedcloudcompany.com";

async function fetchAllProductSlugs(): Promise<string[]> {
  const slugs: string[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const result = await fetchProducts({ page: String(page) });
    slugs.push(...result.products.map((p) => p.slug));
    totalPages = result.totalPages;
    page += 1;
  } while (page <= totalPages);
  return slugs;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/shop`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.5 },
  ];

  try {
    const [{ categories }, productSlugs] = await Promise.all([fetchCategories(), fetchAllProductSlugs()]);

    const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
      url: `${SITE_URL}/shop?category=${c.slug}`,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    const productRoutes: MetadataRoute.Sitemap = productSlugs.map((slug) => ({
      url: `${SITE_URL}/products/${slug}`,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    return [...staticRoutes, ...categoryRoutes, ...productRoutes];
  } catch {
    // API unreachable at build/request time — still return the static routes
    // rather than fail the whole sitemap.
    return staticRoutes;
  }
}
