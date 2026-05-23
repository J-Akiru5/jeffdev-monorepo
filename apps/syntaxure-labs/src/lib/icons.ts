/**
 * Icon Mapper
 * -----------
 * Maps icon string names to Lucide React components.
 * Used to restore icons from Firestore data.
 */

import { 
  Globe, 
  Cloud, 
  Cpu, 
  Sparkles, 
  Code, 
  Palette,
  Database,
  Shield,
  Zap,
  type LucideIcon 
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  Globe,
  Cloud,
  Cpu,
  Sparkles,
  Code,
  Palette,
  Database,
  Shield,
  Zap,
};

export function getIcon(name: string): LucideIcon {
  return iconMap[name] || Globe;
}
