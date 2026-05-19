import type { Metadata } from 'next';
import { GlassCard } from '@/components/ui/glass-card';
import { MHTButton } from '@/components/ui/mht-button';
import { FileText, Wifi, Sun } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Get a Quote',
  description: 'Request a free, no-obligation quote for internet or solar services from Martinez Hybrid Technologies.',
};

export default function QuotePage() {
  return (
    <section className="py-16 sm:py-24" id="quote">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <FileText className="h-6 w-6 text-blue-600" strokeWidth={1.5} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-3">
            Get a Free Quote
          </h1>
          <p className="text-lg text-slate-500 max-w-xl mx-auto">
            Tell us what you need and we will prepare a custom proposal.
            No obligations, no hidden fees.
          </p>
        </div>

        <GlassCard className="p-6 sm:p-10" id="quote-form-card">
          <form className="space-y-6">
            {/* Service Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Which service are you interested in?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 bg-white/50 cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
                  <input type="radio" name="service" value="internet" className="accent-blue-600" />
                  <Wifi className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-slate-700">Internet (Nexure)</span>
                </label>
                <label className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 bg-white/50 cursor-pointer hover:border-green-300 hover:bg-green-50/30 transition-all has-[:checked]:border-green-500 has-[:checked]:bg-green-50">
                  <input type="radio" name="service" value="solar" className="accent-green-600" />
                  <Sun className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-slate-700">Solar (Joularix)</span>
                </label>
              </div>
            </div>

            {/* Personal Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="quote-name" className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                <input
                  id="quote-name"
                  type="text"
                  required
                  placeholder="Juan Dela Cruz"
                  className="w-full h-11 px-4 rounded-lg border border-slate-200 bg-white/80 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                />
              </div>
              <div>
                <label htmlFor="quote-phone" className="block text-sm font-medium text-slate-700 mb-1.5">Phone Number</label>
                <input
                  id="quote-phone"
                  type="tel"
                  required
                  placeholder="09XX XXX XXXX"
                  className="w-full h-11 px-4 rounded-lg border border-slate-200 bg-white/80 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="quote-email" className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
              <input
                id="quote-email"
                type="email"
                required
                placeholder="juan@email.com"
                className="w-full h-11 px-4 rounded-lg border border-slate-200 bg-white/80 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
              />
            </div>

            <div>
              <label htmlFor="quote-address" className="block text-sm font-medium text-slate-700 mb-1.5">Complete Address / Barangay</label>
              <input
                id="quote-address"
                type="text"
                required
                placeholder="Barangay, Municipality, Province"
                className="w-full h-11 px-4 rounded-lg border border-slate-200 bg-white/80 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
              />
            </div>

            <div>
              <label htmlFor="quote-details" className="block text-sm font-medium text-slate-700 mb-1.5">Additional Details</label>
              <textarea
                id="quote-details"
                rows={4}
                placeholder="Tell us more about your needs (e.g., monthly bill for solar, number of devices for internet)..."
                className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white/80 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all resize-none"
              />
            </div>

            <MHTButton type="submit" variant="blue" size="lg" className="w-full" id="quote-submit">
              Request Quote
            </MHTButton>

            <p className="text-center text-xs text-slate-400">
              We typically respond within 24 hours during business days.
            </p>
          </form>
        </GlassCard>
      </div>
    </section>
  );
}
