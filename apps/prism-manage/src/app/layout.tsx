import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "next-themes";
import { ThemeDefaultSyncClient } from "@/components/settings/theme-default-sync-client";
import { AuthWrapper } from "@/components/providers/auth-wrapper";
import { ThemeBootstrap } from "@/components/theme-bootstrap";
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
  keywords: ["project management", "task tracker", "Google Calendar", "productivity"],
  authors: [{ name: "Syntaxure Labs", url: "https://www.syntaxure.dev" }],
  creator: "Syntaxure Labs",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_MANAGE_URL || "https://manage.syntaxure.dev",
  ),
  openGraph: {
    title: "Prism Manage - Personal Project Tracker",
    description: "Track tasks, manage projects, and sync with Google Calendar.",
    url: "/",
    siteName: "Prism Manage",
    images: [
      {
        url: "/web-app-manifest-512x512.png",
        width: 512,
        height: 512,
        alt: "Prism Manage",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Prism Manage - Personal Project Tracker",
    description: "Track tasks, manage projects, and sync with Google Calendar.",
    images: ["/web-app-manifest-512x512.png"],
    creator: "@syntaxure_dev",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/apple-touch-icon.png",
    other: [
      {
        rel: "icon",
        url: "/web-app-manifest-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        rel: "icon",
        url: "/web-app-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  },
  manifest: "/site.webmanifest",
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
      <head>
        <ThemeBootstrap />
      </head>
      <body className="min-h-screen bg-surface antialiased">
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="system"
          enableSystem={true}
          value={{ dark: "dark", light: "theme-light" }}
        >
          <AuthWrapper>
              <ThemeDefaultSyncClient />
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
            </AuthWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
