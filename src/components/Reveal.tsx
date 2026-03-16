import React from "react";
import { motion, useReducedMotion } from "framer-motion";

export type RevealVariant = "fadeUp" | "fade" | "scale";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  /** Delay in seconds */
  delay?: number;
  /** Duration in seconds */
  duration?: number;
  /** Animate once per mount (recommended for scroll reveal) */
  once?: boolean;
  /** How much should be visible before triggering (0..1) */
  amount?: number;
  variant?: RevealVariant;
};

const variants: Record<RevealVariant, any> = {
  fadeUp: {
    hidden: { opacity: 0, y: 30, filter: "blur(10px)" },
    show: { opacity: 1, y: 0, filter: "blur(0px)" },
  },
  fade: {
    hidden: { opacity: 0, filter: "blur(10px)" },
    show: { opacity: 1, filter: "blur(0px)" },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.9, filter: "blur(10px)" },
    show: { opacity: 1, scale: 1, filter: "blur(0px)" },
  },
};

export function Reveal({
  children,
  className,
  delay = 0,
  duration = 0.7,
  once = true,
  amount = 0.2,
  variant = "fadeUp",
}: RevealProps) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={variants[variant]}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount }}
      transition={{
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      style={{ willChange: "transform, opacity, filter" }}
    >
      {children}
    </motion.div>
  );
}
