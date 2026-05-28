import type { Metadata } from "next";
import { Toaster } from "sonner";
import { ThemeWrapper } from "@/components/admin/theme-wrapper";
import { ThemeBootstrap } from "@/components/admin/theme-bootstrap";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    template: "%s | Prism Admin",
    default: "Prism Admin - Mission Control",
  },
  description: "Unified admin panel for Syntaxure Labs products",
  keywords: ["admin", "dashboard", "Syntaxure Labs", "analytics"],
  authors: [{ name: "Syntaxure Labs", url: "https://www.syntaxure.dev" }],
  creator: "Syntaxure Labs",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_ADMIN_URL || "https://admin.syntaxure.dev",
  ),
  openGraph: {
    title: "Prism Admin - Mission Control",
    description: "Unified admin panel for Syntaxure Labs products — users, analytics, and more.",
    url: "/",
    siteName: "Prism Admin",
    images: [
      {
        url: "/web-app-manifest-512x512.png",
        width: 512,
        height: 512,
        alt: "Prism Admin",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Prism Admin - Mission Control",
    description: "Unified admin panel for Syntaxure Labs products.",
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
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
        <head>
          <ThemeBootstrap />
        </head>
        <body className="antialiased bg-[#030303] text-white min-h-screen">
          <ThemeWrapper>{children}</ThemeWrapper>
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
  );
}
