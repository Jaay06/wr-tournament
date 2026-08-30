"use client";

import type { ReactNode } from "react";
import { MotionConfig, motion } from "motion/react";

const easeOutExpo = [0.19, 1, 0.22, 1] as const;

export function MotionReveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        animate={{ opacity: 1, transform: "translateY(0px)" }}
        className={className}
        initial={{ opacity: 0, transform: "translateY(12px)" }}
        transition={{ delay, duration: 0.48, ease: easeOutExpo }}
      >
        {children}
      </motion.div>
    </MotionConfig>
  );
}
