import Link from "next/link";
import { fetchTheme, type Theme } from "@/lib/api";

export const metadata = { title: "Our Story" };

export default async function AboutPage() {
  const theme = await fetchTheme().catch((): Theme => ({}));

  return (
    <div>
      <div className="flex items-center gap-4">
        {theme.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={theme.logoUrl} alt="" className="h-16 w-auto object-contain" />
        )}
        <span className="text-xl font-semibold">The Knitted Cloud Co.</span>
      </div>
      <h1 className="mt-4 text-3xl">How We Cast On</h1>
      <p className="mt-3 max-w-[60ch] text-lg text-ink-soft">
        The Knitted Cloud Company began at a kitchen table with two needles and a skein of undyed
        merino — a search for toys soft enough for a newborn&apos;s grip and sturdy enough to survive
        a decade of being dragged everywhere.
      </p>

      <div className="mt-6 max-w-[70ch] space-y-4 text-ink-soft leading-relaxed">
        <p>
          We still knit that way. Every bear, blanket and bassinet set passes through the hands of
          one of our knitters from cast-on to bind-off, then through a second pair for finishing:
          seams closed, features embroidered, ends woven in so nothing ever comes loose.
        </p>
        <p>
          Only mulesing-free merino wool and organic cotton touch our needles — breathable,
          hypoallergenic, and gentle on new skin. Every dye we use is non-toxic and low-impact, and
          every toy is tested against AU/NZ and EN71 safety standards before it ever reaches a
          shelf.
        </p>
        <p>
          We&apos;re a small workshop by choice. It means slower turnaround than a factory, but it
          also means the person who casts on your order will put their initials on the swing tag —
          and that most of what we sell today, we expect to see resurface as someone&apos;s third
          baby shower gift.
        </p>
      </div>

      <div className="mt-10 grid max-w-xl grid-cols-3 gap-4">
        <div className="rounded-lg bg-fog-card p-4">
          <b className="block text-2xl text-sky-deep">100%</b>
          <span className="text-xs uppercase tracking-wide text-ink-soft">Natural Fibres</span>
        </div>
        <div className="rounded-lg bg-fog-card p-4">
          <b className="block text-2xl text-sky-deep">6–8 hrs</b>
          <span className="text-xs uppercase tracking-wide text-ink-soft">Per Handmade Piece</span>
        </div>
        <div className="rounded-lg bg-fog-card p-4">
          <b className="block text-2xl text-sky-deep">0</b>
          <span className="text-xs uppercase tracking-wide text-ink-soft">Synthetic Dyes</span>
        </div>
      </div>

      <Link href="/" className="mt-10 inline-block rounded-full bg-ink px-6 py-2.5 font-semibold text-fog-card">
        Shop the Collection
      </Link>
    </div>
  );
}
