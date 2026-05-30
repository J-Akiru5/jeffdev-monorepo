import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowUpRight,
  MapPin,
  Mail,
  Calendar,
  Download,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CTASection } from "@/components/sections/cta-section";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getActiveAvailability } from "@/lib/availability";

export const metadata: Metadata = {
  title: "About",
  description:
    "Syntaxure Labs is a web development agency building high-performance systems for startups and enterprises. Learn about our approach and the team behind the code.",
};

export const revalidate = 60;

interface TeamMember {
  name: string;
  title: string;
  role: string;
  bio: string;
  image: string;
}

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
  team: TeamMember[];
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
  const activeAvailability = await getActiveAvailability();

  const { hero, stats, founder, techStack, values, brandAssets } = content;
  const team = content.team || DEFAULT_ABOUT_DATA.team;

  const founderAvailability =
    activeAvailability?.aboutText ?? founder.availability;

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
                    {founderAvailability}
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

        {/* Team Section */}
        <section className="px-6 py-16 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <h2 className="font-mono text-xs uppercase tracking-wider text-white/40">
              {"// Team"}
            </h2>
            <p className="mt-4 max-w-xl text-white/60">
              Meet the leadership team behind Syntaxure Labs.
            </p>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {team.map((member) => (
                <div
                  key={member.role}
                  className="rounded-md border border-white/[0.06] bg-white/[0.02] p-6 text-center"
                >
                  <div className="mx-auto h-20 w-20 rounded-full border border-white/10 bg-white/5 flex items-center justify-center overflow-hidden">
                    {member.image.includes("placeholder") ? (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-cyan-500/20 to-purple-500/20">
                        <span className="text-lg font-bold text-white/40">
                          {member.role.slice(0, 2)}
                        </span>
                      </div>
                    ) : (
                      <Image
                        src={member.image}
                        alt={member.name}
                        width={80}
                        height={80}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <h3 className="mt-4 font-semibold text-white">{member.name}</h3>
                  <p className="text-sm text-cyan-400">{member.title}</p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-white/30">
                    {member.role}
                  </p>
                  <p className="mt-3 text-xs text-white/50">{member.bio}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Kwadra TBI Cohort 5 Section */}
        <section className="px-6 py-16 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="rounded-md border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent p-8 md:p-12">
              <div className="flex flex-col items-center text-center md:flex-row md:text-left md:items-start md:gap-8">
                <div className="shrink-0">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10">
                    <span className="text-2xl font-bold text-amber-400">TBI</span>
                  </div>
                </div>
                <div className="mt-4 md:mt-0">
                  <span className="font-mono text-xs uppercase tracking-wider text-amber-400">
                    {"// Startup Incubator"}
                  </span>
                  <h2 className="mt-2 text-2xl font-bold text-white">
                    Kwadra TBI Cohort 5
                  </h2>
                  <p className="mt-3 max-w-2xl text-white/60">
                    Syntaxure Labs is proud to be part of Kwadra TBI Cohort 5 — a
                    startup incubation program by the{" "}
                    <span className="text-white/80">
                      Iloilo Provincial Government&apos;s Kwadra Care
                    </span>{" "}
                    initiative. This program supports innovation-driven startups
                    with mentorship, funding access, and go-to-market strategy.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    {[
                      "Startup Incubation",
                      "Mentorship",
                      "Funding Access",
                      "GotoMarket Strategy",
                    ].map((item) => (
                      <span
                        key={item}
                        className="rounded-sm border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-amber-400"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
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
            <h2 className="text-2xl font-bold text-white mb-8">Brand Assets</h2>
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

        <CTASection />
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
      "Est. 2025. Built on 5+ years of the founder's hands-on experience shipping production systems across SaaS, AI, and enterprise platforms. Proud member of Kwadra TBI Cohort 5.",
  },
  stats: [
    { label: "Niche Focus", value: "Specialized" },
    { label: "Founder Exp", value: "5+" },
    { label: "Dedication", value: "100%" },
    { label: "Infrastructure", value: "High-Avail" },
  ],
  founder: {
    name: "Jeff Edrick Martinez",
    title: "Lead Architect & Founder",
    bio: "Full-stack engineer with 5+ years building production systems. Specializing in Next.js, cloud architecture, and AI integration. Previously worked on projects for education, e-commerce, and SaaS clients.",
    image: "/profilepic.webp",
    email: "jeff@syntaxure.dev",
    location: "Iloilo City, Philippines",
    availability: "Currently accepting new projects",
  },
  team: [
    {
      name: "Jeff Edrick Martinez",
      title: "Chief Executive Officer",
      role: "CEO",
      bio: "Visionary leader driving the company strategy and growth.",
      image: "/profilepic.webp",
    },
    {
      name: "To Be Announced",
      title: "Chief Technology Officer",
      role: "CTO",
      bio: "Leading technical vision and engineering excellence.",
      image: "/placeholder-avatar.svg",
    },
    {
      name: "To Be Announced",
      title: "Chief Marketing Officer",
      role: "CMO",
      bio: "Driving brand strategy, growth, and market positioning.",
      image: "/placeholder-avatar.svg",
    },
    {
      name: "To Be Announced",
      title: "Chief Operating Officer",
      role: "COO",
      bio: "Overseeing operations, partnerships, and delivery excellence.",
      image: "/placeholder-avatar.svg",
    },
    {
      name: "To Be Announced",
      title: "Chief Product Officer",
      role: "CPO",
      bio: "Shaping product vision and user experience strategy.",
      image: "/placeholder-avatar.svg",
    },
  ],
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
