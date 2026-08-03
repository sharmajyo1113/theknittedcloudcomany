'use strict';

function money(amount) {
    return '₹' + Math.round(Number(amount)).toLocaleString('en-IN');
}

function slugify(text) {
    return String(text)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function shippingFeeFor(subtotal, flatFee, freeThreshold) {
    return subtotal >= freeThreshold ? 0 : flatFee;
}

/** Brand-consistent inline SVG illustration for a product, used when no photo has been uploaded. */
function productIconSvg(icon, size = 64) {
    const bodies = {
        sheep: `
            <ellipse cx="32" cy="42" rx="21" ry="15" fill="url(#pgGold)"/>
            <g fill="none" stroke="color-mix(in srgb, var(--gold) 45%, white 30%)" stroke-width="1.3" opacity="0.85">
                <path d="M15 36q3-4 6 0t6 0t6 0t6 0t6 0t6 0"/>
                <path d="M14 44q3-4 6 0t6 0t6 0t6 0t6 0t6 0"/>
            </g>
            <path d="M8 32c-2-6 2-11 8-10" stroke="url(#pgGold)" stroke-width="9" stroke-linecap="round" fill="none"/>
            <path d="M56 32c2-6-2-11-8-10" stroke="url(#pgGold)" stroke-width="9" stroke-linecap="round" fill="none"/>
            <circle cx="32" cy="17" r="10" fill="url(#pgGold)"/>
            <circle cx="27" cy="16" r="1.8" fill="var(--ink)"/>
            <circle cx="37" cy="16" r="1.8" fill="var(--ink)"/>
            <ellipse cx="32" cy="21" rx="2.4" ry="1.6" fill="var(--ink)"/>`,
        blanket: `
            <rect x="9" y="13" width="46" height="38" rx="3" fill="url(#pgSky)"/>
            <g stroke="color-mix(in srgb, var(--fog-card) 85%, transparent)" stroke-width="1.5" opacity="0.75">
                <path d="M13 21l4 5 4-5"/><path d="M21 21l4 5 4-5"/><path d="M29 21l4 5 4-5"/><path d="M37 21l4 5 4-5"/><path d="M45 21l4 5 4-5"/>
                <path d="M13 32l4 5 4-5"/><path d="M21 32l4 5 4-5"/><path d="M29 32l4 5 4-5"/><path d="M37 32l4 5 4-5"/><path d="M45 32l4 5 4-5"/>
            </g>
            <g stroke="color-mix(in srgb, var(--sky) 65%, var(--ink) 20%)" stroke-width="2" stroke-linecap="round">
                <line x1="12" y1="55" x2="9" y2="60"/><line x1="20" y1="55" x2="18" y2="60"/><line x1="28" y1="55" x2="27" y2="60"/><line x1="36" y1="55" x2="36" y2="60"/><line x1="44" y1="55" x2="45" y2="60"/><line x1="52" y1="55" x2="54" y2="60"/>
            </g>`,
        cushion: `
            <path d="M20 46c-6 0-10.5-4.6-10.5-10.3 0-5 3.7-9.2 8.6-9.9C19.2 19.4 25 14 32 14s12.8 5.4 13.9 11.8c4.9.7 8.6 4.9 8.6 9.9C54.5 41.4 50 46 44 46H20z" fill="url(#pgSky)"/>
            <circle cx="32" cy="30" r="3" fill="color-mix(in srgb, var(--sky) 55%, var(--ink) 20%)"/>`,
    };
    const body = bodies[icon] || `
            <ellipse cx="32" cy="46" rx="18" ry="15" fill="url(#pgGold)"/>
            <circle cx="18" cy="18" r="9" fill="url(#pgGold)"/><circle cx="18" cy="18" r="4.2" fill="color-mix(in srgb, var(--gold) 45%, var(--ink) 22%)"/>
            <circle cx="46" cy="18" r="9" fill="url(#pgGold)"/><circle cx="46" cy="18" r="4.2" fill="color-mix(in srgb, var(--gold) 45%, var(--ink) 22%)"/>
            <circle cx="32" cy="26" r="17" fill="url(#pgGold)"/>
            <ellipse cx="32" cy="32" rx="8" ry="6" fill="color-mix(in srgb, var(--gold) 30%, white 45%)"/>
            <circle cx="25" cy="21" r="2.1" fill="var(--ink)"/><circle cx="39" cy="21" r="2.1" fill="var(--ink)"/>
            <path d="M29 31a3 2 0 006 0" fill="var(--ink)"/>
            <path d="M27 37c2.5 2.4 8 2.4 10 0" stroke="var(--ink)" stroke-width="1.3" stroke-linecap="round" fill="none"/>`;

    return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" fill="none" aria-hidden="true">${body}</svg>`;
}

/** Global gradient <defs>, shared by every productIconSvg() on a page. Include once near the top of <body>. */
function productIconDefs() {
    return `<svg width="0" height="0" style="position:absolute" aria-hidden="true">
        <defs>
            <radialGradient id="pgGold" cx="34%" cy="24%" r="85%">
                <stop offset="0%" style="stop-color:color-mix(in srgb, var(--gold) 45%, white)"/>
                <stop offset="55%" style="stop-color:var(--gold)"/>
                <stop offset="100%" style="stop-color:color-mix(in srgb, var(--gold) 68%, var(--ink) 28%)"/>
            </radialGradient>
            <radialGradient id="pgSky" cx="34%" cy="24%" r="85%">
                <stop offset="0%" style="stop-color:color-mix(in srgb, var(--sky) 42%, white)"/>
                <stop offset="55%" style="stop-color:var(--sky)"/>
                <stop offset="100%" style="stop-color:color-mix(in srgb, var(--sky) 68%, var(--ink) 28%)"/>
            </radialGradient>
        </defs>
    </svg>`;
}

module.exports = { money, slugify, shippingFeeFor, productIconSvg, productIconDefs };
