import type { Metadata } from 'next';
import {
  FileText,
  Wifi,
  Sun,
  Bot,
  AlertTriangle,
  Scale,
  ShieldCheck,
  CreditCard,
  Wrench,
  Ban,
  RefreshCw,
} from 'lucide-react';
import { TermsClient } from './terms-client';

export const metadata: Metadata = {
  title: 'Terms and Conditions',
  description:
    'Read the Terms and Conditions governing the use of services provided by Martinez Hybrid Technologies OPC, operating under the trade names Nexure Networks and Joularix Solar.',
};

export const sections = [
  { id: 'introduction', title: 'Introduction', icon: <FileText className="h-4 w-4" strokeWidth={1.5} /> },
  { id: 'definitions', title: 'Definitions', icon: <Scale className="h-4 w-4" strokeWidth={1.5} /> },
  { id: 'nexure-services', title: 'Nexure Networks', icon: <Wifi className="h-4 w-4" strokeWidth={1.5} /> },
  { id: 'nexure-interruption', title: 'Service Interruptions', icon: <AlertTriangle className="h-4 w-4" strokeWidth={1.5} /> },
  { id: 'joularix-services', title: 'Joularix Solar', icon: <Sun className="h-4 w-4" strokeWidth={1.5} /> },
  { id: 'joularix-warranty', title: 'Hardware Warranty', icon: <Wrench className="h-4 w-4" strokeWidth={1.5} /> },
  { id: 'ai-support', title: 'AI Support', icon: <Bot className="h-4 w-4" strokeWidth={1.5} /> },
  { id: 'payment-terms', title: 'Payment & Billing', icon: <CreditCard className="h-4 w-4" strokeWidth={1.5} /> },
  { id: 'limitation', title: 'Limitation of Liability', icon: <ShieldCheck className="h-4 w-4" strokeWidth={1.5} /> },
  { id: 'termination', title: 'Termination', icon: <Ban className="h-4 w-4" strokeWidth={1.5} /> },
  { id: 'amendments', title: 'Amendments', icon: <RefreshCw className="h-4 w-4" strokeWidth={1.5} /> },
];

export default function TermsPage() {
  return <TermsClient sections={sections} />;
}
