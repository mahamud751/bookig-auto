"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/dashboard/Modal";
import { OptionPicker } from "@/components/dashboard/OptionPicker";
import { apiRequest, fetchMyBusiness, uploadProductImages } from "@/lib/api";
import { clearToken, getToken } from "@/lib/auth";
import { assetUrl, siteUrl } from "@/lib/images";
import { validateImageFiles } from "@/lib/upload";

type DashboardStats = { todayOrders: number; pending: number; delivered: number; cancelled: number };
type Product = {
  id: string;
  name: string;
  sku?: string | null;
  imageUrl?: string | null;
  images?: string[];
  price: string;
  stock: number;
  colors?: string[];
  sizes?: string[];
  isActive?: boolean;
};
type Order = {
  id: string;
  customerName: string;
  customerPhone: string;
  address: string;
  productName: string;
  productCode?: string | null;
  color?: string | null;
  size?: string | null;
  quantity?: number;
  paymentMethod?: string | null;
  paymentNumber?: string | null;
  status: string;
  price: string;
};
type QuickReply = { id: string; title: string; message: string };
type SectionKey = "overview" | "products" | "orders" | "replies";

const TABLE_PAGE_SIZE = 10;
const REPLY_PAGE_SIZE = 5;
const DEFAULT_PRODUCT_COLORS = ["Black", "White", "Red", "Blue"];
const DEFAULT_PRODUCT_SIZES = ["S", "M", "L", "XL", "XXL"];

function defaultProductForm() {
  return {
    name: "",
    sku: "",
    price: "",
    stock: "0",
    colors: [...DEFAULT_PRODUCT_COLORS],
    sizes: [...DEFAULT_PRODUCT_SIZES],
    imageFiles: [] as File[],
    existingImages: [] as string[],
    isActive: true,
  };
}

