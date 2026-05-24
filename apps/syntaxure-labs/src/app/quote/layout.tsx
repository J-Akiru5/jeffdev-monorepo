import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Get a Project Quote',
  description:
    'Request a custom project quote from Syntaxure Labs. Tell us about your web development needs and we will provide a fixed-price investment estimate within 24 hours.',
  openGraph: {
    title: 'Get a Project Quote | Syntaxure Labs',
    description:
      'Request a custom project quote for web development, SaaS platforms, and AI integration services.',
    url: '/quote',
    siteName: 'Syntaxure Labs',
  },
  alternates: {
    canonical: '/quote',
  },
};

export default function QuoteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
