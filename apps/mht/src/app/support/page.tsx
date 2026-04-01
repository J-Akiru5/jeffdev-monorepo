import type { Metadata } from 'next';
import { GlassCard } from '@/components/ui/glass-card';
import { Phone, Mail, MapPin, MessageSquare, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Support',
  description: 'Get help with your MHT services. Contact our local support team for internet or solar inquiries.',
};

export default function SupportPage() {
  return (
    <section className="py-16 sm:py-24" id="support">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-4">
            Support Center
          </h1>
          <p className="text-lg text-slate-500">
            Our local team is ready to help. Reach out through any of these channels.
          </p>
        </div>

        {/* Contact Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <GlassCard className="p-6" hover>
            <Phone className="h-6 w-6 text-blue-600 mb-3" strokeWidth={1.5} />
            <h3 className="text-base font-semibold text-slate-800 mb-1">Phone</h3>
            <p className="text-sm text-slate-500 mb-3">Call us directly for urgent concerns.</p>
            <p className="text-sm font-medium text-blue-600">+63 XXX XXX XXXX</p>
          </GlassCard>

          <GlassCard className="p-6" hover>
            <Mail className="h-6 w-6 text-blue-600 mb-3" strokeWidth={1.5} />
            <h3 className="text-base font-semibold text-slate-800 mb-1">Email</h3>
            <p className="text-sm text-slate-500 mb-3">For general inquiries and documentation.</p>
            <p className="text-sm font-medium text-blue-600">support@martinezhybrid.com</p>
          </GlassCard>

          <GlassCard className="p-6" hover>
            <MapPin className="h-6 w-6 text-blue-600 mb-3" strokeWidth={1.5} />
            <h3 className="text-base font-semibold text-slate-800 mb-1">Office</h3>
            <p className="text-sm text-slate-500 mb-3">Visit us in person during business hours.</p>
            <p className="text-sm font-medium text-slate-700">Dingle, Iloilo, Philippines</p>
          </GlassCard>
        </div>

        {/* Contact Form */}
        <GlassCard className="p-6 sm:p-10 max-w-2xl" id="support-form">
          <div className="flex items-center gap-3 mb-6">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-800">Send us a Message</h2>
          </div>
          <form className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="support-name" className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                <input
                  id="support-name"
                  type="text"
                  placeholder="Juan Dela Cruz"
                  className="w-full h-11 px-4 rounded-lg border border-slate-200 bg-white/80 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                />
              </div>
              <div>
                <label htmlFor="support-email" className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <input
                  id="support-email"
                  type="email"
                  placeholder="juan@email.com"
                  className="w-full h-11 px-4 rounded-lg border border-slate-200 bg-white/80 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                />
              </div>
            </div>
            <div>
              <label htmlFor="support-subject" className="block text-sm font-medium text-slate-700 mb-1.5">Subject</label>
              <select
                id="support-subject"
                className="w-full h-11 px-4 rounded-lg border border-slate-200 bg-white/80 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
              >
                <option value="">Select a topic...</option>
                <option value="internet">Internet Service (Nexure)</option>
                <option value="solar">Solar Installation (Joularix)</option>
                <option value="billing">Billing & Payments</option>
                <option value="technical">Technical Issue</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label htmlFor="support-message" className="block text-sm font-medium text-slate-700 mb-1.5">Message</label>
              <textarea
                id="support-message"
                rows={5}
                placeholder="Describe your concern..."
                className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white/80 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all resize-none"
              />
            </div>
            <button
              type="submit"
              className="h-11 px-8 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-md shadow-blue-600/20 active:scale-[0.98]"
              id="support-submit"
            >
              Send Message
            </button>
          </form>
        </GlassCard>

        {/* Business Hours */}
        <div className="mt-12 flex items-start gap-3 text-sm text-slate-500">
          <Clock className="h-4 w-4 mt-0.5 text-slate-400" />
          <p>
            <span className="font-medium text-slate-700">Business Hours:</span>{' '}
            Monday – Saturday, 8:00 AM – 5:00 PM (PHT)
          </p>
        </div>
      </div>
    </section>
  );
}
