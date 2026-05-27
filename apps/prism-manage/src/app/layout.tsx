import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "next-themes";
import { SupabaseProvider } from "@/components/providers/supabase-provider";
import "./globals.css";

export const dynamic = "force-dynamic";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Prism Manage",
    template: "%s | Prism Manage",
  },
  description: "Personal project tracker with Google Calendar integration",
  robots: "noindex, nofollow",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-surface antialiased">
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="dark"
          enableSystem={false}
          value={{ dark: "dark", light: "theme-light" }}
        >
          <SupabaseProvider>
            <Toaster
              position="bottom-right"
              theme="dark"
              toastOptions={{
                style: {
                  background: "var(--color-elevated)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--color-text, #ededed)",
                },
              }}
            />
            {children}
          </SupabaseProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
