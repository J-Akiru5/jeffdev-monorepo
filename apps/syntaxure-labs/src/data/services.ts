import { Globe, Cloud, Cpu, Sparkles, type LucideIcon } from "lucide-react";

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
    id: "web-development",
    slug: "web-development",
    icon: Globe,
    title: "Custom Websites & Web Applications",
    tagline: "Fast, beautiful websites that drive business growth.",
    description:
      "We build high-performance websites and web apps that load instantly, rank well on Google, and convert visitors into customers. Your site will look great on any device and reflect your brand perfectly.",
    features: [
      "Blazing-fast load times",
      "Mobile-friendly on all devices",
      "Search engine optimized",
      "Custom design that matches your brand",
    ],
    deliverables: [
      "Fully built and deployed website",
      "Custom design with your brand colors and logo",
      "Works perfectly on phone, tablet, and desktop",
      "Performance and SEO optimization report",
    ],
    investment: {
      startingPrice: 75000,
      timeline: "2-4 weeks",
    },
  },
  {
    id: "saas-platforms",
    slug: "saas-platforms",
    icon: Cloud,
    title: "SaaS Platform Development",
    tagline: "Launch your subscription product in weeks, not months.",
    description:
      "We build custom software-as-a-service platforms with everything you need built-in: user accounts, subscription billing, and the ability to serve multiple clients from one system. You focus on your business rules; we handle the rest.",
    features: [
      "User accounts and login system",
      "Subscription payment processing",
      "User permissions and team management",
      "Ready-to-launch foundation",
    ],
    deliverables: [
      "Complete SaaS platform ready to launch",
      "Payment processing integration",
      "Admin dashboard for managing users",
      "Account registration and login flow",
    ],
    investment: {
      startingPrice: 150000,
      timeline: "4-8 weeks",
    },
  },
  {
    id: "cloud-architecture",
    slug: "cloud-architecture",
    icon: Cpu,
    title: "Cloud Hosting & Infrastructure",
    tagline: "Your system stays fast and reliable as you grow.",
    description:
      "We set up and manage enterprise-grade cloud hosting that keeps your website or app running smoothly, even as your traffic grows. We handle the ongoing maintenance, security updates, and monitoring so you never have to worry about technical infrastructure.",
    features: [
      "Fully managed cloud hosting setup and maintenance",
      "Automatic scaling as your traffic grows",
      "24/7 monitoring and security updates",
      "Regular backups and disaster recovery",
    ],
    deliverables: [
      "Cloud hosting account setup and ongoing management",
      "Automated backup and recovery system",
      "24/7 performance and uptime monitoring",
      "Regular security updates and maintenance",
    ],
    investment: {
      startingPrice: 50000,
      timeline: "1-2 weeks (setup) + monthly hosting",
    },
  },
  {
    id: "ai-integration",
    slug: "ai-integration",
    icon: Sparkles,
    title: "AI Integration & Automation",
    tagline: "Make your product smarter with artificial intelligence.",
    description:
      "We add AI capabilities to your product so it can automate repetitive tasks, answer customer questions intelligently, and make smarter decisions. Powered by our Context Engine technology for reliable, accurate AI behavior.",
    features: [
      "AI-powered search and recommendations",
      "Automated document processing",
      "Smart customer support chatbots",
      "Custom AI trained on your data",
    ],
    deliverables: [
      "AI feature integrated into your product",
      "Custom knowledge base for your AI",
      "Automated workflow setup",
      "AI behavior testing and optimization",
    ],
    investment: {
      startingPrice: 100000,
      timeline: "2-4 weeks",
    },
  },
];

export function getServiceBySlug(slug: string): Service | undefined {
  return services.find((service) => service.slug === slug);
}

export function getAllServiceSlugs(): string[] {
  return services.map((service) => service.slug);
}
