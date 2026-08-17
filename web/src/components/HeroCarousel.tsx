'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ProductIcon } from '@/components/ProductIcon';
import type { Slide } from '@/lib/api';

const DEFAULT_SLIDES: Slide[] = [
  {
    id: 'default-1',
    eyebrow: 'Say hello to The Knitted Cloud Co.',
    title: 'Handknitted heirlooms for little hands.',
    description: '',
    ctaLabel: 'Shop the Collection',
    ctaHref: '/shop',
    imagePath: null,
    order: 0,
  },
  {
    id: 'default-2',
    eyebrow: 'New this season',
    title: 'Blankets built for bedtime.',
    description: '',
    ctaLabel: 'Shop Blankets & Throws',
    ctaHref: '/shop?category=blankets-throws',
    imagePath: null,
    order: 1,
  },
  {
    id: 'default-3',
    eyebrow: 'Free shipping over ₹8,300',
    title: 'Gifts worth unwrapping slowly.',
    description: '',
    ctaLabel: 'Shop Gift Bundles',
    ctaHref: '/shop?category=gift-bundles',
    imagePath: null,
    order: 2,
  },
];

// A scattered "flat lay" of our product illustrations, shown behind any slide
// that doesn't have a real photo — same compositional idea (toys arranged on
// a soft background) as lifestyle photography, built from our own icons.
const SCATTER = [
  { icon: 'bear', size: 90, top: '8%', left: '6%', rotate: -8 },
  { icon: 'sheep', size: 70, top: '58%', left: '4%', rotate: 6 },
  { icon: 'blanket', size: 100, top: '15%', left: '84%', rotate: 10 },
  { icon: 'cushion', size: 80, top: '62%', left: '86%', rotate: -6 },
  { icon: 'bunny', size: 60, top: '78%', left: '20%', rotate: 12 },
  { icon: 'sheep', size: 64, top: '10%', left: '45%', rotate: -4 },
];

export function HeroCarousel({ slides }: { slides?: Slide[] }) {
  const activeSlides = slides && slides.length > 0 ? slides : DEFAULT_SLIDES;
  const [active, setActive] = useState(0);

  useEffect(() => {
    setActive(0);
  }, [activeSlides.length]);

  useEffect(() => {
    if (activeSlides.length <= 1) return;
    const id = setInterval(() => setActive((i) => (i + 1) % activeSlides.length), 6000);
    return () => clearInterval(id);
  }, [activeSlides.length]);

  const slide = activeSlides[active];

  return (
    <div className="relative flex min-h-[560px] items-center justify-center overflow-hidden rounded-lg bg-fog-card">
      {slide.imagePath ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={slide.imagePath}
            src={slide.imagePath}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
        </>
      ) : (
        SCATTER.map((s, i) => (
          <div
            key={i}
            className="absolute opacity-70"
            style={{ top: s.top, left: s.left, transform: `rotate(${s.rotate}deg)` }}
          >
            <ProductIcon icon={s.icon} size={s.size} />
          </div>
        ))
      )}

      <div
        key={active}
        className={`relative z-10 mx-6 max-w-lg rounded-2xl p-10 text-center shadow-xl animate-in fade-in duration-500 ${
          slide.imagePath ? 'bg-popup/95' : 'bg-popup'
        }`}
      >
        {slide.eyebrow && (
          <span className="text-xs font-semibold uppercase tracking-widest text-sky-deep">{slide.eyebrow}</span>
        )}
        <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">{slide.title}</h1>
        {slide.description && <p className="mt-3 text-ink-soft">{slide.description}</p>}
        <Link
          href={slide.ctaHref}
          className="mt-6 inline-block rounded-full bg-gold px-8 py-3 font-semibold text-ink"
        >
          {slide.ctaLabel}
        </Link>
      </div>

      {activeSlides.length > 1 && (
        <div className="absolute bottom-5 flex justify-center gap-2">
          {activeSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`Show slide ${i + 1}`}
              className={`h-2 rounded-full transition-all ${i === active ? 'w-6 bg-ink' : 'w-2 bg-line'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
