import Link from "next/link";
import { fetchProducts, fetchCategories, fetchSlides } from "@/lib/api";
import { ProductIcon } from "@/components/ProductIcon";
import { HeroCarousel } from "@/components/HeroCarousel";
import { ProductTabs } from "@/components/ProductTabs";

const categoryTaglines: Record<string, string> = {
  "knitted-toys": "Bears, bunnies & friends",
  "blankets-throws": "Cot to cuddle-size",
  "nursery-sets": "Mobiles & bassinet linen",
  "gift-bundles": "Ready to wrap",
};

const categoryBadges: Record<string, string> = {
  "knitted-toys": "Hand-finished",
  "blankets-throws": "New this season",
  "nursery-sets": "Small batch",
  "gift-bundles": "Ready to gift",
};

const categoryIcons: Record<string, string> = {
  "knitted-toys": "bear",
  "blankets-throws": "blanket",
  "nursery-sets": "cushion",
  "gift-bundles": "bear",
};

export default async function HomePage() {
  const [{ products }, { categories }, { slides }] = await Promise.all([
    fetchProducts({ sort: "newest" }),
    fetchCategories(),
    fetchSlides(),
  ]);

  // Categories explicitly marked "Featured" in the admin appear here; if
  // none have been marked yet, fall back to the first two so this section
  // isn't empty on a freshly-configured site.
  const featured = categories.filter((c) => c.type === "featured");
  const favourites = featured.length > 0 ? featured : categories.slice(0, 2);

  return (
    <div>
      <HeroCarousel slides={slides} />

      {/* Featured categories, large format */}
      <section className="mt-20">
        <h2 className="text-center text-2xl">Start With a Favourite</h2>
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          {favourites.map((c) => (
            <Link
              key={c.id}
              href={`/shop?category=${c.slug}`}
              className="group flex flex-col items-center overflow-hidden rounded-lg bg-fog-card text-center transition hover:-translate-y-1"
            >
              {c.imagePath ? (
                <div className="h-48 w-full overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.imagePath} alt="" className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="pt-12">
                  <ProductIcon icon={categoryIcons[c.slug] || "bear"} size={140} />
                </div>
              )}
              <div className="px-8 pb-12 pt-6">
                <h3 className="text-xl">{c.name}</h3>
                <p className="mt-2 max-w-[32ch] text-sm text-ink-soft">{categoryTaglines[c.slug] || c.description}</p>
                <span className="mt-4 inline-block text-sm font-semibold underline underline-offset-4">Shop Now</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* All categories, compact grid */}
      <section className="mt-16">
        <div className="flex items-end justify-between border-b border-line pb-4">
          <h2 className="text-2xl">Every Collection</h2>
          <p className="hidden text-sm text-ink-soft sm:block">Four collections, one needle at a time.</p>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/shop?category=${c.slug}`}
              className="group flex items-center gap-5 rounded-lg p-4 transition hover:-translate-y-1"
            >
              <div className="flex h-24 w-24 flex-none items-center justify-center overflow-hidden rounded bg-fog-card">
                {c.imagePath ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.imagePath} alt="" className="h-full w-full object-cover" />
                ) : (
                  <ProductIcon icon={categoryIcons[c.slug] || "bear"} size={72} />
                )}
              </div>
              <div>
                <span className="inline-block rounded-full bg-gold px-2.5 py-0.5 text-xs font-semibold text-ink">
                  {c.type === "featured"
                    ? "Featured"
                    : c.type === "new-arrival"
                      ? "New Arrival"
                      : categoryBadges[c.slug] || "Handmade"}
                </span>
                <h3 className="mt-2 text-lg">{c.name}</h3>
                <span className="text-sm text-ink-soft">{categoryTaglines[c.slug] || c.description}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Tabbed product collection */}
      <section className="mt-16">
        <div className="flex items-end justify-between pb-2">
          <h2 className="text-2xl">The Collection</h2>
          <Link href="/shop" className="text-sm underline">View all →</Link>
        </div>
        <ProductTabs products={products} categories={categories} />
      </section>

      {/* Brand story split banner */}
      <section className="mt-16 grid grid-cols-1 items-center gap-10 rounded-lg bg-fog-card p-10 md:grid-cols-2">
        <div className="flex aspect-[4/3] items-center justify-center rounded bg-fog">
          <ProductIcon icon="sheep" size={160} />
        </div>
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-sky-deep">Our Story</span>
          <h2 className="mt-2 text-3xl">Every piece starts as a single loop.</h2>
          <p className="mt-3 max-w-[46ch] text-ink-soft">
            We&apos;re a small workshop by choice — every order passes through the hands of one of
            our knitters from cast-on to bind-off, then through a second pair for finishing.
          </p>
          <Link href="/about" className="mt-5 inline-block rounded border border-ink px-6 py-2.5 font-semibold">
            Read Our Story
          </Link>
        </div>
      </section>

      {/* Trust / difference */}
      <section className="mt-16 grid grid-cols-1 gap-8 border-y border-line py-12 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Fibre first", copy: "Only mulesing-free merino wool and organic cotton touch our needles." },
          { title: "Hand-finished", copy: "Faces embroidered, not printed. Every seam double-stitched." },
          { title: "Safe by design", copy: "Non-toxic dyes and no small parts — tested to AU/NZ and EN71 standards." },
          { title: "Made to outlast", copy: "Wool holds its shape wash after wash, gift after gift." },
        ].map((f) => (
          <div key={f.title}>
            <h3 className="text-lg">{f.title}</h3>
            <p className="mt-2 text-sm text-ink-soft">{f.copy}</p>
          </div>
        ))}
      </section>

      {/* Newsletter */}
      <section className="my-16 rounded-lg bg-ink px-8 py-14 text-center text-fog-card">
        <h2 className="text-2xl">Join the Flock</h2>
        <p className="mx-auto mt-2 max-w-[46ch] text-sm text-fog-card/70">
          First look at new collections, plus 10% off your first order. One email a month, never
          more.
        </p>
        <form className="mx-auto mt-6 flex max-w-md gap-2">
          <input
            type="email"
            placeholder="you@example.com"
            className="flex-1 rounded border border-fog-card/30 bg-transparent px-4 py-2.5 text-sm"
          />
          <button type="submit" className="rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-ink">
            Subscribe
          </button>
        </form>
      </section>
    </div>
  );
}
