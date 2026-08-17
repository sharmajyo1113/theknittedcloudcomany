import Link from "next/link";
import type { Metadata } from "next";
import { fetchProducts, fetchCategories, fetchPriceRange, money } from "@/lib/api";
import { ProductCard } from "@/components/ProductCard";

export const metadata: Metadata = {
  title: "Shop Handknitted Toys, Blankets & Nursery Sets",
  description:
    "Browse hand-knitted teddy bears, blankets and nursery textiles — knitted toys, blankets & throws, nursery sets and gift bundles, made in small batches from natural fibres.",
};

export default async function ShopPage(props: PageProps<"/shop">) {
  const searchParams = await props.searchParams;
  const category = typeof searchParams.category === "string" ? searchParams.category : "";
  const q = typeof searchParams.q === "string" ? searchParams.q : "";
  const sort = typeof searchParams.sort === "string" ? searchParams.sort : "newest";
  const page = typeof searchParams.page === "string" ? searchParams.page : "1";
  const minPrice = typeof searchParams.minPrice === "string" ? searchParams.minPrice : "";
  const maxPrice = typeof searchParams.maxPrice === "string" ? searchParams.maxPrice : "";

  const [{ products, total, totalPages, page: currentPage }, { categories }, priceBounds] = await Promise.all([
    fetchProducts({ category, q, sort, page, minPrice, maxPrice }),
    fetchCategories(),
    fetchPriceRange(),
  ]);

  const activeCategory = categories.find((c) => c.slug === category) || null;

  function buildQuery(overrides: Record<string, string>) {
    const params = new URLSearchParams({ category, q, sort, page, minPrice, maxPrice, ...overrides });
    for (const [k, v] of [...params.entries()]) if (!v) params.delete(k);
    return params.toString();
  }

  return (
    <div>
      <p className="text-sm text-ink-soft">
        <Link href="/">Home</Link> {" / "} Shop
      </p>
      <h1 className="mt-2 text-3xl">{activeCategory ? activeCategory.name : "Shop the Collection"}</h1>
      <p className="mt-1 text-ink-soft">
        {activeCategory ? activeCategory.description : "Heirloom-soft toys, blankets and nursery knits."}
      </p>

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[240px_1fr]">
        {/* Sidebar filters */}
        <aside className="space-y-8">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">Search</h3>
            <form method="get" className="mt-3 flex gap-2">
              {category && <input type="hidden" name="category" value={category} />}
              <input
                type="search"
                name="q"
                defaultValue={q}
                placeholder="Search…"
                className="w-full rounded border border-line bg-transparent px-3 py-2 text-sm"
              />
            </form>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">Categories</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link
                  href={`/shop?${buildQuery({ category: "", page: "" })}`}
                  className={!activeCategory ? "font-semibold text-sky-deep" : ""}
                >
                  All Products
                </Link>
              </li>
              {categories.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/shop?${buildQuery({ category: c.slug, page: "" })}`}
                    className={activeCategory?.id === c.id ? "font-semibold text-sky-deep" : ""}
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">Price Range</h3>
            <form method="get" className="mt-3 space-y-3">
              {category && <input type="hidden" name="category" value={category} />}
              {q && <input type="hidden" name="q" value={q} />}
              <div className="flex items-center gap-2 text-sm">
                <input
                  type="number"
                  name="minPrice"
                  defaultValue={minPrice}
                  placeholder={String(priceBounds.min)}
                  className="w-full rounded border border-line bg-transparent px-2 py-1.5"
                />
                <span className="text-ink-soft">–</span>
                <input
                  type="number"
                  name="maxPrice"
                  defaultValue={maxPrice}
                  placeholder={String(priceBounds.max)}
                  className="w-full rounded border border-line bg-transparent px-2 py-1.5"
                />
              </div>
              <p className="text-xs text-ink-soft">
                Full range: {money(priceBounds.min)} – {money(priceBounds.max)}
              </p>
              <button className="w-full rounded border border-ink py-1.5 text-sm font-semibold">Apply</button>
            </form>
          </div>
        </aside>

        {/* Main content */}
        <div>
          <div className="flex items-center justify-between border-b border-line pb-4 text-sm text-ink-soft">
            <span>{total} product{total === 1 ? "" : "s"}</span>
            <form method="get">
              {category && <input type="hidden" name="category" value={category} />}
              {q && <input type="hidden" name="q" value={q} />}
              {minPrice && <input type="hidden" name="minPrice" value={minPrice} />}
              {maxPrice && <input type="hidden" name="maxPrice" value={maxPrice} />}
              <select name="sort" defaultValue={sort} className="rounded border border-line bg-transparent px-2 py-1">
                <option value="newest">Newest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name_asc">Name: A–Z</option>
              </select>
            </form>
          </div>

          {products.length === 0 ? (
            <div className="py-16 text-center text-ink-soft">
              <h3 className="text-lg text-ink">No products found</h3>
              <p className="mt-1">Try a different search, category or price range.</p>
            </div>
          ) : (
            <>
              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-10 flex justify-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                    <Link
                      key={n}
                      href={`/shop?${buildQuery({ page: String(n) })}`}
                      className={`rounded-full border px-4 py-1.5 text-sm ${n === currentPage ? "border-ink bg-ink text-fog" : "border-line"}`}
                    >
                      {n}
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
