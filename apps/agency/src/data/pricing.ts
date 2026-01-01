/**
 * Pricing Data
 * -------------
 * Static pricing tiers for the public pricing page.
 * Discounts are hardcoded for now; admin discount controller can be added later.
 */

export interface PricingFeature {
  label: string;
  included: boolean;
  highlight?: boolean;
}

export interface PricingTier {
  id: string;
  name: string;
  tagline: string;
  price: {
    php: {
      original: number;
      discounted: number | null;
    };
    usd: {
      original: number;
      discounted: number | null;
    };
  };
  discountLabel: string | null;
  monthlyAddon: string | null; // e.g., "+3 mo. free"
  features: PricingFeature[];
  cta: {
    label: string;
    href: string;
    variant: 'primary' | 'secondary' | 'contact';
  };
  popular: boolean;
  limitedDeal: boolean;
}

export interface CarePlan {
  name: string;
  tagline: string;
  description: string;
  monthlyPrice: {
    php: { min: number; max: number };
    usd: { min: number; max: number };
  };
  features: string[];
}

// =============================================================================
// PRICING TIERS
// =============================================================================
export const pricingTiers: PricingTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'Best for solo entrepreneurs',
    price: {
      php: { original: 45000, discounted: 25000 },
      usd: { original: 800, discounted: 450 },
    },
    discountLabel: '44% OFF',
    monthlyAddon: null,
    features: [
      { label: 'Up to 5 pages', included: true },
      { label: 'Static Next.js + Tailwind', included: true },
      { label: 'Mobile responsive design', included: true },
      { label: 'Basic SEO setup', included: true },
      { label: 'Contact form integration', included: true },
      { label: 'CMS integration', included: false },
      { label: 'Custom features', included: false },
      { label: 'E-commerce functionality', included: false },
    ],
    cta: { label: 'Choose plan', href: '/quote?tier=starter', variant: 'secondary' },
    popular: false,
    limitedDeal: false,
  },
  {
    id: 'business',
    name: 'Business',
    tagline: 'Everything you need to grow',
    price: {
      php: { original: 100000, discounted: 65000 },
      usd: { original: 1800, discounted: 1150 },
    },
    discountLabel: '35% OFF',
    monthlyAddon: '+3 mo. free Care Plan',
    features: [
      { label: 'Up to 15 pages', included: true },
      { label: 'Next.js + CMS (Sanity/Payload)', included: true, highlight: true },
      { label: 'Mobile responsive design', included: true },
      { label: 'Advanced SEO optimization', included: true, highlight: true },
      { label: 'Blog/News system', included: true },
      { label: 'Analytics integration', included: true },
      { label: 'Custom contact forms', included: true },
      { label: 'E-commerce functionality', included: false },
    ],
    cta: { label: 'Choose plan', href: '/quote?tier=business', variant: 'primary' },
    popular: true,
    limitedDeal: true,
  },
  {
    id: 'custom',
    name: 'Custom',
    tagline: 'Full-stack SaaS solutions',
    price: {
      php: { original: 300000, discounted: 180000 },
      usd: { original: 5400, discounted: 3200 },
    },
    discountLabel: '40% OFF',
    monthlyAddon: '+6 mo. free Care Plan',
    features: [
      { label: 'Unlimited pages', included: true },
      { label: 'Full-stack Next.js + Database', included: true, highlight: true },
      { label: 'User authentication system', included: true, highlight: true },
      { label: 'Admin dashboard', included: true },
      { label: 'Payment gateway integration', included: true, highlight: true },
      { label: 'API development', included: true },
      { label: 'E-commerce / Booking system', included: true },
      { label: 'Priority support', included: true },
    ],
    cta: { label: 'Choose plan', href: '/quote?tier=custom', variant: 'primary' },
    popular: false,
    limitedDeal: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'Dedicated team for complex needs',
    price: {
      php: { original: 0, discounted: null },
      usd: { original: 0, discounted: null },
    },
    discountLabel: null,
    monthlyAddon: null,
    features: [
      { label: 'Dedicated development team', included: true, highlight: true },
      { label: 'Custom architecture design', included: true },
      { label: 'Multi-platform solutions', included: true },
      { label: 'Enterprise security audit', included: true, highlight: true },
      { label: 'SLA & uptime guarantee', included: true },
      { label: '24/7 priority support', included: true },
      { label: 'On-demand scaling', included: true },
      { label: 'Custom integrations', included: true },
    ],
    cta: { label: 'Contact us', href: '/contact?subject=enterprise', variant: 'contact' },
    popular: false,
    limitedDeal: false,
  },
];

