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
  isActive?: boolean;
  category: { id: string; name: string; slug: string } | null;
};

export type CategoryType = 'standard' | 'featured' | 'new-arrival';

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  type?: CategoryType;
  imagePath?: string | null;
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

export type NewProduct = {
  name: string;
  categoryId: string;
  sku?: string;
  description: string;
  price: number;
  stock: number;
  icon: string;
  isActive?: boolean;
  imagePath?: string | null;
};

export function fetchAdminProducts(token: string): Promise<{ products: Product[] }> {
  return apiFetch('/api/admin/products', { headers: { Authorization: `Bearer ${token}` } });
}

export async function checkIsAdmin(token: string): Promise<boolean> {
  try {
    await apiFetch('/api/admin/dashboard', { headers: { Authorization: `Bearer ${token}` } });
    return true;
  } catch {
    return false;
  }
}

export function createAdminProduct(token: string, product: NewProduct): Promise<{ product: Product }> {
  return apiFetch('/api/admin/products', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(product),
  });
}

export function updateAdminProduct(
  token: string,
  id: string,
  patch: Partial<NewProduct>
): Promise<{ product: Product }> {
  return apiFetch(`/api/admin/products/${id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(patch),
  });
}

export function deleteAdminProduct(token: string, id: string): Promise<{ ok: true; hidden?: boolean }> {
  return apiFetch(`/api/admin/products/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export type AdminCategory = Category & { _count: { products: number } };

export function fetchAdminCategories(token: string): Promise<{ categories: AdminCategory[] }> {
  return apiFetch('/api/admin/categories', { headers: { Authorization: `Bearer ${token}` } });
}

export type NewCategory = {
  name: string;
  description?: string;
  type?: CategoryType;
  imagePath?: string | null;
};

export function createAdminCategory(token: string, category: NewCategory): Promise<{ category: Category }> {
  return apiFetch('/api/admin/categories', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(category),
  });
}

export function updateAdminCategory(
  token: string,
  id: string,
  patch: Partial<NewCategory>
): Promise<{ category: Category }> {
  return apiFetch(`/api/admin/categories/${id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(patch),
  });
}

export function deleteAdminCategory(token: string, id: string): Promise<{ ok: true }> {
  return apiFetch(`/api/admin/categories/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export type AdminOrder = Order & { userId: string; user: { name: string; email: string } | null };

export function fetchAdminOrders(token: string, status?: string): Promise<{ orders: AdminOrder[] }> {
  const query = status ? `?status=${status}` : '';
  return apiFetch(`/api/admin/orders${query}`, { headers: { Authorization: `Bearer ${token}` } });
}

export function updateAdminOrderStatus(
  token: string,
  id: string,
  status: string
): Promise<{ order: AdminOrder }> {
  return apiFetch(`/api/admin/orders/${id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status }),
  });
}

export type AdminCustomer = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  orderCount: number;
  totalSpent: number;
};

export function fetchAdminCustomers(token: string): Promise<{ customers: AdminCustomer[] }> {
  return apiFetch('/api/admin/customers', { headers: { Authorization: `Bearer ${token}` } });
}

export type AdminDashboard = {
  totalProducts: number;
  totalOrders: number;
  totalCustomers: number;
  revenue: number;
  statusCounts: Record<string, number>;
  lowStock: Product[];
};

export function fetchAdminDashboard(token: string): Promise<AdminDashboard> {
  return apiFetch('/api/admin/dashboard', { headers: { Authorization: `Bearer ${token}` } });
}

export async function uploadAdminImage(token: string, file: File): Promise<{ url: string }> {
  const form = new FormData();
  form.append('image', file);
  const res = await fetch(`${API_URL}/api/admin/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Upload failed with status ${res.status}`);
  }
  return res.json();
}

export type Slide = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  imagePath: string | null;
  order: number;
};

export type NewSlide = {
  eyebrow?: string;
  title: string;
  description?: string;
  ctaLabel: string;
  ctaHref: string;
  imagePath?: string | null;
  order?: number;
};

export function fetchSlides(): Promise<{ slides: Slide[] }> {
  return apiFetch('/api/slides');
}

export function fetchAdminSlides(token: string): Promise<{ slides: Slide[] }> {
  return apiFetch('/api/admin/slides', { headers: { Authorization: `Bearer ${token}` } });
}

export function createAdminSlide(token: string, slide: NewSlide): Promise<{ slide: Slide }> {
  return apiFetch('/api/admin/slides', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(slide),
  });
}

export function updateAdminSlide(token: string, id: string, patch: Partial<NewSlide>): Promise<{ slide: Slide }> {
  return apiFetch(`/api/admin/slides/${id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(patch),
  });
}

export function deleteAdminSlide(token: string, id: string): Promise<{ ok: true }> {
  return apiFetch(`/api/admin/slides/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export type Theme = {
  buttonColor?: string;
  textColor?: string;
  popupColor?: string;
  headerColor?: string;
  footerColor?: string;
  logoUrl?: string | null;
};

export async function fetchTheme(): Promise<Theme> {
  const { theme } = await apiFetch<{ theme: Theme }>('/api/theme');
  return theme;
}

export async function fetchAdminTheme(token: string): Promise<Theme> {
  const { theme } = await apiFetch<{ theme: Theme }>('/api/admin/theme', { headers: { Authorization: `Bearer ${token}` } });
  return theme;
}

export async function updateAdminTheme(token: string, patch: Theme): Promise<Theme> {
  const { theme } = await apiFetch<{ theme: Theme }>('/api/admin/theme', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(patch),
  });
  return theme;
}

export { API_URL };
