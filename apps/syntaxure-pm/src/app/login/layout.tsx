import type { Metadata } from "next";
import { cookies } from "next/headers";
import "../globals.css";

export const metadata: Metadata = {
  title: "Syntaxure PM — Login",
  description: "Sign in to access documentation and project management.",
};

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await cookies();
  return <>{children}</>;
}
