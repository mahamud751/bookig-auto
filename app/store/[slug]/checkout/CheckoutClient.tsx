"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { assetUrl } from "@/lib/images";
import { checkoutStore, fetchStoreProduct } from "@/lib/store-api";
import type { StoreProduct } from "@/lib/types";

const inputClass =
  "mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100";

export default function CheckoutClient() {
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const slug = params.slug;

  const productId = searchParams.get("productId") ?? "";
  const initialColor = searchParams.get("color") ?? "";
  const initialSize = searchParams.get("size") ?? "";
  const initialQty = Math.max(1, Number(searchParams.get("quantity")) || 1);

  const [product, setProduct] = useState<StoreProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    address: "",
    paymentMethod: "bkash" as "bkash" | "nagad",
    paymentNumber: "",
  });

  useEffect(() => {
    if (!productId) {
      setError("No product selected");
      setLoading(false);
      return;
    }
    fetchStoreProduct(slug, productId)
      .then(setProduct)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load product"))
      .finally(() => setLoading(false));
  }, [slug, productId]);

  const quantity = initialQty;
  const color = initialColor;
  const size = initialSize;
  const total = useMemo(() => (product ? Number(product.price) * quantity : 0), [product, quantity]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!product) return;
    setSubmitting(true);
    setError("");
    try {
      await checkoutStore(slug, {
        productId: product.id,
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        address: form.address,
        color: color || undefined,
        size: size || undefined,
        quantity,
        paymentMethod: form.paymentMethod,
        paymentNumber: form.paymentNumber,
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="soft-panel p-10 text-center text-slate-500">Loading checkout...</div>;
  }

  if (success) {
    return (
      <div className="soft-panel mx-auto max-w-lg space-y-4 p-8 text-center">
        <h1 className="text-2xl font-bold text-emerald-700">Order placed successfully</h1>
        <p className="text-sm text-slate-600">Thank you! The seller will contact you soon.</p>
        <Link
          href={`/store/${slug}/products`}
          className="inline-block rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  if (error && !product) {
    return <div className="soft-panel p-10 text-center text-red-600">{error}</div>;
  }

  const cover = product?.images[0] ?? product?.imageUrl;

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
      <div className="soft-panel space-y-4 p-6">
        <h1 className="text-2xl font-bold text-slate-900">Checkout</h1>
        {product ? (
          <div className="flex gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-200">
              {cover ? (
                <Image src={assetUrl(cover)} alt={product.name} fill className="object-cover" sizes="96px" />
              ) : null}
            </div>
            <div className="min-w-0 space-y-1 text-sm">
              <p className="font-semibold text-slate-900">{product.name}</p>
              <p className="text-slate-600">Price: {product.price} BDT</p>
              <p className="text-slate-600">Qty: {quantity}</p>
              {color ? <p className="text-slate-600">Color: {color}</p> : null}
              {size ? <p className="text-slate-600">Size: {size}</p> : null}
              <p className="font-semibold text-emerald-700">Total: {total} BDT</p>
            </div>
          </div>
        ) : null}
      </div>

      <form onSubmit={onSubmit} className="soft-panel space-y-4 p-6">
        <h2 className="text-lg font-semibold text-slate-900">Your details</h2>

        <label className="block text-xs font-medium text-slate-600">
          Full name
          <input
            className={inputClass}
            required
            value={form.customerName}
            onChange={(e) => setForm((p) => ({ ...p, customerName: e.target.value }))}
          />
        </label>
        <label className="block text-xs font-medium text-slate-600">
          Phone number
          <input
            className={inputClass}
            required
            value={form.customerPhone}
            onChange={(e) => setForm((p) => ({ ...p, customerPhone: e.target.value }))}
          />
        </label>
        <label className="block text-xs font-medium text-slate-600">
          Delivery address
          <textarea
            className={`${inputClass} min-h-24`}
            required
            value={form.address}
            onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
          />
        </label>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-800">Payment method</p>
          <div className="grid grid-cols-2 gap-3">
            {(["bkash", "nagad"] as const).map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setForm((p) => ({ ...p, paymentMethod: method }))}
                className={`rounded-xl border px-4 py-3 text-sm font-semibold capitalize transition ${
                  form.paymentMethod === method
                    ? "border-emerald-500 bg-emerald-600 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300"
                }`}
              >
                {method}
              </button>
            ))}
          </div>
        </div>

        <label className="block text-xs font-medium text-slate-600">
          Your {form.paymentMethod} number (sender)
          <input
            className={inputClass}
            required
            placeholder="01XXXXXXXXX"
            value={form.paymentNumber}
            onChange={(e) => setForm((p) => ({ ...p, paymentNumber: e.target.value }))}
          />
        </label>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 disabled:opacity-60"
        >
          {submitting ? "Placing order..." : "Place order"}
        </button>

        {productId ? (
          <Link href={`/store/${slug}/products/${productId}`} className="inline-block text-sm font-semibold text-emerald-700">
            ← Back to product
          </Link>
        ) : null}
      </form>
    </div>
  );
}
