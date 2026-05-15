import Link from "next/link";
import type { StoreBusiness } from "@/lib/types";

export function StoreShell({
  store,
  children,
}: {
  store: StoreBusiness;
  children: React.ReactNode;
}) {
  return (
    <div className="app-shell min-h-screen">
      <header className="sticky top-0 z-20 border-b border-emerald-100/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href={`/store/${store.slug}/products`} className="min-w-0">
            <p className="truncate text-lg font-bold text-slate-900">{store.name}</p>
            <p className="text-xs text-slate-500">Online store</p>
          </Link>
          <Link
            href={`/store/${store.slug}/products`}
            className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
          >
            All products
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
