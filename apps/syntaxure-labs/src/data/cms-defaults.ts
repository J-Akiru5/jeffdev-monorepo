/**
 * CMS Fallback Defaults
 * ----------------------
 * Hardcoded content extracted from each page.
 * Used as fallback when CMS row doesn't exist or fields are missing.
 */

export const HOMEPAGE_DEFAULTS = {
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
  socialProof: {
    tagline: "// Trusted by innovators",
  },
  prismHighlight: {
    tagline: "// Prism Context Engine",
    heading: "AI That Follows Your Rules",
    description:
      "Deploy a context server that forces AI coding tools to follow your design system, your patterns, your rules.",
  },
  agenticProtocol: {
    tagline: "// Agentic Protocol",
    heading: "How We Build",
    description:
      "A structured development methodology that ensures every project is planned, validated, and executed with precision.",
  },
  cta: {
    heading: "Ready to Build?",
    description:
      "Let's turn your idea into a scalable system. Fixed pricing, transparent process, and a team that cares about your success.",
    buttonText: "Start a Project",
    buttonUrl: "/quote",
  },
};

export const FEATURES_DEFAULTS = {
  title: "Why Syntaxure Labs",
  subtitle:
    "We don't just write code — we build systems with a philosophy. Here's what makes Syntaxure Labs unlike any agency you've worked with.",
  features: [
    {
      id: "ai-native",
      title: "AI-Native Development",
      description:
        "Our development pipeline integrates AI agents directly into the IDE, giving them full workspace context to map dependencies, trace issues, and execute tasks end-to-end without human micromanagement.",
    },
    {
      id: "fixed-pricing",
      title: "Fixed Investment Pricing",
      description:
        "Every project follows a structured Statement of Work with defined milestones, deliverables, and fixed pricing. No hourly billing, no scope creep invoices, no financial anxiety.",
    },
    {
      id: "enterprise-security",
      title: "Enterprise-Grade Security",
      description:
        "Defense-in-depth with Firebase Authentication, custom session management, role-based access controls, encrypted Firestore collections, and comprehensive audit logging.",
    },
    {
      id: "socratic-planning",
      title: "Socratic Planning",
      description:
        "Our Clarification-First Doctrine means every project starts with a structured Q&A loop. We challenge assumptions, map edge cases, surface hidden requirements, and validate the full scope before any engineering begins.",
    },
    {
      id: "rapid-mvp",
      title: "Rapid MVP Delivery",
      description:
        "Using proprietary build sequences and pre-built architecture templates, we compress typical 3-month development timelines into 2-3 weeks for functional, polished MVP launches.",
    },
    {
      id: "post-launch",
      title: "Post-Launch Partnership",
      description:
        "Every project includes a transition period with documentation handoff and knowledge transfer. Optional retainer packages cover bug fixes, performance optimization, feature iterations, and architecture evolution.",
    },
  ],
  comparison: [
    { aspect: "Pricing", traditional: "Hourly billing, scope creep", syntaxure: "Fixed project investment" },
    { aspect: "Planning", traditional: "Vague requirements, assumptions", syntaxure: "Socratic Q&A, zero assumptions" },
    { aspect: "Security", traditional: "Basic auth, no RBAC", syntaxure: "Defense-in-depth, audit-ready" },
    { aspect: "AI Usage", traditional: "Copy-paste from ChatGPT", syntaxure: "IDE-native agents with full context" },
    { aspect: "Timeline", traditional: "3-6 months for MVP", syntaxure: "2-3 weeks for MVP" },
    { aspect: "Post-Launch", traditional: "Handoff and goodbye", syntaxure: "Retainer partnership, growth roadmap" },
  ],
};

export const CONTACT_DEFAULTS = {
  title: "Let's Talk",
  subtitle:
    "Have a project in mind? We'd love to hear about it. Send us a message and we'll get back to you within 24 hours.",
  email: "hello@syntaxure.dev",
  location: "Iloilo City, Philippines",
  successMessage: "Message Sent! We'll get back to you within 24 hours.",
};

