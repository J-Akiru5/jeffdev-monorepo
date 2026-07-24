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
  title: "About Our Agency",
  description:
    "Syntaxure Labs is a global B2B digital transformation agency based in Iloilo City, Philippines. Creators of Context Engine for AI governance. Learn about our mission, team, and approach.",
};

export const revalidate = 60;

interface TeamMember {
  name: string;
  title: string;
  role: string;
  bio: string;
  image: string;
}

interface FounderEntry {
  name: string;
  title: string;
  bio: string;
  image: string;
  email: string;
  location: string;
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
  missionVision: {
    executiveSummary: string;
    mission: string;
    vision: string;
  };
  kwadraTbi: {
    heading: string;
    description: string;
    badges: string[];
  };
  founders: FounderEntry[];
  team: TeamMember[];
  techStack: Record<string, string[]>;
  values: { title: string; description: string }[];
  brandAssets: {
    title: string;
    description: string;
    image: string;
    downloadUrl: string;
  };
  sectionHeaders: {
    founder: { cardLabel: string };
    kwadraTbi: { label: string };
    missionVision: { label: string; missionLabel: string; visionLabel: string };
    founders: { label: string; subtitle: string };
    techStack: { label: string; subtitle: string };
    team: { label: string; subtitle: string };
    values: { heading: string };
    brandAssets: { heading: string };
  };
}

async function getAboutData(): Promise<AboutData> {
  try {
    const supabase = await createClient();
    // Phase 1D: Read structured sections instead of monolithic JSONB.
    const { data: rows, error } = await supabase
      .from("page_sections")
      .select("section_key, content")
      .eq("page_slug", "about")
      .order("sort_order", { ascending: true });

    if (!error && rows && rows.length > 0) {
      const content: Record<string, unknown> = {};
      for (const row of rows) {
        content[row.section_key] = row.content;
      }
      return {
        ...DEFAULT_ABOUT_DATA,
        ...content,
        missionVision:
          (content.missionVision as AboutData["missionVision"]) ??
          DEFAULT_ABOUT_DATA.missionVision,
        kwadraTbi:
          (content.kwadraTbi as AboutData["kwadraTbi"]) ??
          DEFAULT_ABOUT_DATA.kwadraTbi,
        founders:
          (content.founders as AboutData["founders"]) ??
          DEFAULT_ABOUT_DATA.founders,
        team:
          (content.team as AboutData["team"]) ?? DEFAULT_ABOUT_DATA.team,
        sectionHeaders:
          (content.sectionHeaders as AboutData["sectionHeaders"]) ??
          DEFAULT_ABOUT_DATA.sectionHeaders,
      };
    }
  } catch {
    // Fall through to defaults
  }

  return DEFAULT_ABOUT_DATA;
}

