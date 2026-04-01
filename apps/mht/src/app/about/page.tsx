import type { Metadata } from 'next';
import { GlassCard } from '@/components/ui/glass-card';
import { MHTLogo } from '@/components/ui/mht-logo';
import { Target, Users, MapPin, Lightbulb } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about Martinez Hybrid Technologies OPC — a Filipino startup delivering internet and solar energy solutions to Western Visayas.',
};

export default function AboutPage() {
  return (
    <section className="py-16 sm:py-24" id="about">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mb-16">
          <div className="flex items-center gap-3 mb-4">
            <MHTLogo className="h-10 w-10" />
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              About MHT
            </h1>
          </div>
          <p className="text-lg text-slate-500 leading-relaxed">
            Martinez Hybrid Technologies OPC is a Filipino One Person Corporation
            founded to bridge the digital and energy divide in Western Visayas.
            We believe that reliable internet and sustainable power are not
            luxuries — they are necessities.
          </p>
        </div>

        {/* Mission / Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          <GlassCard className="p-8" accent="blue">
            <Target className="h-8 w-8 text-blue-600 mb-4" strokeWidth={1.5} />
            <h2 className="text-xl font-bold text-slate-800 mb-3">Our Mission</h2>
            <p className="text-slate-500 leading-relaxed">
              To provide accessible, affordable, and reliable internet connectivity
              and clean energy solutions to underserved communities in the Philippines,
              starting with the municipalities of Iloilo.
            </p>
          </GlassCard>

          <GlassCard className="p-8" accent="green">
            <Lightbulb className="h-8 w-8 text-green-600 mb-4" strokeWidth={1.5} />
            <h2 className="text-xl font-bold text-slate-800 mb-3">Our Vision</h2>
            <p className="text-slate-500 leading-relaxed">
              A connected, energy-independent Western Visayas where every home
              and business has access to world-class internet and the power of
              the Philippine sun.
            </p>
          </GlassCard>
        </div>

        {/* Values */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-slate-800 mb-8">Our Values</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: MapPin, title: 'Community First', desc: 'We live where we serve. Our team is on the ground, speaking your language, understanding your needs.' },
              { icon: Users, title: 'Transparency', desc: 'No hidden fees, no surprise charges. Every peso is accounted for and every service is clearly defined.' },
              { icon: Target, title: 'Innovation', desc: 'We combine proven technology with local expertise to deliver solutions that actually work in the Philippine context.' },
            ].map((v) => (
              <GlassCard key={v.title} className="p-6" hover>
                <v.icon className="h-6 w-6 text-slate-600 mb-3" strokeWidth={1.5} />
                <h3 className="text-base font-semibold text-slate-800 mb-2">{v.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{v.desc}</p>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* Company Info */}
        <GlassCard className="p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Company Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-400 font-medium mb-1">Legal Name</p>
              <p className="text-slate-700">Martinez Hybrid Technologies OPC</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium mb-1">Type</p>
              <p className="text-slate-700">One Person Corporation (OPC)</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium mb-1">Location</p>
              <p className="text-slate-700">Dingle, Iloilo, Philippines</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium mb-1">Divisions</p>
              <p className="text-slate-700">Nexure Networks • Joularix Solar</p>
            </div>
          </div>
        </GlassCard>
      </div>
    </section>
  );
}
