"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqItems = [
  {
    question: "What does Syntaxure Labs do?",
    answer:
      "Syntaxure Labs is a global B2B digital transformation agency specializing in scalable custom software, web architectures, and secure AI integrations. We partner with enterprises to modernize operations, converting slow manual workflows into high-performance digital solutions built on modern frameworks and secure cloud infrastructure.",
  },
  {
    question: "What is Context Engine?",
    answer:
      "Context Engine is a proprietary AI Governance layer that enforces strict protocols and actively prevents AI hallucinations in enterprise environments. It is our flagship product that demonstrates our deep expertise in AI architecture and enterprise-grade system design.",
  },
  {
    question: "Where is Syntaxure Labs based?",
    answer:
      "We are based in Iloilo City, Philippines, rooted in the emerging innovation ecosystem of Western Visayas. We operate globally, delivering enterprise-grade engineering standards to clients worldwide from our Southeast Asian development hub.",
  },
  {
    question: "What services does Syntaxure Labs offer?",
    answer:
      "We offer custom software development, SaaS platform architecture, cloud infrastructure deployment, AI integration services, and high-performance web development. All services are delivered with fixed-investment pricing and predictable timelines, tailored to each client's specific needs.",
  },
  {
    question: "How do I start a project with Syntaxure Labs?",
    answer:
      "Contact us through our website to discuss your project requirements. We provide a free consultation to understand your vision, scope your project thoroughly, and deliver a fixed-price investment estimate within 24 hours. No surprises, just transparent partnership from day one.",
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="px-6 py-24 lg:px-8" id="faq">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <span className="font-mono text-xs uppercase tracking-wider text-cyan-400">
            {"// FAQ"}
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white md:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-white/50">
            Everything you need to know about working with us.
          </p>
        </div>

        <div className="mt-12 space-y-3">
          {faqItems.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="rounded-md border border-white/[0.08] bg-white/[0.02] transition-all duration-200 hover:border-white/[0.15]"
              >
                <button
                  onClick={() => toggleItem(index)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:text-cyan-400"
                  aria-expanded={isOpen}
                >
                  <span className="font-medium text-white/90">
                    {item.question}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 flex-shrink-0 text-white/40 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-cyan-400" : ""
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <p className="border-t border-white/[0.06] px-6 py-5 text-sm leading-relaxed text-white/50">
                    {item.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
