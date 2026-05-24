import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing & Plans',
  description:
    'Transparent fixed-investment pricing for web development services. Choose the plan that fits your budget — from MVPs to enterprise platforms. No hidden fees, no surprises.',
  openGraph: {
    title: 'Pricing & Plans | Syntaxure Labs',
    description:
      'Transparent fixed-investment pricing for web development. No hidden fees, no surprises.',
    url: '/pricing',
    siteName: 'Syntaxure Labs',
  },
  alternates: {
    canonical: '/pricing',
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
