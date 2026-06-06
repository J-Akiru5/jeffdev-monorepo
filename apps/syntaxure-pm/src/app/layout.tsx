import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Syntaxure PM — Project Management & Documentation",
  description: "Centralized documentation, task tracking, and project management for the Syntaxure monorepo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
