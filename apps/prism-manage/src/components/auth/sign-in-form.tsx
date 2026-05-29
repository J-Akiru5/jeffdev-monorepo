"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { Button, Input } from "@syntaxure/ui";
import { toast } from "sonner";
import {
  Lock,
  Mail,
  User,
  Briefcase,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Eye,
  EyeOff,
} from "lucide-react";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";

function GoogleIcon(props: React.ComponentPropsWithoutRef<"svg">) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 5.04c1.78 0 3.38.61 4.64 1.8l3.46-3.46C17.98 1.19 15.15 0 12 0 7.31 0 3.25 2.69 1.25 6.63l4.08 3.16C6.29 7.04 8.91 5.04 12 5.04z" />
      <path d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.28 1.48-1.12 2.74-2.38 3.58l3.69 2.87c2.16-1.99 3.42-4.91 3.42-8.6z" />
      <path d="M5.33 14.21c-.24-.73-.38-1.5-.38-2.31s.14-1.58.38-2.31L1.25 6.63C.45 8.24 0 10.06 0 12s.45 3.76 1.25 5.37l4.08-3.16z" />
      <path d="M12 18.96c-3.09 0-5.71-2-6.67-4.75l-4.08 3.16C3.25 21.31 7.31 24 12 24c3.15 0 5.82-1.04 7.76-2.84l-3.69-2.87c-1.04.7-2.38 1.11-4.07 1.11z" />
    </svg>
  );
}

function GitHubIcon(props: React.ComponentPropsWithoutRef<"svg">) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

const signUpSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters."),
  position: z.enum(["founder", "employee"]),
  email: z.string().email("Please enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
    .regex(/[0-9]/, "Password must contain at least one number.")
    .regex(
      /[^A-Za-z0-9]/,
      "Password must contain at least one special character.",
    ),
});

type Mode = "signin" | "signup";

// ─── OAuth Provider Config ──────────────────────────────────────────────────

interface OAuthProvider {
  id: "google" | "github";
  label: string;
  icon: React.ComponentType<React.ComponentPropsWithoutRef<"svg">>;
}

const OAUTH_PROVIDERS: OAuthProvider[] = [
  { id: "google", label: "Google", icon: GoogleIcon },
  { id: "github", label: "GitHub", icon: GitHubIcon },
];

// ─── Position Select Options ────────────────────────────────────────────────

const POSITION_OPTIONS = [
  { value: "", label: "Select your role...", disabled: true },
  { value: "founder", label: "Founder / Co-Founder", disabled: false },
  { value: "employee", label: "Employee / Team Member", disabled: false },
] as const;

