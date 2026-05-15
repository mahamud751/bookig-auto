import type { PaginatedProducts, StoreBusiness, StoreProduct } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api";

async function storeRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || "Request failed");
  }
  return res.json() as Promise<T>;
}

export function fetchStore(slug: string) {
  return storeRequest<StoreBusiness>(`/store/${slug}`);
}

export function fetchStoreProducts(slug: string, page = 1, limit = 20) {
  return storeRequest<PaginatedProducts>(`/store/${slug}/products?page=${page}&limit=${limit}`);
}

export function fetchStoreProduct(slug: string, productId: string) {
  return storeRequest<StoreProduct>(`/store/${slug}/products/${productId}`);
}

export function checkoutStore(
  slug: string,
  payload: {
    productId: string;
    customerName: string;
    customerPhone: string;
    address: string;
    color?: string;
    size?: string;
    quantity: number;
    paymentMethod: "bkash" | "nagad";
    paymentNumber: string;
  },
) {
  return storeRequest(`/store/${slug}/checkout`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
