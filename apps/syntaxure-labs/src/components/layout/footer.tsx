import Link from "next/link";
import { Mail, MapPin, ArrowUpRight } from "lucide-react";
import { SyntaxureLogo } from "@syntaxure/ui";

const footerLinks = {
  services: [
    { href: "/services/web-development", label: "Web Development" },
    { href: "/services/saas-platforms", label: "SaaS Platforms" },
    { href: "/services/cloud-architecture", label: "Cloud Architecture" },
    { href: "/services/ai-integration", label: "AI Integration" },
  ],
  products: [
    {
      href: "https://www.syntaxure.dev/prism",
      label: "Prism Context Engine",
      external: true,
    },
    {
      href: "https://www.syntaxure.dev/prism/guide/getting-started",
      label: "Documentation",
      external: true,
    },
  ],
  company: [
    { href: "/about", label: "About Studio" },
    { href: "/work", label: "Case Studies" },
    { href: "/blog", label: "Insights" },
    { href: "/contact", label: "Contact" },
  ],
  legal: [
    { href: "/terms", label: "Terms of Service" },
    { href: "/privacy", label: "Privacy Policy" },
  ],
};

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2">
              <SyntaxureLogo className="h-8 w-8" />
              <span className="font-semibold tracking-tight text-slate-900">
                Syntaxure Labs
              </span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-slate-500">
              Enterprise-grade web architecture for startups and scaling
              businesses. We build systems that grow with you.
            </p>
            <div className="mt-6 space-y-2">
              <a
                href="mailto:hello@jeffdev.studio"
                className="flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-cyan-600"
              >
                <Mail className="h-4 w-4" />
                hello@jeffdev.studio
              </a>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <MapPin className="h-4 w-4" />
                Iloilo City, Philippines
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-mono text-xs uppercase tracking-wider text-slate-400">
              Services
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.services.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-600 transition-colors hover:text-slate-900"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-mono text-xs uppercase tracking-wider text-slate-400">
              Products
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.products.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-cyan-600 transition-colors hover:text-cyan-700"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-mono text-xs uppercase tracking-wider text-slate-400">
              Company
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-600 transition-colors hover:text-slate-900"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-mono text-xs uppercase tracking-wider text-slate-400">
              Start a Project
            </h3>
            <p className="mt-4 text-sm text-slate-500">
              Ready to build something exceptional? Let&apos;s discuss your
              vision.
            </p>
            <Link
              href="/quote"
              className="group mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:text-slate-900 hover:shadow-md"
            >
              Get_Quote
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-6 md:flex-row lg:px-8">
          <div className="flex items-center gap-6">
            {footerLinks.legal.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs text-slate-400 transition-colors hover:text-slate-600"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="text-center text-xs text-slate-400 md:text-right">
            <p>© {currentYear} Syntaxure Labs.</p>
            <p className="mt-1 font-mono text-[10px] text-slate-300">
              DTI: VLLP979818395984
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;