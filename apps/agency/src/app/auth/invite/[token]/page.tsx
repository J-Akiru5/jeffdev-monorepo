import Link from 'next/link';
import { cookies } from 'next/headers';
import { ArrowRight, AlertCircle, UserPlus } from 'lucide-react';
import { getInviteByToken } from '@/app/actions/invites';

/**
 * Invite Accept Page
 * ------------------
 * Validates invite token and allows user to complete signup.
 */

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export default async function InviteAcceptPage({ params }: InvitePageProps) {
  await cookies(); // Ensure dynamic rendering
  
  const { token } = await params;
  
  // Validate the invite
  const invite = await getInviteByToken(token);
  
  if (!invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-void">
        <div className="max-w-md w-full mx-4 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
            <AlertCircle className="h-8 w-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Invalid or Expired Invite
          </h1>
          <p className="text-white/50 mb-8">
            This invite link is no longer valid. It may have expired or already been used.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-md bg-white/10 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-white/20"
          >
            Go to Homepage
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }
  
  // Valid invite - show signup form
  return (
    <div className="min-h-screen flex items-center justify-center bg-void">
      <div className="max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/10">
            <UserPlus className="h-8 w-8 text-cyan-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            You&apos;re Invited!
          </h1>
          <p className="text-white/50">
            Join JD Studio as{' '}
            <span className="text-cyan-400 font-medium capitalize">{invite.role}</span>
          </p>
        </div>
        
        <div className="rounded-md border border-white/10 bg-white/5 p-6">
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-xs uppercase tracking-wider text-white/40 mb-1">
                Email
              </label>
              <p className="text-white">{invite.email}</p>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-white/40 mb-1">
                Role
              </label>
              <p className="text-white capitalize">{invite.role}</p>
            </div>
          </div>
          
          <p className="text-sm text-white/40 mb-4">
            Click below to sign in with Google using <strong>{invite.email}</strong>.
            Your account will automatically be set up.
          </p>
          
          {/* Client-side signup button will handle Firebase Auth */}
          <InviteSignupButton token={token} />
        </div>
        
        <p className="mt-6 text-center text-xs text-white/30">
          By joining, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}

/**
 * Client-side button for handling Firebase Auth
 */
/**
 * Client-side button for handling navigation
 */
function InviteSignupButton({ token }: { token: string }) {
  return (
    <Link
      href={`/admin/login?invite=${token}`}
      className="flex w-full items-center justify-center rounded-md bg-cyan-500 px-6 py-3 text-sm font-medium text-black transition-colors hover:bg-cyan-400"
    >
      Continue with Google
    </Link>
  );
}
