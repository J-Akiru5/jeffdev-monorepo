import Link from 'next/link';
import { XCircle } from 'lucide-react';

export const metadata = {
  title: 'Subscription Cancelled | Prism Engine',
};

export default function SubscriptionCancelledPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="rounded-full bg-red-500/10 p-4 mb-6">
        <XCircle className="h-12 w-12 text-red-400" />
      </div>

      <h1 className="text-3xl font-bold text-white">
        Subscription Cancelled
      </h1>

      <p className="mt-4 max-w-md text-white/60">
        Your subscription process was cancelled. No charges were made to your account.
      </p>

      <div className="mt-8 flex gap-4">
        <Link
          href="/pricing"
          className="rounded-md bg-white px-6 py-2.5 font-medium text-black transition-colors hover:bg-white/90"
        >
          View Plans
        </Link>
        <Link
          href="/dashboard"
          className="rounded-md border border-white/20 px-6 py-2.5 font-medium text-white transition-colors hover:bg-white/5"
        >
          Go to Dashboard
        </Link>
      </div>

      <p className="mt-8 text-sm text-white/40">
        Have questions?{' '}
        <Link href="/contact" className="text-cyan-400 hover:underline">
          Contact support
        </Link>
      </p>
    </div>
  );
}
