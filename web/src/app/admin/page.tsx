'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  fetchCategories,
  fetchAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  uploadAdminImage,
  money,
  type Category,
  type Product,
} from '@/lib/api';
import { ProductIcon } from '@/components/ProductIcon';

const ICONS = ['bear', 'sheep', 'bunny', 'blanket', 'cushion', 'mobile'];

const EMPTY_FORM = { name: '', categoryId: '', price: '', stock: '', description: '', icon: 'bear' };

export default function AdminProductsPage() {
  const { getToken } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
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
      const [{ categories }, { products }] = await Promise.all([fetchCategories(), fetchAdminProducts(token)]);
      setCategories(categories);
      setProducts(products);
      setForm((f) => ({ ...f, categoryId: f.categoryId || categories[0]?.slug || '' }));
      setLoaded(true);
    })();
  }, [getToken]);

  function startEdit(p: Product) {
    setEditingId(p.id);
    setForm({
      name: p.name,
      categoryId: p.category?.slug || '',
      price: String(p.price),
      stock: String(p.stock),
      description: p.description,
      icon: p.icon,
    });
    setImageFile(null);
    setSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm((f) => ({ ...EMPTY_FORM, categoryId: f.categoryId }));
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

      const payload = {
        name: form.name,
        categoryId: form.categoryId,
        description: form.description,
        price: Number(form.price),
        stock: Number(form.stock),
        icon: form.icon,
        ...(imagePath !== undefined ? { imagePath } : {}),
      };

      if (editingId) {
        const { product } = await updateAdminProduct(token, editingId, payload);
        setProducts((list) => list.map((p) => (p.id === product.id ? product : p)));
        setSuccess(`"${product.name}" updated.`);
        cancelEdit();
      } else {
        const { product } = await createAdminProduct(token, payload);
        setProducts((p) => [product, ...p]);
        setSuccess(`"${product.name}" created.`);
        setForm((f) => ({ ...EMPTY_FORM, categoryId: f.categoryId }));
        setImageFile(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(p: Product) {
    if (!confirm(`Delete "${p.name}"? This can't be undone unless it's referenced by past orders (in which case it'll just be hidden).`)) return;
    const token = await getToken();
    if (!token) return;
    const result = await deleteAdminProduct(token, p.id);
    if (result.hidden) {
      setProducts((list) => list.map((x) => (x.id === p.id ? { ...x, isActive: false } : x)));
    } else {
      setProducts((list) => list.filter((x) => x.id !== p.id));
    }
    if (editingId === p.id) cancelEdit();
  }

  if (!loaded) return <p className="text-ink-soft">Loading…</p>;

  return (
    <div>
      <h1 className="text-2xl">{editingId ? 'Edit Product' : 'Add a Product'}</h1>

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
          Category
          <select
            required
            value={form.categoryId}
            onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
            className="rounded border border-line bg-fog px-3 py-2"
          >
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="grid gap-1 text-sm">
            Price (₹)
            <input
              required
              type="number"
              min="0"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              className="rounded border border-line bg-fog px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm">
            Stock
            <input
              required
              type="number"
              min="0"
              value={form.stock}
              onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
              className="rounded border border-line bg-fog px-3 py-2"
            />
          </label>
        </div>

        <label className="grid gap-1 text-sm">
          Description
          <textarea
            required
            rows={3}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="rounded border border-line bg-fog px-3 py-2"
          />
        </label>

        <label className="grid gap-1 text-sm">
          Illustration (used when no photo is uploaded)
          <select
            value={form.icon}
            onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
            className="rounded border border-line bg-fog px-3 py-2"
          >
            {ICONS.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-sm">
          Photo ({editingId ? 'leave blank to keep current photo' : 'optional — overrides the illustration above'})
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
            {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Create Product'}
          </button>
          {editingId && (
            <button type="button" onClick={cancelEdit} className="rounded-full border border-line px-6 py-3 font-semibold">
              Cancel
            </button>
          )}
        </div>
      </form>

      <h2 className="mt-14 border-b border-line pb-4 text-xl">All Products ({products.length})</h2>
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((p) => (
          <div key={p.id} className="flex flex-col items-center rounded-lg p-5 text-center">
            <div className="relative flex aspect-square w-full items-center justify-center rounded-lg bg-fog-card">
              {p.imagePath ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.imagePath} alt={p.name} className="h-full w-full rounded-lg object-cover" />
              ) : (
                <ProductIcon icon={p.icon} size={110} />
              )}
              {!p.isActive && (
                <span className="absolute right-2 top-2 rounded-full bg-ink px-2 py-0.5 text-xs text-fog-card">Hidden</span>
              )}
            </div>
            <h3 className="mt-4 text-base">{p.name}</h3>
            <span className="mt-1 font-semibold text-sky-deep">{money(p.price)}</span>
            <span className="mt-1 text-xs text-ink-soft">{p.stock} in stock</span>
            <div className="mt-3 flex gap-2">
              <button onClick={() => startEdit(p)} className="text-xs font-semibold underline">
                Edit
              </button>
              <button onClick={() => handleDelete(p)} className="text-xs font-semibold text-danger underline">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
