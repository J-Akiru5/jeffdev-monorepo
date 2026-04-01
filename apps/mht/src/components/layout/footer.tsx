import React from 'react';
import Link from 'next/link';
import { MHTLogo } from '@/components/ui/mht-logo';

const footerLinks = {
  services: [
    { label: 'Nexure Networks', href: '/nexure' },
    { label: 'Joularix Solar', href: '/joularix' },
    { label: 'Get a Quote', href: '/quote' },
  ],
  company: [
    { label: 'About', href: '/about' },
    { label: 'Support', href: '/support' },
    { label: 'Subscriber Portal', href: '/login' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'NTC Compliance', href: '/ntc-compliance' },
  ],
};

export function Footer() {
  return (
    <footer className="bg-slate-900 text-white" id="footer">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main Footer */}
        <div className="py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <MHTLogo className="h-8 w-8" variant="white" />
              <span className="text-lg font-bold tracking-tight">MHT</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
              Empowering communities in Western Visayas with next-generation
              connectivity and sustainable energy solutions.
            </p>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-4">
              Services
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.services.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-4">
              Company
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-4">
              Legal
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar — SEC/Legal Compliance */}
        <div className="border-t border-slate-800 py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <p className="text-sm font-medium text-slate-300">
                Martinez Hybrid Technologies OPC
              </p>
              <p className="text-xs text-slate-500 mt-1">
                © {new Date().getFullYear()} All rights reserved.
              </p>
            </div>
          </div>

          {/* NTC Legal Disclaimer — CRITICAL */}
          <p className="mt-6 text-[11px] leading-relaxed text-slate-500 max-w-4xl" id="ntc-disclaimer">
            All telecommunications and internet-related services provided by Nexure
            Networks are subject to the required permits, licenses, and regulations of
            the National Telecommunications Commission (NTC) and other relevant
            government agencies.
          </p>
        </div>
      </div>
    </footer>
  );
}
