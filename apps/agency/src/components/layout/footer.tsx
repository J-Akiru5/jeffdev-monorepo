import Link from 'next/link';
import { Mail, MapPin, ArrowUpRight } from 'lucide-react';

/**
 * Footer Component
 * ----------------
 * Professional B2B footer with:
 * - Company info + DTI registration
 * - Quick navigation links
 * - Contact information
 * - Legal links
 */

const footerLinks = {
  services: [
    { href: '/services/web-development', label: 'Web Development' },
    { href: '/services/saas-platforms', label: 'SaaS Platforms' },
    { href: '/services/cloud-architecture', label: 'Cloud Architecture' },
    { href: '/services/ai-integration', label: 'AI Integration' },
  ],
  products: [
    { href: 'https://prism.jeffdev.studio', label: 'Prism Context Engine', external: true },
    { href: 'https://prism.jeffdev.studio/guide/getting-started', label: 'Documentation', external: true },
  ],
  company: [
    { href: '/about', label: 'About Studio' },
    { href: '/work', label: 'Case Studies' },
    { href: '/blog', label: 'Insights' },
    { href: '/contact', label: 'Contact' },
  ],
  legal: [
    { href: '/terms', label: 'Terms of Service' },
    { href: '/privacy', label: 'Privacy Policy' },
  ],
};

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative border-t border-white/[0.08] bg-void">
      {/* Main Footer Content */}
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="relative h-8 w-8 overflow-hidden rounded-md">
                <img
                  src="/favicon.svg"
                  alt="JD Studio"
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="font-semibold tracking-tight text-white">
                JD Studio
              </span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-white/50">
              Enterprise-grade web architecture for startups and scaling
              businesses. We build systems that grow with you.
            </p>
            {/* Contact Info */}
            <div className="mt-6 space-y-2">
              <a
                href="mailto:hello@jeffdev.studio"
                className="flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-cyan-400"
              >
                <Mail className="h-4 w-4" />
                hello@jeffdev.studio
              </a>
              <div className="flex items-center gap-2 text-sm text-white/50">
                <MapPin className="h-4 w-4" />
                Iloilo City, Philippines
              </div>
            </div>
          </div>

          {/* Services Column */}
          <div>
            <h3 className="font-mono text-xs uppercase tracking-wider text-white/30">
              Services
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.services.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Products Column */}
          <div>
            <h3 className="font-mono text-xs uppercase tracking-wider text-white/30">
              Products
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.products.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-cyan-400/80 transition-colors hover:text-cyan-400"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h3 className="font-mono text-xs uppercase tracking-wider text-white/30">
              Company
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA Column */}
          <div>
            <h3 className="font-mono text-xs uppercase tracking-wider text-white/30">
              Start a Project
            </h3>
            <p className="mt-4 text-sm text-white/50">
              Ready to build something exceptional? Let&apos;s discuss your
              vision.
            </p>
            <Link
              href="/quote"
              className="group mt-4 inline-flex items-center gap-2 rounded-md border border-white/10 bg-black/50 px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-white/80 backdrop-blur-md transition-all hover:border-white/20 hover:text-white hover:shadow-[0_0_20px_rgba(6,182,212,0.15)]"
            >
              Get_Quote
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/[0.05]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-6 md:flex-row lg:px-8">
          {/* Legal Links */}
          <div className="flex items-center gap-6">
            {footerLinks.legal.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs text-white/40 transition-colors hover:text-white/70"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Copyright + DTI */}
          <div className="text-center text-xs text-white/30 md:text-right">
            <p>© {currentYear} JD Studio.</p>
            <p className="mt-1 font-mono text-[10px] text-white/20">
              DTI: VLLP979818395984
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
