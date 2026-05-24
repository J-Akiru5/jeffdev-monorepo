import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    'Get in touch with Syntaxure Labs. Have a project in mind? Send us a message and we will get back to you within 24 hours.',
  openGraph: {
    title: 'Contact Syntaxure Labs',
    description:
      'Get in touch with Syntaxure Labs. Start your next web development project today.',
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
