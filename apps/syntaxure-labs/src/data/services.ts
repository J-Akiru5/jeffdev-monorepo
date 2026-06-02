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
    title: "Next-Gen Web Foundations",
    tagline: "Modern, high-performance tech stack for speed and SEO.",
    description:
      "Our templates are built on modern, high-performance frameworks, providing a blazing-fast, SEO-optimized baseline. We customize the UI/UX to match your exact brand identity without compromising on enterprise-level speed.",
    features: [
      "Next.js 14+ App Router",
      "React & TypeScript",
      "Core Web Vitals",
      "Custom UI/UX Styling",
    ],
    deliverables: [
      "Customized frontend templates",
      "Theme integration",
      "Responsiveness check",
      "Speed & SEO auditing",
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
    title: "Turnkey SaaS Core",
    tagline: "Pre-built core features to accelerate launch.",
    description:
      "Skip months of repetitive development. Our core architectures come pre-wired with multi-tenancy, subscription billing, and user management. We take this robust foundation and build your custom business logic directly on top.",
    features: [
      "Multi-Tenant Architecture",
      "Stripe/Paddle Billing",
      "Session-Based RBAC",
      "Ready-to-Ship Core",
    ],
    deliverables: [
      "Tenant separation database",
      "Billing webhook setup",
      "Auth RBAC dashboard configuration",
      "Core template build pipeline",
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
    title: "Scalable Deployments",
    tagline: "Modular architecture ready for seamless scaling.",
    description:
      "Your customized SaaS is ready to scale from day one. Our modular architecture is optimized for seamless edge deployment or Docker containerization, ensuring high availability and cost-efficiency as your user base grows.",
    features: [
      "Vercel / AWS / GCP",
      "Docker Containerization",
      "Edge Computing",
      "Decoupled Scaling",
    ],
    deliverables: [
      "Edge routing configurations",
      "Dockerfiles and build scripts",
      "Auto-scaling configuration",
      "Decoupled architecture documentation",
    ],
    investment: {
      startingPrice: 50000,
      timeline: "1-2 weeks",
    },
  },
  {
    id: "ai-integration",
    slug: "ai-integration",
    icon: Sparkles,
    title: "AI-Native Extensibility",
    tagline: "Inject advanced intelligence into your product.",
    description:
      "Go beyond basic wrappers. We can inject advanced intelligence into your custom SaaS deployment using our Prism Context Engine, custom RAG pipelines, and automated n8n workflows to give your product a true competitive advantage.",
    features: [
      "Prism Context Engine",
      "RAG Pipelines",
      "Automated Workflows",
      "Prompt Engineering",
    ],
    deliverables: [
      "AI orchestration code layers",
      "Vector search indexing setups",
      "n8n flow setup and logic",
      "Optimized prompts repository",
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
