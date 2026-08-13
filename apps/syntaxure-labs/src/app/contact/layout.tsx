import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us | Get a Free Project Quote',
  description:
    'Contact Syntaxure Labs for a free project consultation. Tell us about your web development, SaaS, or AI integration needs and we will respond within 24 hours.',
  openGraph: {
    title: 'Contact Syntaxure Labs | Get a Free Quote',
    description:
      'Get in touch with Syntaxure Labs for a free project consultation. Web development, SaaS platforms, and AI integration services.',
    url: '/contact',
    siteName: 'Syntaxure Labs',
  },
  alternates: {
    canonical: '/contact',
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
