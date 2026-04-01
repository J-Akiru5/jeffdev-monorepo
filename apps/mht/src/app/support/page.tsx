import type { Metadata } from 'next';
import { GlassCard } from '@/components/ui/glass-card';
import Link from 'next/link';
import { FadeIn, FadeInStagger, FadeInItem } from '@/components/ui/fade-in';
import {
  Phone,
  Mail,
  MapPin,
  MessageSquare,
  Clock,
  Wifi,
  Sun,
  Bot,
  HelpCircle,
  CreditCard,
  Wrench,
  FileText,
  ChevronRight,
  Zap,
  AlertTriangle,
  Shield,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Support Center',
  description:
    'Get help with your Nexure Networks internet or Joularix Solar services. Contact our local team or use our 24/7 AI support.',
};

export default function SupportPage() {
  return (
    <>
      {/* Hero */}
      <section className="py-16 sm:py-24" id="support-hero">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn className="max-w-3xl mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-100 mb-5">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse-green" />
              <span className="text-xs font-semibold text-green-700 tracking-wide">
                AI Support Available 24/7
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-4">
              Support Center
            </h1>
            <p className="text-lg text-slate-500 leading-relaxed">
              Our team and AI-powered support agents are here to help you with internet connectivity,
              solar services, billing, and more.
            </p>
          </FadeIn>

          {/* Contact Cards */}
          <FadeInStagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
            <FadeInItem>
              <GlassCard className="p-6 h-full" hover>
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 text-blue-600 mb-4">
                <Phone className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <h3 className="text-sm font-semibold text-slate-800 mb-1">Phone</h3>
              <p className="text-xs text-slate-500 mb-3">Call us directly for urgent concerns.</p>
              <div className="space-y-1">
                <p className="text-sm font-mono font-semibold text-blue-600">0951 916 7103</p>
                <p className="text-sm font-mono font-semibold text-slate-500 text-xs">0998 386 0315 (Alt)</p>
              </div>
            </GlassCard>
            </FadeInItem>

            <FadeInItem>
              <GlassCard className="p-6 h-full" hover>
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 text-blue-600 mb-4">
                <Mail className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <h3 className="text-sm font-semibold text-slate-800 mb-1">Email</h3>
              <p className="text-xs text-slate-500 mb-3">General inquiries and documentation.</p>
              <a
                href="mailto:martinezhybrid.opc@gmail.com"
                className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                martinezhybrid.opc@gmail.com
              </a>
            </GlassCard>
            </FadeInItem>

            <FadeInItem>
              <GlassCard className="p-6 h-full" hover>
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-100 text-green-600 mb-4">
                <Bot className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <h3 className="text-sm font-semibold text-slate-800 mb-1">AI Assistant</h3>
              <p className="text-xs text-slate-500 mb-3">Instant help, 24/7, no waiting.</p>
              <p className="text-sm font-medium text-green-600">
                Available Now
              </p>
            </GlassCard>
            </FadeInItem>

            <FadeInItem>
              <GlassCard className="p-6 h-full" hover>
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 text-slate-600 mb-4">
                <MapPin className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <h3 className="text-sm font-semibold text-slate-800 mb-1">Visit Us</h3>
              <p className="text-xs text-slate-500 mb-3">Walk in during business hours.</p>
              <p className="text-sm font-medium text-slate-700">Dingle, Iloilo, Philippines</p>
            </GlassCard>
            </FadeInItem>
          </FadeInStagger>
        </div>
      </section>

      {/* FAQ / Quick Help */}
      <section className="py-12 sm:py-16 bg-gradient-to-b from-transparent to-blue-50/20" id="quick-help">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-3">
              Common Topics
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              Find quick answers to frequently asked questions by category.
            </p>
          </FadeIn>

          <FadeInStagger className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {/* Nexure Networks FAQ */}
            <FadeInItem>
              <GlassCard className="p-6 sm:p-8 h-full" accent="blue">
              <div className="flex items-center gap-3 mb-6">
                <Wifi className="h-5 w-5 text-blue-600" strokeWidth={1.5} />
                <h3 className="text-lg font-bold text-slate-800">Nexure Networks</h3>
              </div>
              <div className="space-y-3">
                {[
                  {
                    icon: Zap,
                    question: 'My internet is slow',
                    answer: 'Try restarting your router. If the issue persists, contact us for a free line check.',
                  },
                  {
                    icon: AlertTriangle,
                    question: 'Service outage in my area',
                    answer: 'Check our social media for announcements. You are entitled to a pro-rated refund for outages beyond our control.',
                  },
                  {
                    icon: CreditCard,
                    question: 'How do I pay my subscription?',
                    answer: 'Pay via GCash, Maya, or bank transfer. Check your welcome email for account details.',
                  },
                  {
                    icon: HelpCircle,
                    question: 'How do I upgrade my plan?',
                    answer: 'Send us a message or visit our office. Plan changes take effect on your next billing cycle.',
                  },
                ].map((faq) => (
                  <details key={faq.question} className="group rounded-lg border border-blue-100/60 bg-white/40">
                    <summary className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors">
                      <faq.icon className="h-4 w-4 text-blue-500 shrink-0" strokeWidth={1.5} />
                      <span className="flex-1">{faq.question}</span>
                      <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-90" />
                    </summary>
                    <p className="px-4 pb-3 pl-11 text-sm text-slate-500 leading-relaxed">
                      {faq.answer}
                    </p>
                  </details>
                ))}
              </div>
            </GlassCard>
            </FadeInItem>

            {/* Joularix Solar FAQ */}
            <FadeInItem>
            <GlassCard className="p-6 sm:p-8 h-full" accent="green">
              <div className="flex items-center gap-3 mb-6">
                <Sun className="h-5 w-5 text-green-600" strokeWidth={1.5} />
                <h3 className="text-lg font-bold text-slate-800">Joularix Solar</h3>
              </div>
              <div className="space-y-3">
                {[
                  {
                    icon: Wrench,
                    question: 'Is maintenance really free?',
                    answer: 'Yes, routine maintenance is free as per your contract terms. Contact us to schedule your next check-up.',
                  },
                  {
                    icon: Shield,
                    question: 'My inverter is showing an error',
                    answer: 'Note the error code and contact us immediately. Do not attempt to open or repair the equipment yourself.',
                  },
                  {
                    icon: FileText,
                    question: 'How do I file a warranty claim?',
                    answer: 'Contact us with your contract number and equipment serial numbers. We\'ll handle the manufacturer claim process for you.',
                  },
                  {
                    icon: HelpCircle,
                    question: 'Can I expand my system?',
                    answer: 'Absolutely. We offer system expansion consulting. We\'ll assess your current setup and recommend the optimal upgrade path.',
                  },
                ].map((faq) => (
                  <details key={faq.question} className="group rounded-lg border border-green-100/60 bg-white/40">
                    <summary className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors">
                      <faq.icon className="h-4 w-4 text-green-500 shrink-0" strokeWidth={1.5} />
                      <span className="flex-1">{faq.question}</span>
                      <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-90" />
                    </summary>
                    <p className="px-4 pb-3 pl-11 text-sm text-slate-500 leading-relaxed">
                      {faq.answer}
                    </p>
                  </details>
                ))}
              </div>
            </GlassCard>
            </FadeInItem>
          </FadeInStagger>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-12 sm:py-20" id="contact-form">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Form */}
            <div className="lg:col-span-3">
              <GlassCard className="p-6 sm:p-10" id="support-form">
                <div className="flex items-center gap-3 mb-8">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 text-blue-600">
                    <MessageSquare className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Send us a Message</h2>
                    <p className="text-xs text-slate-500">
                      We typically respond within 24 hours during business days.
                    </p>
                  </div>
                </div>
                <form className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="support-name"
                        className="block text-sm font-medium text-slate-700 mb-1.5"
                      >
                        Full Name
                      </label>
                      <input
                        id="support-name"
                        type="text"
                        placeholder="Juan Dela Cruz"
                        className="w-full h-11 px-4 rounded-lg border border-slate-200 bg-white/80 text-sm text-slate-700 font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="support-email"
                        className="block text-sm font-medium text-slate-700 mb-1.5"
                      >
                        Email Address
                      </label>
                      <input
                        id="support-email"
                        type="email"
                        placeholder="juan@email.com"
                        className="w-full h-11 px-4 rounded-lg border border-slate-200 bg-white/80 text-sm text-slate-700 font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="support-phone"
                        className="block text-sm font-medium text-slate-700 mb-1.5"
                      >
                        Phone Number
                      </label>
                      <input
                        id="support-phone"
                        type="tel"
                        placeholder="+63 9XX XXX XXXX"
                        className="w-full h-11 px-4 rounded-lg border border-slate-200 bg-white/80 text-sm text-slate-700 font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="support-subject"
                        className="block text-sm font-medium text-slate-700 mb-1.5"
                      >
                        Subject
                      </label>
                      <select
                        id="support-subject"
                        className="w-full h-11 px-4 rounded-lg border border-slate-200 bg-white/80 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                      >
                        <option value="">Select a topic...</option>
                        <option value="internet">Internet Service (Nexure)</option>
                        <option value="solar">Solar Installation (Joularix)</option>
                        <option value="billing">Billing &amp; Payments</option>
                        <option value="technical">Technical Issue</option>
                        <option value="warranty">Warranty Claim</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="support-account"
                      className="block text-sm font-medium text-slate-700 mb-1.5"
                    >
                      Account / Contract Number{' '}
                      <span className="text-slate-400 font-normal">(optional)</span>
                    </label>
                    <input
                      id="support-account"
                      type="text"
                      placeholder="e.g., NXR-2026-001"
                      className="w-full h-11 px-4 rounded-lg border border-slate-200 bg-white/80 text-sm text-slate-700 font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="support-message"
                      className="block text-sm font-medium text-slate-700 mb-1.5"
                    >
                      Message
                    </label>
                    <textarea
                      id="support-message"
                      rows={5}
                      placeholder="Describe your concern in detail..."
                      className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white/80 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all resize-none"
                    />
                  </div>

                  {/* Privacy consent */}
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="support-consent"
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="support-consent" className="text-xs text-slate-500 leading-relaxed">
                      I consent to Martinez Hybrid Technologies OPC processing my personal data for
                      the purpose of addressing my inquiry in compliance with the{' '}
                      <Link href="/privacy" className="font-medium text-blue-600 hover:text-blue-700">
                        Privacy Policy
                      </Link>{' '}
                      and Republic Act No. 10173.
                    </label>
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
            </div>

            {/* Sidebar Info */}
            <div className="lg:col-span-2 space-y-5">
              {/* Business Hours */}
              <GlassCard className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Clock className="h-5 w-5 text-blue-600" strokeWidth={1.5} />
                  <h3 className="text-base font-bold text-slate-800">Business Hours</h3>
                </div>
                <div className="space-y-2.5 text-sm">
                  {[
                    { day: 'Monday – Friday', hours: '8:00 AM – 5:00 PM', active: true },
                    { day: 'Saturday', hours: '8:00 AM – 12:00 PM', active: true },
                    { day: 'Sunday', hours: 'Closed', active: false },
                    { day: 'Holidays', hours: 'Closed', active: false },
                  ].map((schedule) => (
                    <div
                      key={schedule.day}
                      className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50/80"
                    >
                      <span className="text-slate-600 font-medium">{schedule.day}</span>
                      <span
                        className={`font-mono text-xs ${
                          schedule.active ? 'text-green-600' : 'text-slate-400'
                        }`}
                      >
                        {schedule.hours}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-4">
                  All times are in Philippine Standard Time (PHT / UTC+8).
                </p>
              </GlassCard>

              {/* AI Support Notice */}
              <GlassCard className="p-6" accent="green">
                <div className="flex items-center gap-3 mb-4">
                  <Bot className="h-5 w-5 text-green-600" strokeWidth={1.5} />
                  <h3 className="text-base font-bold text-slate-800">24/7 AI Support</h3>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed mb-4">
                  Our AI-powered agents can help you with common issues instantly — even outside
                  business hours. Topics include:
                </p>
                <ul className="space-y-2 text-sm text-slate-600">
                  {[
                    'Account status & balance checks',
                    'Basic troubleshooting guides',
                    'Service availability inquiries',
                    'Payment confirmation',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-slate-400 mt-4">
                  Complex issues are escalated to human agents during business hours.
                </p>
              </GlassCard>

              {/* Emergency */}
              <GlassCard className="p-6 border-t-2 border-t-amber-400">
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="h-5 w-5 text-amber-500" strokeWidth={1.5} />
                  <h3 className="text-base font-bold text-slate-800">Emergency</h3>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed">
                  For electrical safety concerns related to solar installations, please contact our
                  emergency line immediately. <strong>Do not attempt to repair equipment yourself.</strong>
                </p>
                <div className="mt-4 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-50 border border-amber-100">
                  <Phone className="h-4 w-4 text-amber-600" strokeWidth={1.5} />
                  <span className="text-sm font-mono font-semibold text-amber-700">
                    0951 916 7103
                  </span>
                </div>
              </GlassCard>

              {/* Legal Links */}
              <div className="flex gap-3 text-xs">
                <Link
                  href="/terms"
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-white/60 border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-white/80 transition-colors"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Terms & Conditions
                </Link>
                <Link
                  href="/privacy"
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-white/60 border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-white/80 transition-colors"
                >
                  <Shield className="h-3.5 w-3.5" />
                  Privacy Policy
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
