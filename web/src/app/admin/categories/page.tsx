'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  fetchAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
  uploadAdminImage,
  type AdminCategory,
  type CategoryType,
} from '@/lib/api';

const TYPE_OPTIONS: { value: CategoryType; label: string; hint: string }[] = [
  { value: 'standard', label: 'Standard', hint: 'Shown in "Every Collection" only' },
  { value: 'featured', label: 'Featured', hint: 'Also shown in "Start With a Favourite" on the homepage' },
  { value: 'new-arrival', label: 'New Arrival', hint: 'Marked as new — for a future "New Arrivals" spot' },
];

const EMPTY_FORM = { name: '', description: '', type: 'standard' as CategoryType };

export default function AdminCategoriesPage() {
  const { getToken } = useAuth();
  const [categories, setCategories] = useState<AdminCategory[]>([]);
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
      const { categories } = await fetchAdminCategories(token);
      setCategories(categories);
      setLoaded(true);
    })();
  }, [getToken]);

  function startEdit(c: AdminCategory) {
    setEditingId(c.id);
    setForm({ name: c.name, description: c.description || '', type: c.type || 'standard' });
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
        const { category } = await updateAdminCategory(token, editingId, payload);
        setCategories((list) => list.map((c) => (c.id === category.id ? { ...c, ...category } : c)));
        setSuccess(`"${category.name}" updated.`);
        cancelEdit();
      } else {
        const { category } = await createAdminCategory(token, payload);
        setCategories((c) => [...c, { ...category, _count: { products: 0 } }].sort((a, b) => a.name.localeCompare(b.name)));
        setSuccess(`"${category.name}" created.`);
        setForm(EMPTY_FORM);
        setImageFile(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(c: AdminCategory) {
    if (c._count.products > 0) {
      alert(`"${c.name}" has ${c._count.products} product(s) in it — move or delete those first.`);
      return;
    }
    if (!confirm(`Delete category "${c.name}"?`)) return;
    const token = await getToken();
    if (!token) return;
    await deleteAdminCategory(token, c.id);
    setCategories((list) => list.filter((x) => x.id !== c.id));
    if (editingId === c.id) cancelEdit();
  }

  if (!loaded) return <p className="text-ink-soft">Loading…</p>;

  return (
    <div>
      <h1 className="text-2xl">{editingId ? 'Edit Category' : 'Categories'}</h1>

      <form onSubmit={handleSubmit} className="mt-6 grid max-w-lg gap-4">
        <label className="grid gap-1 text-sm">
          Name
          <input
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="rounded border border-line bg-fog px-3 py-2"
          />
        </label>
        <label className="grid gap-1 text-sm">
          Description (optional)
          <input
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="rounded border border-line bg-fog px-3 py-2"
          />
        </label>

        <div className="grid gap-1 text-sm">
          <span>Type</span>
          <div className="grid gap-2">
            {TYPE_OPTIONS.map((opt) => (
              <label key={opt.value} className="flex items-start gap-2 rounded border border-line px-3 py-2">
                <input
                  type="radio"
                  name="type"
                  checked={form.type === opt.value}
                  onChange={() => setForm((f) => ({ ...f, type: opt.value }))}
                  className="mt-1"
                />
                <span>
                  <span className="font-semibold">{opt.label}</span>
                  <span className="ml-2 text-xs text-ink-soft">{opt.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <label className="grid gap-1 text-sm">
          Photo ({editingId ? 'leave blank to keep current photo' : 'optional — falls back to an illustration'})
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
            className="w-fit rounded-full bg-gold px-6 py-3 font-semibold text-ink disabled:opacity-60"
          >
            {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Add Category'}
          </button>
          {editingId && (
            <button type="button" onClick={cancelEdit} className="w-fit rounded-full border border-line px-6 py-3 font-semibold">
              Cancel
            </button>
          )}
        </div>
      </form>

      <h2 className="mt-14 border-b border-line pb-4 text-xl">All Categories ({categories.length})</h2>
      <div className="mt-6 space-y-3">
        {categories.map((c) => (
          <div key={c.id} className="flex items-center gap-4 rounded-lg bg-fog-card p-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded bg-fog">
              {c.imagePath ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.imagePath} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs text-ink-soft">No photo</span>
              )}
            </div>
            <div className="flex-1">
              <span className="font-semibold">{c.name}</span>
              <span className="ml-2 text-sm text-ink-soft">{c._count.products} product(s)</span>
              {c.type && c.type !== 'standard' && (
                <span className="ml-2 rounded-full bg-gold/30 px-2 py-0.5 text-xs font-semibold">
                  {TYPE_OPTIONS.find((t) => t.value === c.type)?.label}
                </span>
              )}
              {c.description && <p className="mt-1 text-sm text-ink-soft">{c.description}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <button onClick={() => startEdit(c)} className="text-xs font-semibold underline">
                Edit
              </button>
              <button onClick={() => handleDelete(c)} className="text-xs font-semibold text-danger underline">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
