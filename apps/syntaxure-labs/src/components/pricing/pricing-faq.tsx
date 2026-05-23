'use client';

/**
 * PricingFAQ Component
 * ---------------------
 * Accordion-style FAQ section for the pricing page.
 */

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FAQItem } from '@/data/pricing';

interface PricingFAQProps {
  items: FAQItem[];
}

export function PricingFAQ({ items }: PricingFAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="divide-y divide-white/10">
      {items.map((item, idx) => (
        <div key={idx} className="py-4">
          <button
            onClick={() => toggleItem(idx)}
            className="flex w-full items-center justify-between text-left transition-colors hover:text-cyan-400"
          >
            <span className="pr-4 text-lg font-medium text-white">
              {item.question}
            </span>
            <ChevronDown
              className={cn(
                'h-5 w-5 flex-shrink-0 text-white/50 transition-transform duration-200',
                openIndex === idx && 'rotate-180 text-cyan-400'
              )}
            />
          </button>
          <div
            className={cn(
              'overflow-hidden transition-all duration-300',
              openIndex === idx ? 'mt-4 max-h-96' : 'max-h-0'
            )}
          >
            <p className="text-white/60 leading-relaxed">{item.answer}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default PricingFAQ;
