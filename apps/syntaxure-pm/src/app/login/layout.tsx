import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Syntaxure PM — Login",
  description: "Sign in to access documentation and project management.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
