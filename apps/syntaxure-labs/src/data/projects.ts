/**
 * Projects Data (Case Studies)
 * ----------------------------
 * Portfolio projects for the Work section.
 * B2B language with metrics and outcomes.
 */

export interface Project {
  id: string;
  slug: string;
  title: string;
  client: string;
  category: string;
  tagline: string;
  description: string;
  challenge: string;
  solution: string;
  results: {
    metric: string;
    value: string;
  }[];
  technologies: string[];
  services?: string[];
  testimonial?: {
    quote: string;
    author: string;
    role: string;
  };
  image?: string;
  publishedSiteUrl?: string;
  clientLogo?: string;
  gallery?: {
    url: string;
    colSpan?: number; // e.g., 1, 2, 3
    rowSpan?: number; // e.g., 1, 2
    alt?: string;
  }[];
  featured: boolean;
}

export const projects: Project[] = [
  {
    id: "mdm-events",
    slug: "mdm-events",
    title: "MDM Events Management Platform",
    client: "MDM Events Management",
    category: "Full-Stack Web Application",
    tagline: "Production-ready event management platform with public site, dynamic portfolio, and full admin CMS",
    description: "A complete full-stack event management platform featuring a public-facing marketing site, dynamic portfolio with image galleries, client inquiry and feedback management, and a full-featured admin CMS with analytics, audit logging, and notification system.",
    challenge: "MDM Events needed a professional digital presence with a dynamic portfolio, client inquiry system, and full back-office CMS, all built from scratch to replace fragmented manual workflows across event booking, portfolio showcase, and client communication.",
    solution: "We designed and built the entire platform end-to-end: a public marketing site with dynamic portfolio galleries pulled from the database, a contact inquiry system with email notifications via Resend, and a complete admin CMS featuring an analytics dashboard, portfolio CRUD with drag-and-drop image management, paginated inquiry and feedback management, an immutable audit log, profile settings, and in-app notifications. We also handled cloud hosting and domain configuration on Vercel, implemented full SEO, AEO for AI discoverability, CI/CD via GitHub Actions, and integrated an AI-powered chatbot for visitor engagement.",
    results: [
      { metric: "Delivery", value: "Full-Stack" },
      { metric: "Timeline", value: "8 Weeks" },
      { metric: "Launch", value: "Zero Downtime" },
    ],
    technologies: [
      "Next.js 16",
      "TypeScript",
      "Prisma",
      "Supabase",
      "PostgreSQL",
      "Resend",
      "Vercel",
      "GitHub Actions",
    ],
    services: [
      "Custom Development",
      "Cloud Hosting & Domain",
      "SEO Optimization",
      "AEO Implementation",
      "AI Integration",
      "Admin CMS",
      "CI/CD Pipeline",
    ],
    image: "/work/mdm-events-hero.png",
    gallery: [
      {
        url: "/work/mdm-mobile.png",
        colSpan: 1,
        rowSpan: 3,
        alt: "MDM Events Mobile View",
      },
      {
        url: "/work/mdm-portfolio.png",
        colSpan: 2,
        rowSpan: 2,
        alt: "MDM Events Portfolio Layout",
      },
    ],
    publishedSiteUrl: "https://mdmevents.org/",
    featured: true,
  },
  {
    id: "manpower-enterprise",
    slug: "manpower-enterprise",
    title: "ManPower Enterprise ERP",
    client: "Philippine Staffing Agencies",
    category: "Enterprise Workforce Management",
    tagline: "End-to-end multi-tenant ERP for Philippine manpower agencies",
    description: "A comprehensive SaaS platform covering the complete staffing lifecycle: AI-assisted recruitment with resume parsing, automated onboarding with e-signatures, biometric GPS attendance, TRAIN-compliant payroll for all 8 BIR statuses, and a client portal with automated PayMongo billing and Twilio SMS dunning collections.",
    challenge: "Manpower agencies struggle with manual workflows, disjointed systems, and strict DOLE/BIR compliance requirements. Tracking thousands of daily deployments and computing complex tax tables across fragmented spreadsheets leads to revenue leakage.",
    solution: "Engineered a Turborepo-driven monorepo delivering 140 core features rolled out across 3 phases (Core Operations, Recruitment/Deployment, Client Portal/BI). Security is enforced by a 14-level strict RBAC hierarchy via Supabase Row-Level Security. Hardened with Playwright E2E testing, PostHog analytics, Sentry error tracking, and comprehensive CI/CD pipelines.",
    results: [
      { metric: "Features Delivered", value: "140 / 140" },
      { metric: "RBAC Roles", value: "14 Levels" },
      { metric: "Monorepo Packages", value: "14 Packages" },
    ],
    technologies: ["Next.js 16", "Supabase", "TypeScript", "Tailwind CSS v4", "Turborepo", "Playwright", "PayMongo", "Twilio"],
    services: [
      "Enterprise SaaS Development",
      "Regulatory Compliance Tech",
      "Automated Payroll Systems",
    ],
    featured: true,
  },
  {
    id: "likaslens",
    slug: "likaslens",
    title: "LikasLens: AI Environmental Intelligence",
    client: "AI ASEAN Hackathon 2026",
    category: "Neuro-Symbolic AI Platform",
    tagline: "Southeast Asia's first neuro-symbolic environmental reporting and accountability platform",
    description: "An enterprise-grade civic intelligence platform that closes the environmental accountability loop. It allows citizens to safely report violations, which are then analyzed by AI vision models and routed to the correct government agencies via a legal knowledge graph.",
    challenge: "Environmental degradation is accelerating, but reporting is fragmented across multiple agencies, whistleblowing is dangerous, and there is a transparency gap regarding government response times.",
    solution: "Engineered a microservices architecture (Laravel 12 REST API, FastAPI Python service, Next.js 16 frontends). It features dual YOLOv8 vision models for hazard detection and a Neo4j + Gemini 2.5 Flash GraphRAG pipeline for exact law matching. To protect whistleblowers, we built 'Ghost Mode' with EXIF-stripping and GPS fuzzing, alongside Blockchain Evidence Hashing for tamper-proof reports.",
    results: [
      { metric: "Architecture", value: "Microservices" },
      { metric: "AI Triage", value: "Instant" },
      { metric: "Whistleblower Trace", value: "Zero" },
    ],
    technologies: ["Next.js 16", "Laravel 12", "FastAPI", "YOLOv8", "Neo4j", "GraphRAG", "Gemini 2.5 Flash"],
    services: [
      "AI & Machine Learning",
      "Enterprise Architecture",
      "Civic Tech Platform",
    ],
    image: "/work/likaslens-hero.png",
    gallery: [
      { url: "/work/likaslens-mobile.png", alt: "LikasLens Mobile PWA" },
      { url: "/work/likaslens-map.png", alt: "LikasLens Interactive MapLibre Data" }
    ],
    featured: true,
  },
  {
    id: "isufst-qr-systems",
    slug: "isufst-qr-systems",
    title: "ISUFST Offline-First QR Systems",
    client: "ISUFST Dingle Campus",
    category: "Progressive Web Apps (PWA)",
    tagline: "Two official offline-first administrative PWAs for university event attendance and OJT intern tracking.",
    description: "Architected and deployed two distinct production-ready Progressive Web Apps to solve the university's reliance on manual logbooks and unstable Wi-Fi. System 1 (IT WEEK Scanner) handles rapid event tracking for 500+ students with a real-time live scoreboard. System 2 (OJT QR Pass) tracks CICT interns, featuring printable CR80 ID card generation and automated pixel-perfect PDF Daily Time Records.",
    challenge: "When building enterprise web applications for a university campus, relying on constant network connectivity is a point of failure. If the Wi-Fi drops, traditional systems halt, causing bottlenecks at event gates and intern check-ins.",
    solution: "Both PWAs share a core offline-first architecture utilizing local storage queues and HTML5 camera scanners synchronized with Supabase. While both survive network outages via 'Offline Queueing', their feature sets are distinct. The IT WEEK system uses Supabase Realtime for instant live scoreboard updates and cinematic reveals. The OJT system focuses on complex admin workflows, animated SVG progress charts, and automated PDF generation via jsPDF.",
    results: [
      { metric: "Network Reliance", value: "Offline First" },
      { metric: "Event Capacity", value: "500+ Scans" },
      { metric: "Manual Work", value: "Zero (Auto PDF)" },
    ],
    technologies: ["Next.js 16", "React 19", "Supabase", "Framer Motion", "SQLite", "jsPDF", "html5-qrcode"],
    services: [
      "Offline-First PWA Development",
      "QR & Hardware Integration",
      "Automated Reporting",
    ],
    featured: true,
  },
  {
    id: "snap-it",
    slug: "snap-it",
    title: "Snap IT: Premium PhotoBooth",
    client: "ISUFST CICT Department",
    category: "Interactive Kiosk Application",
    tagline: "A professional-grade, fullscreen photo booth web application built for campus events",
    description: "Designed for the First Day of School event at the ISUFST CICT department. A complete kiosk solution featuring live camera previews, custom frame overlays, countdown timers, and instant QR code sharing via Cloudinary.",
    challenge: "The department wanted an engaging, interactive photo booth experience for students on the first day of school, without relying on expensive, inflexible third-party kiosk software.",
    solution: "Developed a custom fullscreen web application with Next.js and Tailwind CSS. Integrated react-webcam for live video, Konva.js for real-time photo compositing with custom templates, and Cloudinary for instant, backend-less image uploads that generate scannable QR codes for easy sharing.",
    results: [
      { metric: "Engagement", value: "High" },
      { metric: "Photo Delivery", value: "Instant via QR" },
      { metric: "Architecture", value: "Serverless" },
    ],
    technologies: ["Next.js 16", "Tailwind CSS", "Konva.js", "Framer Motion", "Cloudinary"],
    services: [
      "Custom Web App Development",
      "Interactive UI/UX Design",
      "API Integration",
    ],
    image: "/work/snap-it-hero.png",
    gallery: [
      { url: "/work/snap-it-hero.png", alt: "Snap IT Cover" },
      { url: "/work/snap-it-gallery.png", alt: "Snap IT Interface" }
    ],
    publishedSiteUrl: "https://snap-it-2026.vercel.app/",
    featured: true,
  },
  {
    id: "spatialsync",
    slug: "spatialsync",
    title: "SpatialSync: Collaborative 3D Architectural System",
    client: "SaaS Platform",
    category: "Real-Time 3D Engine",
    tagline: "Next-generation collaborative 3D architectural engine running natively in the browser.",
    description: "A browser-native collaborative 3D architectural SaaS platform. Teams of architects and designers can simultaneously construct spatial layouts using a drag-and-drop 3D builder for walls, doors, and textures, all synchronized in sub-second real-time. Features include a scrollytelling hero section, passwordless biometric authentication, dynamic material pricing, and one-click automatic 2D blueprint generation.",
    challenge: "Traditional architectural software requires heavy desktop installations, expensive licenses, and makes real-time remote collaboration difficult. The goal was to build a true SaaS product that brings enterprise-grade 3D spatial planning natively into the browser with zero plugins and instant multiplayer synchronization.",
    solution: "Engineered a high-performance WebGL 3D engine using Three.js and Alpine.js, backed by a Laravel 11 and Supabase stack. Build states are synchronized via Supabase Realtime WebSockets, acting as a robust real-time collaboration engine. Users can drag and drop 16+ smart building parts, and auto-generate professional blueprint PDFs directly from their 3D models. The platform implements an advanced 2026 UI/UX design system and utilizes face-api.js for on-device biometric facial recognition login.",
    results: [
      { metric: "Synchronization", value: "Sub-second" },
      { metric: "Collaboration", value: "Real-time Multi-user" },
      { metric: "3D Rendering", value: "WebGL Native" },
    ],
    technologies: ["Laravel 11", "Three.js", "Supabase Realtime", "Alpine.js", "Tailwind CSS", "TensorFlow.js"],
    services: [
      "WebGL 3D SaaS Development",
      "Real-Time Multiplayer Sync",
      "AI Biometric Authentication",
    ],
    featured: true,
  },
  {
    id: "cict-voting-system",
    slug: "cict-voting-system",
    title: "CICT Digital Voting System",
    client: "ISUFST CICT Department",
    category: "Progressive Web App (PWA)",
    tagline: "Secure, offline-first digital voting and auto-tallying platform",
    description: "A custom voting platform developed for the CICT department's 2026 officer elections. Built as an installable Progressive Web App (PWA) with a native desktop feel, it completely digitized the manual ballot and counting process.",
    challenge: "The department previously relied on manual paper ballots, which made counting slow, prone to errors, and lacked real-time transparency for candidates and voters.",
    solution: "Designed a secure, offline-first digital voting system with a full admin CMS to manage elections, roles, and candidate nominations via CRUD operations. To ensure absolute transparency and trust, the system features a live dashboard for real-time vote auto-counting, and generates an automated, anonymized voting receipt for each user that hides personal details but securely verifies their cast ballot. Built with React, Vite, Tailwind, and Recharts.",
    results: [
      { metric: "Counting Speed", value: "Instant" },
      { metric: "Manual Errors", value: "0%" },
      { metric: "Transparency", value: "100%" },
    ],
    technologies: ["React", "TypeScript", "Vite", "Tailwind CSS", "Recharts", "PWA", "Vercel"],
    services: [
      "Custom Web App Development",
      "Interactive UI/UX Design",
      "Data Visualization",
    ],
    image: "/work/voting-system-hero.png",
    gallery: [
      { url: "/work/voting-system-hero.png", alt: "Voting System Interface" },
      { url: "/work/voting-system-light.png", alt: "Voting System Light Mode" },
      { url: "/work/voting-system-admin.png", alt: "Voting System Admin Dashboard" },
      { url: "/work/voting-system-1.png", alt: "Voting System Preview" }
    ],
    featured: true,
  },
  {
    id: "sineai-hub",
    slug: "sineai-hub",
    title: "SineAI Hub",
    client: "Internal Project",
    category: "SaaS Platform",
    tagline: "AI-powered student information system",
    description: "A comprehensive SaaS platform for educational institutions featuring AI-assisted student management, real-time analytics, and automated reporting.",
    challenge: "Educational institutions needed a modern, unified system to manage student data, track performance, and generate insights without complex integrations.",
    solution: "Built a full-stack SaaS with Laravel and React, featuring AI-powered insights, multi-tenant architecture, and secure data import from legacy systems.",
    results: [
      { metric: "Admin Time Saved", value: "60%" },
      { metric: "Data Entry Errors", value: "-85%" },
      { metric: "Report Generation", value: "10x Faster" },
    ],
    technologies: ["Laravel", "React", "MySQL", "OpenAI", "Tailwind CSS"],
    featured: true,
  },
  {
    id: "energy-monitoring",
    slug: "energy-monitoring",
    title: "Energy Monitoring",
    client: "IoT Infrastructure",
    category: "IoT & Monitoring",
    tagline: "Real-time IoT energy monitoring system",
    description: "A real-time monitoring dashboard for IoT sensor networks, tracking energy consumption patterns with live visualizations and anomaly detection.",
    challenge: "Facilities needed granular, real-time visibility into energy usage across multiple zones to identify waste, predict failures, and optimize consumption.",
    solution: "Developed a TypeScript-based monitoring pipeline ingesting MQTT sensor data, rendering live charts, and triggering alerts on consumption anomalies via threshold rules.",
    results: [
      { metric: "Energy Waste Detected", value: "-40%" },
      { metric: "Sensor Uptime", value: "99.8%" },
      { metric: "Alert Accuracy", value: "94%" },
    ],
    technologies: [
      "TypeScript",
      "Node.js",
      "MQTT",
      "React",
      "Chart.js",
      "InfluxDB",
    ],
    featured: true,
  },
  {
    id: "cict-portal",
    slug: "cict-portal",
    title: "CICT Tech Portal",
    client: "WVSU-CICT",
    category: "Web Application",
    tagline: "College department portal with event management",
    description: "A comprehensive web portal for the College of ICT featuring event management, news publishing, and student resources.",
    challenge: "The department needed a centralized platform to manage events, share announcements, and provide resources to 500+ students.",
    solution: "Developed a PHP-based portal with role-based access, event calendar, and integrated analytics dashboard for administrators.",
    results: [
      { metric: "Student Engagement", value: "+150%" },
      { metric: "Event Attendance", value: "+80%" },
      { metric: "Admin Efficiency", value: "3x" },
    ],
    technologies: ["PHP", "MySQL", "JavaScript", "Bootstrap", "Chart.js"],
    testimonial: {
      quote: "The portal transformed how we communicate with students. Event registrations increased dramatically.",
      author: "Department Head",
      role: "WVSU-CICT",
    },
    featured: true,
  },
  {
    id: "dams",
    slug: "dams",
    title: "DAMS",
    client: "DSWD Regional Office",
    category: "Government System",
    tagline: "DSWD Assistance Management System",
    description: "A centralized case management system for the Department of Social Welfare and Development, streamlining beneficiary intake, assistance tracking, and reporting workflows.",
    challenge: "Social workers managed thousands of beneficiary cases using paper records and spreadsheets, leading to duplicate entries, lost follow-ups, and delayed assistance distribution.",
    solution: "Built a PHP-based web application with structured beneficiary profiles, assistance type categorization, case status tracking, and automated report generation for regional compliance.",
    results: [
      { metric: "Processing Time", value: "-60%" },
      { metric: "Duplicate Records", value: "-90%" },
      { metric: "Cases Managed", value: "1,200+" },
    ],
    technologies: ["PHP", "Laravel", "MySQL", "Bootstrap", "JavaScript"],
    featured: true,
  },
  {
    id: "e-bhm-connect",
    slug: "e-bhm-connect",
    title: "e-BHM Connect",
    client: "Barangay Health Unit",
    category: "Health Tech",
    tagline: "E-Barangay Health Management System",
    description: "A digital health records and management platform for barangay health centers, enabling patient registration, consultation logging, maternal care tracking, and health program reporting.",
    challenge: "Barangay health workers relied on manual logbooks and fragmented records, making it difficult to track patient history, schedule follow-ups, and report health trends to municipal offices.",
    solution: "Designed a role-based web system with patient lifecycle management, automated appointment reminders, maternal and child health modules, and dashboard analytics for health program monitoring.",
    results: [
      { metric: "Record Retrieval", value: "10x Faster" },
      { metric: "Patient Follow-ups", value: "+75%" },
      { metric: "Reporting Time", value: "-80%" },
    ],
    technologies: ["PHP", "Laravel", "MySQL", "Bootstrap", "JavaScript"],
    featured: true,
  },
  {
    id: "ecommerce-platform",
    slug: "ecommerce-platform",
    title: "E-Commerce Platform",
    client: "Retail Client",
    category: "E-Commerce",
    tagline: "High-conversion online store",
    description: "A modern e-commerce platform with product management, inventory tracking, and integrated payment processing.",
    challenge: "Client needed to move from physical-only retail to online sales with proper inventory management.",
    solution: "Built a custom e-commerce solution with Stripe integration, inventory sync, and automated order processing.",
    results: [
      { metric: "Online Sales", value: "₱2M+" },
      { metric: "Conversion Rate", value: "4.2%" },
      { metric: "Cart Abandonment", value: "-35%" },
    ],
    technologies: ["Next.js 16", "Stripe", "PostgreSQL", "Vercel", "Resend"],
    featured: false,
  }
];

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug);
}

export function getAllProjectSlugs(): string[] {
  return projects.map((project) => project.slug);
}

export function getFeaturedProjects(): Project[] {
  return projects.filter((project) => project.featured);
}
