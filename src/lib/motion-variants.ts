import type { Variants } from "framer-motion";

/**
 * Shared Framer Motion animation variants for ChainVote.
 * Using cubic-bezier arrays instead of string ease names
 * to satisfy Framer Motion's strict Easing type.
 */

const easeOut = [0.25, 0.1, 0.25, 1] as const;

export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easeOut } },
};

export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: easeOut } },
};
