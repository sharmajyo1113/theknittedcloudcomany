'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ProductIcon } from '@/components/ProductIcon';

const SLIDES = [
  {
    eyebrow: 'Say hello to The Knitted Cloud Co.',
    title: 'Handknitted heirlooms for little hands.',
    cta: { label: 'Shop the Collection', href: '/shop' },
  },
  {
    eyebrow: 'New this season',
    title: 'Blankets built for bedtime.',
    cta: { label: 'Shop Blankets & Throws', href: '/shop?category=blankets-throws' },
  },
  {
    eyebrow: 'Free shipping over ₹8,300',
    title: 'Gifts worth unwrapping slowly.',
    cta: { label: 'Shop Gift Bundles', href: '/shop?category=gift-bundles' },
  },
];

// A scattered "flat lay" of our product illustrations standing in for lifestyle
// photography we don't have — same compositional idea (toys arranged on a soft
// background), built from our own icons instead of a stock photo.
const SCATTER = [
  { icon: 'bear', size: 90, top: '8%', left: '6%', rotate: -8 },
  { icon: 'sheep', size: 70, top: '58%', left: '4%', rotate: 6 },
  { icon: 'blanket', size: 100, top: '15%', left: '84%', rotate: 10 },
  { icon: 'cushion', size: 80, top: '62%', left: '86%', rotate: -6 },
  { icon: 'bunny', size: 60, top: '78%', left: '20%', rotate: 12 },
  { icon: 'sheep', size: 64, top: '10%', left: '45%', rotate: -4 },
];

export function HeroCarousel() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActive((i) => (i + 1) % SLIDES.length), 6000);
    return () => clearInterval(id);
  }, []);

  const slide = SLIDES[active];

  return (
    <div className="relative flex min-h-[560px] items-center justify-center overflow-hidden rounded-lg bg-fog-card">
      {SCATTER.map((s, i) => (
        <div
          key={i}
          className="absolute opacity-70"
          style={{ top: s.top, left: s.left, transform: `rotate(${s.rotate}deg)` }}
        >
          <ProductIcon icon={s.icon} size={s.size} />
        </div>
      ))}

      <div key={active} className="relative z-10 mx-6 max-w-lg rounded-2xl bg-fog p-10 text-center shadow-xl animate-in fade-in duration-500">
        <span className="text-xs font-semibold uppercase tracking-widest text-sky-deep">{slide.eyebrow}</span>
        <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">{slide.title}</h1>
        <Link
          href={slide.cta.href}
          className="mt-6 inline-block rounded-full bg-gold px-8 py-3 font-semibold text-ink"
        >
          {slide.cta.label}
        </Link>
      </div>

      <div className="absolute bottom-5 flex justify-center gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            aria-label={`Show slide ${i + 1}`}
            className={`h-2 rounded-full transition-all ${i === active ? 'w-6 bg-ink' : 'w-2 bg-line'}`}
          />
        ))}
      </div>
    </div>
  );
}
