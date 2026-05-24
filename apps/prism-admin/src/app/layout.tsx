import type { Metadata } from "next";
import { SupabaseProvider } from "@/components/providers/supabase-provider";
import { Toaster } from "sonner";
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