export default async function AboutPage() {
  const content = await getAboutData();
  const activeAvailability = await getActiveAvailability();

  const { hero, stats, founder, missionVision, kwadraTbi, founders, techStack, values, brandAssets, sectionHeaders } = content;
  const team = content.team || DEFAULT_ABOUT_DATA.team;
  const realTeam = team.filter(
    (m) => !m.name.includes("To Be Announced") && !m.image.includes("placeholder"),
  );

  const founderAvailability =
    activeAvailability?.aboutText ?? founder.availability;

  return (
    <>
      <Header />
      <main className="pt-24 pb-16">
        {/* Desktop Absolute Back Button (Sits on the left side, professional style) */}
        <div className="hidden xl:flex absolute left-[max(2rem,calc(50%-54rem))] top-28 z-50">
          <Link
            href="/"
            className="group flex items-center gap-2 rounded-md border border-[var(--border-subtle)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-all hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Back to Home
          </Link>
        </div>

        {/* Hero Section */}
        <section className="px-6 pb-8 lg:px-8">
          <div className="mx-auto max-w-7xl relative">
            {/* Mobile/Tablet: Back button */}
            <div className="mb-8 xl:hidden">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-md border border-[var(--border-subtle)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-all hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
              >
                <ArrowLeft className="h-4 w-4 transition-transform hover:-translate-x-0.5" />
                Back to Home
              </Link>
            </div>

            <div className="mt-4 mx-auto max-w-4xl text-center">
              <div>
                <span className="font-mono text-xs uppercase tracking-wider text-cyan-400">
                  {hero.tagline}
                </span>
                <h1 className="mt-4 text-4xl font-bold tracking-tight text-white md:text-6xl">
                  {hero.heading1}{" "}
                  <span className="text-gradient-holographic">
                    {hero.heading2}
                  </span>
                </h1>
                <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/60">
                  {hero.description}
                </p>
                <p className="mx-auto mt-4 max-w-2xl text-white/50">{hero.subDescription}</p>

                {/* Stats */}
                <div className="mt-8 grid grid-cols-2 gap-8 sm:grid-cols-4 border-y border-white/[0.06] py-6">
                  {stats.map((stat) => (
                    <div key={stat.label} className="flex flex-col items-center justify-center">
                      <div className="text-3xl font-bold text-white">
                        {stat.value}
                      </div>
                      <div className="mt-2 font-mono text-[10px] uppercase tracking-wider text-white/40">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mission & Vision Section */}
        <section className="px-6 py-16 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <h2 className="font-mono text-xs uppercase tracking-wider text-white/40">
              {sectionHeaders.missionVision.label}
            </h2>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-white/60">
              {missionVision.executiveSummary}
            </p>
            <div className="mt-10 grid gap-8 md:grid-cols-2">
              <div className="rounded-md border border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-transparent p-8">
                <h3 className="font-mono text-xs uppercase tracking-wider text-cyan-400">
                  {sectionHeaders.missionVision.missionLabel}
                </h3>
                <p className="mt-4 text-white/70">{missionVision.mission}</p>
              </div>
              <div className="rounded-md border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent p-8">
                <h3 className="font-mono text-xs uppercase tracking-wider text-purple-400">
                  {sectionHeaders.missionVision.visionLabel}
                </h3>
                <p className="mt-4 text-white/70">{missionVision.vision}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Founders Section */}
        <section className="px-6 py-16 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <h2 className="font-mono text-xs uppercase tracking-wider text-white/40">
              {sectionHeaders.founders.label}
            </h2>
            <p className="mt-4 max-w-xl text-white/60">
              {sectionHeaders.founders.subtitle}
            </p>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 max-w-5xl mx-auto">
              {founders.map((f) => (
                <div
                  key={f.name}
                  className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-6 md:p-8"
                >
                  <div className="flex flex-col items-center text-center xl:flex-row xl:text-left gap-5">
                    <Image
                      src={f.image}
                      alt={f.name}
                      width={128}
                      height={128}
                      className="h-20 w-20 md:h-24 md:w-24 rounded-full object-cover shadow-sm border border-black/5 dark:border-white/10 shrink-0"
                    />
                    <div>
                      <h3 className="text-lg md:text-xl font-semibold text-[var(--text-primary)]">{f.name}</h3>
                      <p className="text-sm font-medium text-cyan-600 dark:text-cyan-400 mt-1">{f.title}</p>
                    </div>
                  </div>
                  <p className="mt-6 text-sm leading-relaxed text-[var(--text-secondary)]">{f.bio}</p>
                  <div className="mt-6 flex flex-col gap-3 border-t border-[var(--border-subtle)] pt-6">
                    <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                      <MapPin className="h-4 w-4 opacity-70" /> {f.location}
                    </div>
                    <a
                      href={`mailto:${f.email}`}
                      className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-cyan-500 transition-colors"
                    >
                      <Mail className="h-4 w-4 opacity-70" /> {f.email}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* Values Section */}
        <section className="px-6 py-16 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <h2 className="text-2xl font-bold text-white">{sectionHeaders.values.heading}</h2>
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

        {/* Tech Stack Section */}
        <section className="px-6 py-16 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <h2 className="font-mono text-xs uppercase tracking-wider text-white/40">
              {sectionHeaders.techStack.label}
            </h2>
            <p className="mt-4 max-w-xl text-white/60">
              {sectionHeaders.techStack.subtitle}
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

        {/* Brand Assets Section */}
        <section className="px-6 py-16 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-2xl font-bold text-white mb-8">{sectionHeaders.brandAssets.heading}</h2>
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
    tagline: "// About.labs",
    heading1: "We Build Systems",
    heading2: "That Launch",
    description:
      "Syntaxure Labs is a specialized engineering studio building high-performance systems for ambitious startups and scaling enterprises. We partner with visionary teams to turn complex ideas into scalable reality.",
    subDescription:
      "Est. 2025. Built on our founders' deep technical experience shipping production systems across SaaS, AI, and enterprise platforms.",
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
  missionVision: {
    executiveSummary:
      "Syntaxure Labs is a technology company building AI-powered software ecosystems, enterprise solutions, and context intelligence platforms through its flagship product, Prism Context Engine.",
    mission:
      "To serve as the strategic technical foundation for high-impact business concepts, transforming venture-ready ideas into sustainable, scalable software ecosystems through AI-driven architecture.",
    vision:
      "To serve as the foundational technological backbone of the Southeast Asian startup economy, helping enterprises scale through AI infrastructure and becoming a leading provider of enterprise-grade software solutions by 2030.",
  },
  kwadraTbi: {
    heading: "Kwadra TBI Cohort 5",
    description:
      "Syntaxure Labs is proud to be part of Kwadra TBI Cohort 5, a startup incubation program by the Iloilo Provincial Government's Kwadra Care initiative. This program supports innovation-driven startups with mentorship, funding access, and go-to-market strategy.",
    badges: [
      "Startup Incubation",
      "Mentorship",
      "Funding Access",
      "Go-to-Market Strategy",
    ],
  },
  founders: [
    {
      name: "Jeff Edrick Martinez",
      title: "CEO & Founder",
      bio: "Technical founder with 5+ years architecting production systems. Specializes in Next.js, cloud infrastructure, and AI integration for high-growth SaaS, e-commerce, and enterprise clients.",
      image: "/profilepic.webp",
      email: "jeff@syntaxure.dev",
      location: "Iloilo City, Philippines",
    },
    {
      name: "Lou Vincent Baroro",
      title: "CTO & Co-Founder",
      bio: "Engineering leader specializing in scalable system architecture and artificial intelligence. Expert in designing high-performance cloud infrastructure, intelligent AI engines, and enterprise-grade platforms.",
      image: "/cto.jpg",
      email: "lou@syntaxure.dev",
      location: "Iloilo City, Philippines",
    }
  ],
  team: [
    {
      name: "Jeff Edrick Martinez",
      title: "Chief Executive Officer",
      role: "CEO",
      bio: "Visionary leader driving the company strategy, systems architecture, and growth.",
      image: "/profilepic.webp",
    },
    {
      name: "Lou Vincent Baroro",
      title: "Chief Technology Officer",
      role: "CTO",
      bio: "Leading technical vision, AI infrastructure, and engineering excellence.",
      image: "/cto.jpg",
    }
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
        "We write code that is readable, maintainable, and built to last. No clever hacks, just clean architecture.",
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
  sectionHeaders: {
    founder: { cardLabel: "// Founder.log" },
    kwadraTbi: { label: "// Startup Incubator" },
    missionVision: {
      label: "// Mission & Vision",
      missionLabel: "Mission",
      visionLabel: "Vision",
    },
    founders: {
      label: "// Founders",
      subtitle: "The people behind Syntaxure Labs.",
    },
    techStack: {
      label: "// Tech_Stack",
      subtitle:
        "We use modern, battle-tested technologies. No legacy frameworks, no tech debt. Just clean, scalable architecture.",
    },
    team: {
      label: "// Team",
      subtitle: "Meet the leadership team behind Syntaxure Labs.",
    },
    values: { heading: "How We Work" },
    brandAssets: { heading: "Brand Assets" },
  },
};
