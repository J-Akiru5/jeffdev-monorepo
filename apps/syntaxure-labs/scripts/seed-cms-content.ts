/**
 * Seed CMS Content
 * -----------------
 * One-time script to populate page_sections with current hardcoded content.
 * Phase 1D: Each page's content keys become individual section rows.
 * Run: npx tsx scripts/seed-cms-content.ts
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

const pages = [
  {
    slug: "homepage",
    content: {
      hero: {
        tagline: "// Zero to One",
        heading1: "We Build Systems",
        heading2: "That Scale",
        description:
          "Syntaxure Labs is a new-breed development agency architecting high-performance systems for ambitious startups. We don't just write code — we partner with founders to turn ideas into scalable reality.",
      },
      highlights: [
        "AI-native development pipeline",
        "Fixed pricing, no scope creep",
        "Enterprise-grade security by default",
      ],
      cta: {
        heading: "Ready to Build?",
        description:
          "Let's turn your idea into a scalable system. Fixed pricing, transparent process, and a team that cares about your success.",
        buttonText: "View Templates",
        buttonUrl: "/services",
        text: "View Templates",
        url: "/services",
      },
    },
  },
  {
    slug: "features",
    content: {
      title: "Why Syntaxure Labs",
      subtitle:
        "Our Production Core. Six architectural pillars engineered into our base SaaS templates, giving you a production-ready foundation that we customize to your exact business logic without the custom-build timeline.",
      features: [
        {
          title: "Multi-Tenant Architecture",
          description:
            "Built for Scale. Every template features a fully-baked multi-tenant architecture with robust organization isolation, team workspaces, and scalable database indexing right out of the box.",
          icon: "layers",
        },
        {
          title: "Ready-to-Ship Security",
          description:
            "Turnkey Compliance. Production-grade authentication, role-based access control (RBAC), and encrypted data handling are natively integrated into the core boilerplate.",
          icon: "shield",
        },
        {
          title: "Template-Accelerated Delivery",
          description:
            "Zero to Launch in Weeks. Because we skip the repetitive boilerplate phase and start directly with a production-ready SaaS template, your custom deployment takes weeks, not months.",
          icon: "zap",
        },
        {
          title: "AI-Native Extensibility",
          description:
            "AI-Ready Foundations. Our core architecture is built to cleanly integrate AI native workflows, vector search, and automated pipeline contexts, making it simple to inject intelligence into your custom features.",
          icon: "bot",
        },
        {
          title: "Productized Customization",
          description:
            "Predictable Value Tiers. No ambiguous agency estimates. Choose your base SaaS template and pick exactly the custom modules and integrations you need with transparent, predictable pricing.",
          icon: "sliders",
        },
        {
          title: "Continuous Evolution",
          description:
            "CI/CD Enabled Growth. Our decoupled template infrastructure allows us to seamlessly deploy feature upgrades, maintain dependency security, and scale your application as your user base expands.",
          icon: "refresh-cw",
        },
      ],
    },
  },
  {
    slug: "contact",
    content: {
      title: "Let's Talk",
      subtitle:
        "Have a project in mind? We'd love to hear about it. Send us a message and we'll get back to you within 24 hours.",
      email: "hello@syntaxure.dev",
      phone: "",
      address: "Iloilo City, Philippines",
      hours: "",
      social: {
        facebook: "",
        linkedin: "",
        github: "",
      },
    },
  },
  {
    slug: "quote",
    content: {
      title: "What type of project?",
      subtitle: "Select the option that best describes your project.",
      tiers: [],
      submitButtonText: "Submit_Quote",
      successMessage:
        "Thank you for your interest. We'll review your project details and get back to you within 24 hours with a custom quote.",
    },
  },
  {
    slug: "prism",
    content: {
      hero: {
        title: "Something is forming...",
        tagline: "A new paradigm. 2026.",
        description:
          "Prism Context Engine — deploy a context server that forces AI coding tools to follow your rules.",
      },
      features: [],
      pricing: {
        free: "",
        pro: "",
        enterprise: "",
      },
    },
  },
  {
    slug: "legal",
    content: {
      privacyPolicy: {
        lastUpdated: "December 2025",
        content:
          "## 1. Introduction\n\nSyntaxure Labs (\"we,\" \"our,\" or \"us\") is committed to protecting your privacy.\n\n## 2. Information We Collect\n\nWe may collect personal information that you voluntarily provide to us.\n\n## 3. How We Use Your Information\n\nWe use the information to respond to your inquiries and provide requested services.\n\n## 4. Contact Us\n\nContact us at hello@syntaxure.dev.",
      },
      termsOfService: {
        lastUpdated: "December 2025",
        content:
          "## 1. Acceptance of Terms\n\nBy using our website and services, you accept these Terms of Service.\n\n## 2. Services\n\nSyntaxure Labs provides web development and technology consulting services.\n\n## 3. Contact Us\n\nContact us at hello@syntaxure.dev.",
      },
      cookiePolicy: {
        lastUpdated: "December 2025",
        content:
          "## 1. What Are Cookies\n\nCookies are small text files stored on your device.\n\n## 2. How We Use Cookies\n\nWe use cookies to improve your experience.\n\n## 3. Contact Us\n\nContact us at hello@syntaxure.dev.",
      },
    },
  },
  {
    slug: "about",
    content: {
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
        bio: "Full-stack engineer with 5+ years building production systems.",
        image: "/profilepic.webp",
        email: "jeff@syntaxure.dev",
        location: "Iloilo City, Philippines",
        availability: "Currently accepting new projects",
      },
      missionVision: {
        executiveSummary:
          "Syntaxure Labs is a technology company building AI-powered software ecosystems.",
        mission:
          "To serve as the strategic technical foundation for high-impact business concepts.",
        vision:
          "To serve as the foundational technological backbone of the Southeast Asian startup economy.",
      },
      kwadraTbi: {
        heading: "Kwadra TBI Cohort 5",
        description:
          "Syntaxure Labs is proud to be part of Kwadra TBI Cohort 5.",
        badges: ["Startup Incubation", "Mentorship", "Funding Access", "Go-to-Market Strategy"],
      },
      founders: [
        {
          name: "Jeff Edrick Martinez",
          title: "Lead Architect & Founder",
          bio: "Full-stack engineer with 5+ years building production systems.",
          image: "/profilepic.webp",
          email: "jeff@syntaxure.dev",
          location: "Iloilo City, Philippines",
        },
      ],
      team: [
        {
          name: "Jeff Edrick Martinez",
          title: "Chief Executive Officer",
          role: "CEO",
          bio: "Visionary leader driving the company strategy and growth.",
          image: "/profilepic.webp",
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
          description: "We write code that's readable, maintainable, and built to last.",
        },
        {
          title: "Fixed Investment, No Surprises",
          description: "We scope properly, quote fairly, and deliver on time.",
        },
        {
          title: "Partnership, Not Vendorship",
          description: "We invest in your success.",
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
            "We use modern, battle-tested technologies. No legacy frameworks, no tech debt — just clean, scalable architecture.",
        },
        team: {
          label: "// Team",
          subtitle: "Meet the leadership team behind Syntaxure Labs.",
        },
        values: { heading: "How We Work" },
        brandAssets: { heading: "Brand Assets" },
      },
    },
  },
];

async function seed() {
  console.log("Seeding CMS content into page_sections...\n");

  for (const page of pages) {
    // Phase 1D: Seed into page_sections instead of site_pages JSONB
    // First ensure the site_pages registry row exists
    await supabase.from("site_pages").upsert(
      { slug: page.slug, updated_at: new Date().toISOString() },
      { onConflict: "slug" },
    );

    const entries = Object.entries(page.content);

    for (let i = 0; i < entries.length; i++) {
      const [key, value] = entries[i]!;
      const sectionType = Array.isArray(value)
        ? "list"
        : typeof value === "object"
          ? "content"
          : "text";

      const { error } = await supabase.from("page_sections").upsert(
        {
          page_slug: page.slug,
          section_key: key,
          section_type: sectionType,
          content: value,
          sort_order: i,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "page_slug,section_key" },
      );

      if (error) {
        console.error(`  ✗ ${page.slug}.${key}: ${error.message}`);
      }
    }

    console.log(`  ✓ ${page.slug} (${entries.length} sections)`);
  }

  console.log("\nDone.");
}

seed();
