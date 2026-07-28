"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { statusPulse } from "@/lib/motion/config";
import { useLifeosMotion } from "./MotionProvider";

type MotionStatusProps = {
  children: ReactNode;
  className?: string;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
  live?: boolean;
};

export function MotionStatus({ children, className, tone = "neutral", live = true }: MotionStatusProps) {
  const { allowDecorativeMotion, fadeTransition } = useLifeosMotion();

  if (!allowDecorativeMotion) {
    return (
      <p className={className} data-tone={tone} aria-live={live ? "polite" : undefined}>
        {children}
      </p>
    );
  }

  return (
    <motion.p
      className={className}
      data-tone={tone}
      aria-live={live ? "polite" : undefined}
      initial={statusPulse.initial}
      animate={statusPulse.animate}
      transition={fadeTransition}
      key={typeof children === "string" ? children : tone}
    >
      {children}
    </motion.p>
  );
}
