import type { Metadata } from 'next';
import Image from 'next/image';
import { GlassCard } from '@/components/ui/glass-card';
import { MHTLogo } from '@/components/ui/mht-logo';
import Link from 'next/link';
import {
  Target,
  Eye,
  Users,
  MapPin,
  Lightbulb,
  Wifi,
  Sun,
  Building2,
  UserCircle,
  Network,
  Zap,
  Globe,
  Wrench,
  BarChart3,
  Shield,
  Heart,
  ArrowRight,
  Download,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us',
  description:
    'Learn about Martinez Hybrid Technologies OPC — a dynamic One Person Corporation empowering communities in Western Visayas with robust connectivity and sustainable solar energy.',
};

export default function AboutPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="py-16 sm:py-24 relative overflow-hidden" id="about-hero">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-16">
            <div className="flex items-center gap-3 mb-6">
              <MHTLogo className="h-12 w-12" />
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                  About Martinez Hybrid Technologies
                </h1>
              </div>
            </div>
            <p className="text-lg text-slate-500 leading-relaxed mb-4">
              Martinez Hybrid Technologies OPC is a dynamic One Person Corporation (OPC) dedicated
              to bridging the gap between critical infrastructure needs and sustainable,
              future-ready solutions.
            </p>
            <p className="text-base text-slate-500 leading-relaxed">
              Based in <strong className="text-slate-700">Western Visayas, Philippines</strong>,
              the company operates as a unique hybrid enterprise, integrating localized
              telecommunications services with advanced renewable energy solutions. By leveraging
              technology on two fronts, we empower communities with robust connectivity and
              sustainable power generation.
            </p>
          </div>

          {/* Mission / Vision */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20">
            <GlassCard className="p-8 sm:p-10" accent="blue">
              <Target className="h-9 w-9 text-blue-600 mb-5" strokeWidth={1.5} />
              <h2 className="text-xl font-bold text-slate-800 mb-3">Our Mission</h2>
              <p className="text-slate-500 leading-relaxed">
                To empower local communities and businesses through the seamless integration of
                accessible, high-speed digital connectivity and efficient, sustainable renewable
                energy systems.
              </p>
            </GlassCard>

            <GlassCard className="p-8 sm:p-10" accent="green">
              <Eye className="h-9 w-9 text-green-600 mb-5" strokeWidth={1.5} />
              <h2 className="text-xl font-bold text-slate-800 mb-3">Our Vision</h2>
              <p className="text-slate-500 leading-relaxed">
                To be a leading force in fostering self-sufficient and digitally-integrated
                communities across the Philippines, where reliable power and internet access are
                fundamental catalysts for growth and opportunity.
              </p>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* Core Divisions Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-transparent to-blue-50/20" id="business-divisions">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-3">
              Core Business Divisions
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              We operate two distinct divisions — each focused on a critical pillar of community
              empowerment.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Nexure Networks */}
            <GlassCard className="p-8 sm:p-10" accent="blue">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 text-blue-600">
                  <Wifi className="h-6 w-6" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Nexure Networks</h3>
                  <p className="text-xs font-medium text-blue-600 tracking-wide uppercase">
                    Micro-ISP &amp; Connectivity Solutions
                  </p>
                </div>
              </div>
              <p className="text-slate-500 leading-relaxed mb-6">
                Nexure Networks specializes in deploying and managing advanced, localized network
                infrastructure to provide reliable, high-speed internet access. Operating as an
                authorized network reseller and value-added service (VAS) provider, we focus on
                bridging digital divides.
              </p>
              <div className="space-y-3">
                {[
                  { icon: Globe, label: 'Localized WiFi Subscription Services' },
                  { icon: Network, label: 'Residential & Commercial Internet Installation' },
                  { icon: Wrench, label: 'LAN Deployment & Management' },
                  { icon: BarChart3, label: 'Network Consulting & Support' },
                ].map((service) => (
                  <div
                    key={service.label}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-blue-50/50 border border-blue-100/50"
                  >
                    <service.icon className="h-4 w-4 text-blue-500 shrink-0" strokeWidth={1.5} />
                    <span className="text-sm text-slate-600 font-medium">{service.label}</span>
                  </div>
                ))}
              </div>
              <Link
                href="/nexure"
                className="inline-flex items-center gap-2 mt-6 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors group"
              >
                Learn more about Nexure{' '}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </GlassCard>

            {/* Joularix Solar */}
            <GlassCard className="p-8 sm:p-10" accent="green">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-green-100 text-green-600">
                  <Sun className="h-6 w-6" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Joularix Solar</h3>
                  <p className="text-xs font-medium text-green-600 tracking-wide uppercase">
                    Smart Solar &amp; Renewable Energy
                  </p>
                </div>
              </div>
              <p className="text-slate-500 leading-relaxed mb-6">
                Joularix Solar is dedicated to the design, supply, installation, and maintenance of
                high-performance solar energy systems. As a smart-grid specialist, we help
                residential and commercial clients transition to clean energy.
              </p>
              <div className="space-y-3">
                {[
                  { icon: Zap, label: 'Solar Energy System Design & Installation' },
                  { icon: Sun, label: 'Renewable Energy Equipment Sales' },
                  { icon: Lightbulb, label: 'Residential & Commercial Energy Consulting' },
                  { icon: Wrench, label: 'System Maintenance & Support' },
                ].map((service) => (
                  <div
                    key={service.label}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-green-50/50 border border-green-100/50"
                  >
                    <service.icon className="h-4 w-4 text-green-500 shrink-0" strokeWidth={1.5} />
                    <span className="text-sm text-slate-600 font-medium">{service.label}</span>
                  </div>
                ))}
              </div>
              <Link
                href="/joularix"
                className="inline-flex items-center gap-2 mt-6 text-sm font-semibold text-green-600 hover:text-green-700 transition-colors group"
              >
                Learn more about Joularix{' '}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 sm:py-20" id="values">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-3">
              What We Stand For
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              Our values drive every decision, from network deployment to solar installation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: MapPin,
                title: 'Community First',
                desc: 'We live where we serve. Our team is on the ground, speaking your language, understanding your needs.',
                color: 'blue' as const,
              },
              {
                icon: Shield,
                title: 'Transparency',
                desc: 'No hidden fees, no surprise charges. Every peso is accounted for and every service is clearly defined.',
                color: 'green' as const,
              },
              {
                icon: Lightbulb,
                title: 'Innovation',
                desc: 'We combine proven technology with local expertise to deliver solutions that actually work in the Philippine context.',
                color: 'blue' as const,
              },
              {
                icon: Heart,
                title: 'Sustainability',
                desc: 'We build for the long term — both in the technology we deploy and the communities we serve.',
                color: 'green' as const,
              },
            ].map((v) => (
              <GlassCard key={v.title} className="p-6" hover>
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-lg mb-4 ${
                    v.color === 'blue' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                  }`}
                >
                  <v.icon className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <h3 className="text-base font-semibold text-slate-800 mb-2">{v.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{v.desc}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership & Legal */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-transparent to-green-50/20" id="leadership">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Leadership */}
            <GlassCard className="p-8 sm:p-10">
              <div className="flex items-center gap-3 mb-6">
                <UserCircle className="h-8 w-8 text-slate-600" strokeWidth={1.5} />
                <h2 className="text-xl font-bold text-slate-800">Leadership</h2>
              </div>
              <div className="space-y-5">
                <div className="flex items-start gap-4 p-4 rounded-lg bg-slate-50/80 border border-slate-100">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-green-500 text-white font-bold text-lg shrink-0">
                    JM
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">Jeff Martinez</h3>
                    <p className="text-sm text-blue-600 font-medium">
                      President &amp; Single Stockholder
                    </p>
                    <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                      Founder and chief architect of the Company&apos;s hybrid model, combining
                      telecommunications and renewable energy expertise to serve Filipino communities.
                    </p>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Company Information */}
            <GlassCard className="p-8 sm:p-10">
              <div className="flex items-center gap-3 mb-6">
                <Building2 className="h-8 w-8 text-slate-600" strokeWidth={1.5} />
                <h2 className="text-xl font-bold text-slate-800">Company Information</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {[
                  { label: 'Legal Name', value: 'Martinez Hybrid Technologies OPC' },
                  { label: 'Entity Type', value: 'One Person Corporation (OPC)' },
                  { label: 'Principal Location', value: 'Western Visayas, Philippines' },
                  { label: 'Trade Names', value: 'Nexure Networks • Joularix Solar' },
                  { label: 'Registration', value: 'SEC Filing Phase' },
                  { label: 'Sector', value: 'Telecommunications & Renewable Energy' },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      {item.label}
                    </p>
                    <p className="text-sm text-slate-700 font-medium">{item.value}</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* Brand Assets Section */}
      <section className="py-16 sm:py-20" id="brand-assets">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-3">
              Brand Assets
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              Official Martinez Hybrid Technologies media kits.
            </p>
          </div>

          <GlassCard className="p-8 sm:p-12">
            <div className="flex flex-col">
              <div className="flex-1 flex items-center justify-center rounded-lg overflow-hidden border border-slate-200 bg-white relative min-h-[400px]">
                <Image
                  src="/nexure-business-card.png"
                  alt="Nexure Networks Digital Business Card"
                  fill
                  className="object-cover shadow-sm"
                />
              </div>
              <div className="mt-6 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-800">Digital Business Card</h3>
                  <p className="text-sm text-slate-500">High-resolution PNG</p>
                </div>
                <a
                  href="/nexure-business-card.png"
                  download
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-blue-600 transition-colors hover:bg-blue-600 hover:text-white"
                  title="Download Digital Business Card"
                >
                  <Download className="h-5 w-5" />
                </a>
              </div>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20" id="about-cta">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <GlassCard className="p-8 sm:p-12">
            <Users className="h-10 w-10 text-blue-600 mx-auto mb-4" strokeWidth={1.5} />
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-3">
              Let&apos;s Work Together
            </h2>
            <p className="text-slate-500 mb-8 max-w-xl mx-auto">
              Whether you need reliable internet or smart solar solutions, our team is ready to
              help your community thrive.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/quote">
                <button className="h-12 px-8 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors shadow-md shadow-blue-600/20 active:scale-[0.98]">
                  Request a Quote
                </button>
              </Link>
              <Link href="/support">
                <button className="h-12 px-8 rounded-lg border-2 border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors active:scale-[0.98]">
                  Contact Support
                </button>
              </Link>
            </div>
          </GlassCard>
        </div>
      </section>
    </>
  );
}
