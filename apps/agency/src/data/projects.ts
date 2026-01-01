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
  testimonial?: {
    quote: string;
    author: string;
    role: string;
  };
  image?: string;
  featured: boolean;
}

export const projects: Project[] = [
  {
    id: 'sineai-hub',
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
    featured: true,
  },
  {
    id: 'cict-portal',
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
    featured: true,
  },
  {
    id: 'vibecoder-engine',
    slug: 'vibecoder-engine',
    title: 'Vibecoder Engine',
    client: 'JD Studio',
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
    featured: true,
  },
  {
    id: 'ecommerce-platform',
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
    featured: false,
  },
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
