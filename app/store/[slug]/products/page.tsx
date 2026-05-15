import Link from "next/link";
import { ProductCard } from "@/components/store/ProductCard";
import { fetchStoreProducts } from "@/lib/store-api";

export default async function StoreProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const data = await fetchStoreProducts(slug, page, 20);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Products</h1>
        <p className="mt-1 text-sm text-slate-500">{data.total} items available</p>
      </div>

      {data.items.length === 0 ? (
        <div className="soft-panel p-10 text-center text-slate-500">No products yet.</div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.items.map((product) => (
            <ProductCard key={product.id} slug={slug} product={product} />
          ))}
        </div>
      )}

      {data.totalPages > 1 ? (
        <div className="flex items-center justify-center gap-3">
          {page > 1 ? (
            <Link
              href={`/store/${slug}/products?page=${page - 1}`}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Previous
            </Link>
          ) : null}
          <span className="text-sm text-slate-500">
            Page {data.page} of {data.totalPages}
          </span>
          {page < data.totalPages ? (
            <Link
              href={`/store/${slug}/products?page=${page + 1}`}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Next
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
