export type TeamMember = {
  id: string;
  name: string;
  role: string;
  initials: string;
  color: 'cyan' | 'purple' | 'emerald' | 'amber' | 'rose';
  focus: string;
};

export const team: TeamMember[] = [
  {
    id: 'jeff',
    name: 'Jeff Edrick Martinez',
    role: 'CEO & Founder',
    initials: 'JM',
    color: 'cyan',
    focus: 'Strategy, vision, fundraising',
  },
  {
    id: 'lou',
    name: 'Lou',
    role: 'CTO',
    initials: 'LC',
    color: 'purple',
    focus: 'Engineering, product architecture',
  },
  {
    id: 'karl',
    name: 'Karl',
    role: 'CPO',
    initials: 'KD',
    color: 'emerald',
    focus: 'Product design, UX, brand assets',
  },
  {
    id: 'hazel',
    name: 'Hazel',
    role: 'COO',
    initials: 'HM',
    color: 'amber',
    focus: 'Operations, partnerships, onboarding',
  },
  {
    id: 'mark',
    name: 'Mark',
    role: 'CMO',
    initials: 'MM',
    color: 'rose',
    focus: 'Marketing, content, social media',
  },
];
