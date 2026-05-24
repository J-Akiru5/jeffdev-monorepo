import { SignUpForm } from "@/components/auth/sign-up-form";

export default function SignUpPage() {
  return (
    <div className="space-y-8">
      <div className="text-center lg:text-left">
        <h1 className="text-2xl font-bold text-white">Create your account</h1>
        <p className="mt-1 text-sm text-white/60">
          Start with a free plan — no credit card required
        </p>
      </div>
      <SignUpForm />
    </div>
  );
}
