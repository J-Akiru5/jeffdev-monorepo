import { SignInForm } from "@/components/auth/sign-in-form";

export default function SignInPage() {
  return (
    <div className="space-y-8">
      <div className="text-center lg:text-left">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Welcome back</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Sign in with Syntaxure Labs to continue
        </p>
      </div>
      <SignInForm />
      <p className="text-center text-[10px] text-[var(--text-tertiary)] font-mono uppercase tracking-wider">
        Est. 2025 · Built with Next.js
      </p>
    </div>
  );
}
