import { Globe, Cloud, Cpu, Sparkles, type LucideIcon } from 'lucide-react';

/**
 * Services Data
 * -------------
 * Centralized service definitions for consistency across pages.
 * Follows B2B investment-focused language.
 *
 * NOTE: All prices are stored as numbers in PHP (Philippine Peso).
 * The CurrencyContext handles conversion to USD for international visitors.
 */

export interface Service {
  id: string;
  slug: string;
  icon: LucideIcon;
  title: string;
  tagline: string;
  description: string;
  features: string[];
  deliverables: string[];
  investment: {
    /** Base price in PHP (numeric for currency conversion) */
    startingPrice: number;
    timeline: string;
  };
}

export const services: Service[] = [
  {
    id: 'web-development',
    slug: 'web-development',
    icon: Globe,
    title: 'Web Development',
    tagline: 'High-performance web applications that convert.',
    description:
      'We build blazing-fast web applications using Next.js 14+, React, and modern tooling. Every project is optimized for speed, SEO, and conversions — engineered to outperform your competition.',
    features: [
      'Next.js 14+ with App Router',
      'TypeScript for type safety',
      'Edge Functions for global performance',
      'SEO optimization & Core Web Vitals',
      'Responsive, mobile-first design',
      'Analytics & conversion tracking',
    ],
    deliverables: [
      'Production-ready codebase',
      'Vercel deployment configuration',
      'Documentation & handoff',
      '30-day post-launch support',
    ],
    investment: {
      startingPrice: 75000,
      timeline: '2-4 weeks',
    },
  },
  {
    id: 'saas-platforms',
    slug: 'saas-platforms',
    icon: Cloud,
    title: 'SaaS Platforms',
    tagline: 'Full-stack SaaS from zero to revenue.',
    description:
      'Launch your SaaS with a solid foundation. Multi-tenancy, subscription billing, user management, and analytics — all built in from day one. Scale confidently from MVP to enterprise.',
    features: [
      'Multi-tenant architecture',
      'Stripe/Paddle billing integration',
      'User authentication & RBAC',
      'Admin dashboard',
      'Usage analytics & reporting',
      'API-first design',
    ],
    deliverables: [
      'Complete SaaS codebase',
      'Database schema & migrations',
      'Payment integration',
      'Admin panel',
      'API documentation',
    ],
    investment: {
      startingPrice: 150000,
      timeline: '4-8 weeks',
    },
  },
  {
    id: 'cloud-architecture',
    slug: 'cloud-architecture',
    icon: Cpu,
    title: 'Cloud Architecture',
    tagline: 'Infrastructure built for 99.9% uptime.',
    description:
      'Enterprise-grade infrastructure on Vercel, AWS, or Google Cloud. We design systems that scale infinitely, recover automatically, and cost-optimize as you grow.',
    features: [
      'Vercel / AWS / GCP setup',
      'CI/CD pipeline configuration',
      'Auto-scaling infrastructure',
      'Monitoring & alerting',
      'Disaster recovery planning',
      'Cost optimization',
    ],
    deliverables: [
      'Infrastructure as Code (IaC)',
      'CI/CD pipelines',
      'Monitoring dashboards',
      'Runbooks & documentation',
      'SLA guarantee',
    ],
    investment: {
      startingPrice: 50000,
      timeline: '1-2 weeks',
    },
  },
  {
    id: 'ai-integration',
    slug: 'ai-integration',
    icon: Sparkles,
    title: 'AI Integration',
    tagline: 'Embed intelligence into your product.',
    description:
      'Add AI capabilities to your existing product or build AI-native applications from scratch. Chatbots, content generation, recommendation engines, RAG systems — we make AI accessible.',
    features: [
      'OpenAI / Claude / Gemini integration',
      'RAG systems with vector databases',
      'Custom fine-tuning',
      'Conversational AI / Chatbots',
      'Content generation pipelines',
      'AI-powered search',
    ],
    deliverables: [
      'AI integration codebase',
      'Prompt engineering library',
      'Vector database setup',
      'Usage monitoring',
      'Optimization recommendations',
    ],
    investment: {
      startingPrice: 100000,
      timeline: '2-4 weeks',
    },
  },
];

export function getServiceBySlug(slug: string): Service | undefined {
  return services.find((service) => service.slug === slug);
}

export function getAllServiceSlugs(): string[] {
  return services.map((service) => service.slug);
}
