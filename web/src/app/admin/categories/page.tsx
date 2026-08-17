'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchAdminCategories, createAdminCategory, deleteAdminCategory, type AdminCategory } from '@/lib/api';

export default function AdminCategoriesPage() {
  const { getToken } = useAuth();
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) return;
      const { categories } = await fetchAdminCategories(token);
      setCategories(categories);
      setLoaded(true);
    })();
  }, [getToken]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in.');
      const { category } = await createAdminCategory(token, { name, description: description || undefined });
      setCategories((c) => [...c, { ...category, _count: { products: 0 } }].sort((a, b) => a.name.localeCompare(b.name)));
      setName('');
      setDescription('');
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
  }

  if (!loaded) return <p className="text-ink-soft">Loading…</p>;

  return (
    <div>
      <h1 className="text-2xl">Categories</h1>

      <form onSubmit={handleSubmit} className="mt-6 grid max-w-lg gap-4">
        <label className="grid gap-1 text-sm">
          Name
          <input required value={name} onChange={(e) => setName(e.target.value)} className="rounded border border-line bg-fog px-3 py-2" />
        </label>
        <label className="grid gap-1 text-sm">
          Description (optional)
          <input value={description} onChange={(e) => setDescription(e.target.value)} className="rounded border border-line bg-fog px-3 py-2" />
        </label>
        {error && <p className="text-sm text-danger">{error}</p>}
        <button type="submit" disabled={saving} className="w-fit rounded-full bg-gold px-6 py-3 font-semibold text-ink disabled:opacity-60">
          {saving ? 'Saving…' : 'Add Category'}
        </button>
      </form>

      <h2 className="mt-14 border-b border-line pb-4 text-xl">All Categories ({categories.length})</h2>
      <div className="mt-6 space-y-3">
        {categories.map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded-lg bg-fog-card p-5">
            <div>
              <span className="font-semibold">{c.name}</span>
              <span className="ml-2 text-sm text-ink-soft">{c._count.products} product(s)</span>
              {c.description && <p className="mt-1 text-sm text-ink-soft">{c.description}</p>}
            </div>
            <button onClick={() => handleDelete(c)} className="text-sm font-semibold text-danger underline">
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
