const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export type Product = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  description: string;
  price: number;
  stock: number;
  imagePath: string | null;
  icon: string;
  category: { id: string; name: string; slug: string } | null;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    cache: 'no-store',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed with status ${res.status}`);
  }
  return res.json();
}

export function fetchProducts(params: {
  category?: string;
  q?: string;
  sort?: string;
  page?: string;
  minPrice?: string;
  maxPrice?: string;
}): Promise<{ products: Product[]; total: number; totalPages: number; page: number }> {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v) as [string, string][]
  ).toString();
  return apiFetch(`/api/products${query ? `?${query}` : ''}`);
}

export function fetchProduct(slug: string): Promise<{ product: Product; related: Product[] }> {
  return apiFetch(`/api/products/${slug}`);
}

export function fetchCategories(): Promise<{ categories: Category[] }> {
  return apiFetch('/api/categories');
}

export function fetchPriceRange(): Promise<{ min: number; max: number }> {
  return apiFetch('/api/products/price-range');
}

export type Shipping = {
  name: string;
  address: string;
  city: string;
  postcode: string;
  phone: string;
  notes?: string;
};

export function createOrder(
  token: string,
  items: { productId: string; quantity: number }[],
  shipping: Shipping
): Promise<{ orderId: string; clientSecret: string; total: number }> {
  return apiFetch('/api/orders', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ items, shipping }),
  });
}

export type Order = {
  id: string;
  status: string;
  subtotal: number;
  shippingFee: number;
  total: number;
  shippingName: string;
  shippingAddress: string;
  shippingCity: string;
  shippingPostcode: string;
  shippingPhone: string;
  notes: string | null;
  createdAt: string;
  items: { productName: string; unitPrice: number; quantity: number; lineTotal: number }[];
};

export function fetchOrder(token: string, orderId: string): Promise<{ order: Order }> {
  return apiFetch(`/api/orders/${orderId}`, { headers: { Authorization: `Bearer ${token}` } });
}

export function fetchOrders(token: string): Promise<{ orders: Order[] }> {
  return apiFetch('/api/orders', { headers: { Authorization: `Bearer ${token}` } });
}

export function money(amount: number): string {
  return '₹' + Math.round(amount).toLocaleString('en-IN');
}

// Mirrors SHIPPING_FLAT_FEE / FREE_SHIPPING_THRESHOLD in api/src/routes/orders.js —
// the API recalculates and enforces these for real at checkout; these are only
// for showing the right numbers on the cart page before that.
export const SHIPPING_FLAT_FEE = 826;
export const FREE_SHIPPING_THRESHOLD = 8300;

export function shippingFeeFor(subtotal: number): number {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT_FEE;
}

export { API_URL };
