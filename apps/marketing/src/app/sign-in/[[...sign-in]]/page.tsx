import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-void">
      <SignIn
        appearance={{
          elements: {
            rootBox: 'mx-auto',
            card: 'bg-glass border border-white/10 rounded-lg shadow-none',
            headerTitle: 'text-white',
            headerSubtitle: 'text-white/50',
            socialButtonsBlockButton: 'bg-white/5 border border-white/10 text-white hover:bg-white/10',
            socialButtonsBlockButtonText: 'text-white',
            formFieldLabel: 'text-white/70',
            formFieldInput: 'bg-white/5 border border-white/10 text-white',
            formButtonPrimary: 'bg-cyan-accent text-black hover:bg-cyan-accent/80',
            footerActionLink: 'text-cyan-accent hover:text-cyan-accent/80',
            identityPreviewText: 'text-white',
            identityPreviewEditButton: 'text-cyan-accent',
          },
        }}
      />
    </main>
  );
}
