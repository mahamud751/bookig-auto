"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { register } from "@/lib/api";
import { setToken } from "@/lib/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    businessName: "",
    ownerName: "",
    phone: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await register(form);
      setToken(res.accessToken);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app-shell flex min-h-screen items-center justify-center px-6 py-10">
      <div className="soft-panel w-full max-w-lg p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">F-Commerce</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Create Seller Account</h1>
        <p className="mt-1 text-sm text-slate-500">Start managing your Facebook orders with a clean workflow.</p>
        <form onSubmit={onSubmit} className="mt-6 grid gap-4">
          <input className={inputClass} placeholder="Business name" value={form.businessName} onChange={(e) => setForm((p) => ({ ...p, businessName: e.target.value }))} />
          <input className={inputClass} placeholder="Owner name" value={form.ownerName} onChange={(e) => setForm((p) => ({ ...p, ownerName: e.target.value }))} />
          <input className={inputClass} placeholder="Phone" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
          <input className={inputClass} placeholder="Email (optional)" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
          <input className={inputClass} placeholder="Password" type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button disabled={loading} className="rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-emerald-500 disabled:opacity-60">
            {loading ? "Please wait..." : "Create account"}
          </button>
        </form>
        <p className="mt-4 text-sm text-slate-600">
          Already have account?{" "}
          <Link href="/login" className="font-semibold text-emerald-600">Login</Link>
        </p>
      </div>
    </main>
  );
}

const inputClass =
  "rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100";
