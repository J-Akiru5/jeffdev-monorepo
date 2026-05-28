import Link from "next/link";
import { Mail, MapPin, ArrowUpRight, Github, BookOpen } from "lucide-react";
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
    { href: "/community", label: "Changelog" },
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
    <footer className="border-t border-white/10 bg-[#0a0a0a]">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2">
              <SyntaxureLogo className="h-8 w-8" />
              <span className="font-semibold tracking-tight text-white">
                Syntaxure Labs
              </span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-white/50">
              Enterprise-grade web architecture for startups and scaling
              businesses. We build systems that grow with you.
            </p>
            <div className="mt-6 space-y-2">
              <a
                href="mailto:hello@syntaxure.dev"
                className="flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-cyan-500"
              >
                <Mail className="h-4 w-4" />
                hello@syntaxure.dev
              </a>
              <div className="flex items-center gap-2 text-sm text-white/50">
                <MapPin className="h-4 w-4" />
                Iloilo City, Philippines
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-mono text-xs uppercase tracking-wider text-white/40">
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

          <div>
            <h3 className="font-mono text-xs uppercase tracking-wider text-white/40">
              Products
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.products.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-cyan-500 transition-colors hover:text-cyan-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-mono text-xs uppercase tracking-wider text-white/40">
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
                      className="group inline-flex items-center gap-1.5 text-sm text-white/60 transition-colors hover:text-white"
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
                      className="text-sm text-white/60 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-mono text-xs uppercase tracking-wider text-white/40">
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

          <div>
            <h3 className="font-mono text-xs uppercase tracking-wider text-white/40">
              Start a Project
            </h3>
            <p className="mt-4 text-sm text-white/50">
              Ready to build something exceptional? Let&apos;s discuss your
              vision.
            </p>
            <Link
              href="/quote"
              className="group relative mt-4 inline-flex items-center gap-2 overflow-hidden rounded-md border border-white/10 bg-white/5 px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-white/80 transition-all hover:border-white/20 hover:text-white hover:bg-white/[0.08]"
            >
              Get_Quote
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-white/5">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-6 md:flex-row lg:px-8">
          <div className="flex items-center gap-6">
            {footerLinks.legal.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs text-white/45 transition-colors hover:text-white/60"
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
              className="text-white/35 transition-colors hover:text-white/60"
              aria-label="GitHub"
            >
              <Github className="h-4 w-4" />
            </a>
          </div>

          <div className="text-center text-xs text-white/45 md:text-right">
            <p>© {currentYear} Syntaxure Labs. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;