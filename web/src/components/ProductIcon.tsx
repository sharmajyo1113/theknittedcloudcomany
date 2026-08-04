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
      </defs>
    </svg>
  );
}

export function ProductIcon({ icon, size = 64 }: { icon: string; size?: number }) {
  const body = (() => {
    switch (icon) {
      case 'sheep':
        return (
          <>
            <ellipse cx="32" cy="42" rx="21" ry="15" fill="url(#pgGold)" />
            <circle cx="32" cy="17" r="10" fill="url(#pgGold)" />
            <circle cx="27" cy="16" r="1.8" fill="var(--color-ink)" />
            <circle cx="37" cy="16" r="1.8" fill="var(--color-ink)" />
          </>
        );
      case 'blanket':
        return (
          <>
            <rect x="9" y="13" width="46" height="38" rx="3" fill="url(#pgSky)" />
            <g stroke="color-mix(in srgb, var(--color-fog-card) 85%, transparent)" strokeWidth="1.5" opacity="0.75">
              <path d="M13 21l4 5 4-5" />
              <path d="M21 21l4 5 4-5" />
              <path d="M29 21l4 5 4-5" />
              <path d="M37 21l4 5 4-5" />
              <path d="M45 21l4 5 4-5" />
            </g>
          </>
        );
      case 'cushion':
        return (
          <>
            <path
              d="M20 46c-6 0-10.5-4.6-10.5-10.3 0-5 3.7-9.2 8.6-9.9C19.2 19.4 25 14 32 14s12.8 5.4 13.9 11.8c4.9.7 8.6 4.9 8.6 9.9C54.5 41.4 50 46 44 46H20z"
              fill="url(#pgSky)"
            />
            <circle cx="32" cy="30" r="3" fill="color-mix(in srgb, var(--color-sky) 55%, var(--color-ink) 20%)" />
          </>
        );
      default:
        return (
          <>
            <ellipse cx="32" cy="46" rx="18" ry="15" fill="url(#pgGold)" />
            <circle cx="18" cy="18" r="9" fill="url(#pgGold)" />
            <circle cx="46" cy="18" r="9" fill="url(#pgGold)" />
            <circle cx="32" cy="26" r="17" fill="url(#pgGold)" />
            <ellipse cx="32" cy="32" rx="8" ry="6" fill="color-mix(in srgb, var(--color-gold) 30%, white 45%)" />
            <circle cx="25" cy="21" r="2.1" fill="var(--color-ink)" />
            <circle cx="39" cy="21" r="2.1" fill="var(--color-ink)" />
            <path d="M29 31a3 2 0 006 0" fill="var(--color-ink)" />
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
