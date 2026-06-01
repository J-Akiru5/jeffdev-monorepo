"use client";

/**
 * TextReveal — word-by-word fade+rise reveal.
 * Uses framer-motion (transitive via @syntaxure/ui).
 * Respects prefers-reduced-motion.
 */

import { motion, useReducedMotion, type Variants } from "framer-motion";
import clsx from "clsx";

interface TextRevealProps {
  text: string;
  className?: string;
  delay?: number;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  stagger?: number;
}

export function TextReveal({
  text,
  className,
  delay = 0,
  as = "span",
  stagger = 0.04,
}: TextRevealProps) {
  const reduced = useReducedMotion();
  const words = text.split(" ");
  const Tag = motion[as] as typeof motion.span;

  const container: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: reduced ? 0 : stagger,
        delayChildren: delay,
      },
    },
  };

  const word: Variants = {
    hidden: { opacity: 0, y: reduced ? 0 : 18, filter: reduced ? "none" : "blur(6px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: reduced ? 0 : 0.5, ease: [0.2, 0.8, 0.2, 1] },
    },
  };

  return (
    <Tag className={clsx("inline-block", className)} variants={container} initial="hidden" animate="visible">
      {words.map((w, i) => (
        <motion.span
          key={`${w}-${i}`}
          variants={word}
          className="inline-block whitespace-pre"
        >
          {w}
          {i < words.length - 1 ? " " : ""}
        </motion.span>
      ))}
    </Tag>
  );
}

export default TextReveal;
