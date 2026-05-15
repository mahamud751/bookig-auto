"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ImageGallery } from "@/components/store/ImageGallery";
import { OptionChips } from "@/components/store/OptionChips";
import { siteUrl } from "@/lib/images";
import { fetchStoreProduct } from "@/lib/store-api";
import type { StoreProduct } from "@/lib/types";

export default function ProductDetailPage() {
  const params = useParams<{ slug: string; id: string }>();
  const router = useRouter();
  const slug = params.slug;
  const productId = params.id;

  const [product, setProduct] = useState<StoreProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchStoreProduct(slug, productId)
      .then((data) => {
        setProduct(data);
        setColor(data.colors[0] ?? "");
        setSize(data.sizes[0] ?? "");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load product"))
      .finally(() => setLoading(false));
  }, [slug, productId]);

  const productUrl = useMemo(
    () => siteUrl(`/store/${slug}/products/${productId}`),
    [slug, productId],
  );

  const copyText = useMemo(() => {
    if (!product) return "";
    return [
      `পণ্য: ${product.name}`,
      `দাম: ${product.price} BDT`,
      `পরিমাণ: ${quantity}`,
      `সাইজ: ${size || "-"}`,
      `রং: ${color || "-"}`,
      "",
      `অর্ডার করতে এখানে ক্লিক করুন 👉 ${productUrl}`,
    ].join("\n");
  }, [product, quantity, size, color, productUrl]);

  async function copyProductInfo() {
    await navigator.clipboard.writeText(copyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function goCheckout() {
    const query = new URLSearchParams({
      productId,
      quantity: String(quantity),
      ...(color ? { color } : {}),
      ...(size ? { size } : {}),
    });
    router.push(`/store/${slug}/checkout?${query.toString()}`);
  }

  if (loading) {
    return <div className="soft-panel p-10 text-center text-slate-500">Loading product...</div>;
  }

  if (error || !product) {
    return <div className="soft-panel p-10 text-center text-red-600">{error || "Product not found"}</div>;
  }

  const total = Number(product.price) * quantity;

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <ImageGallery images={product.images} alt={product.name} />

      <div className="soft-panel space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{product.name}</h1>
          {product.sku ? <p className="mt-1 text-sm text-slate-500">Product code: {product.sku}</p> : null}
          <p className="mt-3 text-2xl font-bold text-emerald-700">{product.price} BDT</p>
          <p className="text-sm text-slate-500">Stock: {product.stock}</p>
        </div>

        <OptionChips label="Color" options={product.colors} value={color} onChange={setColor} />
        <OptionChips label="Size" options={product.sizes} value={size} onChange={setSize} />

        <div>
          <p className="mb-2 text-sm font-semibold text-slate-800">Quantity</p>
          <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50">
            <button
              type="button"
              className="px-4 py-2 text-lg font-semibold text-slate-700"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            >
              −
            </button>
            <span className="min-w-10 text-center text-sm font-semibold text-slate-900">{quantity}</span>
            <button
              type="button"
              className="px-4 py-2 text-lg font-semibold text-slate-700"
              onClick={() => setQuantity((q) => q + 1)}
            >
              +
            </button>
          </div>
        </div>

        <p className="text-lg font-semibold text-slate-900">Total: {total} BDT</p>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={goCheckout}
            className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500"
          >
            Order now
          </button>
          <button
            type="button"
            onClick={copyProductInfo}
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
          >
            {copied ? "Copied!" : "Copy for Messenger"}
          </button>
        </div>

        <Link href={`/store/${slug}/products`} className="inline-block text-sm font-semibold text-emerald-700 hover:text-emerald-600">
          ← Back to products
        </Link>
      </div>
    </div>
  );
}
