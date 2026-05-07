"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { clearToken, getToken } from "@/lib/auth";

type DashboardStats = { todayOrders: number; pending: number; delivered: number; cancelled: number };
type Product = { id: string; name: string; sku?: string | null; price: string; stock: number };
type Order = { id: string; customerName: string; productName: string; productCode?: string | null; color?: string | null; size?: string | null; status: string; price: string };
type QuickReply = { id: string; title: string; message: string };
type SectionKey = "overview" | "products" | "orders" | "replies";

const PAGE_SIZE = 5;

export default function DashboardPage() {
  const router = useRouter();
  const [token, setTokenState] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [replies, setReplies] = useState<QuickReply[]>([]);
  const [newProduct, setNewProduct] = useState({ name: "", sku: "", price: "", stock: "0" });
  const [newOrder, setNewOrder] = useState({
    customerName: "",
    customerPhone: "",
    address: "",
    productName: "",
    productCode: "",
    color: "",
    size: "",
    price: "",
  });
  const [newReply, setNewReply] = useState({ title: "", message: "" });
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [productPage, setProductPage] = useState(1);
  const [orderPage, setOrderPage] = useState(1);
  const [replyPage, setReplyPage] = useState(1);
  const [activeSection, setActiveSection] = useState<SectionKey>("overview");
  const [productSearch, setProductSearch] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [deliveryCharge, setDeliveryCharge] = useState("80");
  const [pastedOrderText, setPastedOrderText] = useState("");

  useEffect(() => {
    const t = getToken();
    if (!t) {
      router.replace("/login");
      return;
    }
    setTokenState(t);
  }, [router]);

  async function loadAll(t: string) {
    setLoading(true);
    const [statsRes, productsRes, ordersRes, repliesRes] = await Promise.all([
      apiRequest<DashboardStats>("/orders/dashboard", { token: t }),
      apiRequest<Product[]>("/products", { token: t }),
      apiRequest<Order[]>("/orders", { token: t }),
      apiRequest<QuickReply[]>("/quick-replies", { token: t }),
    ]);
    setStats(statsRes);
    setProducts(productsRes);
    setOrders(ordersRes);
    setReplies(repliesRes);
    setLoading(false);
  }

  useEffect(() => {
    if (!token) return;
    loadAll(token).catch(() => {
      clearToken();
      router.replace("/login");
    });
  }, [token, router]);

  const copyTemplate = async (text: string, idx: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 1200);
  };

  async function createProduct(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    await apiRequest("/products", { method: "POST", token, body: JSON.stringify({ ...newProduct, price: Number(newProduct.price), stock: Number(newProduct.stock) }) });
    setNewProduct({ name: "", sku: "", price: "", stock: "0" });
    await loadAll(token);
  }

  async function createOrder(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    await apiRequest("/orders", { method: "POST", token, body: JSON.stringify({ ...newOrder, price: Number(newOrder.price) }) });
    setNewOrder({
      customerName: "",
      customerPhone: "",
      address: "",
      productName: "",
      productCode: "",
      color: "",
      size: "",
      price: "",
    });
    setPastedOrderText("");
    await loadAll(token);
  }

  async function createReply(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    await apiRequest("/quick-replies", { method: "POST", token, body: JSON.stringify(newReply) });
    setNewReply({ title: "", message: "" });
    await loadAll(token);
  }

  function logout() {
    clearToken();
    router.push("/login");
  }

  const paginatedProducts = paginate(products, productPage, PAGE_SIZE);
  const paginatedOrders = paginate(orders, orderPage, PAGE_SIZE);
  const paginatedReplies = paginate(replies, replyPage, PAGE_SIZE);
  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return products.slice(0, 30);
    return products
      .filter((p) => p.name.toLowerCase().includes(q) || (p.sku ?? "").toLowerCase().includes(q))
      .slice(0, 30);
  }, [products, productSearch]);
  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const generatedReply = selectedProduct
    ? `${selectedProduct.name}${selectedProduct.sku ? ` (Code: ${selectedProduct.sku})` : ""}
Price: ${selectedProduct.price} BDT
Delivery: ${deliveryCharge || "80"} BDT

Order করতে:
Name:
Phone:
Address:
Color (optional):
Size (optional):`
    : "";

  function autofillFromPastedText() {
    if (!pastedOrderText.trim()) return;
    const parsed = parseMessengerOrderText(pastedOrderText);
    setNewOrder((p) => ({ ...p, ...parsed }));
  }

  return (
    <main className="app-shell px-4 py-8 sm:px-6">
      <div className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[240px_1fr]">
        <aside className={`${mobileSidebarOpen ? "block" : "hidden"} rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:block`}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">F-Commerce Toolkit</p>
          <p className="mt-2 text-lg font-bold text-slate-900">Seller Panel</p>
          <nav className="mt-5 space-y-2">
            <NavItem
              label="Overview"
              active={activeSection === "overview"}
              onClick={() => {
                setActiveSection("overview");
                setMobileSidebarOpen(false);
              }}
            />
            <NavItem
              label="Products"
              badge={products.length}
              active={activeSection === "products"}
              onClick={() => {
                setActiveSection("products");
                setMobileSidebarOpen(false);
              }}
            />
            <NavItem
              label="Orders"
              badge={orders.length}
              active={activeSection === "orders"}
              onClick={() => {
                setActiveSection("orders");
                setMobileSidebarOpen(false);
              }}
            />
            <NavItem
              label="Quick Replies"
              badge={replies.length}
              active={activeSection === "replies"}
              onClick={() => {
                setActiveSection("replies");
                setMobileSidebarOpen(false);
              }}
            />
          </nav>
          <button onClick={logout} className="mt-6 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Logout
          </button>
        </aside>

        <div className="flex flex-col gap-6">
          <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <button
              className="mb-3 rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-600 lg:hidden"
              onClick={() => setMobileSidebarOpen((p) => !p)}
            >
              {mobileSidebarOpen ? "Close Menu" : "Open Menu"}
            </button>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Seller Dashboard</h1>
            <p className="mt-1 text-sm text-slate-500">Classic and clear workspace for daily operations.</p>
          </header>

          {loading ? (
            <StatsSkeleton />
          ) : (
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Today Orders" value={String(stats?.todayOrders ?? 0)} />
              <StatCard label="Pending" value={String(stats?.pending ?? 0)} />
              <StatCard label="Delivered" value={String(stats?.delivered ?? 0)} />
              <StatCard label="Cancelled" value={String(stats?.cancelled ?? 0)} />
            </section>
          )}

          {(activeSection === "overview" || activeSection === "products" || activeSection === "orders" || activeSection === "replies") && (
          <section className="grid gap-4 xl:grid-cols-3">
            {(activeSection === "overview" || activeSection === "products") && (
            <form onSubmit={createProduct} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">Add Product</h2>
              <p className="mb-4 mt-1 text-xs text-slate-500">Add product and stock details.</p>
              <div className="space-y-3">
                <input className={inputClass} placeholder="Product name" value={newProduct.name} onChange={(e) => setNewProduct((p) => ({ ...p, name: e.target.value }))} />
                <input className={inputClass} placeholder="Product code (SKU)" value={newProduct.sku} onChange={(e) => setNewProduct((p) => ({ ...p, sku: e.target.value }))} />
                <input className={inputClass} placeholder="Price (BDT)" value={newProduct.price} onChange={(e) => setNewProduct((p) => ({ ...p, price: e.target.value }))} />
                <input className={inputClass} placeholder="Stock qty" value={newProduct.stock} onChange={(e) => setNewProduct((p) => ({ ...p, stock: e.target.value }))} />
                <button className={buttonClass}>Save Product</button>
              </div>
            </form>
            )}

            {(activeSection === "overview" || activeSection === "orders") && (
            <form onSubmit={createOrder} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">Add Order</h2>
              <p className="mb-4 mt-1 text-xs text-slate-500">Capture customer order from chat.</p>
              <div className="space-y-3">
                <input className={inputClass} placeholder="Customer name" value={newOrder.customerName} onChange={(e) => setNewOrder((p) => ({ ...p, customerName: e.target.value }))} />
                <input className={inputClass} placeholder="Customer phone" value={newOrder.customerPhone} onChange={(e) => setNewOrder((p) => ({ ...p, customerPhone: e.target.value }))} />
                <input className={inputClass} placeholder="Delivery address" value={newOrder.address} onChange={(e) => setNewOrder((p) => ({ ...p, address: e.target.value }))} />
                <input className={inputClass} placeholder="Product name" value={newOrder.productName} onChange={(e) => setNewOrder((p) => ({ ...p, productName: e.target.value }))} />
                <input className={inputClass} placeholder="Product code (optional)" value={newOrder.productCode} onChange={(e) => setNewOrder((p) => ({ ...p, productCode: e.target.value }))} />
                <input className={inputClass} placeholder="Color (optional)" value={newOrder.color} onChange={(e) => setNewOrder((p) => ({ ...p, color: e.target.value }))} />
                <input className={inputClass} placeholder="Size (optional)" value={newOrder.size} onChange={(e) => setNewOrder((p) => ({ ...p, size: e.target.value }))} />
                <input className={inputClass} placeholder="Price (BDT)" value={newOrder.price} onChange={(e) => setNewOrder((p) => ({ ...p, price: e.target.value }))} />
                <textarea
                  className={`${inputClass} min-h-24`}
                  placeholder="Paste customer message (Name/Phone/Address/Color/Size)..."
                  value={pastedOrderText}
                  onChange={(e) => setPastedOrderText(e.target.value)}
                />
                <button
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  type="button"
                  onClick={autofillFromPastedText}
                >
                  Autofill from pasted text
                </button>
                <button className={buttonClass}>Save Order</button>
              </div>
            </form>
            )}

            {(activeSection === "overview" || activeSection === "replies") && (
            <form onSubmit={createReply} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">Add Quick Reply</h2>
              <p className="mb-4 mt-1 text-xs text-slate-500">Save reusable message templates.</p>
              <div className="space-y-3">
                <input className={inputClass} placeholder="Template title" value={newReply.title} onChange={(e) => setNewReply((p) => ({ ...p, title: e.target.value }))} />
                <textarea className={`${inputClass} min-h-28`} placeholder="Message template..." value={newReply.message} onChange={(e) => setNewReply((p) => ({ ...p, message: e.target.value }))} />
                <button className={buttonClass}>Save Reply</button>
              </div>
            </form>
            )}
          </section>
          )}

          {(activeSection === "overview" || activeSection === "products" || activeSection === "replies") && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">Messenger Reply Helper (Product Price)</h2>
              <p className="mt-1 text-xs text-slate-500">
                Search product, auto-generate message, then copy and paste in Messenger.
              </p>
              <div className="mt-4 grid gap-4 xl:grid-cols-3">
                <div className="space-y-3 xl:col-span-1">
                  <input
                    className={inputClass}
                    placeholder="Search product (e.g. polo)"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                  />
                  <select
                    className={inputClass}
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                  >
                    <option value="">Select product</option>
                    {filteredProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.sku ? `(${p.sku})` : ""} - {p.price} BDT
                      </option>
                    ))}
                  </select>
                  <input
                    className={inputClass}
                    placeholder="Delivery charge"
                    value={deliveryCharge}
                    onChange={(e) => setDeliveryCharge(e.target.value)}
                  />
                  <button
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    disabled={!selectedProduct}
                    onClick={() => {
                      if (!selectedProduct) return;
                      setNewOrder((p) => ({
                        ...p,
                        productName: selectedProduct.name,
                        productCode: selectedProduct.sku ?? "",
                        price: String(selectedProduct.price),
                      }));
                    }}
                    type="button"
                  >
                    Use in Add Order form
                  </button>
                </div>
                <div className="xl:col-span-2">
                  <textarea
                    className={`${inputClass} min-h-44`}
                    value={generatedReply}
                    onChange={() => {}}
                    placeholder="Generated message will appear here..."
                    readOnly
                  />
                  <div className="mt-3 flex justify-end">
                    <button
                      className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 disabled:opacity-40"
                      onClick={() => navigator.clipboard.writeText(generatedReply)}
                      disabled={!generatedReply}
                      type="button"
                    >
                      Copy Generated Reply
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {(activeSection === "overview" || activeSection === "products" || activeSection === "orders") && (
          <section className="grid gap-4 xl:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-slate-900">Products</h2>
              {loading ? (
                <ListSkeleton />
              ) : (
                <>
                  <div className="space-y-2">
                    {paginatedProducts.items.length === 0 ? <Empty text="No products added yet." /> : null}
                    {paginatedProducts.items.map((p) => (
                      <div key={p.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                        <div>
                          <p className="font-medium text-slate-800">{p.name}</p>
                          <p className="text-xs text-slate-500">Code: {p.sku || "-"} | Stock: {p.stock}</p>
                        </div>
                        <span className="rounded-md bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">{p.price} BDT</span>
                      </div>
                    ))}
                  </div>
                  <Pagination page={productPage} totalPages={paginatedProducts.totalPages} onPageChange={setProductPage} />
                </>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-slate-900">Recent Orders</h2>
              {loading ? (
                <ListSkeleton />
              ) : (
                <>
                  <div className="space-y-2">
                    {paginatedOrders.items.length === 0 ? <Empty text="No orders yet." /> : null}
                    {paginatedOrders.items.map((o) => (
                      <div key={o.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                        <div>
                          <p className="font-medium text-slate-800">{o.customerName}</p>
                          <p className="text-xs text-slate-500">
                            {o.productName}
                            {o.productCode ? ` (${o.productCode})` : ""}
                            {(o.color || o.size) ? ` | ${o.color || "-"} / ${o.size || "-"}` : ""}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500">{o.price} BDT</p>
                          <p className="text-xs font-semibold text-blue-700">{o.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Pagination page={orderPage} totalPages={paginatedOrders.totalPages} onPageChange={setOrderPage} />
                </>
              )}
            </div>
          </section>
          )}

          {(activeSection === "overview" || activeSection === "replies") && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-slate-900">Quick Replies</h2>
            {loading ? (
              <ListSkeleton />
            ) : (
              <>
                <div className="space-y-3">
                  {paginatedReplies.items.length === 0 ? <Empty text="No quick replies yet." /> : null}
                  {paginatedReplies.items.map((reply, idx) => (
                    <div key={reply.id} className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <div>
                        <p className="font-medium text-slate-800">{reply.title}</p>
                        <p className="text-sm text-slate-600">{reply.message}</p>
                      </div>
                      <button
                        className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                        onClick={() => copyTemplate(reply.message, idx)}
                      >
                        {copiedIndex === idx ? "Copied" : "Copy"}
                      </button>
                    </div>
                  ))}
                </div>
                <Pagination page={replyPage} totalPages={paginatedReplies.totalPages} onPageChange={setReplyPage} />
              </>
            )}
          </section>
          )}
        </div>
      </div>
    </main>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200";

const buttonClass =
  "rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800";

function Empty({ text }: { text: string }) {
  return <p className="rounded-lg border border-dashed border-slate-300 px-3 py-4 text-center text-sm text-slate-500">{text}</p>;
}

function NavItem({
  label,
  active,
  badge,
  onClick,
}: {
  label: string;
  active: boolean;
  badge?: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm font-medium transition ${
        active
          ? "border-blue-200 bg-blue-50 text-blue-700"
          : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
      }`}
    >
      <span>{label}</span>
      {typeof badge === "number" ? (
        <span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-600">{badge}</span>
      ) : null}
    </button>
  );
}

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (n: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
      <button className="rounded border border-slate-300 px-2 py-1 disabled:opacity-40" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
        Prev
      </button>
      <span>
        Page {page} of {totalPages}
      </span>
      <button className="rounded border border-slate-300 px-2 py-1 disabled:opacity-40" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
        Next
      </button>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-2">
      <div className="h-14 animate-pulse rounded-lg bg-slate-100" />
      <div className="h-14 animate-pulse rounded-lg bg-slate-100" />
      <div className="h-14 animate-pulse rounded-lg bg-slate-100" />
    </div>
  );
}

function StatsSkeleton() {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-white" />
      <div className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-white" />
      <div className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-white" />
      <div className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-white" />
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function paginate<T>(items: T[], page: number, size: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / size));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * size;
  return { items: items.slice(start, start + size), totalPages };
}

function parseMessengerOrderText(text: string) {
  const normalizedText = normalizeOrderText(text);
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const productLine =
    lines.find((line) => !/^(price|delivery|order|name|phone|address|color|size)\b/i.test(line)) ?? "";

  return {
    customerName: extractField(normalizedText, ["name", "customer name"]),
    customerPhone: extractField(normalizedText, ["phone", "mobile", "number"]),
    address: extractField(normalizedText, ["address"]),
    color: extractField(normalizedText, ["color", "colour"]),
    size: extractField(normalizedText, ["size"]),
    productCode: extractField(normalizedText, ["product code", "code", "sku"]),
    productName: productLine,
  };
}

function normalizeOrderText(text: string) {
  return text
    .replace(/\((optional|required)\)/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\n\s+/g, "\n")
    .trim();
}

function extractField(text: string, labels: string[]) {
  const allKnownLabels = [
    "name",
    "customer name",
    "phone",
    "mobile",
    "number",
    "address",
    "color",
    "colour",
    "size",
    "product code",
    "code",
    "sku",
  ];
  const nextFieldPattern = allKnownLabels.map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");

  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Stop at the next field label so one-line pasted text is parsed correctly.
    const sameLineMatch = text.match(
      new RegExp(`(?:^|\\s)${escaped}\\s*[:：-]\\s*(.+?)(?=\\s+(?:${nextFieldPattern})\\s*[:：-]|$)`, "i"),
    );
    if (sameLineMatch?.[1]?.trim()) return sameLineMatch[1].trim();

    const lineMatch = text.match(new RegExp(`(?:^|\\n|\\r)\\s*${escaped}\\s*[:：-]\\s*([^\\n\\r]+)`, "im"));
    if (lineMatch?.[1]?.trim()) return lineMatch[1].trim();

    const colonSeparatedMatch = text.match(new RegExp(`(?:^|\\s)${escaped}\\s*[:：]\\s*(.+?)(?=\\n|\\r|$)`, "i"));
    if (colonSeparatedMatch?.[1]?.trim()) return colonSeparatedMatch[1].trim();
  }
  return "";
}
