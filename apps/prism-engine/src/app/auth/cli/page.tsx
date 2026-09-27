import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CopyButton } from "./copy-button";

export const dynamic = "force-dynamic";

/**
 * /auth/cli — CLI session-token minting page.
 *
 * Authenticated page (cookie-bound session). Renders the user's current
 * Supabase session JWT so the Prism CLI can consume it:
 *
 *   prism login --token <token>
 *
 * v1 deliberately minimal: copy-paste flow, no device-code dance. The token
 * is rendered into the page HTML on purpose — it IS the delivery mechanism;
 * it belongs to the signed-in user's own session and expires with it.
 */

export default async function AuthCliPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
      <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
        <h1 className="text-xl font-bold text-white">Prism CLI Authentication</h1>
        <p className="mt-2 text-sm text-slate-400">
          Copy this session token, then run the command below in your terminal
          to authenticate the Prism CLI on this machine.
        </p>

        <pre className="mt-6 rounded-lg bg-slate-950 p-4 text-xs text-cyan-300">
          {`prism login --token <your-token>`}
        </pre>

        <div className="mt-4 flex items-center gap-2">
          <input
            readOnly
            value={session.access_token}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 font-mono text-xs text-slate-300"
            onFocus={(e) => e.currentTarget.select()}
          />
          <CopyButton value={session.access_token} />
        </div>

        <p className="mt-4 text-xs text-slate-500">
          The token is your Supabase session JWT. It expires with your browser
          session and can be cleared at any time with <code>prism logout</code>.
          Never share it.
        </p>
      </div>
    </main>
  );
}