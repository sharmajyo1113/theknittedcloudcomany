import Link from 'next/link';

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-footer">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 py-12 sm:grid-cols-4">
        <div>
          <div className="text-lg font-medium">The Knitted Cloud Co.</div>
          <p className="mt-2 max-w-[32ch] text-sm text-ink-soft">
            Handknitted toys, blankets and nursery textiles, made slowly in small batches from natural fibres.
          </p>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Shop</h4>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/shop?category=knitted-toys">Knitted Toys</Link></li>
            <li><Link href="/shop?category=blankets-throws">Blankets &amp; Throws</Link></li>
            <li><Link href="/shop?category=nursery-sets">Nursery Sets</Link></li>
            <li><Link href="/shop?category=gift-bundles">Gift Bundles</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Company</h4>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/about">Our Story</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Account</h4>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/account/orders">Order History</Link></li>
            <li><Link href="/cart">My Cart</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line px-6 py-6 text-center text-xs text-ink-soft">
        &copy; {new Date().getFullYear()} The Knitted Cloud Company.
      </div>
    </footer>
  );
}
