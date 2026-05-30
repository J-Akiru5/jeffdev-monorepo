import Link from "next/link";
import { XCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

/**
 * Maya Payment Cancel Page
 *
 * Displayed when user cancels or payment fails.
 */

export default async function MayaCancelPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const params = await searchParams;

  return (
    <>
      <Header />
      <main className="flex min-h-screen items-center justify-center px-6 pt-24">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
            <XCircle className="h-8 w-8 text-red-400" />
          </div>

          <h1 className="text-3xl font-bold text-white">Payment Cancelled</h1>

          <p className="mt-4 text-white/60">
            Your payment was cancelled or could not be processed. You can try
            again or contact us for assistance.
          </p>

          <div className="mt-8 space-y-4">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-medium transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
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
      <Footer />
    </>
  );
}
