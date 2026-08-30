"use client";

import type { ReactNode } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";

const stateSwapTransition = { type: "spring", duration: 0.3, bounce: 0 } as const;

export function AnimatedButtonLabel({
  children,
  stateKey,
}: {
  children: ReactNode;
  stateKey: string;
}) {
  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence initial={false} mode="wait">
        <motion.span
          animate={{ opacity: 1, transform: "translateY(0px)" }}
          className="inline-flex items-center gap-2"
          exit={{ opacity: 0, transform: "translateY(6px)" }}
          initial={{ opacity: 0, transform: "translateY(-6px)" }}
          key={stateKey}
          transition={stateSwapTransition}
        >
          {children}
        </motion.span>
      </AnimatePresence>
    </MotionConfig>
  );
}
