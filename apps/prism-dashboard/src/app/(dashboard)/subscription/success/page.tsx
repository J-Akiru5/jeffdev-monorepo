import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

export const metadata = {
  title: 'Subscription Successful | Prism Context Engine',
};

export default function SubscriptionSuccessPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="rounded-full bg-emerald-500/10 p-4 mb-6">
        <CheckCircle className="h-12 w-12 text-emerald-400" />
      </div>

      <h1 className="text-3xl font-bold text-white">
        Welcome to Prism Pro!
      </h1>

      <p className="mt-4 max-w-md text-white/60">
        Your subscription is now active. You have access to unlimited rules,
        components, AI generations, and IDE sync.
      </p>

      <div className="mt-8 flex gap-4">
        <Link
          href="/generate"
          className="rounded-md bg-cyan-500 px-6 py-2.5 font-medium text-black transition-colors hover:bg-cyan-400"
        >
          Start Generating
        </Link>
        <Link
          href="/dashboard"
          className="rounded-md border border-white/20 px-6 py-2.5 font-medium text-white transition-colors hover:bg-white/5"
        >
          Go to Dashboard
        </Link>
      </div>

      <p className="mt-8 text-sm text-white/40">
        A confirmation email has been sent to your account.
      </p>
    </div>
  );
}
