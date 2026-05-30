"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@syntaxure/ui";
import { createClient } from "@/lib/supabase/browser";

export default function ResetPasswordPage() {
  const supabase = createClient();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Verify the reset token is valid
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsValid(!!session);
    };
    checkSession();
  }, [supabase]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error(error.message);
      } else {
        setIsComplete(true);
        toast.success("Password updated successfully!");
      }
    } catch {
      toast.error("Failed to update password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isValid) {
    return (
      <div className="space-y-6 text-center">
        <h1 className="text-2xl font-bold text-white">Invalid or expired link</h1>
        <p className="text-sm text-white/60">
          This password reset link is invalid or has expired.
        </p>
        <Link
          href="/forgot-password"
          className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          Request a new reset link
        </Link>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="space-y-6 text-center">
        <h1 className="text-2xl font-bold text-white">Password updated!</h1>
        <p className="text-sm text-white/60">
          Your password has been reset. You can now sign in.
        </p>
        <Button
          variant="primary"
          onClick={() => router.push("/sign-in")}
          className="w-full"
        >
          Sign in
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white">Set new password</h1>
        <p className="mt-2 text-sm text-white/60">
          Enter your new password below.
        </p>
      </div>

      <form onSubmit={handleReset} className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-1.5">
            New Password
          </label>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-colors"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/80 mb-1.5">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-colors"
          />
        </div>

        <Button
          type="submit"
          isLoading={isLoading}
          variant="primary"
          className="w-full"
        >
          Update Password
        </Button>
      </form>
    </div>
  );
}
