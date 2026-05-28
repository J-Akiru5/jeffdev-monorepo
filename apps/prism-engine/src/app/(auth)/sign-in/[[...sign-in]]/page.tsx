import { SignInForm } from "@/components/auth/sign-in-form";

export default function SignInPage() {
  return (
    <div className="space-y-8">
      <div className="text-center lg:text-left">
        <h1 className="text-2xl font-bold text-white">Welcome back</h1>
        <p className="mt-1 text-sm text-white/60">
          Sign in with Syntaxure Labs to continue
        </p>
      </div>
      <SignInForm />
      <p className="text-center text-[10px] text-white/20 font-mono uppercase tracking-wider">
        Est. 2025 · Built with Next.js
      </p>
    </div>
  );
}
