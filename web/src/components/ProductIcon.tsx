import { useId } from 'react';

export function ProductIconDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        <radialGradient id="pgGold" cx="34%" cy="24%" r="85%">
          <stop offset="0%" style={{ stopColor: 'color-mix(in srgb, var(--color-gold) 45%, white)' }} />
          <stop offset="55%" style={{ stopColor: 'var(--color-gold)' }} />
          <stop offset="100%" style={{ stopColor: 'color-mix(in srgb, var(--color-gold) 68%, var(--color-ink) 28%)' }} />
        </radialGradient>
        <radialGradient id="pgSky" cx="34%" cy="24%" r="85%">
          <stop offset="0%" style={{ stopColor: 'color-mix(in srgb, var(--color-sky) 42%, white)' }} />
          <stop offset="55%" style={{ stopColor: 'var(--color-sky)' }} />
          <stop offset="100%" style={{ stopColor: 'color-mix(in srgb, var(--color-sky) 68%, var(--color-ink) 28%)' }} />
        </radialGradient>
        <radialGradient id="pgBlush" cx="34%" cy="24%" r="85%">
          <stop offset="0%" style={{ stopColor: 'color-mix(in srgb, var(--color-blush) 45%, white)' }} />
          <stop offset="55%" style={{ stopColor: 'var(--color-blush)' }} />
          <stop offset="100%" style={{ stopColor: 'color-mix(in srgb, var(--color-blush) 68%, var(--color-ink) 28%)' }} />
        </radialGradient>
        {/* Chunky crochet "bobble" texture — a staggered grid of little raised
            nubs (dark shadow + light highlight per bump), tiled and laid over
            each shape via clipPath so every icon reads as amigurumi stitching
            rather than a flat vector blob. */}
        <pattern id="crochetBobble" width="6.4" height="5.6" patternUnits="userSpaceOnUse">
          <circle cx="1.6" cy="1.4" r="1.5" fill="black" opacity="0.14" />
          <circle cx="1.25" cy="1.05" r="1.1" fill="white" opacity="0.3" />
          <circle cx="4.8" cy="4.2" r="1.5" fill="black" opacity="0.14" />
          <circle cx="4.45" cy="3.85" r="1.1" fill="white" opacity="0.3" />
        </pattern>
      </defs>
    </svg>
  );
}

function Knit({ clipId, opacity = 1 }: { clipId: string; opacity?: number }) {
  return (
    <g clipPath={`url(#${clipId})`} opacity={opacity}>
      <rect x="0" y="0" width="64" height="64" fill="url(#crochetBobble)" />
    </g>
  );
}

