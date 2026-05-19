import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030303]">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Prism Admin</h1>
          <p className="text-white/50 text-sm">Mission Control Access</p>
        </div>
        <SignIn 
          afterSignInUrl="/admin/dashboard"
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-[#080808] border border-white/10",
            }
          }}
        />
      </div>
    </div>
  );
}
