import { SignUpForm } from "@/components/auth/sign-up-form";

export default function SignUpPage() {
  return (
    <div className="space-y-8">
      <div className="text-center lg:text-left">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Create your account</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Join Syntaxure Labs — start with a free plan, no credit card required
        </p>
      </div>
      <SignUpForm />
      <p className="text-center text-[10px] text-[var(--text-tertiary)] font-mono uppercase tracking-wider">
        Est. 2025 · Built with Next.js
      </p>
    </div>
  );
}
