"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent } from "@syntaxure/ui";
import { toast } from "sonner";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Mail, User, Briefcase, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";

const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

const signUpSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters."),
  companyName: z.string().min(2, "Company name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
    .regex(/[0-9]/, "Password must contain at least one number.")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character."),
});

type Mode = "signin" | "signup";

export function SignInForm() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  const router = useRouter();
  const supabase = createClient();

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "None", color: "bg-white/10" };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score += 1;
    if (/\d/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    switch (score) {
      case 1:
        return { score, label: "Weak", color: "bg-red-500" };
      case 2:
        return { score, label: "Fair", color: "bg-yellow-500" };
      case 3:
        return { score, label: "Good", color: "bg-cyan-500" };
      case 4:
        return { score, label: "Strong", color: "bg-emerald-500" };
      default:
        return { score: 0, label: "Too short", color: "bg-red-500/50" };
    }
  };

  const strength = getPasswordStrength(password);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setValidationErrors({});

    try {
      if (mode === "signin") {
        const result = signInSchema.safeParse({ email, password });
        if (!result.success) {
          const errors: Record<string, string> = {};
          result.error.issues.forEach((issue) => {
            if (issue.path[0]) errors[issue.path[0].toString()] = issue.message;
          });
          setValidationErrors(errors);
          setLoading(false);
          return;
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          toast.error(signInError.message);
          setLoading(false);
          return;
        }

        toast.success("Welcome back! Loading environment...");
        router.push("/tasks");
        router.refresh();
      } else {
        const result = signUpSchema.safeParse({ fullName, companyName, email, password });
        if (!result.success) {
          const errors: Record<string, string> = {};
          result.error.issues.forEach((issue) => {
            if (issue.path[0]) errors[issue.path[0].toString()] = issue.message;
          });
          setValidationErrors(errors);
          setLoading(false);
          return;
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              company_name: companyName,
            },
          },
        });

        if (signUpError) {
          toast.error(signUpError.message);
          setLoading(false);
          return;
        }

        // If email confirmation is enabled, we won't get a session right away
        if (data.session) {
          toast.success("Account created successfully!");
          router.push("/tasks");
          router.refresh();
        } else {
          setRegistered(true);
          toast.success("Registration complete! Check your email to verify.");
        }
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  if (registered) {
    return (
      <Card className="w-full max-w-md border border-white/10 bg-black/60 backdrop-blur-xl">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
            <CheckCircle2 className="h-6 w-6 text-cyan-400" />
          </div>
          <CardTitle className="text-xl font-mono uppercase tracking-wider text-white">
            Verify Email
          </CardTitle>
          <CardDescription className="text-white/60">
            We have sent a verification link to <span className="font-mono text-cyan-400">{email}</span>. Please check your inbox to activate your account.
          </CardDescription>
          <Button
            variant="secondary"
            onClick={() => {
              setRegistered(false);
              setMode("signin");
              setPassword("");
            }}
            className="w-full"
          >
            Back to Sign In
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md border border-white/5 bg-white/[0.02] backdrop-blur-xl shadow-2xl relative overflow-hidden">
      {/* Dynamic top gradient line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-purple-500" />
      
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-xl font-mono uppercase tracking-wider text-white flex items-center justify-center gap-2">
          {mode === "signin" ? "Access Portal" : "Join Platform"}
          <Sparkles className="h-4 w-4 text-purple-400 animate-pulse" />
        </CardTitle>
        <CardDescription className="text-white/50">
          {mode === "signin" ? "Login to access your project dashboard" : "Register to track and manage projects"}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Toggle tabs */}
        <div className="grid grid-cols-2 gap-1 bg-white/5 p-1 rounded-md mb-6 border border-white/5">
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setValidationErrors({});
            }}
            className={`py-1.5 text-xs font-mono uppercase tracking-wider rounded transition-all duration-200 ${
              mode === "signin"
                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.15)]"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setValidationErrors({});
            }}
            className={`py-1.5 text-xs font-mono uppercase tracking-wider rounded transition-all duration-200 ${
              mode === "signup"
                ? "bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-[0_0_10px_rgba(139,92,246,0.15)]"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className="space-y-4"
            >
              {mode === "signup" && (
                <>
                  <div className="relative">
                    <User className="absolute left-3 top-[34px] h-4 w-4 text-white/30" />
                    <Input
                      label="Full Name"
                      type="text"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      error={validationErrors.fullName}
                      className="pl-10"
                      required
                    />
                  </div>

                  <div className="relative">
                    <Briefcase className="absolute left-3 top-[34px] h-4 w-4 text-white/30" />
                    <Input
                      label="Company Name"
                      type="text"
                      placeholder="Acme Corp"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      error={validationErrors.companyName}
                      className="pl-10"
                      required
                    />
                  </div>
                </>
              )}

              <div className="relative">
                <Mail className="absolute left-3 top-[34px] h-4 w-4 text-white/30" />
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={validationErrors.email}
                  className="pl-10"
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-[34px] h-4 w-4 text-white/30" />
                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={validationErrors.password}
                  className="pl-10"
                  required
                />

                {/* Password strength visualizer (Sign Up only) */}
                {mode === "signup" && password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-mono text-white/40">
                      <span>Password Strength:</span>
                      <span className="text-white/60">{strength.label}</span>
                    </div>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${strength.color} transition-all duration-300`}
                        style={{ width: `${(strength.score / 4) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          <Button
            type="submit"
            isLoading={loading}
            variant="primary"
            className="w-full mt-6"
          >
            {mode === "signin" ? "Authenticate" : "Create Account"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
