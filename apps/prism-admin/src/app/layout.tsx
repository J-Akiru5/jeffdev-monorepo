import type { Metadata } from "next";
import { SupabaseProvider } from "@/components/providers/supabase-provider";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    template: "%s | Prism Admin",
    default: "Prism Admin - Mission Control",
  },
  description: "Unified admin panel for Syntaxure Labs products",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SupabaseProvider>
      <html lang="en" className="dark">
        <body className="antialiased bg-[#030303] text-white min-h-screen">
          {children}
        </body>
      </html>
    </SupabaseProvider>
  );
}
