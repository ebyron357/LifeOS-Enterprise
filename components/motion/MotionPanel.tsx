"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { panelEnter } from "@/lib/motion/config";
import { useLifeosMotion } from "./MotionProvider";

type MotionPanelProps = {
  children: ReactNode;
  className?: string;
  as?: "section" | "div" | "article";
  layout?: boolean;
};

export function MotionPanel({ children, className, as = "section", layout = false }: MotionPanelProps) {
  const { allowMotion, softTransition } = useLifeosMotion();
  const Component = motion[as];

  if (!allowMotion) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <Component
      className={className}
      layout={layout || undefined}
      initial={panelEnter.initial}
      animate={panelEnter.animate}
      exit={panelEnter.exit}
      transition={softTransition}
    >
      {children}
    </Component>
  );
}
