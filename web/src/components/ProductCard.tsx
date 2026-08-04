import Link from 'next/link';
import { ProductIcon } from '@/components/ProductIcon';
import { money, type Product } from '@/lib/api';

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col items-center rounded-lg p-5 text-center transition hover:-translate-y-1"
    >
      <div className="relative flex aspect-square w-full items-center justify-center rounded-lg bg-fog-card">
        {product.imagePath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imagePath} alt={product.name} className="h-full w-full rounded-lg object-cover" />
        ) : (
          <ProductIcon icon={product.icon} size={110} />
        )}
        {product.stock > 0 && product.stock <= 3 && (
          <span className="absolute left-3 top-3 rounded-full bg-gold px-2.5 py-0.5 text-xs font-semibold text-ink">
            Low stock
          </span>
        )}
        {product.stock === 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-danger px-2.5 py-0.5 text-xs font-semibold text-white">
            Sold out
          </span>
        )}
      </div>
      <h3 className="mt-4 text-base">{product.name}</h3>
      <span className="mt-1 font-semibold text-sky-deep">{money(product.price)}</span>
    </Link>
  );
}
