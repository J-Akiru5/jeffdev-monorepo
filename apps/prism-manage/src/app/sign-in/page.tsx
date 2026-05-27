import { SignInForm } from "@/components/auth/sign-in-form";
import { GridBackground } from "@syntaxure/ui";
import { FolderKanban } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Access Portal",
  description: "Sign in or register for your Prism project management dashboard.",
};

export default function SignInPage() {
  return (
    <div className="min-h-screen relative flex items-center justify-center bg-void px-4 py-12">
      {/* Premium Neon Grid Background */}
      <GridBackground variant="neon" />
      
      <div className="w-full max-w-md z-10">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
            <FolderKanban className="h-8 w-8 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-mono tracking-wider text-white uppercase">
              Prism Manage
            </h1>
            <p className="text-white/40 text-xs font-mono tracking-wider uppercase mt-1.5">
              Personal project & task synchronization
            </p>
          </div>
        </div>
        
        <SignInForm />
      </div>
    </div>
  );
}
