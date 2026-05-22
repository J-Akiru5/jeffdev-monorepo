export type Phase = {
  id: string;
  name: string;
  timeframe: string;
  description: string;
  totalTasks: number;
  completedTasks: number;
  color: string;
};

export const phases: Phase[] = [
  {
    id: 'phase-1',
    name: 'Foundation',
    timeframe: 'May-June 2026',
    description: 'Build the audience engine — accounts, waitlist, first content wave, visual assets.',
    totalTasks: 30,
    completedTasks: 0,
    color: 'cyan',
  },
  {
    id: 'phase-2',
    name: 'Authority Building',
    timeframe: 'July-August 2026',
    description: 'Content engine, open-source releases, case studies, social proof.',
    totalTasks: 18,
    completedTasks: 0,
    color: 'purple',
  },
  {
    id: 'phase-3',
    name: 'Launch',
    timeframe: 'September-October 2026',
    description: 'Product Hunt launch, Founding Member conversion, paid ads, growth levers.',
    totalTasks: 16,
    completedTasks: 0,
    color: 'emerald',
  },
  {
    id: 'ongoing',
    name: 'Ongoing',
    timeframe: 'Running daily/weekly/monthly',
    description: 'Sustained content, community, analytics, and iteration.',
    totalTasks: 16,
    completedTasks: 0,
    color: 'amber',
  },
];

export const kpis = [
  { label: 'Waitlist Signups', current: 0, target: 1500, unit: '' },
  { label: 'LinkedIn Followers', current: 0, target: 2000, unit: '' },
  { label: 'Twitter Followers', current: 0, target: 3000, unit: '' },
  { label: 'YouTube Subs', current: 0, target: 1000, unit: '' },
  { label: 'GitHub Stars', current: 0, target: 1000, unit: '' },
  { label: 'MRR', current: 0, target: 1500, unit: '$' },
  { label: 'Pay Customers', current: 0, target: 75, unit: '' },
  { label: 'Discord Members', current: 0, target: 500, unit: '' },
];
