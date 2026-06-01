import Link from "next/link";
import { ShieldX } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-void px-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center">
            <ShieldX className="h-8 w-8 text-red-400" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-[var(--text-primary, #ededed)] mb-2">Access Denied</h1>
        <p className="text-[var(--text-secondary, rgba(255,255,255,0.5))] mb-6">
          You don&apos;t have permission to access the admin panel. Contact the
          founder if you believe this is an error.
        </p>

        <div className="flex gap-4 justify-center">
          <Link
            href={process.env.NEXT_PUBLIC_PRISM_URL ?? "https://prism.syntaxure.dev"}
            className="px-6 py-2 rounded-md border border-white/10 bg-white/5 text-[var(--text-primary, #ededed)] text-sm hover:bg-white/10 transition-colors"
          >
            Go to Prism Dashboard
          </Link>
          <Link
            href={process.env.NEXT_PUBLIC_AGENCY_URL ?? "https://syntaxure.dev"}
            className="px-6 py-2 rounded-md border border-white/10 bg-white/5 text-[var(--text-primary, #ededed)] text-sm hover:bg-white/10 transition-colors"
          >
            Go to Agency
          </Link>
        </div>
      </div>
    </div>
  );
}
