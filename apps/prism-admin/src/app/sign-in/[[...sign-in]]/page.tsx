import { SignInForm } from "@/components/auth/sign-in-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Mission Control Access for Prism Admin.",
};

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-void px-6">
      <div className="w-full max-w-md">
        <SignInForm />

        {/* Footer */}
        <p className="mt-6 text-center text-[11px] text-white/25 font-mono">
          Authorized personnel only
        </p>
      </div>
    </div>
  );
}
