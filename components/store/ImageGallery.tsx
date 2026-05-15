"use client";

import Image from "next/image";
import { useState } from "react";
import { assetUrl } from "@/lib/images";

export function ImageGallery({ images, alt }: { images: string[]; alt: string }) {
  const gallery = images.length > 0 ? images : [];
  const [active, setActive] = useState(0);
  const current = gallery[active];

  if (gallery.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-400">
        No product image
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-slate-100">
        <Image src={assetUrl(current)} alt={alt} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" priority />
      </div>
      {gallery.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {gallery.map((src, index) => (
            <button
              key={`${src}-${index}`}
              type="button"
              onClick={() => setActive(index)}
              className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                active === index ? "border-emerald-500 ring-2 ring-emerald-100" : "border-slate-200 opacity-80 hover:opacity-100"
              }`}
            >
              <Image src={assetUrl(src)} alt={`${alt} ${index + 1}`} fill className="object-cover" sizes="80px" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
