import type { Metadata } from "next";
import { SupabaseProvider } from "@/components/auth/supabase-provider";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s | Prism Context Engine",
    default:
      "Prism Context Engine - The Context Operating System for Vibecoders",
  },
  description:
    "Record your architecture. AI learns your rules. Deploy context directly to Cursor, Windsurf, and Claude via MCP. Eliminate context pollution.",
  keywords: [
    "MCP",
    "Model Context Protocol",
    "Cursor",
    "Windsurf",
    "Claude",
    "AI coding assistant",
    "video to context",
    "architectural rules",
    "design system",
  ],
  authors: [{ name: "Syntaxure Labs", url: "https://jeffdev.studio" }],
  creator: "Syntaxure Labs",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_PRISM_URL || "https://prism.jeffdev.studio",
  ),
  openGraph: {
    title: "Prism Context Engine - The Context Operating System for Vibecoders",
    description:
      "Record your architecture. AI learns your rules. Deploy to your IDE.",
    url: "/",
    siteName: "Prism Context Engine",
    images: [
      {
        url: "/prism-icon.png",
        width: 1200,
        height: 630,
        alt: "Prism Context Engine",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Prism Context Engine - The Context Operating System",
    description: "Record your architecture. AI learns your rules.",
    images: ["/prism-icon.png"],
    creator: "@jeffdevstudio",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SupabaseProvider>
      <html lang="en" className="dark">
        <body className="antialiased bg-[#050505] text-white min-h-screen">
          {children}
          <Toaster
            theme="dark"
            position="bottom-right"
            toastOptions={{
              style: {
                background: "#0a0a0a",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#fff",
              },
            }}
          />
        </body>
      </html>
    </SupabaseProvider>
  );
}
