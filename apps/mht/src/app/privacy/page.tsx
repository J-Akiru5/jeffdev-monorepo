import type { Metadata } from 'next';
import {
  ShieldCheck,
  Database,
  UserCheck,
  Bot,
  Users,
  Lock,
  Globe,
  FileWarning,
  Mail,
  Scale,
} from 'lucide-react';
import { PrivacyClient } from './privacy-client';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'Learn how Martinez Hybrid Technologies OPC collects, processes, stores, and protects your personal data in compliance with the Philippine Data Privacy Act of 2012 (RA 10173).',
};

export const sections = [
  { id: 'overview', title: 'Overview', icon: <ShieldCheck className="h-4 w-4" strokeWidth={1.5} /> },
  { id: 'data-collection', title: 'Data Collection', icon: <Database className="h-4 w-4" strokeWidth={1.5} /> },
  { id: 'purpose', title: 'Purpose of Processing', icon: <Globe className="h-4 w-4" strokeWidth={1.5} /> },
  { id: 'dpo', title: 'Data Protection Officer', icon: <UserCheck className="h-4 w-4" strokeWidth={1.5} /> },
  { id: 'ai-processing', title: 'AI & Automated Processing', icon: <Bot className="h-4 w-4" strokeWidth={1.5} /> },
  { id: 'data-security', title: 'Data Security', icon: <Lock className="h-4 w-4" strokeWidth={1.5} /> },
  { id: 'user-rights', title: 'Your Rights', icon: <Users className="h-4 w-4" strokeWidth={1.5} /> },
  { id: 'data-sharing', title: 'Data Sharing', icon: <Globe className="h-4 w-4" strokeWidth={1.5} /> },
  { id: 'data-retention', title: 'Data Retention', icon: <FileWarning className="h-4 w-4" strokeWidth={1.5} /> },
  { id: 'contact', title: 'Contact & Complaints', icon: <Mail className="h-4 w-4" strokeWidth={1.5} /> },
  { id: 'amendments', title: 'Amendments', icon: <Scale className="h-4 w-4" strokeWidth={1.5} /> },
];

export default function PrivacyPage() {
  return <PrivacyClient sections={sections} />;
}
