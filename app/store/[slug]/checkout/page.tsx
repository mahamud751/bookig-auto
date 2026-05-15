import { Suspense } from "react";
import CheckoutClient from "./CheckoutClient";

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="soft-panel p-10 text-center text-slate-500">Loading checkout...</div>
      }
    >
      <CheckoutClient />
    </Suspense>
  );
}
