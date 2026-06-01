/**
 * Seed CMS Content
 * -----------------
 * One-time script to populate site_pages with current hardcoded content.
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
        text: "Start a Project",
        url: "/quote",
      },
    },
  },
  {
    slug: "features",
    content: {
      title: "Why Syntaxure Labs",
      subtitle:
        "We don't just write code — we build systems with a philosophy. Here's what makes Syntaxure Labs unlike any agency you've worked with.",
      features: [
        {
          title: "AI-Native Development",
          description:
            "Our development pipeline integrates AI agents directly into the IDE, giving them full workspace context to map dependencies, trace issues, and execute tasks end-to-end without human micromanagement.",
          icon: "bot",
        },
        {
          title: "Fixed Investment Pricing",
          description:
            "Every project follows a structured Statement of Work with defined milestones, deliverables, and fixed pricing. No hourly billing, no scope creep invoices, no financial anxiety.",
          icon: "piggy-bank",
        },
        {
          title: "Enterprise-Grade Security",
          description:
            "Defense-in-depth with Firebase Authentication, custom session management, role-based access controls, encrypted Firestore collections, and comprehensive audit logging.",
          icon: "shield",
        },
        {
          title: "Socratic Planning",
          description:
            "Our Clarification-First Doctrine means every project starts with a structured Q&A loop. We challenge assumptions, map edge cases, surface hidden requirements, and validate the full scope before any engineering begins.",
          icon: "message-square",
        },
        {
          title: "Rapid MVP Delivery",
          description:
            "Using proprietary build sequences and pre-built architecture templates, we compress typical 3-month development timelines into 2-3 weeks for functional, polished MVP launches.",
          icon: "zap",
        },
        {
          title: "Post-Launch Partnership",
          description:
            "Every project includes a transition period with documentation handoff and knowledge transfer. Optional retainer packages cover bug fixes, performance optimization, feature iterations, and architecture evolution.",
          icon: "heart-handshake",
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
];

async function seed() {
  console.log("Seeding CMS content into site_pages...\n");

  for (const page of pages) {
    const { error } = await supabase.from("site_pages").upsert(
      {
        slug: page.slug,
        content: page.content,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "slug" },
    );

    if (error) {
      console.error(`  ✗ ${page.slug}: ${error.message}`);
    } else {
      console.log(`  ✓ ${page.slug}`);
    }
  }

  console.log("\nDone.");
}

seed();
