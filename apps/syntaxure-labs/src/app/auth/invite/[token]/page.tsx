import Link from 'next/link';
import { cookies } from 'next/headers';
import { ArrowRight, AlertCircle, UserPlus } from 'lucide-react';
import { getInviteByToken } from '@/app/actions/invites';

/**
 * Invite Accept Page
 * ------------------
 * Validates invite token and allows user to complete signup.
 * Glassmorphism + neon accent design for brand consistency.
 */

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export default async function InviteAcceptPage({ params }: InvitePageProps) {
  await cookies();

  const { token } = await params;

  const invite = await getInviteByToken(token);

  if (!invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-void px-4">
        <div className="max-w-md w-full">
          {/* Glass Card */}
          <div className="relative overflow-hidden glass-heavy rounded-lg p-10 text-center">
            {/* Neon accent top bar */}
            <div className="absolute top-0 left-4 right-4 h-px animate-border-beam" />

            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20">
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">
              Invalid or Expired Invite
            </h1>
            <p className="text-white/50 mb-8 leading-relaxed">
              This invite link is no longer valid. It may have expired or
              already been used.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 glass rounded-md px-6 py-3 text-sm font-medium text-white/80 transition-all hover:text-white hover:border-cyan-500/30 hover:shadow-glow-cyan font-mono uppercase tracking-wider text-xs"
            >
              Go to Homepage
              <ArrowRight className="h-4 w-4" />
            </Link>

            {/* Neon accent bottom bar */}
            <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-void px-4">
      <div className="max-w-md w-full">
        {/* Glass Card */}
        <div className="relative overflow-hidden glass-heavy glass-shimmer rounded-lg p-10">
          {/* Neon accent top bar */}
          <div className="absolute top-0 left-4 right-4 h-px animate-border-beam" />

          <div className="text-center mb-8">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/10 border border-cyan-500/30 animate-neon-pulse">
              <UserPlus className="h-8 w-8 text-cyan-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              You&apos;re Invited!
            </h1>
            <p className="text-white/50">
              Join Syntaxure Labs as{' '}
              <span className="text-gradient-holographic font-semibold capitalize">
                {invite.role}
              </span>
            </p>
          </div>

          <div className="space-y-4 mb-6 glass rounded-lg p-5">
            <div>
              <label className="block text-xs uppercase tracking-wider text-white/40 mb-1 font-mono">
                Email
              </label>
              <p className="text-white font-medium">{invite.email}</p>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-white/40 mb-1 font-mono">
                Role
              </label>
              <p className="text-white font-medium capitalize">{invite.role}</p>
            </div>
          </div>

          <p className="text-sm text-white/40 mb-5 text-center leading-relaxed">
            Click below to sign in with Google using{' '}
            <strong className="text-white/60">{invite.email}</strong>.
            Your account will automatically be set up.
          </p>

          <InviteSignupButton token={token} />

          <p className="mt-6 text-center text-[11px] text-white/25 font-mono">
            By joining, you agree to our Terms of Service and Privacy Policy.
          </p>

          {/* Neon accent bottom bar */}
          <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
        </div>
      </div>
    </div>
  );
}

function InviteSignupButton({ token }: { token: string }) {
  return (
    <Link
      href={`/admin/login?invite=${token}`}
      className="flex w-full items-center justify-center gap-2 rounded-md border border-cyan-500/50 bg-cyan-500/10 px-6 py-3 text-sm font-medium text-white backdrop-blur-sm transition-all hover:border-cyan-400 hover:bg-cyan-500/20 hover:shadow-[0_0_30px_rgba(6,182,212,0.25)] font-mono uppercase tracking-wider text-xs"
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="currentColor"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="currentColor"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="currentColor"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
      Continue with Google
    </Link>
  );
}
