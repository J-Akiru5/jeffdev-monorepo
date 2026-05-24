import { redirect } from "next/navigation";

/**
 * Root Page
 * ---------
 * Redirects to the default tasks view.
 */
export default function HomePage() {
  redirect("/tasks");
}
