import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { fetchProduct, money } from "@/lib/api";
import { ProductIcon } from "@/components/ProductIcon";
import { ProductCard } from "@/components/ProductCard";
import { AddToCartForm } from "@/components/AddToCartForm";

export async function generateMetadata(props: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  try {
    const { product } = await fetchProduct(slug);
    return {
      title: `${product.name} — Handknitted ${product.category?.name || "Piece"}`,
      description: product.description,
    };
  } catch {
    return { title: "Product Not Found" };
  }
}

export default async function ProductPage(props: PageProps<"/products/[slug]">) {
  const { slug } = await props.params;

  let data;
  try {
    data = await fetchProduct(slug);
  } catch {
    notFound();
  }
  const { product, related } = data!;

  return (
    <div>
      <p className="text-sm text-ink-soft">
        <Link href="/shop">Shop</Link>
        {product.category && (
          <>
            {" / "}
            <Link href={`/shop?category=${product.category.slug}`}>{product.category.name}</Link>
          </>
        )}
        {" / "}
        {product.name}
      </p>

      <div className="mt-6 grid grid-cols-1 gap-10 md:grid-cols-2">
        <div className="flex aspect-square items-center justify-center rounded bg-fog-card">
          {product.imagePath ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.imagePath} alt={product.name} className="h-full w-full rounded object-cover" />
          ) : (
            <ProductIcon icon={product.icon} size={260} />
          )}
        </div>
        <div>
          <h1 className="text-3xl">{product.name}</h1>
          <p className="mt-2 text-xl font-semibold text-sky-deep">{money(product.price)}</p>
          <p className="mt-4 whitespace-pre-line text-ink-soft">{product.description}</p>
          {product.stock > 0 && product.stock <= 3 && (
            <p className="mt-3 text-sm text-gold">Only {product.stock} left in stock.</p>
          )}
          <AddToCartForm product={product} />
          {product.sku && <p className="mt-6 text-sm text-ink-soft">SKU: {product.sku}</p>}
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-16">
          <h2 className="border-b border-line pb-4 text-2xl">You might also like</h2>
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
