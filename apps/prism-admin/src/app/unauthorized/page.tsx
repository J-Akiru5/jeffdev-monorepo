import Link from "next/link";
import { ShieldX } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#030303] px-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center">
            <ShieldX className="h-8 w-8 text-red-400" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-white/50 mb-6">
          You don't have permission to access the admin panel. 
          Contact the founder if you believe this is an error.
        </p>
        
        <div className="flex gap-4 justify-center">
          <Link
            href="https://prism.jeffdev.studio"
            className="px-6 py-2 rounded-md border border-white/10 bg-white/5 text-white text-sm hover:bg-white/10 transition-colors"
          >
            Go to Prism Dashboard
          </Link>
          <Link
            href="https://jeffdev.studio"
            className="px-6 py-2 rounded-md border border-white/10 bg-white/5 text-white text-sm hover:bg-white/10 transition-colors"
          >
            Go to Agency
          </Link>
        </div>
      </div>
    </div>
  );
}
