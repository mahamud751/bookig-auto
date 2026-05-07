export default function Home() {
  return (
    <main className="app-shell flex flex-1 items-center">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-16 md:grid-cols-2">
        <section className="space-y-6">
          <p className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            F-Commerce Toolkit
          </p>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
            Clean, modern order management for Facebook sellers
          </h1>
          <p className="max-w-xl text-slate-600">
            Manage orders, quick replies, and daily status from one dashboard. Designed for
            speed, clarity, and real business operations.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href="/register" className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500">
              Create Account
            </a>
            <a href="/login" className="rounded-xl border border-emerald-200 bg-white px-5 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50">
              Seller Login
            </a>
          </div>
        </section>

        <section className="soft-panel p-6">
          <h2 className="text-lg font-bold text-slate-900">What you get</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-700">
            <li>Fast order capture from Messenger conversation</li>
            <li>Classic dashboard with pending, delivered, cancelled stats</li>
            <li>Quick reply templates with one-click copy</li>
            <li>Secure business account with protected API access</li>
          </ul>
          <a
            href="http://localhost:4000/api/docs"
            className="mt-6 inline-block text-sm font-semibold text-emerald-700 hover:text-emerald-600"
          >
            Open API Documentation
          </a>
        </section>
      </div>
    </main>
  );
}
