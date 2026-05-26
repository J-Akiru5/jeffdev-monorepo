import { SignInForm } from "@/components/auth/sign-in-form";
import { FolderKanban } from "lucide-react";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-void">
      <div className="text-center">
        <div className="mb-8 flex flex-col items-center gap-3">
          <FolderKanban className="h-10 w-10 text-cyan-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Prism Manage</h1>
            <p className="text-white/50 text-sm mt-1">
              Personal project tracker
            </p>
          </div>
        </div>
        <SignInForm />
      </div>
    </div>
  );
}
