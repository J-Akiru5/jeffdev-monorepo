import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s | Prism Context Engine",
    default: "Prism Context Engine - The Context Operating System for Vibecoders",
  },
  description:
    "Record your architecture. AI learns your rules. Deploy context directly to Cursor, Windsurf, and Claude via MCP. Eliminate context pollution.",
  keywords: ['MCP', 'Model Context Protocol', 'Cursor', 'Windsurf', 'Claude', 'AI coding assistant', 'video to context', 'architectural rules', 'design system'],
  authors: [{ name: 'JeffDev Studio', url: 'https://jeffdev.studio' }],
  creator: 'JeffDev Studio',
  metadataBase: new URL(process.env.NEXT_PUBLIC_PRISM_URL || "https://prism.jeffdev.studio"),
  openGraph: {
    title: 'Prism Context Engine - The Context Operating System for Vibecoders',
    description: 'Record your architecture. AI learns your rules. Deploy to your IDE.',
    url: '/',
    siteName: 'Prism Context Engine',
    images: [
      {
        url: '/prism-icon.png',
        width: 1200,
        height: 630,
        alt: 'Prism Context Engine',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prism Context Engine - The Context Operating System',
    description: 'Record your architecture. AI learns your rules.',
    images: ['/prism-icon.png'],
    creator: '@jeffdevstudio',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/prism-icon.png',
    shortcut: '/prism-icon.png',
    apple: '/prism-icon.png',
  },
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
    </ClerkProvider>
  );
}
