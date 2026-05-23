/**
 * Firestore Seed Script
 * ----------------------
 * Seeds the database with services, projects, and sample form data.
 * Run: npx ts-node --project tsconfig.seed.json scripts/seed.ts
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

// Initialize Firebase Admin
if (!getApps().length) {
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');
  
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey,
    }),
  });
}

const db = getFirestore();

// =============================================================================
// SERVICES DATA
// =============================================================================
const services = [
  {
    slug: 'web-development',
    icon: 'Globe',
    title: 'Web Development',
    tagline: 'High-performance web applications that convert.',
    description:
      'We build blazing-fast web applications using Next.js 14+, React, and modern tooling. Every project is optimized for speed, SEO, and conversions — engineered to outperform your competition.',
    features: [
      'Next.js 14+ with App Router',
      'TypeScript for type safety',
      'Edge Functions for global performance',
      'SEO optimization & Core Web Vitals',
      'Responsive, mobile-first design',
      'Analytics & conversion tracking',
    ],
    deliverables: [
      'Production-ready codebase',
      'Vercel deployment configuration',
      'Documentation & handoff',
      '30-day post-launch support',
    ],
    investment: {
      starting: '₱75,000',
      timeline: '2-4 weeks',
    },
    order: 1,
  },
  {
    slug: 'saas-platforms',
    icon: 'Cloud',
    title: 'SaaS Platforms',
    tagline: 'Full-stack SaaS from zero to revenue.',
    description:
      'Launch your SaaS with a solid foundation. Multi-tenancy, subscription billing, user management, and analytics — all built in from day one. Scale confidently from MVP to enterprise.',
    features: [
      'Multi-tenant architecture',
      'Stripe/Paddle billing integration',
      'User authentication & RBAC',
      'Admin dashboard',
      'Usage analytics & reporting',
      'API-first design',
    ],
    deliverables: [
      'Complete SaaS codebase',
      'Database schema & migrations',
      'Payment integration',
      'Admin panel',
      'API documentation',
    ],
    investment: {
      starting: '₱150,000',
      timeline: '4-8 weeks',
    },
    order: 2,
  },
  {
    slug: 'cloud-architecture',
    icon: 'Cpu',
    title: 'Cloud Architecture',
    tagline: 'Infrastructure built for 99.9% uptime.',
    description:
      'Enterprise-grade infrastructure on Vercel, AWS, or Google Cloud. We design systems that scale infinitely, recover automatically, and cost-optimize as you grow.',
    features: [
      'Vercel / AWS / GCP setup',
      'CI/CD pipeline configuration',
      'Auto-scaling infrastructure',
      'Monitoring & alerting',
      'Disaster recovery planning',
      'Cost optimization',
    ],
    deliverables: [
      'Infrastructure as Code (IaC)',
      'CI/CD pipelines',
      'Monitoring dashboards',
      'Runbooks & documentation',
      'SLA guarantee',
    ],
    investment: {
      starting: '₱50,000',
      timeline: '1-2 weeks',
    },
    order: 3,
  },
  {
    slug: 'ai-integration',
    icon: 'Sparkles',
    title: 'AI Integration',
    tagline: 'Embed intelligence into your product.',
    description:
      'Add AI capabilities to your existing product or build AI-native applications from scratch. Chatbots, content generation, recommendation engines, RAG systems — we make AI accessible.',
    features: [
      'OpenAI / Claude / Gemini integration',
      'RAG systems with vector databases',
      'Custom fine-tuning',
      'Conversational AI / Chatbots',
      'Content generation pipelines',
      'AI-powered search',
    ],
    deliverables: [
      'AI integration codebase',
      'Prompt engineering library',
      'Vector database setup',
      'Usage monitoring',
      'Optimization recommendations',
    ],
    investment: {
      starting: '₱100,000',
      timeline: '2-4 weeks',
    },
    order: 4,
  },
];

// =============================================================================
// PROJECTS DATA
// =============================================================================
const projects = [
  {
    slug: 'sineai-hub',
    title: 'SineAI Hub',
    client: 'Internal Project',
    category: 'SaaS Platform',
    tagline: 'AI-powered student information system',
    description:
      'A comprehensive SaaS platform for educational institutions featuring AI-assisted student management, real-time analytics, and automated reporting.',
    challenge:
      'Educational institutions needed a modern, unified system to manage student data, track performance, and generate insights without complex integrations.',
    solution:
      'Built a full-stack SaaS with Laravel + React, featuring AI-powered insights, multi-tenant architecture, and seamless data import from legacy systems.',
    results: [
      { metric: 'Admin Time Saved', value: '60%' },
      { metric: 'Data Entry Errors', value: '-85%' },
      { metric: 'Report Generation', value: '10x Faster' },
    ],
    technologies: ['Laravel', 'React', 'MySQL', 'OpenAI', 'Tailwind CSS'],
    testimonial: null,
    image: null,
    featured: true,
    order: 1,
  },
  {
    slug: 'cict-portal',
    title: 'CICT Tech Portal',
    client: 'WVSU-CICT',
    category: 'Web Application',
    tagline: 'College department portal with event management',
    description:
      'A comprehensive web portal for the College of ICT featuring event management, news publishing, and student resources.',
    challenge:
      'The department needed a centralized platform to manage events, share announcements, and provide resources to 500+ students.',
    solution:
      'Developed a PHP-based portal with role-based access, event calendar, and integrated analytics dashboard for administrators.',
    results: [
      { metric: 'Student Engagement', value: '+150%' },
      { metric: 'Event Attendance', value: '+80%' },
      { metric: 'Admin Efficiency', value: '3x' },
    ],
    technologies: ['PHP', 'MySQL', 'JavaScript', 'Bootstrap', 'Chart.js'],
    testimonial: {
      quote:
        'The portal transformed how we communicate with students. Event registrations increased dramatically.',
      author: 'Department Head',
      role: 'WVSU-CICT',
    },
    image: null,
    featured: true,
    order: 2,
  },
  {
    slug: 'vibecoder-engine',
    title: 'Vibecoder Engine',
    client: 'JeffDev Studio',
    category: 'Internal Tool',
    tagline: 'AI-accelerated development workflow',
    description:
      'An internal toolkit combining AI code generation, component libraries, and automated testing to accelerate project delivery.',
    challenge:
      'Need to deliver high-quality web applications faster while maintaining consistency across projects.',
    solution:
      'Built a proprietary engine combining pre-built components, AI prompts, and automated testing pipelines.',
    results: [
      { metric: 'Development Speed', value: '3x' },
      { metric: 'Code Consistency', value: '95%' },
      { metric: 'Bug Rate', value: '-70%' },
    ],
    technologies: ['Next.js', 'TypeScript', 'GSAP', 'Tailwind', 'Claude API'],
    testimonial: null,
    image: null,
    featured: true,
    order: 3,
  },
  {
    slug: 'ecommerce-platform',
    title: 'E-Commerce Platform',
    client: 'Retail Client',
    category: 'E-Commerce',
    tagline: 'High-conversion online store',
    description:
      'A modern e-commerce platform with product management, inventory tracking, and integrated payment processing.',
    challenge:
      'Client needed to move from physical-only retail to online sales with proper inventory management.',
    solution:
      'Built a custom e-commerce solution with Stripe integration, inventory sync, and automated order processing.',
    results: [
      { metric: 'Online Sales', value: '₱2M+' },
      { metric: 'Conversion Rate', value: '4.2%' },
      { metric: 'Cart Abandonment', value: '-35%' },
    ],
    technologies: ['Next.js', 'Stripe', 'PostgreSQL', 'Vercel', 'Resend'],
    testimonial: null,
    image: null,
    featured: false,
    order: 4,
  },
];

// =============================================================================
// SAMPLE QUOTES
// =============================================================================
const sampleQuotes = [
  {
    projectType: 'saas',
    budget: '250k-500k',
    timeline: '2-3-months',
    name: 'Maria Santos',
    email: 'maria@techstartup.ph',
    company: 'TechStartup PH',
    details: 'We need a multi-tenant SaaS platform for HR management. Features include employee onboarding, leave management, payroll integration, and analytics dashboard.',
    status: 'new',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    projectType: 'web',
    budget: '100k-250k',
    timeline: '1-month',
    name: 'John Cruz',
    email: 'john@localretail.com',
    company: 'Local Retail Co.',
    details: 'Looking for a modern e-commerce website to sell our products online. Need inventory management, payment integration with GCash/Maya, and order tracking.',
    status: 'contacted',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    projectType: 'ai',
    budget: '100k-250k',
    timeline: 'flexible',
    name: 'Anna Reyes',
    email: 'anna@edutech.io',
    company: 'EduTech Solutions',
    details: 'Want to integrate an AI chatbot into our learning management system. It should answer student questions based on course materials and FAQs.',
    status: 'in-progress',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// =============================================================================
// SAMPLE MESSAGES
// =============================================================================
const sampleMessages = [
  {
    name: 'Carlos Mendoza',
    email: 'carlos@startup.ph',
    subject: 'Partnership Inquiry',
    message: 'Hi! We are a startup accelerator and would like to discuss a potential partnership for providing web development services to our portfolio companies.',
    status: 'new',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    name: 'Lisa Tan',
    email: 'lisa@agency.com',
    subject: 'Collaboration Opportunity',
    message: 'Hello! I run a digital marketing agency and we often need development partners for client projects. Would love to discuss how we can work together.',
    status: 'read',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    name: 'Mike Garcia',
    email: 'mike@corp.ph',
    subject: 'Question about SaaS Services',
    message: 'I saw your SaaS platform service and wanted to ask if you also provide ongoing maintenance and support after the initial development phase.',
    status: 'responded',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// =============================================================================
// SEED FUNCTION
// =============================================================================
async function seed() {
  console.log('🌱 Starting Firestore seed...\n');

  // Seed Services
  console.log('📦 Seeding services...');
  for (const service of services) {
    await db.collection('services').doc(service.slug).set(service);
    console.log(`   ✓ ${service.title}`);
  }

  // Seed Projects
  console.log('\n📦 Seeding projects...');
  for (const project of projects) {
    await db.collection('projects').doc(project.slug).set(project);
    console.log(`   ✓ ${project.title}`);
  }

  // Seed Sample Quotes
  console.log('\n📦 Seeding sample quotes...');
  for (const quote of sampleQuotes) {
    await db.collection('quotes').add(quote);
    console.log(`   ✓ Quote from ${quote.name}`);
  }

  // Seed Sample Messages
  console.log('\n📦 Seeding sample messages...');
  for (const message of sampleMessages) {
    await db.collection('messages').add(message);
    console.log(`   ✓ Message from ${message.name}`);
  }

  console.log('\n✅ Seed complete!');
  console.log('   → 4 services');
  console.log('   → 4 projects');
  console.log('   → 3 sample quotes');
  console.log('   → 3 sample messages');
}

seed().catch(console.error);
