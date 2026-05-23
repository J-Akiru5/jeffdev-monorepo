'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

const fadeInVariant = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      type: 'spring' as const,
      damping: 25,
      stiffness: 100,
      duration: 0.6 
    } 
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    }
  }
};

interface FadeInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  id?: string;
}

export function FadeIn({ children, className, delay = 0, id }: FadeInProps) {
  return (
    <motion.div
      id={id}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={{
        hidden: { opacity: 0, y: 30 },
        visible: { 
          opacity: 1, 
          y: 0, 
          transition: { 
            type: 'spring' as const,
            damping: 25,
            stiffness: 100,
            duration: 0.6,
            delay 
          } 
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function FadeInStagger({ children, className, id }: FadeInProps) {
  return (
    <motion.div
      id={id}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={staggerContainer}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function FadeInItem({ children, className }: FadeInProps) {
  return (
    <motion.div variants={fadeInVariant} className={className}>
      {children}
    </motion.div>
  );
}
