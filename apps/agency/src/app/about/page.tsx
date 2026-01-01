import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, MapPin, Mail, Calendar } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { CTA } from '@/components/sections/cta';
import type { Metadata } from 'next';

/**
 * About Page
 * ----------
 * Studio overview and founder profile.
 * B2B positioning with trust signals.
 */

export const metadata: Metadata = {
  title: 'About',
  description:
    'JeffDev Studio is a web development agency building high-performance systems for startups and enterprises. Learn about our approach and the team behind the code.',
};

const stats = [
  { label: 'Niche Focus', value: 'Specialized' },
  { label: 'Founder Exp', value: '5+' },
  { label: 'Dedication', value: '100%' },
  { label: 'Uptime SLA', value: '99.9%' },
];

const techStack = {
  frontend: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'GSAP'],
  backend: ['Node.js', 'Laravel', 'PostgreSQL', 'Firebase'],
  cloud: ['Vercel', 'AWS', 'Cloudflare', 'Docker'],
  ai: ['OpenAI', 'Claude', 'Langchain', 'Pinecone'],
};

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="pt-24">
        {/* Hero Section */}
        <section className="px-6 py-16 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>

            <div className="mt-8 grid gap-12 lg:grid-cols-2">
              {/* Left: Content */}
              <div>
                <span className="font-mono text-xs uppercase tracking-wider text-cyan-400">
                  {"// About.studio"}
                </span>
                <h1 className="mt-4 text-4xl font-bold tracking-tight text-white md:text-5xl">
                  We Build Systems
                  <br />
                  <span className="text-gradient-holographic">That Launch</span>
                </h1>
                <p className="mt-6 text-lg leading-relaxed text-white/60">
                  JeffDev Studio is a new-breed development agency architecting
                  high-performance systems for ambitious startups. We don&apos;t
                  just write code — we partner with founders to turn &apos;Zero
                  to One&apos; ideas into scalable reality.
                </p>
                <p className="mt-4 text-white/50">
                  Est. 2025. Built on 5+ years of the founder&apos;s hands-on
                  experience shipping production systems across SaaS, AI, and
                  enterprise platforms.
                </p>

                {/* Stats */}
                <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4">
                  {stats.map((stat) => (
                    <div key={stat.label}>
                      <div className="text-2xl font-bold text-white">
                        {stat.value}
                      </div>
                      <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-white/40">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Founder Card */}
              <div className="rounded-md border border-white/[0.08] bg-white/[0.02] p-8">
                <div className="font-mono text-xs uppercase tracking-wider text-white/40">
                  {"// Founder.log"}
                </div>

                {/* Avatar placeholder */}
                <div className="mt-6 flex items-center gap-4">
                  <div className="h-16 w-16 rounded-md bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
                    <span className="font-mono text-xl font-bold text-white">
                      JM
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">
                      Jeff Edrick Martinez
                    </h3>
                    <p className="text-sm text-cyan-400">
                      Lead Architect & Founder
                    </p>
                  </div>
                </div>

                <p className="mt-6 text-white/60">
                  Full-stack engineer with 5+ years building production systems.
                  Specializing in Next.js, cloud architecture, and AI
                  integration. Previously worked on projects for education,
                  e-commerce, and SaaS clients.
                </p>

                {/* Info */}
                <div className="mt-6 space-y-3 border-t border-white/[0.06] pt-6">
                  <div className="flex items-center gap-3 text-sm text-white/50">
                    <MapPin className="h-4 w-4" />
                    Iloilo City, Philippines
                  </div>
                  <div className="flex items-center gap-3 text-sm text-white/50">
                    <Calendar className="h-4 w-4" />
                    Available for Q1 2026 projects
                  </div>
                  <a
                    href="mailto:jeff@jeffdev.studio"
                    className="flex items-center gap-3 text-sm text-white/50 transition-colors hover:text-cyan-400"
                  >
                    <Mail className="h-4 w-4" />
                    jeff@jeffdev.studio
                  </a>
                </div>

                <Link
                  href="/contact"
                  className="mt-6 inline-flex items-center gap-2 text-sm text-cyan-400 transition-colors hover:text-cyan-300"
                >
                  Get in touch
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Tech Stack Section */}
        <section className="px-6 py-16 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <h2 className="font-mono text-xs uppercase tracking-wider text-white/40">
              {"// Tech_Stack"}
            </h2>
            <p className="mt-4 max-w-xl text-white/60">
              We use modern, battle-tested technologies. No legacy frameworks,
              no tech debt — just clean, scalable architecture.
            </p>

            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {Object.entries(techStack).map(([category, techs]) => (
                <div
                  key={category}
                  className="rounded-md border border-white/[0.06] bg-white/[0.02] p-6"
                >
                  <h3 className="font-mono text-xs uppercase tracking-wider text-cyan-400/70">
                    {category}
                  </h3>
                  <ul className="mt-4 space-y-2">
                    {techs.map((tech) => (
                      <li
                        key={tech}
                        className="text-sm text-white/70"
                      >
                        {tech}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="px-6 py-16 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <h2 className="text-2xl font-bold text-white">How We Work</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              <div className="rounded-md border border-white/[0.06] bg-white/[0.02] p-6">
                <h3 className="font-semibold text-white">
                  Clarity Over Complexity
                </h3>
                <p className="mt-2 text-sm text-white/50">
                  We write code that&apos;s readable, maintainable, and built to
                  last. No clever hacks — just clean architecture.
                </p>
              </div>
              <div className="rounded-md border border-white/[0.06] bg-white/[0.02] p-6">
                <h3 className="font-semibold text-white">
                  Fixed Investment, No Surprises
                </h3>
                <p className="mt-2 text-sm text-white/50">
                  We scope properly, quote fairly, and deliver on time. You know
                  exactly what you&apos;re getting before we start.
                </p>
              </div>
              <div className="rounded-md border border-white/[0.06] bg-white/[0.02] p-6">
                <h3 className="font-semibold text-white">
                  Partnership, Not Vendorship
                </h3>
                <p className="mt-2 text-sm text-white/50">
                  We invest in your success. Our best clients become long-term
                  partners who come back project after project.
                </p>
              </div>
            </div>
          </div>
        </section>

        <CTA />
      </main>
      <Footer />
    </>
  );
}
