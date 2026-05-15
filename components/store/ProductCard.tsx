import Image from "next/image";
import Link from "next/link";
import { assetUrl } from "@/lib/images";
import type { StoreProduct } from "@/lib/types";

export function ProductCard({ slug, product }: { slug: string; product: StoreProduct }) {
  const cover = product.images[0] ?? product.imageUrl;

  return (
    <Link
      href={`/store/${slug}/products/${product.id}`}
      className="group soft-panel overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-slate-100">
        {cover ? (
          <Image
            src={assetUrl(cover)}
            alt={product.name}
            fill
            className="object-cover transition duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">No image</div>
        )}
      </div>
      <div className="space-y-1 p-4">
        <p className="line-clamp-2 font-semibold text-slate-900">{product.name}</p>
        {product.sku ? <p className="text-xs text-slate-500">Code: {product.sku}</p> : null}
        <p className="text-base font-bold text-emerald-700">{product.price} BDT</p>
      </div>
    </Link>
  );
}
