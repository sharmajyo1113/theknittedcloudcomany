'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  fetchAdminSlides,
  createAdminSlide,
  updateAdminSlide,
  deleteAdminSlide,
  uploadAdminImage,
  fetchAdminTheme,
  updateAdminTheme,
  type Slide,
  type Theme,
} from '@/lib/api';

const EMPTY_FORM = { eyebrow: '', title: '', description: '', ctaLabel: '', ctaHref: '' };

const THEME_FIELDS: { key: keyof Theme; label: string; hint: string; fallback: string }[] = [
  { key: 'buttonColor', label: 'Button Color', hint: 'Primary buttons (e.g. "Shop the Collection")', fallback: '#C4986A' },
  { key: 'textColor', label: 'Text Color', hint: 'Main body and heading text', fallback: '#262220' },
  { key: 'popupColor', label: 'Popup Color', hint: 'Floating card surfaces, like the hero banner text card', fallback: '#FEFCF8' },
  { key: 'headerColor', label: 'Header Color', hint: 'Site header background', fallback: '#FEFCF8' },
  { key: 'footerColor', label: 'Footer Color', hint: 'Site footer background', fallback: '#FEFCF8' },
];

// The page background itself isn't admin-configurable (only these 5 fields
// are), so contrast checks against body text need this fixed value.
const PAGE_BACKGROUND = '#FEFCF8';

// WCAG relative luminance + contrast ratio — small enough to inline rather
// than pull in a library just for this.
function luminance(hex: string): number | null {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return null;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16) / 255);
  const [R, G, B] = [r, g, b].map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function contrastRatio(hexA: string, hexB: string): number | null {
  const lA = luminance(hexA);
  const lB = luminance(hexB);
  if (lA === null || lB === null) return null;
  const lighter = Math.max(lA, lB);
  const darker = Math.min(lA, lB);
  return (lighter + 0.05) / (darker + 0.05);
}

function ThemePreview({ theme }: { theme: Theme }) {
  const button = theme.buttonColor || '#C4986A';
  const text = theme.textColor || '#262220';
  const popup = theme.popupColor || '#FEFCF8';
  const header = theme.headerColor || '#FEFCF8';
  const footer = theme.footerColor || '#FEFCF8';

  const bodyContrast = contrastRatio(text, PAGE_BACKGROUND);
  const popupContrast = contrastRatio(text, popup);
  const lowContrast = (bodyContrast !== null && bodyContrast < 3) || (popupContrast !== null && popupContrast < 3);

  return (
    <div className="w-full max-w-sm overflow-hidden rounded-lg border border-line shadow-sm">
      <div style={{ background: header }} className="border-b border-line px-4 py-3 text-sm font-semibold" >
        <span style={{ color: text }}>The Knitted Cloud Co.</span>
      </div>
      <div style={{ background: PAGE_BACKGROUND }} className="space-y-4 p-5">
        <div>
          <h4 style={{ color: text }} className="text-lg font-semibold">
            Handknitted heirlooms
          </h4>
          <p style={{ color: text }} className="mt-1 text-sm opacity-80">
            Sample body copy, exactly as it'll read on the actual page background.
          </p>
        </div>
        <button style={{ background: button, color: text }} className="rounded-full px-5 py-2 text-sm font-semibold">
          Shop the Collection
        </button>
        <div style={{ background: popup, color: text }} className="rounded-lg p-4 shadow">
          <div className="text-xs font-semibold uppercase tracking-wide opacity-70">Popup surface</div>
          <div className="mt-1 text-sm">Sample card / hero text panel</div>
        </div>
      </div>
      <div style={{ background: footer, color: text }} className="border-t border-line px-4 py-3 text-xs">
        © 2026 The Knitted Cloud Company.
      </div>
      {lowContrast && (
        <div className="border-t border-danger bg-danger/10 px-4 py-2 text-xs text-danger">
          Low contrast — this text may be hard or impossible to read against the page or popup background.
        </div>
      )}
    </div>
  );
}

