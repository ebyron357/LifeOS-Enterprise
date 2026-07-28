"use client";

import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import { listItemEnter } from "@/lib/motion/config";
import { useLifeosMotion } from "./MotionProvider";

type MotionListProps = {
  children: ReactNode;
  className?: string;
};

export function MotionList({ children, className }: MotionListProps) {
  return <div className={className}>{children}</div>;
}

type MotionListItemProps = {
  id: string;
  children: ReactNode;
  className?: string;
  layout?: boolean;
};

export function MotionListItem({ id, children, className, layout = true }: MotionListItemProps) {
  const { allowMotion, transition } = useLifeosMotion();

  if (!allowMotion) {
    return <div className={className} data-motion-id={id}>{children}</div>;
  }

  return (
    <motion.div
      layout={layout || undefined}
      className={className}
      data-motion-id={id}
      initial={listItemEnter.initial}
      animate={listItemEnter.animate}
      exit={listItemEnter.exit}
      transition={transition}
    >
      {children}
    </motion.div>
  );
}

export function MotionListPresence({ children }: { children: ReactNode }) {
  const { allowMotion } = useLifeosMotion();
  if (!allowMotion) return <>{children}</>;
  return <AnimatePresence initial={false}>{children}</AnimatePresence>;
}