// ─── Component ──────────────────────────────────────────────────────────────

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [position, setPosition] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [registered, setRegistered] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [needsPosition, setNeedsPosition] = useState(false);
  const [oAuthPosition, setOAuthPosition] = useState("");

  // ── Detect OAuth position prompt ──────────────────────────────────────────
  useEffect(() => {
    if (searchParams.get("needs_position") === "true") {
      setNeedsPosition(true);
      setMode("signup");
    }
  }, [searchParams]);

  // ── Password strength ─────────────────────────────────────────────────────
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

  // ── OAuth Sign-In ─────────────────────────────────────────────────────────
  async function handleOAuthSignIn(providerId: "google" | "github") {
    setOauthLoading(providerId);
    try {
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: providerId,
        options: {
          redirectTo,
        },
      });

      if (error) {
        toast.error(error.message);
        setOauthLoading(null);
      }
      // Redirect happens — no need to reset state
    } catch (err: any) {
      toast.error(err.message || "OAuth sign-in failed");
      setOauthLoading(null);
    }
  }

  // ── Complete OAuth registration (position picker) ─────────────────────────
  async function handleCompleteOAuthRegistration() {
    if (!oAuthPosition) {
      toast.error("Please select your role to continue.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { position: oAuthPosition },
      });

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      toast.success("Welcome to Syntaxure Labs!");
      router.push("/tasks");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to complete registration");
      setLoading(false);
    }
  }

  // ── Email/Password Submit ─────────────────────────────────────────────────
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
            if (issue.path[0])
              errors[issue.path[0].toString()] = issue.message;
          });
          setValidationErrors(errors);
          setLoading(false);
          return;
        }

        const { error: signInError } =
          await supabase.auth.signInWithPassword({
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
        const result = signUpSchema.safeParse({
          fullName,
          position,
          email,
          password,
        });
        if (!result.success) {
          const errors: Record<string, string> = {};
          result.error.issues.forEach((issue) => {
            if (issue.path[0])
              errors[issue.path[0].toString()] = issue.message;
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
              position,
            },
          },
        });

        if (signUpError) {
          const isDuplicate =
            signUpError.message?.toLowerCase().includes("already registered") ||
            signUpError.message?.toLowerCase().includes("already exists") ||
            signUpError.message?.toLowerCase().includes("duplicate");

          if (isDuplicate) {
            toast.error("This email is already registered. Switching to sign in.");
            setMode("signin");
            setLoading(false);
            return;
          }

          toast.error(signUpError.message);
          setLoading(false);
          return;
        }

        if (data.session) {
          toast.success("Account created successfully!");
          router.push("/tasks");
          router.refresh();
        } else {
          setRegistered(true);
          toast.success(
            "Registration complete! Check your email to verify.",
          );
        }
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  // ── Verified Email State ──────────────────────────────────────────────────
  if (registered) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="relative overflow-hidden glass-heavy glass-shimmer rounded-lg p-10 text-center space-y-6">
          {/* Top accent */}
          <div className="absolute top-0 left-4 right-4 h-px animate-border-beam" />

          <div className="mx-auto w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/30 animate-neon-pulse">
            <CheckCircle2 className="h-8 w-8 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">
              Verify Your Email
            </h3>
            <p className="mt-2 text-sm text-white/50 leading-relaxed">
              We have sent a verification link to{" "}
              <span className="font-mono text-cyan-400">{email}</span>.
              <br />
              Please check your inbox to activate your account.
            </p>
          </div>
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

          {/* Bottom accent */}
          <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
        </div>
      </div>
    );
  }

  // ── OAuth Position Picker Overlay ─────────────────────────────────────────
  if (needsPosition) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="relative overflow-hidden glass-heavy glass-shimmer rounded-lg p-10 text-center space-y-6">
          {/* Top accent */}
          <div className="absolute top-0 left-4 right-4 h-px animate-border-beam" />

          <div className="mx-auto w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/30 animate-neon-pulse">
            <User className="h-8 w-8 text-purple-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">
              Almost There!
            </h3>
            <p className="mt-2 text-sm text-white/50">
              Tell us your role to complete your profile.
            </p>
          </div>

          {/* Position Select */}
          <div className="w-full text-left">
            <label className="text-xs font-medium uppercase tracking-wider text-white/50 block mb-1.5">
              Your Role
            </label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" />
              <select
                value={oAuthPosition}
                onChange={(e) => setOAuthPosition(e.target.value)}
                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2.5 pl-10 font-mono text-sm text-white outline-none transition-all duration-200 focus:border-white/20 focus:bg-white/8 appearance-none cursor-pointer"
              >
                {POSITION_OPTIONS.map((opt) => (
                  <option
                    key={opt.value}
                    value={opt.value}
                    disabled={opt.disabled}
                    className="bg-elevated text-white"
                  >
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/30">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>

          <Button
            onClick={handleCompleteOAuthRegistration}
            isLoading={loading}
            variant="primary"
            className="w-full"
          >
            Complete Registration
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>

          {/* Bottom accent */}
          <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
        </div>
      </div>
    );
  }

  // ── Main Auth Form ────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="relative overflow-hidden glass-heavy glass-shimmer rounded-lg">
        {/* Neon accent top bar */}
        <div className="absolute top-0 left-4 right-4 h-px animate-border-beam" />

        {/* Header */}
        <div className="px-10 pt-10 pb-4 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/10 border border-cyan-500/30 animate-neon-pulse">
            <Sparkles className="h-8 w-8 text-cyan-400" />
          </div>
          <h2 className="text-xl font-bold text-white">
            {mode === "signin" ? "Access Portal" : "Create Account"}
          </h2>
          <p className="mt-1 text-sm text-white/50">
            {mode === "signin"
              ? "Sign in to manage your projects"
              : "Register to get started with Syntaxure Labs"}
          </p>
        </div>

        <div className="px-10 pb-10">
          {/* ── Toggle Tabs ── */}
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

          {/* ── OAuth Buttons ── */}
          <div className="space-y-2.5 mb-6">
            {OAUTH_PROVIDERS.map((provider) => {
              const Icon = provider.icon;
              return (
                <button
                  key={provider.id}
                  type="button"
                  onClick={() => handleOAuthSignIn(provider.id)}
                  disabled={oauthLoading !== null}
                  className="flex w-full items-center justify-center gap-3 glass rounded-md px-6 py-2.5 text-white/80 transition-all hover:border-cyan-500/30 hover:text-white hover:shadow-[0_0_25px_rgba(6,182,212,0.15)] disabled:cursor-not-allowed disabled:opacity-50 font-mono text-xs uppercase tracking-wider"
                >
                  {oauthLoading === provider.id ? (
                    <svg
                      className="h-5 w-5 animate-spin text-white/50"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.105 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                  <span>
                    {mode === "signin"
                      ? `Sign in with ${provider.label}`
                      : `Sign up with ${provider.label}`}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ── Divider ── */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-glass-heavy px-3 text-white/30 font-mono uppercase tracking-wider">
                Or continue with email
              </span>
            </div>
          </div>

          {/* ── Email/Password Form ── */}
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
                    {/* Full Name */}
                    <div className="relative">
                      <User className="absolute left-3 top-[34px] h-4 w-4 text-white/30 pointer-events-none" />
                      <Input
                        label="Full Name"
                        type="text"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        error={validationErrors.fullName}
                        className="pl-10"
                        variant="glass"
                        required
                      />
                    </div>

                    {/* Position */}
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-[34px] h-4 w-4 text-white/30 pointer-events-none" />
                      <div className="space-y-1.5">
                        <label
                          htmlFor="position-select"
                          className="text-xs font-medium uppercase tracking-wider text-white/50"
                        >
                          Your Role
                        </label>
                        <div className="relative">
                          <select
                            id="position-select"
                            value={position}
                            onChange={(e) => setPosition(e.target.value)}
                            className={`w-full rounded-md border ${
                              validationErrors.position
                                ? "border-red-500/50"
                                : "border-white/10"
                            } bg-white/5 px-3 py-2.5 pl-10 font-mono text-sm text-white outline-none transition-all duration-200 focus:border-white/20 focus:bg-white/8 appearance-none cursor-pointer`}
                            required
                          >
                            {POSITION_OPTIONS.map((opt) => (
                              <option
                                key={opt.value}
                                value={opt.value}
                                disabled={opt.disabled}
                                className="bg-elevated text-white"
                              >
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/30">
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </div>
                        </div>
                        {validationErrors.position && (
                          <p className="text-xs text-red-400">
                            {validationErrors.position}
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Email */}
                <div className="relative">
                  <Mail className="absolute left-3 top-[34px] h-4 w-4 text-white/30 pointer-events-none" />
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={validationErrors.email}
                    className="pl-10"
                    variant="glass"
                    required
                  />
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase tracking-wider text-white/50">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none z-10" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className={`w-full rounded-md border ${
                        validationErrors.password
                          ? "border-red-500/50"
                          : "border-white/10"
                      } bg-white/5 px-3 py-2.5 pl-10 pr-10 font-mono text-sm text-white outline-none transition-all duration-200 focus:border-white/20 focus:bg-white/[0.08] placeholder:text-white/20`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors z-10"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {validationErrors.password && (
                    <p className="text-xs text-red-400">{validationErrors.password}</p>
                  )}

                  {/* Password strength (Sign Up only) */}
                  {mode === "signup" && password && (
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[10px] font-mono text-white/40">
                        <span>Password Strength:</span>
                        <span className="text-white/60">
                          {strength.label}
                        </span>
                      </div>
                      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${strength.color} transition-all duration-300`}
                          style={{
                            width: `${(strength.score / 4) * 100}%`,
                          }}
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
              {mode === "signin"
                ? "Authenticate"
                : "Create Account"}
            </Button>
          </form>
        </div>

        {/* Neon accent bottom bar */}
        <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
      </div>
    </div>
  );
}
