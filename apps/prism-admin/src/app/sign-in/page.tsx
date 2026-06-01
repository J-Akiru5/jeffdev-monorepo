import { SignInForm } from "@/components/auth/sign-in-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Access — Syntaxure Labs",
  description: "Authenticate with Syntaxure Labs to access the Prism Admin dashboard.",
};

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-void px-6">
      <div className="w-full max-w-md">
        <SignInForm />

        {/* Footer */}
        <p className="mt-6 text-center text-[10px] text-white/20 font-mono uppercase tracking-wider">
          Est. 2025 · Built with Next.js
        </p>
      </div>
    </div>
  );
}
