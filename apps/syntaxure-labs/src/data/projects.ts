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
    client: 'Syntaxure Labs',
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
  {
    id: 'likaslens',
    slug: 'likaslens',
    title: 'LikasLens',
    client: 'Civic Tech Initiative',
    category: 'Civic Tech',
    tagline: 'Smart community watchdog for environmental accountability',
    description:
      'A platform that empowers everyday citizens to earn rewards for reporting minor environmental issues, while a public scoreboard holds local governments accountable for resolution speed.',
    challenge:
      'Communities lacked an accessible way to report environmental violations and track government response. Existing channels were slow, opaque, and offered no incentive for citizen participation.',
    solution:
      'Built a mobile-first reporting platform with geotagged submissions, reward incentives, automated government routing, and a public transparency scoreboard ranking LGU response times.',
    results: [
      { metric: 'Response Rate', value: '+200%' },
      { metric: 'Issue Resolution', value: '3x Faster' },
      { metric: 'Citizen Reports', value: '500+' },
    ],
    technologies: ['JavaScript', 'React', 'Node.js', 'Firebase', 'Mapbox'],
    featured: true,
  },
  {
    id: 'energy-monitoring',
    slug: 'energy-monitoring',
    title: 'Energy Monitoring',
    client: 'IoT Infrastructure',
    category: 'IoT & Monitoring',
    tagline: 'Real-time IoT energy monitoring system',
    description:
      'A real-time monitoring dashboard for IoT sensor networks, tracking energy consumption patterns with live visualizations and anomaly detection.',
    challenge:
      'Facilities needed granular, real-time visibility into energy usage across multiple zones to identify waste, predict failures, and optimize consumption.',
    solution:
      'Developed a TypeScript-based monitoring pipeline ingesting MQTT sensor data, rendering live charts, and triggering alerts on consumption anomalies via threshold rules.',
    results: [
      { metric: 'Energy Waste Detected', value: '-40%' },
      { metric: 'Sensor Uptime', value: '99.8%' },
      { metric: 'Alert Accuracy', value: '94%' },
    ],
    technologies: ['TypeScript', 'Node.js', 'MQTT', 'React', 'Chart.js', 'InfluxDB'],
    featured: true,
  },
  {
    id: 'dswd-dams',
    slug: 'dswd-dams',
    title: 'DAMS',
    client: 'DSWD Regional Office',
    category: 'Government System',
    tagline: 'DSWD Assistance Management System',
    description:
      'A centralized case management system for the Department of Social Welfare and Development, streamlining beneficiary intake, assistance tracking, and reporting workflows.',
    challenge:
      'Social workers managed thousands of beneficiary cases using paper records and spreadsheets, leading to duplicate entries, lost follow-ups, and delayed assistance distribution.',
    solution:
      'Built a PHP-based web application with structured beneficiary profiles, assistance type categorization, case status tracking, and automated report generation for regional compliance.',
    results: [
      { metric: 'Processing Time', value: '-60%' },
      { metric: 'Duplicate Records', value: '-90%' },
      { metric: 'Cases Managed', value: '1,200+' },
    ],
    technologies: ['PHP', 'Laravel', 'MySQL', 'Bootstrap', 'JavaScript'],
    featured: true,
  },
  {
    id: 'e-bhm-connect',
    slug: 'e-bhm-connect',
    title: 'e-BHM Connect',
    client: 'Barangay Health Unit',
    category: 'Health Tech',
    tagline: 'E-Barangay Health Management System',
    description:
      'A digital health records and management platform for barangay health centers, enabling patient registration, consultation logging, maternal care tracking, and health program reporting.',
    challenge:
      'Barangay health workers relied on manual logbooks and fragmented records, making it difficult to track patient history, schedule follow-ups, and report health trends to municipal offices.',
    solution:
      'Designed a role-based web system with patient lifecycle management, automated appointment reminders, maternal and child health modules, and dashboard analytics for health program monitoring.',
    results: [
      { metric: 'Record Retrieval', value: '10x Faster' },
      { metric: 'Patient Follow-ups', value: '+75%' },
      { metric: 'Reporting Time', value: '-80%' },
    ],
    technologies: ['PHP', 'Laravel', 'MySQL', 'Bootstrap', 'JavaScript'],
    featured: true,
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