function LogoSection() {
  const { getToken } = useAuth();
  const [logoUrl, setLogoUrl] = useState<string | null | undefined>(undefined);
  const [loaded, setLoaded] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) return;
      const theme = await fetchAdminTheme(token);
      setLogoUrl(theme.logoUrl ?? null);
      setLoaded(true);
    })();
  }, [getToken]);

  async function handleUpload(e: FormEvent) {
    e.preventDefault();
    if (!file) return;
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in.');
      const { url } = await uploadAdminImage(token, file);
      const updated = await updateAdminTheme(token, { logoUrl: url });
      setLogoUrl(updated.logoUrl);
      setFile(null);
      setSuccess('Logo updated — now showing in the header and on the About page.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in.');
      const updated = await updateAdminTheme(token, { logoUrl: null });
      setLogoUrl(updated.logoUrl);
      setSuccess('Logo removed — showing the text name instead.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  if (!loaded) return <p className="text-ink-soft">Loading…</p>;

  return (
    <div className="flex flex-wrap items-start gap-10">
      <form onSubmit={handleUpload} className="grid max-w-sm gap-4">
        <label className="grid gap-1 text-sm">
          Logo image
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-sm" />
        </label>
        {file && <p className="text-xs text-ink-soft">Selected: {file.name}</p>}
        {error && <p className="text-sm text-danger">{error}</p>}
        {success && <p className="text-sm text-success">{success}</p>}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving || !file}
            className="w-fit rounded-full bg-gold px-6 py-3 font-semibold text-ink disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Upload Logo'}
          </button>
          {logoUrl && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={saving}
              className="w-fit rounded-full border border-line px-6 py-3 font-semibold disabled:opacity-60"
            >
              Remove Logo
            </button>
          )}
        </div>
      </form>

      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">Current Logo</div>
        <div className="flex h-24 w-48 items-center justify-center rounded-lg border border-line bg-fog-card p-3">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="Current logo" className="h-full w-full object-contain" />
          ) : (
            <span className="text-sm text-ink-soft">No logo set — showing text name</span>
          )}
        </div>
      </div>
    </div>
  );
}

