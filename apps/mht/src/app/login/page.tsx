import type { Metadata } from 'next';
import { LoginForm } from '@/components/login/login-form';

export const metadata: Metadata = {
  title: 'Subscriber Portal — Sign In',
  description: 'Sign in to your MHT subscriber account to manage your internet and solar services.',
  robots: { index: false, follow: false }, // Private page
};

export default function LoginPage() {
  return (
    <section className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4" id="login-page">
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-80 h-80 bg-blue-400/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-green-400/8 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        <LoginForm />
      </div>
    </section>
  );
}
