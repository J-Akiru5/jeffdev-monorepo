import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s | Prism Admin",
    default: "Prism Admin - Mission Control",
  },
  description: "Unified admin panel for JeffDev Studio products",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "#f59e0b",
          colorBackground: "#030303",
          colorInputBackground: "#080808",
          colorInputText: "#ffffff",
          borderRadius: "6px",
        },
        elements: {
          formButtonPrimary: "bg-amber-500 hover:bg-amber-600",
          card: "bg-[#080808] border border-white/5",
          headerTitle: "text-white font-semibold",
          headerSubtitle: "text-white/60",
          socialButtonsBlockButton: "border-white/10 hover:bg-white/5",
          formFieldLabel: "text-white/80",
          formFieldInput: "bg-transparent border-white/10 text-white",
          footerActionLink: "text-amber-400 hover:text-amber-300",
        },
      }}
    >
      <html lang="en" className="dark">
        <body className="antialiased bg-[#030303] text-white min-h-screen">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