function ThemeSection() {
  const { getToken } = useAuth();
  const [theme, setTheme] = useState<Theme>({});
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) return;
      setTheme(await fetchAdminTheme(token));
      setLoaded(true);
    })();
  }, [getToken]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in.');
      const updated = await updateAdminTheme(token, theme);
      setTheme(updated);
      setSuccess('Theme saved — changes are live across the whole site now.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  if (!loaded) return <p className="text-ink-soft">Loading…</p>;

  return (
    <div className="flex flex-wrap gap-10">
    <form onSubmit={handleSave} className="grid max-w-lg flex-1 gap-4">
      {THEME_FIELDS.map((f) => (
        <label key={f.key} className="grid gap-1 text-sm">
          <span>
            {f.label}
            <span className="ml-2 font-normal text-ink-soft">{f.hint}</span>
          </span>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={theme[f.key] || f.fallback}
              onChange={(e) => setTheme((t) => ({ ...t, [f.key]: e.target.value }))}
              className="h-10 w-16 rounded border border-line bg-fog"
            />
            <input
              value={theme[f.key] || ''}
              onChange={(e) => setTheme((t) => ({ ...t, [f.key]: e.target.value }))}
              placeholder={f.fallback}
              className="w-32 rounded border border-line bg-fog px-3 py-2 text-sm"
            />
          </div>
        </label>
      ))}

      {error && <p className="text-sm text-danger">{error}</p>}
      {success && <p className="text-sm text-success">{success}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-fit rounded-full bg-gold px-6 py-3 font-semibold text-ink disabled:opacity-60"
      >
        {saving ? 'Saving…' : 'Save Theme'}
      </button>
    </form>

    <div>
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">Live Preview</div>
      <ThemePreview theme={theme} />
    </div>
    </div>
  );
}

function SlidesSection() {
  const { getToken } = useAuth();
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) return;
      const { slides } = await fetchAdminSlides(token);
      setSlides(slides);
      setLoaded(true);
    })();
  }, [getToken]);

  function startEdit(s: Slide) {
    setEditingId(s.id);
    setForm({ eyebrow: s.eyebrow, title: s.title, description: s.description, ctaLabel: s.ctaLabel, ctaHref: s.ctaHref });
    setImageFile(null);
    setSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setImageFile(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in.');

      let imagePath: string | null | undefined = undefined;
      if (imageFile) {
        const { url } = await uploadAdminImage(token, imageFile);
        imagePath = url;
      }

      const payload = { ...form, ...(imagePath !== undefined ? { imagePath } : {}) };

      if (editingId) {
        const { slide } = await updateAdminSlide(token, editingId, payload);
        setSlides((list) => list.map((s) => (s.id === slide.id ? slide : s)));
        setSuccess('Slide updated.');
        cancelEdit();
      } else {
        const { slide } = await createAdminSlide(token, { ...payload, order: slides.length });
        setSlides((list) => [...list, slide]);
        setSuccess('Slide created.');
        setForm(EMPTY_FORM);
        setImageFile(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(s: Slide) {
    if (!confirm(`Delete this slide ("${s.title}")?`)) return;
    const token = await getToken();
    if (!token) return;
    await deleteAdminSlide(token, s.id);
    setSlides((list) => list.filter((x) => x.id !== s.id));
    if (editingId === s.id) cancelEdit();
  }

  async function move(s: Slide, direction: -1 | 1) {
    const sorted = [...slides].sort((a, b) => a.order - b.order);
    const i = sorted.findIndex((x) => x.id === s.id);
    const j = i + direction;
    if (j < 0 || j >= sorted.length) return;
    const token = await getToken();
    if (!token) return;
    const other = sorted[j];
    const [updatedA, updatedB] = await Promise.all([
      updateAdminSlide(token, s.id, { order: other.order }),
      updateAdminSlide(token, other.id, { order: s.order }),
    ]);
    setSlides((list) =>
      list.map((x) => (x.id === updatedA.slide.id ? updatedA.slide : x.id === updatedB.slide.id ? updatedB.slide : x))
    );
  }

  if (!loaded) return <p className="text-ink-soft">Loading…</p>;

  const sorted = [...slides].sort((a, b) => a.order - b.order);

  return (
    <div>
      <h3 className="text-lg font-semibold">{editingId ? 'Edit Slide' : 'Add a Homepage Slide'}</h3>
      <p className="mt-1 text-sm text-ink-soft">
        These appear in the rotating hero banner at the top of the homepage. Leave photo blank to use the default
        illustrated background.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 grid max-w-lg gap-4">
        <label className="grid gap-1 text-sm">
          Eyebrow (small text above the title)
          <input
            value={form.eyebrow}
            onChange={(e) => setForm((f) => ({ ...f, eyebrow: e.target.value }))}
            className="rounded border border-line bg-fog px-3 py-2"
          />
        </label>

        <label className="grid gap-1 text-sm">
          Title
          <input
            required
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="rounded border border-line bg-fog px-3 py-2"
          />
        </label>

        <label className="grid gap-1 text-sm">
          Description (optional)
          <textarea
            rows={2}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="rounded border border-line bg-fog px-3 py-2"
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="grid gap-1 text-sm">
            Button Text
            <input
              required
              value={form.ctaLabel}
              onChange={(e) => setForm((f) => ({ ...f, ctaLabel: e.target.value }))}
              className="rounded border border-line bg-fog px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm">
            Button Link
            <input
              required
              placeholder="/shop"
              value={form.ctaHref}
              onChange={(e) => setForm((f) => ({ ...f, ctaHref: e.target.value }))}
              className="rounded border border-line bg-fog px-3 py-2"
            />
          </label>
        </div>

        <label className="grid gap-1 text-sm">
          Photo ({editingId ? 'leave blank to keep current photo' : 'optional'})
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            className="text-sm"
          />
        </label>

        {imageFile && <p className="text-xs text-ink-soft">Selected: {imageFile.name}</p>}
        {error && <p className="text-sm text-danger">{error}</p>}
        {success && <p className="text-sm text-success">{success}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-gold px-6 py-3 font-semibold text-ink disabled:opacity-60"
          >
            {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Create Slide'}
          </button>
          {editingId && (
            <button type="button" onClick={cancelEdit} className="rounded-full border border-line px-6 py-3 font-semibold">
              Cancel
            </button>
          )}
        </div>
      </form>

      <h3 className="mt-14 border-b border-line pb-4 text-lg font-semibold">All Slides ({sorted.length})</h3>
      <div className="mt-6 space-y-3">
        {sorted.map((s, i) => (
          <div key={s.id} className="flex items-center gap-4 rounded-lg bg-fog-card p-4">
            <div className="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded bg-fog">
              {s.imagePath ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.imagePath} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs text-ink-soft">No photo</span>
              )}
            </div>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-wide text-ink-soft">{s.eyebrow}</div>
              <div className="font-semibold">{s.title}</div>
              <div className="text-sm text-ink-soft">
                {s.ctaLabel} → {s.ctaHref}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <button onClick={() => move(s, -1)} disabled={i === 0} className="text-xs underline disabled:opacity-30">
                ↑ Up
              </button>
              <button
                onClick={() => move(s, 1)}
                disabled={i === sorted.length - 1}
                className="text-xs underline disabled:opacity-30"
              >
                ↓ Down
              </button>
            </div>
            <div className="flex flex-col gap-1">
              <button onClick={() => startEdit(s)} className="text-xs font-semibold underline">
                Edit
              </button>
              <button onClick={() => handleDelete(s)} className="text-xs font-semibold text-danger underline">
                Delete
              </button>
            </div>
          </div>
        ))}
        {sorted.length === 0 && <p className="text-ink-soft">No slides yet — the homepage will show the default illustrated banner.</p>}
      </div>
    </div>
  );
}

export default function AdminConfigPage() {
  return (
    <div>
      <h1 className="text-2xl">Application Configuration</h1>

      <section className="mt-8">
        <h2 className="border-b border-line pb-3 text-xl">Site Logo</h2>
        <div className="mt-6">
          <LogoSection />
        </div>
      </section>

      <section className="mt-14">
        <h2 className="border-b border-line pb-3 text-xl">Theme Colors</h2>
        <div className="mt-6">
          <ThemeSection />
        </div>
      </section>

      <section className="mt-14">
        <h2 className="border-b border-line pb-3 text-xl">Homepage Slides</h2>
        <div className="mt-6">
          <SlidesSection />
        </div>
      </section>
    </div>
  );
}
