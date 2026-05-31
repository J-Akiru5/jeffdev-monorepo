import { Suspense } from "react";
import Link from "next/link";
import { CheckCircle, ArrowLeft, Package } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

/**
 * Maya Payment Success Page
 *
 * Displayed after successful Maya checkout or subscription approval.
 */

function SuccessContent({
  searchParams,
}: {
  searchParams: { ref?: string };
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 pt-24">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
          <CheckCircle className="h-8 w-8 text-emerald-400" />
        </div>

        <h1 className="text-3xl font-bold text-white">Payment Successful!</h1>

        <p className="mt-4 text-white/60">
          Thank you for your purchase. Your subscription is now active and we&apos;ll
          send you onboarding instructions shortly.
        </p>

        <div className="mt-8 space-y-4">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-medium transition-colors"
          >
            <Package className="h-4 w-4" />
            View Products
          </Link>

          <Link
            href="/"
            className="flex items-center justify-center gap-2 text-white/40 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}

export default async function MayaSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const params = await searchParams;

  return (
    <>
      <Header />
      <Suspense fallback={
        <main className="flex min-h-screen items-center justify-center px-6 pt-24">
          <div className="text-white/40">Loading...</div>
        </main>
      }>
        <SuccessContent searchParams={params} />
      </Suspense>
      <Footer />
    </>
  );
}
