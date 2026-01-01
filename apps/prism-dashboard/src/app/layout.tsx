import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s | Prism Engine",
    default: "Prism Engine - Context Governance for LLMs",
  },
  description:
    "Deploy a Context Server that forces AI coding assistants to follow your Design System. Stop hallucinations, enforce architecture.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_PRISM_URL || "https://prism.jeffdev.studio"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "#06b6d4", // Cyan-500 (Design System)
          colorBackground: "#050505", // bg-void
          colorInputBackground: "#0a0a0a", // bg-surface
          colorInputText: "#ffffff",
          borderRadius: "6px", // rounded-md
        },
        elements: {
          formButtonPrimary: "bg-cyan-500 hover:bg-cyan-600",
          card: "bg-[#0a0a0a] border border-white/5",
          headerTitle: "text-white font-semibold",
          headerSubtitle: "text-white/60",
          socialButtonsBlockButton: "border-white/10 hover:bg-white/5",
          formFieldLabel: "text-white/80",
          formFieldInput: "bg-transparent border-white/10 text-white",
          footerActionLink: "text-cyan-400 hover:text-cyan-300",
        },
      }}
    >
      <html lang="en" className="dark">
        <body className="antialiased bg-[#050505] text-white min-h-screen">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
