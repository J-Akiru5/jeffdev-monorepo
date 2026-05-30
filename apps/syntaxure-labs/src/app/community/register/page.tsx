"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Loader2, Sparkles, Send, ShieldAlert } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { registerCommunityMember } from "@/app/actions/community";
import { cn } from "@syntaxure/ui";

const roles = [
  { value: "developer", label: "Developer" },
  { value: "founder", label: "Founder / CEO" },
  { value: "cto", label: "CTO / Tech Lead" },
  { value: "designer", label: "UI/UX Designer" },
  { value: "researcher", label: "AI Researcher" },
  { value: "other", label: "Other" },
];

export default function RegisterCommunityPage() {
  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    githubUsername: "",
    discordHandle: "",
    primaryRole: "developer",
    interests: "",
  });
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const selectRole = (roleValue: string) => {
    setFormData((prev) => ({
      ...prev,
      primaryRole: roleValue,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("idle");
    setErrorMessage("");

    startTransition(async () => {
      const result = await registerCommunityMember(formData);
      if (result.success) {
        setStatus("success");
      } else {
        setStatus("error");
        setErrorMessage(result.error || "Uplink failed. Please verify connection and retry.");
      }
    });
  };

  return (
    <>
      <Header />
      <main className="pt-24 min-h-screen bg-void flex flex-col relative overflow-hidden">
        {/* Mysterious Ambient Background Glows */}
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-purple-500/5 blur-[130px] animate-pulse-slow" />
          <div className="absolute bottom-10 left-1/3 w-[400px] h-[400px] rounded-full bg-cyan-500/5 blur-[120px]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_#050505_90%)]" />
        </div>

        <div className="relative z-10 flex-1 flex items-center justify-center px-6 py-16 lg:px-8">
          <div className="w-full max-w-xl">
            {/* Back Nav Link */}
            <div className="mb-8">
              <Link
                href="/community"
                className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-white/40 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-3 w-3" />
                Return to Community
              </Link>
            </div>

            {/* Header / Intro */}
            <div className="mb-10">
              <span className="font-mono text-xs uppercase tracking-widest text-purple-400 flex items-center gap-2">
                <Sparkles className="h-3 w-3" />
                {"// ESTABLISH_IDENTITY"}
              </span>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-white font-sans sm:text-4xl">
                Join the <span className="text-gradient-holographic">Syntaxure</span> Community
              </h1>
              <p className="mt-3 text-sm text-white/50 leading-relaxed">
                Connect with developers, founders, and engineers building the future of autonomous systems and context engines. Secure your clearance.
              </p>
            </div>

            {/* Form & Card Wrapper */}
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.01] p-8 backdrop-blur-xl relative">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />

              {status === "success" ? (
                <div className="animate-in fade-in zoom-in duration-500 py-10 text-center">
                  <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
                    <Check className="h-6 w-6 text-emerald-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">Clearance Granted.</h2>
                  <p className="text-sm text-white/50 max-w-sm mx-auto font-mono leading-relaxed">
                    Transmission locked. Your welcome packet is being routed to <span className="text-cyan-400">{formData.email}</span>.
                  </p>
                  <div className="mt-10">
                    <Link
                      href="/community"
                      className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-6 py-2.5 font-mono text-xs uppercase tracking-wider text-white hover:bg-white/10 hover:border-white/20 transition-all"
                    >
                      Return to Changelog
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {status === "error" && (
                    <div className="flex items-center gap-2 p-3 rounded-md border border-rose-500/20 bg-rose-500/5 text-rose-400 font-mono text-xs">
                      <ShieldAlert className="h-4 w-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* Name & Email Group */}
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block font-mono text-xs uppercase tracking-wider text-white/40 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        required
                        placeholder="John Doe"
                        className="w-full rounded-md border border-white/5 bg-white/[0.03] px-4 py-3 text-white placeholder:text-white/20 focus:border-cyan-500/40 focus:bg-white/[0.05] focus:outline-none focus:ring-1 focus:ring-cyan-500/40 transition-all text-sm"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-xs uppercase tracking-wider text-white/40 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="you@domain.com"
                        className="w-full rounded-md border border-white/5 bg-white/[0.03] px-4 py-3 text-white placeholder:text-white/20 focus:border-cyan-500/40 focus:bg-white/[0.05] focus:outline-none focus:ring-1 focus:ring-cyan-500/40 transition-all text-sm"
                      />
                    </div>
                  </div>

                  {/* GitHub & Discord Group */}
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block font-mono text-xs uppercase tracking-wider text-white/40 mb-2">
                        GitHub Username
                      </label>
                      <div className="relative flex items-center">
                        <span className="absolute left-4 font-mono text-sm text-white/20">@</span>
                        <input
                          type="text"
                          name="githubUsername"
                          value={formData.githubUsername}
                          onChange={handleChange}
                          placeholder="username"
                          className="w-full rounded-md border border-white/5 bg-white/[0.03] pl-8 pr-4 py-3 text-white placeholder:text-white/20 focus:border-cyan-500/40 focus:bg-white/[0.05] focus:outline-none focus:ring-1 focus:ring-cyan-500/40 transition-all text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block font-mono text-xs uppercase tracking-wider text-white/40 mb-2">
                        Discord Handle
                      </label>
                      <input
                        type="text"
                        name="discordHandle"
                        value={formData.discordHandle}
                        onChange={handleChange}
                        placeholder="username#0000"
                        className="w-full rounded-md border border-white/5 bg-white/[0.03] px-4 py-3 text-white placeholder:text-white/20 focus:border-cyan-500/40 focus:bg-white/[0.05] focus:outline-none focus:ring-1 focus:ring-cyan-500/40 transition-all text-sm"
                      />
                    </div>
                  </div>

                  {/* Role Selector Grid */}
                  <div>
                    <label className="block font-mono text-xs uppercase tracking-wider text-white/40 mb-3">
                      Primary Role
                    </label>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {roles.map((role) => {
                        const isSelected = formData.primaryRole === role.value;
                        return (
                          <button
                            key={role.value}
                            type="button"
                            onClick={() => selectRole(role.value)}
                            className={cn(
                              "rounded-md border py-2.5 px-3 text-center text-xs font-mono uppercase tracking-wider transition-all",
                              isSelected
                                ? "border-cyan-500/50 bg-cyan-500/10 text-white shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                                : "border-white/5 bg-white/[0.02] text-white/40 hover:text-white/70 hover:border-white/10"
                            )}
                          >
                            {role.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Interests Description */}
                  <div>
                    <label className="block font-mono text-xs uppercase tracking-wider text-white/40 mb-2">
                      Interests / What are you building?
                    </label>
                    <textarea
                      name="interests"
                      value={formData.interests}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Briefly tell us what you're working on or interested in..."
                      className="w-full rounded-md border border-white/5 bg-white/[0.03] px-4 py-3 text-white placeholder:text-white/20 focus:border-cyan-500/40 focus:bg-white/[0.05] focus:outline-none focus:ring-1 focus:ring-cyan-500/40 transition-all text-sm resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isPending}
                      className={cn(
                        "w-full rounded-md border border-cyan-500/50 bg-cyan-500/10 px-6 py-4 font-mono text-xs uppercase tracking-widest text-white backdrop-blur-md transition-all hover:border-cyan-400 hover:bg-cyan-500/20 hover:shadow-[0_0_35px_rgba(6,182,212,0.25)] flex items-center justify-center gap-2",
                        isPending && "cursor-not-allowed opacity-50"
                      )}
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Establishing Uplink...
                        </>
                      ) : (
                        <>
                          Request Access Clearance
                          <Send className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
        <Footer />
      </main>
    </>
  );
}
