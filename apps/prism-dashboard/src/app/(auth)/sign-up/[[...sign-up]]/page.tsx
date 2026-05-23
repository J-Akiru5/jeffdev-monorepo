import { SignUpForm } from "@/components/auth/sign-up-form";

export default function SignUpPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      {/* Grid Background */}
      <div className="fixed inset-0 -z-10 h-full w-full bg-[#050505] bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white">Prism Engine</h1>
          <p className="mt-2 text-white/60">Create your account</p>
        </div>
        <SignUpForm />
      </div>
    </main>
  );
}
