import Link from "next/link";
import { Mail, MapPin, ArrowUpRight, BookOpen, Phone, Star } from "lucide-react";
import { GithubIcon as Github } from "@/components/icons/brand-icons";
import { SyntaxureLogo } from "@syntaxure/ui";

const DOCS_URL = process.env.NEXT_PUBLIC_DOCS_URL || "https://docs.syntaxure.dev";

const footerLinks = {
  services: [
    { href: "/services/web-development", label: "Web Development" },
    { href: "/services/saas-platforms", label: "SaaS Platforms" },
    { href: "/services/cloud-architecture", label: "Cloud Architecture" },
    { href: "/services/ai-integration", label: "AI Integration" },
  ],
  products: [
    {
      href: "/prism",
      label: "Prism Context Engine",
    },
  ],
  resources: [
    { href: DOCS_URL, label: "Documentation", external: true },
    { href: "/changelog", label: "Changelog" },
    {
      href: "https://github.com/J-Akiru5/jeffdev-monorepo",
      label: "GitHub",
      external: true,
    },
  ],
  company: [
    { href: "/about", label: "About Studio" },
    { href: "/work", label: "Case Studies" },
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
    <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2">
              <SyntaxureLogo className="h-8 w-8 text-[var(--text-primary)]" />
              <span className="font-bold tracking-tight text-[var(--text-primary)]">
                Syntaxure Labs
              </span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-[var(--text-secondary)]">
              Enterprise-grade web architecture for startups and scaling
              businesses. We build systems that grow with you.
            </p>
            <div className="mt-6 space-y-2">
              <a
                href="mailto:hello@syntaxure.dev"
                className="flex items-center gap-2 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
              >
                <Mail className="h-4 w-4" />
                hello@syntaxure.dev
              </a>
              <a
                href="tel:+639705762593"
                className="flex items-center gap-2 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
              >
                <Phone className="h-4 w-4" />
                +63 970 576 2593
              </a>
              <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <MapPin className="h-4 w-4" />
                Iloilo City, Philippines
              </div>
              <a
                href="https://maps.app.goo.gl/ALFPxasfNt9qjtrP9"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-[var(--text-secondary)] transition-colors hover:text-cyan-400"
              >
                <Star className="h-4 w-4" />
                Google Business Profile
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
              Services
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.services.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
              Products
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.products.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
              Resources
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.href}>
                  {"external" in link && link.external ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
                    >
                      {link.href.includes("github") ? (
                        <Github className="h-3.5 w-3.5" />
                      ) : (
                        <BookOpen className="h-3.5 w-3.5" />
                      )}
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className="text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
              Company
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
              Start a Project
            </h3>
            <p className="mt-4 text-sm text-[var(--text-secondary)]">
              Ready to build something exceptional? Let&apos;s discuss your
              vision.
            </p>
            <Link
              href="/quote"
              className="group relative mt-4 inline-flex items-center gap-2 overflow-hidden rounded-md border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] transition-all hover:border-[var(--text-tertiary)] hover:text-[var(--text-primary)] shadow-sm"
            >
              Get_Quote
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-primary)]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-6 md:flex-row lg:px-8">
          <div className="flex items-center gap-6">
            {footerLinks.legal.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs font-medium text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)]"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://github.com/J-Akiru5/jeffdev-monorepo"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)]"
              aria-label="GitHub"
            >
              <Github className="h-4 w-4" />
            </a>
          </div>

          <div className="text-center text-xs font-medium text-[var(--text-tertiary)] md:text-right">
            <p>© {currentYear} Syntaxure Labs. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;