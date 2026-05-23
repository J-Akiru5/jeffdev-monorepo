import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowUpRight, MapPin, Mail, Calendar, Download } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CTA } from "@/components/sections/cta";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "About",
  description:
    "Syntaxure Labs is a web development agency building high-performance systems for startups and enterprises. Learn about our approach and the team behind the code.",
};

export const revalidate = 60;

interface AboutData {
  hero: {
    tagline: string;
    heading1: string;
    heading2: string;
    description: string;
    subDescription: string;
  };
  stats: { label: string; value: string }[];
  founder: {
    name: string;
    title: string;
    bio: string;
    image: string;
    email: string;
    location: string;
    availability: string;
  };
  techStack: Record<string, string[]>;
  values: { title: string; description: string }[];
  brandAssets: {
    title: string;
    description: string;
    image: string;
    downloadUrl: string;
  };
}

async function getAboutData(): Promise<AboutData> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("site_pages")
      .select("content")
      .eq("slug", "about")
      .single();

    if (!error && data?.content) {
      const content = data.content as Record<string, unknown>;
      return content as unknown as AboutData;
    }
  } catch {
    // Fall through to defaults
  }

  return DEFAULT_ABOUT_DATA;
}

export default async function AboutPage() {
  const content = await getAboutData();

  const {
    hero,
    stats,
    founder,
    techStack,
    values,
    brandAssets,
  } = content;

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
                  {hero.tagline}
                </span>
                <h1 className="mt-4 text-4xl font-bold tracking-tight text-white md:text-5xl">
                  {hero.heading1}
                  <br />
                  <span className="text-gradient-holographic">
                    {hero.heading2}
                  </span>
                </h1>
                <p className="mt-6 text-lg leading-relaxed text-white/60">
                  {hero.description}
                </p>
                <p className="mt-4 text-white/50">{hero.subDescription}</p>

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

                {/* Avatar */}
                <div className="mt-6 flex items-center gap-4">
                  <Image
                    src={founder.image}
                    alt={founder.name}
                    width={64}
                    height={64}
                    priority
                    className="h-16 w-16 rounded-md object-cover"
                  />
                  <div>
                    <h3 className="text-xl font-semibold text-white">
                      {founder.name}
                    </h3>
                    <p className="text-sm text-cyan-400">{founder.title}</p>
                  </div>
                </div>

                <p className="mt-6 text-white/60">{founder.bio}</p>

                {/* Info */}
                <div className="mt-6 space-y-3 border-t border-white/[0.06] pt-6">
                  <div className="flex items-center gap-3 text-sm text-white/50">
                    <MapPin className="h-4 w-4" />
                    {founder.location}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-white/50">
                    <Calendar className="h-4 w-4" />
                    {founder.availability}
                  </div>
                  <a
                    href={`mailto:${founder.email}`}
                    className="flex items-center gap-3 text-sm text-white/50 transition-colors hover:text-cyan-400"
                  >
                    <Mail className="h-4 w-4" />
                    {founder.email}
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
                      <li key={tech} className="text-sm text-white/70">
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
              {values.map((val) => (
                <div
                  key={val.title}
                  className="rounded-md border border-white/[0.06] bg-white/[0.02] p-6"
                >
                  <h3 className="font-semibold text-white">{val.title}</h3>
                  <p className="mt-2 text-sm text-white/50">
                    {val.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Brand Assets Section */}
        <section className="px-6 py-16 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-2xl font-bold text-white mb-8">
              Brand Assets
            </h2>
            <div className="rounded-md border border-white/[0.06] bg-white/[0.02] p-8 md:p-12">
              <div className="flex flex-col">
                <div className="flex-1 flex items-center justify-center rounded-lg overflow-hidden border border-white/10 bg-[#050505]">
                  <Image
                    src={brandAssets.image}
                    alt={brandAssets.title}
                    width={1200}
                    height={630}
                    className="w-full h-auto object-cover"
                  />
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white">
                      {brandAssets.title}
                    </h3>
                    <p className="text-sm text-white/50">
                      {brandAssets.description}
                    </p>
                  </div>
                  <a
                    href={brandAssets.downloadUrl}
                    download
                    className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-white/5 text-white transition-colors hover:bg-cyan-500 hover:text-white"
                    title={`Download ${brandAssets.title}`}
                  >
                    <Download className="h-5 w-5" />
                  </a>
                </div>
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

const DEFAULT_ABOUT_DATA: AboutData = {
  hero: {
    tagline: "// About.studio",
    heading1: "We Build Systems",
    heading2: "That Launch",
    description:
      "Syntaxure Labs is a new-breed development agency architecting high-performance systems for ambitious startups. We don't just write code — we partner with founders to turn 'Zero to One' ideas into scalable reality.",
    subDescription:
      "Est. 2025. Built on 5+ years of the founder's hands-on experience shipping production systems across SaaS, AI, and enterprise platforms.",
  },
  stats: [
    { label: "Niche Focus", value: "Specialized" },
    { label: "Founder Exp", value: "5+" },
    { label: "Dedication", value: "100%" },
    { label: "Uptime SLA", value: "99.9%" },
  ],
  founder: {
    name: "Jeff Edrick Martinez",
    title: "Lead Architect & Founder",
    bio: "Full-stack engineer with 5+ years building production systems. Specializing in Next.js, cloud architecture, and AI integration. Previously worked on projects for education, e-commerce, and SaaS clients.",
    image: "/profilepic.webp",
    email: "jeff@jeffdev.studio",
    location: "Iloilo City, Philippines",
    availability: "Available for Q1 2026 projects",
  },
  techStack: {
    frontend: ["Next.js", "React", "TypeScript", "Tailwind CSS", "GSAP"],
    backend: ["Node.js", "Laravel", "PostgreSQL", "Firebase"],
    cloud: ["Vercel", "AWS", "Cloudflare", "Docker"],
    ai: ["OpenAI", "Claude", "Langchain", "Pinecone"],
  },
  values: [
    {
      title: "Clarity Over Complexity",
      description:
        "We write code that's readable, maintainable, and built to last. No clever hacks — just clean architecture.",
    },
    {
      title: "Fixed Investment, No Surprises",
      description:
        "We scope properly, quote fairly, and deliver on time. You know exactly what you're getting before we start.",
    },
    {
      title: "Partnership, Not Vendorship",
      description:
        "We invest in your success. Our best clients become long-term partners who come back project after project.",
    },
  ],
  brandAssets: {
    title: "Digital Business Card",
    description: "High-resolution PNG",
    image: "/syntaxure-business-card.png",
    downloadUrl: "/syntaxure-business-card.png",
  },
};
