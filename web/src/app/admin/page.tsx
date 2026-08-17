'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  fetchCategories,
  fetchAdminProducts,
  createAdminProduct,
  uploadAdminImage,
  money,
  type Category,
  type Product,
} from '@/lib/api';
import { ProductIcon } from '@/components/ProductIcon';

const ICONS = ['bear', 'sheep', 'bunny', 'blanket', 'cushion', 'mobile'];

export default function AdminPage() {
  const { user, loading, getToken } = useAuth();
  const [status, setStatus] = useState<'checking' | 'denied' | 'ready'>('checking');
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('bear');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setStatus('denied');
      return;
    }
    (async () => {
      const token = await getToken();
      if (!token) return setStatus('denied');
      try {
        const [{ categories }, { products }] = await Promise.all([
          fetchCategories(),
          fetchAdminProducts(token),
        ]);
        setCategories(categories);
        setProducts(products);
        setCategoryId((c) => c || categories[0]?.slug || '');
        setStatus('ready');
      } catch {
        setStatus('denied');
      }
    })();
  }, [user, loading, getToken]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in.');

      let imagePath: string | null = null;
      if (imageFile) {
        const { url } = await uploadAdminImage(token, imageFile);
        imagePath = url;
      }

      const { product } = await createAdminProduct(token, {
        name,
        categoryId,
        description,
        price: Number(price),
        stock: Number(stock),
        icon,
        imagePath,
      });

      setProducts((p) => [product, ...p]);
      setSuccess(`"${product.name}" created.`);
      setName('');
      setPrice('');
      setStock('');
      setDescription('');
      setImageFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  if (status === 'checking') {
    return <p className="text-ink-soft">Checking access…</p>;
  }

  if (status === 'denied') {
    return (
      <div>
        <h1 className="text-2xl">Admin</h1>
        <p className="mt-3 text-ink-soft">
          You need to be signed in with an admin account to view this page.{' '}
          <Link href="/login" className="underline">
            Log in
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl">Add a Product</h1>

      <form onSubmit={handleSubmit} className="mt-6 grid max-w-lg gap-4">
        <label className="grid gap-1 text-sm">
          Name
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded border border-line bg-fog px-3 py-2"
          />
        </label>

        <label className="grid gap-1 text-sm">
          Category
          <select
            required
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
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
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="rounded border border-line bg-fog px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm">
            Stock
            <input
              required
              type="number"
              min="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="rounded border border-line bg-fog px-3 py-2"
            />
          </label>
        </div>

        <label className="grid gap-1 text-sm">
          Description
          <textarea
            required
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="rounded border border-line bg-fog px-3 py-2"
          />
        </label>

        <label className="grid gap-1 text-sm">
          Illustration (used when no photo is uploaded)
          <select value={icon} onChange={(e) => setIcon(e.target.value)} className="rounded border border-line bg-fog px-3 py-2">
            {ICONS.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-sm">
          Photo (optional — overrides the illustration above)
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            className="text-sm"
          />
        </label>

        {imageFile && (
          <p className="text-xs text-ink-soft">Selected: {imageFile.name}</p>
        )}

        {error && <p className="text-sm text-danger">{error}</p>}
        {success && <p className="text-sm text-success">{success}</p>}

        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-gold px-6 py-3 font-semibold text-ink disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Create Product'}
        </button>
      </form>

      <h2 className="mt-14 border-b border-line pb-4 text-xl">Existing Products ({products.length})</h2>
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
            </div>
            <h3 className="mt-4 text-base">{p.name}</h3>
            <span className="mt-1 font-semibold text-sky-deep">{money(p.price)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