export const QUOTE_DEFAULTS = {
  title: "What type of project?",
  subtitle: "Select the option that best describes your project.",
  projectTypes: [
    { id: "web", label: "Web Application", description: "Marketing sites, portals, dashboards" },
    { id: "saas", label: "SaaS Platform", description: "Multi-tenant, subscription-based" },
    { id: "mobile", label: "Mobile App", description: "iOS, Android, or cross-platform" },
    { id: "ai", label: "AI Integration", description: "Chatbots, automation, ML features" },
    { id: "other", label: "Other", description: "Custom project or consultation" },
  ],
  budgetRanges: [
    { id: "50k-100k", minPhp: 50000, maxPhp: 100000, description: "Small projects, MVPs" },
    { id: "100k-250k", minPhp: 100000, maxPhp: 250000, description: "Medium complexity apps" },
    { id: "250k-500k", minPhp: 250000, maxPhp: 500000, description: "Full-featured platforms" },
    { id: "500k+", minPhp: 500000, maxPhp: null, description: "Enterprise solutions" },
  ],
  timelines: [
    { id: "1-2-weeks", label: "1-2 Weeks", description: "Rush / Small scope" },
    { id: "1-month", label: "1 Month", description: "Standard project" },
    { id: "2-3-months", label: "2-3 Months", description: "Complex platform" },
    { id: "flexible", label: "Flexible", description: "No strict deadline" },
  ],
  successMessage:
    "Thank you for your interest. We'll review your project details and get back to you within 24 hours with a custom quote.",
};

export const PRISM_DEFAULTS = {
  hero: {
    title: "Something is forming...",
    tagline: "A new paradigm. 2026.",
    description: "Prism Context Engine — deploy a context server that forces AI coding tools to follow your rules.",
  },
  waitlistPlaceholder: "Enter signal frequency (email)",
  successMessage: "Transmission received. We will signal you.",
};

export const LEGAL_DEFAULTS = {
  privacyPolicy: {
    lastUpdated: "December 2025",
    content: `## 1. Introduction

Syntaxure Labs ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you visit our website syntaxure.dev (the "Site").

## 2. Information We Collect

### a. Personal Data
We may collect personal information that you voluntarily provide to us when you fill out a contact form, request a quote, or subscribe to our newsletter.

### b. Automatically Collected Data
We may automatically collect certain information when you visit the Site, including your IP address, browser type, operating system, and browsing behavior.

## 3. How We Use Your Information

We use the information we collect to respond to your inquiries, provide requested services, improve our website, and send periodic communications related to your inquiries.

## 4. Data Security

We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.

## 5. Contact Us

If you have questions about this Privacy Policy, please contact us at hello@syntaxure.dev.`,
  },
  termsOfService: {
    lastUpdated: "December 2025",
    content: `## 1. Acceptance of Terms

By accessing and using the Syntaxure Labs website and services, you accept and agree to be bound by these Terms of Service.

## 2. Services

Syntaxure Labs provides web development, software engineering, and technology consulting services. All services are governed by separate Statements of Work or service agreements.

## 3. Intellectual Property

All content on this website, including text, graphics, logos, and code, is the property of Syntaxure Labs and is protected by intellectual property laws.

## 4. Limitation of Liability

Syntaxure Labs shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of our website or services.

## 5. Contact Us

For questions about these Terms, contact us at hello@syntaxure.dev.`,
  },
  cookiePolicy: {
    lastUpdated: "December 2025",
    content: `## 1. What Are Cookies

Cookies are small text files that are stored on your device when you visit our website. They help us provide you with a better experience.

## 2. How We Use Cookies

We use cookies to understand how you use our website, remember your preferences, and improve our services.

## 3. Types of Cookies We Use

- **Essential Cookies:** Required for the website to function properly.
- **Analytics Cookies:** Help us understand how visitors interact with our website.
- **Preference Cookies:** Allow the website to remember your preferences.

## 4. Managing Cookies

You can control and manage cookies through your browser settings. Please note that disabling cookies may affect the functionality of our website.

## 5. Contact Us

For questions about our Cookie Policy, contact us at hello@syntaxure.dev.`,
  },
};
