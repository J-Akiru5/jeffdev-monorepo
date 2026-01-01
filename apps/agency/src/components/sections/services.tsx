'use client';

import { useRef, useEffect } from 'react';
import Link from 'next/link';
import { Globe, Cloud, Cpu, Sparkles, ArrowUpRight } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { cn } from '@/lib/utils';

// Register GSAP plugin
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Services Section
 * ----------------
 * Productized B2B service offerings with:
 * - Icon-based cards
 * - Glass morphism styling
 * - Scroll-triggered animations
 * - Investment-focused language
 */

const services = [
  {
    id: 'web-development',
    icon: Globe,
    title: 'Web Development',
    description:
      'High-performance web applications built with Next.js, React, and modern tooling. Optimized for speed, SEO, and conversions.',
    features: ['Next.js 14+', 'TypeScript', 'Edge Functions'],
    href: '/services/web-development',
  },
  {
    id: 'saas-platforms',
    icon: Cloud,
    title: 'SaaS Platforms',
    description:
      'Full-stack SaaS solutions with multi-tenancy, billing integration, and scalable infrastructure from day one.',
    features: ['Multi-tenant', 'Stripe/Paddle', 'Analytics'],
    href: '/services/saas-platforms',
  },
  {
    id: 'cloud-architecture',
    icon: Cpu,
    title: 'Cloud Architecture',
    description:
      'Enterprise-grade infrastructure on Vercel, AWS, or Google Cloud. Built for 99.9% uptime and infinite scale.',
    features: ['Vercel/AWS', 'CI/CD', '99.9% SLA'],
    href: '/services/cloud-architecture',
  },
  {
    id: 'ai-integration',
    icon: Sparkles,
    title: 'AI Integration',
    description:
      'Embed AI capabilities into your product — chatbots, content generation, recommendation engines, and more.',
    features: ['OpenAI/Claude', 'RAG Systems', 'Fine-tuning'],
    href: '/services/ai-integration',
  },
];

export function Services() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Header animation
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          scrollTrigger: {
            trigger: headerRef.current,
            start: 'top 85%',
          },
        }
      );

      // Cards stagger animation
      gsap.fromTo(
        cardsRef.current?.children || [],
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.15,
          scrollTrigger: {
            trigger: cardsRef.current,
            start: 'top 80%',
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative py-24 md:py-32"
      id="services"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section Header */}
        <div ref={headerRef} className="mx-auto max-w-2xl text-center">
          <span className="font-mono text-xs uppercase tracking-wider text-cyan-400">
            {"// Services"}
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white md:text-4xl">
            Productized Solutions for
            <br />
            <span className="text-gradient-holographic">Modern Businesses</span>
          </h2>
          <p className="mt-4 text-white/50">
            We partner with ambitious startups and enterprises to build web
            systems that drive growth. Clear scope. Fixed investment.
          </p>
        </div>

        {/* Services Grid */}
        <div
          ref={cardsRef}
          className="mt-16 grid gap-6 md:grid-cols-2"
        >
          {services.map((service) => (
            <Link
              key={service.id}
              href={service.href}
              className={cn(
                'group relative overflow-hidden rounded-md border border-white/[0.08] bg-white/[0.02] p-8 transition-all duration-300',
                'hover:border-white/[0.15] hover:bg-white/[0.04]',
                'hover:shadow-[0_0_40px_rgba(6,182,212,0.08)]'
              )}
            >
              {/* Icon */}
              <div className="mb-6 inline-flex rounded-md border border-white/10 bg-white/5 p-3">
                <service.icon className="h-6 w-6 text-cyan-400" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold text-white">{service.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/50">
                {service.description}
              </p>

              {/* Feature Tags */}
              <div className="mt-6 flex flex-wrap gap-2">
                {service.features.map((feature) => (
                  <span
                    key={feature}
                    className="rounded-sm border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-white/60"
                  >
                    {feature}
                  </span>
                ))}
              </div>

              {/* Arrow indicator */}
              <div className="absolute right-6 top-8 text-white/20 transition-all duration-300 group-hover:text-cyan-400 group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
                <ArrowUpRight className="h-5 w-5" />
              </div>

              {/* Hover gradient accent */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Services;
