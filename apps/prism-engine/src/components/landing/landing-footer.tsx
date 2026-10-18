import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

/**
 * LandingFooter — lifted out of `page.tsx` unchanged.
 *
 * It was 100 lines of JSX sitting between the hero and the closing brace of the
 * page component, which made the page's actual structure hard to read. No copy
 * or styling was altered in the move; this is the same markup in its own file.
 */

export function LandingFooter() {
  return (
    <footer className="relative z-10 border-t border-[var(--border-subtle)] bg-[var(--bg-primary)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-1">
            <div className="mb-4 flex items-center gap-2">
              <Image
                src="/prism-icon.png"
                alt="Prism Context Engine"
                width={24}
                height={24}
              />
              <span className="text-gradient-cyan font-bold">
                Prism Context Engine
              </span>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
              The Context Operating System for developers who ship fast.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--text-primary)]">
              Product
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/pricing"
                  className="text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="https://docs.syntaxure.dev"
                  target="_blank"
                  className="text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
                >
                  Docs
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--text-primary)]">
              Company
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="https://www.syntaxure.dev"
                  target="_blank"
                  className="text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
                >
                  About Syntaxure Labs
                </Link>
              </li>
              <li>
                <Link
                  href="https://www.syntaxure.dev/contact"
                  target="_blank"
                  className="text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* CTA */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--text-primary)]">
              Get Started
            </h3>
            <p className="mb-4 text-sm text-[var(--text-secondary)]">
              Ready to eliminate context pollution?
            </p>
            <Link
              href="/sign-up"
              className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-md bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-3 font-mono text-sm font-semibold tracking-wider !text-white transition-all hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-95"
            >
              <span className="relative z-10 uppercase">Start Free</span>
              <ArrowRight className="relative z-10 h-4 w-4 transition-transform group-hover:translate-x-1" />
              <div className="absolute inset-0 -z-0 bg-gradient-to-r from-cyan-500 to-blue-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </Link>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between border-t border-[var(--border-subtle)] pt-8 md:flex-row">
          <p className="font-mono text-xs text-[var(--text-tertiary)]">
            © {new Date().getFullYear()} Syntaxure Labs. Built with Prism Context
            Engine.
          </p>
          <div className="mt-4 flex gap-6 md:mt-0">
            <Link
              href="/terms"
              className="text-xs text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)]"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="text-xs text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)]"
            >
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default LandingFooter;