export function ProductIcon({ icon, size = 64 }: { icon: string; size?: number }) {
  // clipPath ids must be unique per rendered instance — multiple products on
  // the same page can share an icon type (e.g. two "blanket" products), and
  // duplicate SVG ids would otherwise collide.
  const uid = `pi-${icon}-${useId()}`;

  const body = (() => {
    switch (icon) {
      case 'sheep':
        return (
          <>
            <clipPath id={`${uid}-body`}>
              <path d="M11 40c-1-8 5-13 10-13 1-6 6-10 11-10s10 4 11 10c5 0 11 5 10 13 1 7-6 12-12 12H23c-6 0-13-5-12-12z" />
            </clipPath>
            <path
              d="M11 40c-1-8 5-13 10-13 1-6 6-10 11-10s10 4 11 10c5 0 11 5 10 13 1 7-6 12-12 12H23c-6 0-13-5-12-12z"
              fill="url(#pgGold)"
            />
            <Knit clipId={`${uid}-body`} />
            {/* face */}
            <ellipse cx="32" cy="24" rx="7.5" ry="6.5" fill="color-mix(in srgb, var(--color-ink) 78%, var(--color-gold) 22%)" />
            <path d="M27 15c-2-3-1-6 2-6M37 15c2-3 1-6-2-6" stroke="color-mix(in srgb, var(--color-ink) 78%, var(--color-gold) 22%)" strokeWidth="2.4" strokeLinecap="round" fill="none" />
            <circle cx="29" cy="24" r="1.4" fill="var(--color-fog)" />
            <circle cx="35" cy="24" r="1.4" fill="var(--color-fog)" />
            {/* legs */}
            <g stroke="color-mix(in srgb, var(--color-ink) 70%, var(--color-gold) 30%)" strokeWidth="2.6" strokeLinecap="round">
              <path d="M19 49v6M27 51v6M37 51v6M45 49v6" />
            </g>
          </>
        );
      case 'bunny':
        return (
          <>
            <clipPath id={`${uid}-ears`}>
              <path d="M22 26C15 18 15 4 20 2c4-2 8 8 9 16 1 4 1 7 0 9l-7-1z M42 26c7-8 7-22 2-24-4-2-8 8-9 16-1 4-1 7 0 9l7-1z" />
            </clipPath>
            <clipPath id={`${uid}-head`}>
              <circle cx="32" cy="34" r="16" />
            </clipPath>
            <path d="M22 26C15 18 15 4 20 2c4-2 8 8 9 16 1 4 1 7 0 9l-7-1z" fill="url(#pgBlush)" />
            <path d="M42 26c7-8 7-22 2-24-4-2-8 8-9 16-1 4-1 7 0 9l7-1z" fill="url(#pgBlush)" />
            <Knit clipId={`${uid}-ears`} opacity={0.9} />
            <path d="M23 22c-1-6 0-14 3-17M41 22c1-6 0-14-3-17" stroke="color-mix(in srgb, var(--color-blush) 55%, white)" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.8" />
            <circle cx="32" cy="34" r="16" fill="url(#pgBlush)" />
            <Knit clipId={`${uid}-head`} />
            <ellipse cx="32" cy="40" rx="5" ry="4" fill="color-mix(in srgb, var(--color-fog-card) 92%, transparent)" />
            <circle cx="27" cy="32" r="1.7" fill="var(--color-ink)" />
            <circle cx="37" cy="32" r="1.7" fill="var(--color-ink)" />
            <path d="M30 39.5c.7.8 2.6.8 3.3 0" stroke="var(--color-ink)" strokeWidth="1.4" strokeLinecap="round" fill="none" />
          </>
        );
      case 'blanket':
        return (
          <>
            <clipPath id={`${uid}-body`}>
              <rect x="9" y="12" width="46" height="34" rx="2.5" />
            </clipPath>
            <rect x="9" y="12" width="46" height="34" rx="2.5" fill="url(#pgSky)" />
            <Knit clipId={`${uid}-body`} />
            <rect x="9" y="12" width="46" height="34" rx="2.5" fill="none" stroke="color-mix(in srgb, var(--color-sky) 55%, var(--color-ink) 25%)" strokeWidth="1.2" />
            {/* hand-tied fringe */}
            <g stroke="color-mix(in srgb, var(--color-sky) 45%, var(--color-ink) 30%)" strokeWidth="1.6" strokeLinecap="round">
              <path d="M13 46v7M20 46v7M27 46v7M34 46v7M41 46v7M48 46v7" />
            </g>
          </>
        );
      case 'cushion':
        return (
          <>
            <clipPath id={`${uid}-body`}>
              <path d="M20 46c-6 0-10.5-4.6-10.5-10.3 0-5 3.7-9.2 8.6-9.9C19.2 19.4 25 14 32 14s12.8 5.4 13.9 11.8c4.9.7 8.6 4.9 8.6 9.9C54.5 41.4 50 46 44 46H20z" />
            </clipPath>
            <path
              d="M20 46c-6 0-10.5-4.6-10.5-10.3 0-5 3.7-9.2 8.6-9.9C19.2 19.4 25 14 32 14s12.8 5.4 13.9 11.8c4.9.7 8.6 4.9 8.6 9.9C54.5 41.4 50 46 44 46H20z"
              fill="url(#pgSky)"
            />
            <Knit clipId={`${uid}-body`} />
            <path
              d="M20 46c-6 0-10.5-4.6-10.5-10.3 0-5 3.7-9.2 8.6-9.9C19.2 19.4 25 14 32 14s12.8 5.4 13.9 11.8c4.9.7 8.6 4.9 8.6 9.9C54.5 41.4 50 46 44 46H20z"
              fill="none"
              stroke="color-mix(in srgb, var(--color-sky) 55%, var(--color-ink) 25%)"
              strokeWidth="1"
              strokeDasharray="1.5 2.5"
            />
            <circle cx="32" cy="31" r="2.6" fill="color-mix(in srgb, var(--color-sky) 55%, var(--color-ink) 25%)" />
            <path d="M32 31l-7 6M32 31l7 6M32 31l-7-6M32 31l7-6" stroke="color-mix(in srgb, var(--color-sky) 55%, var(--color-ink) 25%)" strokeWidth="0.8" opacity="0.6" />
          </>
        );
      case 'mobile':
        return (
          <>
            <g stroke="color-mix(in srgb, var(--color-ink) 60%, var(--color-gold) 20%)" strokeWidth="1.6" strokeLinecap="round">
              <path d="M14 10h36" />
              <path d="M20 10v9M32 10v13M44 10v9" />
            </g>
            <clipPath id={`${uid}-c1`}>
              <path d="M14 27c-4 0-7-3-7-6.5S10 14 14 14c.6-3 3.4-5 6.5-5s5.9 2 6.5 5c4 0 7 3 7 6.5S31 27 27 27H14z" transform="translate(-5,10) scale(0.55)" />
            </clipPath>
            <clipPath id={`${uid}-c2`}>
              <path d="M14 27c-4 0-7-3-7-6.5S10 14 14 14c.6-3 3.4-5 6.5-5s5.9 2 6.5 5c4 0 7 3 7 6.5S31 27 27 27H14z" transform="translate(20,23) scale(0.75)" />
            </clipPath>
            <clipPath id={`${uid}-c3`}>
              <path d="M14 27c-4 0-7-3-7-6.5S10 14 14 14c.6-3 3.4-5 6.5-5s5.9 2 6.5 5c4 0 7 3 7 6.5S31 27 27 27H14z" transform="translate(38,10) scale(0.5)" />
            </clipPath>
            {[`${uid}-c1`, `${uid}-c2`, `${uid}-c3`].map((id) => (
              <g key={id}>
                <path
                  d="M14 27c-4 0-7-3-7-6.5S10 14 14 14c.6-3 3.4-5 6.5-5s5.9 2 6.5 5c4 0 7 3 7 6.5S31 27 27 27H14z"
                  fill="url(#pgSky)"
                  transform={id.endsWith('c1') ? 'translate(-5,10) scale(0.55)' : id.endsWith('c2') ? 'translate(20,23) scale(0.75)' : 'translate(38,10) scale(0.5)'}
                />
                <Knit clipId={id} />
              </g>
            ))}
          </>
        );
      default:
        return (
          <>
            <clipPath id={`${uid}-ears`}>
              <circle cx="18" cy="18" r="9" />
              <circle cx="46" cy="18" r="9" />
            </clipPath>
            <clipPath id={`${uid}-head`}>
              <circle cx="32" cy="26" r="17" />
            </clipPath>
            <circle cx="18" cy="18" r="9" fill="url(#pgGold)" />
            <circle cx="46" cy="18" r="9" fill="url(#pgGold)" />
            <Knit clipId={`${uid}-ears`} />
            <ellipse cx="32" cy="46" rx="18" ry="15" fill="url(#pgGold)" />
            <circle cx="32" cy="26" r="17" fill="url(#pgGold)" />
            <Knit clipId={`${uid}-head`} />
            <ellipse cx="32" cy="32" rx="8" ry="6" fill="color-mix(in srgb, var(--color-gold) 30%, white 45%)" />
            <circle cx="25" cy="21" r="2.1" fill="var(--color-ink)" />
            <circle cx="39" cy="21" r="2.1" fill="var(--color-ink)" />
            <path d="M29 31a3 2 0 006 0" fill="var(--color-ink)" />
            <circle cx="18" cy="18" r="3.4" fill="color-mix(in srgb, var(--color-gold) 30%, white 45%)" opacity="0.8" />
            <circle cx="46" cy="18" r="3.4" fill="color-mix(in srgb, var(--color-gold) 30%, white 45%)" opacity="0.8" />
            {/* signature ribbon bow */}
            <ellipse cx="27" cy="42.5" rx="4.5" ry="3" transform="rotate(-25 27 42.5)" fill="color-mix(in srgb, var(--color-ink) 55%, var(--color-gold) 45%)" />
            <ellipse cx="37" cy="42.5" rx="4.5" ry="3" transform="rotate(25 37 42.5)" fill="color-mix(in srgb, var(--color-ink) 55%, var(--color-gold) 45%)" />
            <circle cx="32" cy="42.5" r="2.1" fill="color-mix(in srgb, var(--color-ink) 70%, var(--color-gold) 30%)" />
          </>
        );
    }
  })();

  return (
    <svg viewBox="0 0 64 64" width={size} height={size} fill="none" aria-hidden="true">
      {body}
    </svg>
  );
}
