"use client";

import { ArrowDown } from "lucide-react";

export function HeroScrollButton() {
  const scrollToContent = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: "smooth",
    });
  };

  return (
    <button
      onClick={scrollToContent}
      className="absolute bottom-10 left-1/2 -translate-x-1/2 text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-primary)] z-20"
      aria-label="Scroll to content"
    >
      <ArrowDown className="h-5 w-5 animate-bounce" />
    </button>
  );
}

export default HeroScrollButton;