// =============================================================================
// CARE PLAN (Maintenance Retainer)
// =============================================================================
export const carePlan: CarePlan = {
  name: 'Care Plan',
  tagline: 'Protect your investment',
  description:
    'For the price of one nice dinner, your business stays online and secure forever. All projects include our mandatory Care Plan for the first 12 months.',
  monthlyPrice: {
    php: { min: 2000, max: 5000 },
    usd: { min: 35, max: 90 },
  },
  features: [
    'Managed cloud hosting',
    'SSL & security patches',
    'Daily automated backups',
    'Monthly health reports',
    'Priority email support',
    'Minor updates & bug fixes',
  ],
};

// =============================================================================
// FEATURE COMPARISON TABLE
// =============================================================================
export interface ComparisonRow {
  feature: string;
  starter: boolean | string;
  business: boolean | string;
  custom: boolean | string;
  enterprise: boolean | string;
}

export const comparisonTable: ComparisonRow[] = [
  { feature: 'Number of pages', starter: 'Up to 5', business: 'Up to 15', custom: 'Unlimited', enterprise: 'Unlimited' },
  { feature: 'Custom domain', starter: true, business: true, custom: true, enterprise: true },
  { feature: 'SSL certificate', starter: true, business: true, custom: true, enterprise: true },
  { feature: 'Mobile responsive', starter: true, business: true, custom: true, enterprise: true },
  { feature: 'SEO optimization', starter: 'Basic', business: 'Advanced', custom: 'Advanced', enterprise: 'Custom' },
  { feature: 'CMS integration', starter: false, business: true, custom: true, enterprise: true },
  { feature: 'Blog system', starter: false, business: true, custom: true, enterprise: true },
  { feature: 'User authentication', starter: false, business: false, custom: true, enterprise: true },
  { feature: 'Admin dashboard', starter: false, business: false, custom: true, enterprise: true },
  { feature: 'Payment gateway', starter: false, business: false, custom: true, enterprise: true },
  { feature: 'API development', starter: false, business: false, custom: true, enterprise: true },
  { feature: 'Database integration', starter: false, business: false, custom: true, enterprise: true },
  { feature: 'Care Plan included', starter: '12 months', business: '15 months', custom: '18 months', enterprise: 'Custom' },
  { feature: 'Support response', starter: '48 hours', business: '24 hours', custom: '12 hours', enterprise: '1 hour' },
  { feature: 'Source code ownership', starter: true, business: true, custom: true, enterprise: true },
];

// =============================================================================
// FAQ
// =============================================================================
export interface FAQItem {
  question: string;
  answer: string;
}

export const pricingFAQ: FAQItem[] = [
  {
    question: 'What is the Care Plan?',
    answer:
      'The Care Plan is our mandatory maintenance retainer that ensures your website stays secure, fast, and up-to-date. It includes managed hosting, security patches, daily backups, and priority support. Think of it as insurance for your digital investment.',
  },
  {
    question: 'Can I pay in installments?',
    answer:
      'Yes! We offer flexible payment terms. Typically, we require 50% upfront to start the project and the remaining 50% upon completion. For larger projects, we can arrange milestone-based payments.',
  },
  {
    question: 'What happens after the included Care Plan period?',
    answer:
      'After the included period, you can continue the Care Plan at our standard monthly rate (₱2,000-₱5,000/month depending on your tier). If you choose not to continue, your site remains yours, but you\'ll be responsible for hosting and maintenance.',
  },
  {
    question: 'Do I own the source code?',
    answer:
      'Absolutely. Once the project is paid in full, you own 100% of the source code. We believe in full transparency and ownership for our clients.',
  },
  {
    question: 'What\'s the typical project timeline?',
    answer:
      'Starter projects take 2-3 weeks. Business projects take 4-6 weeks. Custom/SaaS projects take 8-16 weeks depending on complexity. Enterprise timelines are determined during the scoping phase.',
  },
  {
    question: 'Can I upgrade my plan later?',
    answer:
      'Yes! Your website can grow with your business. We can add features, integrate new systems, or completely rebuild as needed. Existing clients receive priority scheduling and discounted rates for upgrades.',
  },
];