function defaultOrderForm() {
  return {
    customerName: "",
    customerPhone: "",
    address: "",
    productName: "",
    productCode: "",
    color: "",
    size: "",
    price: "",
    status: "PENDING",
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const [token, setTokenState] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [replies, setReplies] = useState<QuickReply[]>([]);
  const [newProduct, setNewProduct] = useState(defaultProductForm);
  const [orderForm, setOrderForm] = useState(defaultOrderForm);
  const [newReply, setNewReply] = useState({ title: "", message: "" });
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [productPage, setProductPage] = useState(1);
  const [orderPage, setOrderPage] = useState(1);
  const [replyPage, setReplyPage] = useState(1);
  const [activeSection, setActiveSection] = useState<SectionKey>("overview");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [productModal, setProductModal] = useState<"add" | "edit" | null>(null);
  const [orderModal, setOrderModal] = useState<"add" | "edit" | null>(null);
  const [pastedOrderText, setPastedOrderText] = useState("");
  const [storeSlug, setStoreSlug] = useState("");
  const [uploadingImages, setUploadingImages] = useState(false);
  const [formError, setFormError] = useState("");

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
    const [statsRes, productsRes, ordersRes, repliesRes, businessRes] = await Promise.all([
      apiRequest<DashboardStats>("/orders/dashboard", { token: t }),
      apiRequest<Product[]>("/products", { token: t }),
      apiRequest<Order[]>("/orders", { token: t }),
      apiRequest<QuickReply[]>("/quick-replies", { token: t }),
      fetchMyBusiness(t),
    ]);
    setStats(statsRes);
    setProducts(productsRes);
    setOrders(ordersRes);
    setReplies(repliesRes);
    setStoreSlug(businessRes.slug);
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

  async function saveProduct(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setFormError("");
    setUploadingImages(true);
    try {
      validateImageFiles(newProduct.imageFiles);
      let uploadedImages: string[] = [];
      if (newProduct.imageFiles.length > 0) {
        const uploaded = await uploadProductImages(token, newProduct.imageFiles);
        uploadedImages = uploaded.images;
      }
      const images = [...newProduct.existingImages, ...uploadedImages];
      const payload = {
        name: newProduct.name,
        sku: newProduct.sku || undefined,
        price: Number(newProduct.price),
        stock: Number(newProduct.stock),
        colors: newProduct.colors,
        sizes: newProduct.sizes,
        images,
        imageUrl: images[0],
        isActive: newProduct.isActive,
      };
      if (productModal === "edit" && selectedProductId) {
        await apiRequest(`/products/${selectedProductId}`, { method: "PATCH", token, body: JSON.stringify(payload) });
      } else {
        await apiRequest("/products", { method: "POST", token, body: JSON.stringify(payload) });
      }
      setProductModal(null);
      setNewProduct(defaultProductForm());
      await loadAll(token);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save product");
    } finally {
      setUploadingImages(false);
    }
  }

  async function deleteProduct(id: string) {
    if (!token || !confirm("Delete this product?")) return;
    await apiRequest(`/products/${id}`, { method: "DELETE", token });
    setSelectedProductId(null);
    await loadAll(token);
  }

  async function toggleProductStatus(product: Product) {
    if (!token) return;
    await apiRequest(`/products/${product.id}`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ isActive: !product.isActive }),
    });
    await loadAll(token);
  }

  function openEditProduct(product: Product) {
    setNewProduct({
      name: product.name,
      sku: product.sku ?? "",
      price: String(product.price),
      stock: String(product.stock),
      colors: product.colors ?? [...DEFAULT_PRODUCT_COLORS],
      sizes: product.sizes ?? [...DEFAULT_PRODUCT_SIZES],
      imageFiles: [],
      existingImages: product.images?.length ? product.images : product.imageUrl ? [product.imageUrl] : [],
      isActive: product.isActive ?? true,
    });
    setSelectedProductId(product.id);
    setProductModal("edit");
  }

  async function saveOrder(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setFormError("");
    const payload = { ...orderForm, price: Number(orderForm.price) };
    try {
      if (orderModal === "edit" && selectedOrderId) {
        await apiRequest(`/orders/${selectedOrderId}`, { method: "PATCH", token, body: JSON.stringify(payload) });
      } else {
        await apiRequest("/orders", { method: "POST", token, body: JSON.stringify(payload) });
      }
      setOrderModal(null);
      setOrderForm(defaultOrderForm());
      setPastedOrderText("");
      await loadAll(token);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save order");
    }
  }

  async function deleteOrder(id: string) {
    if (!token || !confirm("Delete this order?")) return;
    await apiRequest(`/orders/${id}`, { method: "DELETE", token });
    setSelectedOrderId(null);
    await loadAll(token);
  }

  function openEditOrder(order: Order) {
    setOrderForm({
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      address: order.address,
      productName: order.productName,
      productCode: order.productCode ?? "",
      color: order.color ?? "",
      size: order.size ?? "",
      price: String(order.price),
      status: order.status,
    });
    setSelectedOrderId(order.id);
    setOrderModal("edit");
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

  const paginatedProducts = paginate(products, productPage, TABLE_PAGE_SIZE);
  const paginatedOrders = paginate(orders, orderPage, TABLE_PAGE_SIZE);
  const paginatedReplies = paginate(replies, replyPage, REPLY_PAGE_SIZE);
  const selectedProduct = products.find((p) => p.id === selectedProductId) ?? null;
  const selectedOrder = orders.find((o) => o.id === selectedOrderId) ?? null;

  function autofillFromPastedText() {
    if (!pastedOrderText.trim()) return;
    const parsed = parseMessengerOrderText(pastedOrderText);
    setOrderForm((p) => ({ ...p, ...parsed }));
  }

  function onProductFilesChange(files: FileList | null) {
    if (!files) return;
    try {
      const list = Array.from(files);
      validateImageFiles(list);
      setNewProduct((p) => ({ ...p, imageFiles: list }));
      setFormError("");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Invalid file");
    }
  }

  return (
    <main className="app-shell px-4 py-8 sm:px-6">
      <div className="mx-auto grid w-full max-w-[1320px] gap-6 lg:grid-cols-[260px_1fr]">
        <aside className={`${mobileSidebarOpen ? "block" : "hidden"} soft-panel p-4 lg:block`}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">F-Commerce Toolkit</p>
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
                setSelectedProductId(null);
                setMobileSidebarOpen(false);
              }}
            />
            <NavItem
              label="Orders"
              badge={orders.length}
              active={activeSection === "orders"}
              onClick={() => {
                setActiveSection("orders");
                setSelectedOrderId(null);
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
          {storeSlug ? (
            <a
              href={siteUrl(`/store/${storeSlug}/products`)}
              target="_blank"
              rel="noreferrer"
              className="mt-4 block rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-center text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
            >
              Open my store
            </a>
          ) : null}
          <button onClick={logout} className="mt-4 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-white">
            Logout
          </button>
        </aside>

        <div className="flex flex-col gap-6">
          <header className="soft-panel p-6">
            <button
              className="mb-3 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 lg:hidden"
              onClick={() => setMobileSidebarOpen((p) => !p)}
            >
              {mobileSidebarOpen ? "Close Menu" : "Open Menu"}
            </button>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Seller Dashboard</h1>
                <p className="mt-1 text-sm text-slate-500">Track orders, customers, and replies in one premium workspace.</p>
              </div>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Today
              </span>
            </div>
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


          {activeSection === "overview" && (
            <section className="soft-panel p-6 text-sm text-slate-600">
              Welcome to your seller workspace. Open <strong>Products</strong> or <strong>Orders</strong> from the sidebar to manage everything.
            </section>
          )}

          {activeSection === "products" && (
            <section className="soft-panel p-5">
              {!selectedProduct ? (
                <>
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">Products</h2>
                      <p className="text-xs text-slate-500">Only active products show in your public store.</p>
                    </div>
                    <button
                      type="button"
                      className={buttonClass}
                      onClick={() => {
                        setNewProduct(defaultProductForm());
                        setProductModal("add");
                        setFormError("");
                      }}
                    >
                      + Add Product
                    </button>
                  </div>
                  {loading ? (
                    <ListSkeleton />
                  ) : (
                    <>
                      <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full min-w-[640px] text-left text-sm">
                          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                            <tr>
                              <th className="px-3 py-2">Name</th>
                              <th className="px-3 py-2">Code</th>
                              <th className="px-3 py-2">Price</th>
                              <th className="px-3 py-2">Stock</th>
                              <th className="px-3 py-2">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedProducts.items.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                                  No products yet.
                                </td>
                              </tr>
                            ) : (
                              paginatedProducts.items.map((p) => (
                                <tr
                                  key={p.id}
                                  className="cursor-pointer border-t border-slate-100 hover:bg-emerald-50/40"
                                  onClick={() => setSelectedProductId(p.id)}
                                >
                                  <td className="px-3 py-2 font-medium text-slate-800">{p.name}</td>
                                  <td className="px-3 py-2 text-slate-600">{p.sku || "-"}</td>
                                  <td className="px-3 py-2">{p.price} BDT</td>
                                  <td className="px-3 py-2">{p.stock}</td>
                                  <td className="px-3 py-2">
                                    <StatusPill active={p.isActive !== false} />
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                      <Pagination page={productPage} totalPages={paginatedProducts.totalPages} onPageChange={setProductPage} />
                    </>
                  )}
                </>
              ) : (
                <ProductDetail
                  product={selectedProduct}
                  onBack={() => setSelectedProductId(null)}
                  onEdit={() => openEditProduct(selectedProduct)}
                  onDelete={() => deleteProduct(selectedProduct.id)}
                  onToggleStatus={() => toggleProductStatus(selectedProduct)}
                />
              )}
            </section>
          )}

          {activeSection === "orders" && (
            <section className="soft-panel p-5">
              {!selectedOrder ? (
                <>
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">Orders</h2>
                      <p className="text-xs text-slate-500">Click a row to view details.</p>
                    </div>
                    <button
                      type="button"
                      className={buttonClass}
                      onClick={() => {
                        setOrderForm(defaultOrderForm());
                        setOrderModal("add");
                        setFormError("");
                      }}
                    >
                      + Add Order
                    </button>
                  </div>
                  {loading ? (
                    <ListSkeleton />
                  ) : (
                    <>
                      <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full min-w-[720px] text-left text-sm">
                          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                            <tr>
                              <th className="px-3 py-2">Customer</th>
                              <th className="px-3 py-2">Phone</th>
                              <th className="px-3 py-2">Product</th>
                              <th className="px-3 py-2">Price</th>
                              <th className="px-3 py-2">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedOrders.items.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                                  No orders yet.
                                </td>
                              </tr>
                            ) : (
                              paginatedOrders.items.map((o) => (
                                <tr
                                  key={o.id}
                                  className="cursor-pointer border-t border-slate-100 hover:bg-emerald-50/40"
                                  onClick={() => setSelectedOrderId(o.id)}
                                >
                                  <td className="px-3 py-2 font-medium text-slate-800">{o.customerName}</td>
                                  <td className="px-3 py-2">{o.customerPhone}</td>
                                  <td className="px-3 py-2">{o.productName}</td>
                                  <td className="px-3 py-2">{o.price} BDT</td>
                                  <td className="px-3 py-2">
                                    <OrderStatusPill status={o.status} />
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                      <Pagination page={orderPage} totalPages={paginatedOrders.totalPages} onPageChange={setOrderPage} />
                    </>
                  )}
                </>
              ) : (
                <OrderDetail
                  order={selectedOrder}
                  onBack={() => setSelectedOrderId(null)}
                  onEdit={() => openEditOrder(selectedOrder)}
                  onDelete={() => deleteOrder(selectedOrder.id)}
                />
              )}
            </section>
          )}

          {activeSection === "replies" && (
            <section className="soft-panel p-5">
              <h2 className="mb-4 text-base font-semibold text-slate-900">Quick Replies</h2>
              <form onSubmit={createReply} className="mb-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <input className={inputClass} placeholder="Template title" value={newReply.title} onChange={(e) => setNewReply((p) => ({ ...p, title: e.target.value }))} />
                <textarea className={`${inputClass} min-h-24`} placeholder="Message template..." value={newReply.message} onChange={(e) => setNewReply((p) => ({ ...p, message: e.target.value }))} />
                <button className={buttonClass}>Save Reply</button>
              </form>
              {loading ? (
                <ListSkeleton />
              ) : (
                <>
                  <div className="space-y-3">
                    {paginatedReplies.items.length === 0 ? <Empty text="No quick replies yet." /> : null}
                    {paginatedReplies.items.map((reply, idx) => (
                      <div key={reply.id} className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                        <div>
                          <p className="font-medium text-slate-800">{reply.title}</p>
                          <p className="text-sm text-slate-600">{reply.message}</p>
                        </div>
                        <button
                          type="button"
                          className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700"
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

          <Modal
            title={productModal === "edit" ? "Edit Product" : "Add Product"}
            open={productModal !== null}
            onClose={() => setProductModal(null)}
          >
            <form onSubmit={saveProduct} className="space-y-3">
              <input className={inputClass} placeholder="Product name" required value={newProduct.name} onChange={(e) => setNewProduct((p) => ({ ...p, name: e.target.value }))} />
              <input className={inputClass} placeholder="Product code (SKU)" value={newProduct.sku} onChange={(e) => setNewProduct((p) => ({ ...p, sku: e.target.value }))} />
              <input className={inputClass} placeholder="Price (BDT)" required value={newProduct.price} onChange={(e) => setNewProduct((p) => ({ ...p, price: e.target.value }))} />
              <input className={inputClass} placeholder="Stock qty" value={newProduct.stock} onChange={(e) => setNewProduct((p) => ({ ...p, stock: e.target.value }))} />
              <OptionPicker label="Colors" options={DEFAULT_PRODUCT_COLORS} selected={newProduct.colors} onChange={(colors) => setNewProduct((p) => ({ ...p, colors }))} />
              <OptionPicker label="Sizes" options={DEFAULT_PRODUCT_SIZES} selected={newProduct.sizes} onChange={(sizes) => setNewProduct((p) => ({ ...p, sizes }))} />
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={newProduct.isActive} onChange={(e) => setNewProduct((p) => ({ ...p, isActive: e.target.checked }))} />
                Active in store
              </label>
              <label className="block text-xs font-medium text-slate-600">
                Product photos (max 5MB each)
                <input className={`${inputClass} mt-1`} type="file" accept="image/*" multiple onChange={(e) => onProductFilesChange(e.target.files)} />
                {newProduct.imageFiles.length > 0 ? <p className="mt-1 text-xs text-slate-500">{newProduct.imageFiles.length} new file(s)</p> : null}
                {newProduct.existingImages.length > 0 ? <p className="mt-1 text-xs text-slate-500">{newProduct.existingImages.length} existing image(s) kept</p> : null}
              </label>
              {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
              <button className={`${buttonClass} w-full`} disabled={uploadingImages}>{uploadingImages ? "Saving..." : "Save Product"}</button>
            </form>
          </Modal>

          <Modal title={orderModal === "edit" ? "Edit Order" : "Add Order"} open={orderModal !== null} onClose={() => setOrderModal(null)}>
            <form onSubmit={saveOrder} className="space-y-3">
              <input className={inputClass} placeholder="Customer name" required value={orderForm.customerName} onChange={(e) => setOrderForm((p) => ({ ...p, customerName: e.target.value }))} />
              <input className={inputClass} placeholder="Customer phone" required value={orderForm.customerPhone} onChange={(e) => setOrderForm((p) => ({ ...p, customerPhone: e.target.value }))} />
              <input className={inputClass} placeholder="Delivery address" required value={orderForm.address} onChange={(e) => setOrderForm((p) => ({ ...p, address: e.target.value }))} />
              <input className={inputClass} placeholder="Product name" required value={orderForm.productName} onChange={(e) => setOrderForm((p) => ({ ...p, productName: e.target.value }))} />
              <input className={inputClass} placeholder="Product code" value={orderForm.productCode} onChange={(e) => setOrderForm((p) => ({ ...p, productCode: e.target.value }))} />
              <input className={inputClass} placeholder="Color" value={orderForm.color} onChange={(e) => setOrderForm((p) => ({ ...p, color: e.target.value }))} />
              <input className={inputClass} placeholder="Size" value={orderForm.size} onChange={(e) => setOrderForm((p) => ({ ...p, size: e.target.value }))} />
              <input className={inputClass} placeholder="Price (BDT)" required value={orderForm.price} onChange={(e) => setOrderForm((p) => ({ ...p, price: e.target.value }))} />
              <select className={inputClass} value={orderForm.status} onChange={(e) => setOrderForm((p) => ({ ...p, status: e.target.value }))}>
                <option value="PENDING">Pending</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              {orderModal === "add" ? (
                <>
                  <textarea className={`${inputClass} min-h-20`} placeholder="Paste customer message..." value={pastedOrderText} onChange={(e) => setPastedOrderText(e.target.value)} />
                  <button type="button" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold" onClick={autofillFromPastedText}>Autofill from pasted text</button>
                </>
              ) : null}
              {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
              <button className={`${buttonClass} w-full`}>Save Order</button>
            </form>
          </Modal>
        </div>
      </div>
    </main>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100";

const buttonClass =
  "rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500";

function formatOptions(values: string[] | undefined, fallback: string[]) {
  const list = values?.length ? values : fallback;
  return list.join(", ");
}

function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
        active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function OrderStatusPill({ status }: { status: string }) {
  const styles =
    status === "DELIVERED"
      ? "bg-emerald-100 text-emerald-700"
      : status === "CANCELLED"
        ? "bg-red-100 text-red-700"
        : "bg-amber-100 text-amber-800";
  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${styles}`}>{status}</span>;
}

function ProductDetail({
  product,
  onBack,
  onEdit,
  onDelete,
  onToggleStatus,
}: {
  product: Product;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
}) {
  const images = product.images?.length ? product.images : product.imageUrl ? [product.imageUrl] : [];
  return (
    <div className="space-y-5">
      <button type="button" onClick={onBack} className="text-sm font-semibold text-emerald-700">
        ← Back to products
      </button>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex gap-2 overflow-x-auto">
          {images.length > 0 ? (
            images.map((src) => (
              <div key={src} className="relative h-32 w-32 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                <Image src={assetUrl(src)} alt={product.name} fill className="object-cover" sizes="128px" />
              </div>
            ))
          ) : (
            <div className="flex h-32 w-full items-center justify-center rounded-xl border border-dashed border-slate-300 text-sm text-slate-400">
              No images
            </div>
          )}
        </div>
        <div className="space-y-3 text-sm">
          <h2 className="text-xl font-bold text-slate-900">{product.name}</h2>
          <p className="text-slate-600">Code: {product.sku || "-"}</p>
          <p className="text-lg font-bold text-emerald-700">{product.price} BDT</p>
          <p>Stock: {product.stock}</p>
          <p>Colors: {formatOptions(product.colors, DEFAULT_PRODUCT_COLORS)}</p>
          <p>Sizes: {formatOptions(product.sizes, DEFAULT_PRODUCT_SIZES)}</p>
          <p>
            Status: <StatusPill active={product.isActive !== false} />
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <button type="button" className={buttonClass} onClick={onEdit}>
              Edit
            </button>
            <button type="button" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold" onClick={onToggleStatus}>
              {product.isActive !== false ? "Set Inactive" : "Set Active"}
            </button>
            <button type="button" className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700" onClick={onDelete}>
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderDetail({
  order,
  onBack,
  onEdit,
  onDelete,
}: {
  order: Order;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="space-y-4 text-sm">
      <button type="button" onClick={onBack} className="text-sm font-semibold text-emerald-700">
        ← Back to orders
      </button>
      <h2 className="text-xl font-bold text-slate-900">{order.customerName}</h2>
      <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
        <p>Phone: {order.customerPhone}</p>
        <p>Status: <OrderStatusPill status={order.status} /></p>
        <p className="sm:col-span-2">Address: {order.address}</p>
        <p>Product: {order.productName}</p>
        <p>Code: {order.productCode || "-"}</p>
        <p>Color: {order.color || "-"}</p>
        <p>Size: {order.size || "-"}</p>
        <p>Qty: {order.quantity ?? 1}</p>
        <p className="font-semibold text-emerald-700">Total: {order.price} BDT</p>
        {order.paymentMethod ? <p>Payment: {order.paymentMethod} ({order.paymentNumber})</p> : null}
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={buttonClass} onClick={onEdit}>
          Edit
        </button>
        <button type="button" className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700" onClick={onDelete}>
          Delete
        </button>
      </div>
    </div>
  );
}

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
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-white"
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
      <button className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 disabled:opacity-40" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
        Prev
      </button>
      <span>
        Page {page} of {totalPages}
      </span>
      <button className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 disabled:opacity-40" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
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
    <div className="soft-panel p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
        <span className="h-8 w-8 rounded-full bg-emerald-100" />
      </div>
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
