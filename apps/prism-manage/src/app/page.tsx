import { redirect } from "next/navigation";

/**
 * Root Page
 * ---------
 * Redirects to the Syntaxure Labs HQ dashboard landing page.
 */
export default function HomePage() {
  redirect("/dashboard");
}
