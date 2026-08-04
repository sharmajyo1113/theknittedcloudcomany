'use client';

import { useState } from 'react';
import { ProductCard } from '@/components/ProductCard';
import { type Product, type Category } from '@/lib/api';

export function ProductTabs({ products, categories }: { products: Product[]; categories: Category[] }) {
  const [activeTab, setActiveTab] = useState<string>('all');

  const tabs = [{ slug: 'all', name: 'All' }, ...categories];
  const visible = activeTab === 'all' ? products : products.filter((p) => p.category?.slug === activeTab);

  return (
    <div>
      <div className="flex flex-wrap gap-2 border-b border-line pb-4">
        {tabs.map((t) => (
          <button
            key={t.slug}
            onClick={() => setActiveTab(t.slug)}
            className={`rounded-full border px-4 py-1.5 text-sm transition ${
              activeTab === t.slug ? 'border-ink bg-ink text-fog' : 'border-line'
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="mt-8 text-center text-ink-soft">No products in this category yet.</p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-5 lg:grid-cols-4">
          {visible.slice(0, 8).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
