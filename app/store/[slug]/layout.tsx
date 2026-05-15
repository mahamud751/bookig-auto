import { StoreShell } from "@/components/store/StoreShell";
import { fetchStore } from "@/lib/store-api";

export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const store = await fetchStore(slug);
  return <StoreShell store={store}>{children}</StoreShell>;
}
