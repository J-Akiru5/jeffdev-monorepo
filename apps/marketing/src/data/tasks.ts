export type TaskStatus = 'todo' | 'in-progress' | 'done';

export type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  phase: string;
  owner: string[];
  priority: 'high' | 'medium' | 'low';
  platform?: string;
  description?: string;
};

export const tasks: Task[] = [
  // === PHASE 1: Foundation ===

  // Accounts & Infrastructure
  { id: 'p1-01', title: 'Create LinkedIn company page with logo, banner, tagline', status: 'todo', phase: 'phase-1', owner: ['mark'], priority: 'high', platform: 'LinkedIn' },
  { id: 'p1-02', title: 'Create Twitter/X account (@syntaxurelabs)', status: 'todo', phase: 'phase-1', owner: ['mark'], priority: 'high', platform: 'Twitter' },
  { id: 'p1-03', title: 'Create YouTube channel + upload first teaser', status: 'todo', phase: 'phase-1', owner: ['mark'], priority: 'high', platform: 'YouTube' },
  { id: 'p1-04', title: 'Set up Buffer/Publer for social scheduling', status: 'todo', phase: 'phase-1', owner: ['mark'], priority: 'medium', platform: 'Twitter' },
  { id: 'p1-05', title: 'Create Linktree/Beacons bio link page', status: 'todo', phase: 'phase-1', owner: ['mark'], priority: 'medium', platform: 'Twitter' },

  // Website Updates
  { id: 'p1-06', title: 'Update hero with "Governance over Generation" subtext', status: 'todo', phase: 'phase-1', owner: ['karl'], priority: 'high', platform: 'Website', description: 'Agency site hero section' },
  { id: 'p1-07', title: 'Create Team page with all 5 bios + ISAT-U TBI badge', status: 'todo', phase: 'phase-1', owner: ['karl', 'jeff'], priority: 'high', platform: 'Website' },
  { id: 'p1-08', title: 'Add ISAT-U Kwadra TBI partner section to homepage + about', status: 'todo', phase: 'phase-1', owner: ['karl'], priority: 'high', platform: 'Website' },
  { id: 'p1-09', title: 'Implement /blog route with MDX rendering', status: 'todo', phase: 'phase-1', owner: ['lou'], priority: 'high', platform: 'Website' },
  { id: 'p1-10', title: 'Write blog: "What is Context-as-a-Service?"', status: 'todo', phase: 'phase-1', owner: ['jeff'], priority: 'high', platform: 'Blog' },
  { id: 'p1-11', title: 'Write blog: "The $150/month AI Token Waste Problem"', status: 'todo', phase: 'phase-1', owner: ['jeff'], priority: 'high', platform: 'Blog' },
  { id: 'p1-12', title: 'Write blog: "Context Governance 101 for Engineering Teams"', status: 'todo', phase: 'phase-1', owner: ['lou'], priority: 'high', platform: 'Blog' },
  { id: 'p1-13', title: 'Expand /prism waitlist page with Founding Member CTA', status: 'todo', phase: 'phase-1', owner: ['karl', 'lou'], priority: 'high', platform: 'Website' },
  { id: 'p1-14', title: 'Add newsletter signup to footer + landing page', status: 'todo', phase: 'phase-1', owner: ['lou'], priority: 'medium', platform: 'Website' },
  { id: 'p1-15', title: 'Add team headshots to About page', status: 'todo', phase: 'phase-1', owner: ['mark'], priority: 'medium', platform: 'Website' },
  { id: 'p1-16', title: 'Create media kit page (logos, brand, bios)', status: 'todo', phase: 'phase-1', owner: ['karl'], priority: 'low', platform: 'Website' },

  // Prism Landing
  { id: 'p1-17', title: 'Design waitlist landing page with Founding Member CTA', status: 'todo', phase: 'phase-1', owner: ['karl', 'lou'], priority: 'high', platform: 'Website' },
  { id: 'p1-18', title: 'Write Founding Member offer copy ($9/mo lifetime)', status: 'todo', phase: 'phase-1', owner: ['jeff', 'lou'], priority: 'high', platform: 'Website' },
  { id: 'p1-19', title: 'Add email capture form (Resend)', status: 'todo', phase: 'phase-1', owner: ['lou'], priority: 'high', platform: 'Website' },
  { id: 'p1-20', title: 'Embed product demo video on landing page', status: 'todo', phase: 'phase-1', owner: ['lou'], priority: 'high', platform: 'Website' },
  { id: 'p1-21', title: 'Design "How It Works" animated section', status: 'todo', phase: 'phase-1', owner: ['karl'], priority: 'medium', platform: 'Website' },
  { id: 'p1-22', title: 'Write comparison table (Prism vs competitors)', status: 'todo', phase: 'phase-1', owner: ['jeff'], priority: 'medium', platform: 'Website' },
  { id: 'p1-23', title: 'Build IDE support grid', status: 'todo', phase: 'phase-1', owner: ['karl'], priority: 'medium', platform: 'Website' },
  { id: 'p1-24', title: "Write FAQ section (pricing, SEC, timeline, privacy)", status: 'todo', phase: 'phase-1', owner: ['jeff'], priority: 'medium', platform: 'Website' },
  { id: 'p1-25', title: 'Add "Built in Iloilo" badge/story section', status: 'todo', phase: 'phase-1', owner: ['karl'], priority: 'low', platform: 'Website' },

  // Content — First Wave
  { id: 'p1-26', title: 'Write Founding Member waitlist LinkedIn post', status: 'todo', phase: 'phase-1', owner: ['mark', 'jeff'], priority: 'high', platform: 'LinkedIn' },
  { id: 'p1-27', title: 'Write "AI Token Waste" Twitter thread (5-7 tweets)', status: 'todo', phase: 'phase-1', owner: ['mark', 'lou'], priority: 'high', platform: 'Twitter' },
  { id: 'p1-28', title: 'Schedule first week of LinkedIn posts', status: 'todo', phase: 'phase-1', owner: ['mark'], priority: 'high', platform: 'LinkedIn' },
  { id: 'p1-29', title: 'Record first product demo video (90s)', status: 'todo', phase: 'phase-1', owner: ['lou'], priority: 'high', platform: 'YouTube' },
  { id: 'p1-30', title: 'Create social media post templates', status: 'todo', phase: 'phase-1', owner: ['karl'], priority: 'high', platform: 'Twitter' },
  { id: 'p1-31', title: 'Write Newsletter #1 draft', status: 'todo', phase: 'phase-1', owner: ['mark', 'jeff'], priority: 'medium', platform: 'Blog' },
  { id: 'p1-32', title: 'DM 10 dev contacts to share waitlist post', status: 'todo', phase: 'phase-1', owner: ['mark'], priority: 'medium', platform: 'LinkedIn' },
  { id: 'p1-33', title: 'Post waitlist on Reddit (r/ChatGPTCoding, r/cursor)', status: 'todo', phase: 'phase-1', owner: ['mark'], priority: 'medium', platform: 'Twitter' },

  // Visual Assets
  { id: 'p1-34', title: 'Create Prism animated logo', status: 'todo', phase: 'phase-1', owner: ['karl'], priority: 'high', platform: 'Website' },
  { id: 'p1-35', title: 'Design LinkedIn banner (1584x396)', status: 'todo', phase: 'phase-1', owner: ['karl'], priority: 'high', platform: 'LinkedIn' },
  { id: 'p1-36', title: 'Design Twitter banner (1500x500)', status: 'todo', phase: 'phase-1', owner: ['karl'], priority: 'high', platform: 'Twitter' },
  { id: 'p1-37', title: 'Design YouTube channel art + thumbnail template', status: 'todo', phase: 'phase-1', owner: ['karl'], priority: 'high', platform: 'YouTube' },
  { id: 'p1-38', title: 'Design token waste infographic', status: 'todo', phase: 'phase-1', owner: ['karl'], priority: 'medium', platform: 'Twitter' },
  { id: 'p1-39', title: 'Design architecture diagram for blog + landing', status: 'todo', phase: 'phase-1', owner: ['karl'], priority: 'medium', platform: 'Website' },
  { id: 'p1-40', title: 'Create OG image template for blog posts', status: 'todo', phase: 'phase-1', owner: ['karl'], priority: 'medium', platform: 'Blog' },

  // Promos Setup
  { id: 'p1-41', title: 'Design referral program structure', status: 'todo', phase: 'phase-1', owner: ['mark'], priority: 'high', platform: 'Website' },
  { id: 'p1-42', title: 'Set up waitlist email flow in Resend', status: 'todo', phase: 'phase-1', owner: ['lou'], priority: 'high', platform: 'Website' },
  { id: 'p1-43', title: 'Create Discord welcome channel for waitlist members', status: 'todo', phase: 'phase-1', owner: ['lou'], priority: 'medium', platform: 'Discord' },
  { id: 'p1-44', title: 'Draft ISAT-U student ambassador program proposal', status: 'todo', phase: 'phase-1', owner: ['hazel'], priority: 'medium', platform: 'Website' },

  // === PHASE 2: Authority Building ===
  { id: 'p2-01', title: 'Write case study #1: Internal token reduction', status: 'todo', phase: 'phase-2', owner: ['jeff', 'lou'], priority: 'high', platform: 'Blog' },
  { id: 'p2-02', title: 'Publish case study on LinkedIn, Twitter, blog', status: 'todo', phase: 'phase-2', owner: ['mark'], priority: 'high', platform: 'LinkedIn' },
  { id: 'p2-03', title: 'Record tutorial: "Set up Prism with Cursor"', status: 'todo', phase: 'phase-2', owner: ['lou'], priority: 'high', platform: 'YouTube' },
  { id: 'p2-04', title: 'Record tutorial: "Prism + Windsurf setup"', status: 'todo', phase: 'phase-2', owner: ['lou'], priority: 'high', platform: 'YouTube' },
  { id: 'p2-05', title: 'Write comparison: "Prism vs .cursorrules"', status: 'todo', phase: 'phase-2', owner: ['jeff'], priority: 'medium', platform: 'Blog' },
  { id: 'p2-06', title: 'Write guest post for dev publication', status: 'todo', phase: 'phase-2', owner: ['jeff'], priority: 'medium', platform: 'Blog' },
  { id: 'p2-07', title: 'Pitch 5 AI/dev podcasts', status: 'todo', phase: 'phase-2', owner: ['mark'], priority: 'medium', platform: 'Twitter' },
  { id: 'p2-08', title: 'Record 2 podcast appearances', status: 'todo', phase: 'phase-2', owner: ['jeff', 'mark'], priority: 'medium', platform: 'YouTube' },
  { id: 'p2-09', title: 'Create 3 Shorts from product demo footage', status: 'todo', phase: 'phase-2', owner: ['karl'], priority: 'medium', platform: 'YouTube' },
  { id: 'p2-10', title: 'Release first MCP tool as open source', status: 'todo', phase: 'phase-2', owner: ['lou'], priority: 'high', platform: 'GitHub' },
  { id: 'p2-11', title: 'Launch GitHub star campaign', status: 'todo', phase: 'phase-2', owner: ['mark'], priority: 'high', platform: 'GitHub' },
  { id: 'p2-12', title: 'Create GitHub Discussions for Prism community', status: 'todo', phase: 'phase-2', owner: ['lou'], priority: 'medium', platform: 'GitHub' },
  { id: 'p2-13', title: 'Host first Discord office hours', status: 'todo', phase: 'phase-2', owner: ['mark'], priority: 'medium', platform: 'Discord' },
  { id: 'p2-14', title: 'Recruit 3 beta users for case studies', status: 'todo', phase: 'phase-2', owner: ['mark', 'hazel'], priority: 'medium', platform: 'Website' },
  { id: 'p2-15', title: 'Add testimonials carousel to landing page', status: 'todo', phase: 'phase-2', owner: ['karl'], priority: 'medium', platform: 'Website' },
  { id: 'p2-16', title: 'Add case studies section to agency site', status: 'todo', phase: 'phase-2', owner: ['karl'], priority: 'medium', platform: 'Website' },
  { id: 'p2-17', title: 'SEO audit + add missing metadata', status: 'todo', phase: 'phase-2', owner: ['lou'], priority: 'low', platform: 'Website' },
  { id: 'p2-18', title: 'Write Newsletter #2', status: 'todo', phase: 'phase-2', owner: ['mark'], priority: 'medium', platform: 'Blog' },

  // === PHASE 3: Launch ===
  { id: 'p3-01', title: 'Research successful MCP/AI tool Product Hunt launches', status: 'todo', phase: 'phase-3', owner: ['mark'], priority: 'high', platform: 'Website' },
  { id: 'p3-02', title: 'Write PH tagline + description + first comment', status: 'todo', phase: 'phase-3', owner: ['jeff', 'mark'], priority: 'high', platform: 'Website' },
  { id: 'p3-03', title: 'Create Product Hunt media kit', status: 'todo', phase: 'phase-3', owner: ['karl'], priority: 'high', platform: 'Website' },
  { id: 'p3-04', title: 'Build PH community outreach list (50+ hunters)', status: 'todo', phase: 'phase-3', owner: ['mark'], priority: 'high', platform: 'Website' },
  { id: 'p3-05', title: 'Schedule launch week', status: 'todo', phase: 'phase-3', owner: ['mark'], priority: 'high', platform: 'Website' },
  { id: 'p3-06', title: 'All-hands launch day: reply to every PH comment', status: 'todo', phase: 'phase-3', owner: ['jeff', 'lou', 'karl', 'hazel', 'mark'], priority: 'high', platform: 'Website' },
  { id: 'p3-07', title: 'Coordinate social blast across all platforms on launch day', status: 'todo', phase: 'phase-3', owner: ['mark'], priority: 'high', platform: 'Twitter' },
  { id: 'p3-08', title: 'Send "Last chance: Founding Member pricing" email', status: 'todo', phase: 'phase-3', owner: ['mark'], priority: 'high', platform: 'Website' },
  { id: 'p3-09', title: 'Post scarcity campaign on LinkedIn + Twitter', status: 'todo', phase: 'phase-3', owner: ['mark'], priority: 'high', platform: 'LinkedIn' },
  { id: 'p3-10', title: 'Set up Stripe/PayPal billing (post-SEC)', status: 'todo', phase: 'phase-3', owner: ['lou'], priority: 'medium', platform: 'Website' },
  { id: 'p3-11', title: 'Process Founding Member onboardings', status: 'todo', phase: 'phase-3', owner: ['hazel'], priority: 'medium', platform: 'Website' },
  { id: 'p3-12', title: 'Build referral tracking system', status: 'todo', phase: 'phase-3', owner: ['lou'], priority: 'high', platform: 'Website' },
  { id: 'p3-13', title: 'Launch affiliate program (20% recurring)', status: 'todo', phase: 'phase-3', owner: ['mark'], priority: 'medium', platform: 'Website' },
  { id: 'p3-14', title: 'Reach out to 10 dev influencers for affiliate partnerships', status: 'todo', phase: 'phase-3', owner: ['mark'], priority: 'medium', platform: 'Twitter' },
  { id: 'p3-15', title: 'Set up LinkedIn Ads test ($500/mo)', status: 'todo', phase: 'phase-3', owner: ['mark'], priority: 'medium', platform: 'LinkedIn' },
  { id: 'p3-16', title: 'Create customer onboarding docs + video series', status: 'todo', phase: 'phase-3', owner: ['hazel'], priority: 'medium', platform: 'Website' },

  // === ONGOING ===
  { id: 'og-01', title: '1 Twitter thread or 3-5 tweets daily', status: 'todo', phase: 'ongoing', owner: ['mark'], priority: 'high', platform: 'Twitter' },
  { id: 'og-02', title: 'Engage with AI/dev community on Twitter daily', status: 'todo', phase: 'ongoing', owner: ['mark'], priority: 'high', platform: 'Twitter' },
  { id: 'og-03', title: 'Monitor Discord for community questions daily', status: 'todo', phase: 'ongoing', owner: ['mark'], priority: 'medium', platform: 'Discord' },
  { id: 'og-04', title: '3-4 LinkedIn posts weekly', status: 'todo', phase: 'ongoing', owner: ['mark'], priority: 'high', platform: 'LinkedIn' },
  { id: 'og-05', title: '1 YouTube tutorial or 3 Shorts weekly', status: 'todo', phase: 'ongoing', owner: ['lou'], priority: 'high', platform: 'YouTube' },
  { id: 'og-06', title: '1 blog post weekly', status: 'todo', phase: 'ongoing', owner: ['jeff', 'lou'], priority: 'high', platform: 'Blog' },
  { id: 'og-07', title: '3 Shorts/reels from existing footage weekly', status: 'todo', phase: 'ongoing', owner: ['karl'], priority: 'medium', platform: 'YouTube' },
  { id: 'og-08', title: '1-2 Reddit posts weekly (organic, helpful)', status: 'todo', phase: 'ongoing', owner: ['mark'], priority: 'medium', platform: 'Twitter' },
  { id: 'og-09', title: 'Review analytics weekly', status: 'todo', phase: 'ongoing', owner: ['mark'], priority: 'high', platform: 'Website' },
  { id: 'og-10', title: 'Newsletter monthly', status: 'todo', phase: 'ongoing', owner: ['mark'], priority: 'high', platform: 'Blog' },
  { id: 'og-11', title: 'Content performance review monthly', status: 'todo', phase: 'ongoing', owner: ['mark'], priority: 'high', platform: 'Website' },
  { id: 'og-12', title: 'Review waitlist numbers + MRR monthly', status: 'todo', phase: 'ongoing', owner: ['jeff', 'mark'], priority: 'high', platform: 'Website' },
  { id: 'og-13', title: 'New product demo video (reflecting latest) monthly', status: 'todo', phase: 'ongoing', owner: ['karl'], priority: 'medium', platform: 'YouTube' },
  { id: 'og-14', title: '1 case study published monthly', status: 'todo', phase: 'ongoing', owner: ['lou'], priority: 'medium', platform: 'Blog' },
  { id: 'og-15', title: '1 Newsletter monthly', status: 'todo', phase: 'ongoing', owner: ['mark'], priority: 'medium', platform: 'Blog' },
  { id: 'og-16', title: 'Content performance review + strategy adjustment monthly', status: 'todo', phase: 'ongoing', owner: ['mark'], priority: 'high', platform: 'Website' },
];

export function getTasksByPhase(phaseId: string): Task[] {
  return tasks.filter((t) => t.phase === phaseId);
}

export function getTasksByOwner(ownerId: string): Task[] {
  return tasks.filter((t) => t.owner.includes(ownerId));
}

export function getTasksByStatus(status: TaskStatus): Task[] {
  return tasks.filter((t) => t.status === status);
}

export function getPhaseProgress(phaseId: string): { done: number; total: number; percent: number } {
  const phaseTasks = getTasksByPhase(phaseId);
  const done = phaseTasks.filter((t) => t.status === 'done').length;
  const total = phaseTasks.length;
  return { done, total, percent: total > 0 ? Math.round((done / total) * 100) : 0 };
}
