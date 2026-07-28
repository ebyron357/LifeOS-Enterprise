import type { Transition } from "motion/react";

/** Calm, short springs for a professional command-center feel. */
export const lifeosSpring: Transition = {
  type: "spring",
  stiffness: 380,
  damping: 32,
  mass: 0.7,
};

export const lifeosSoftSpring: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 34,
  mass: 0.85,
};

export const lifeosFade: Transition = {
  duration: 0.18,
  ease: [0.22, 1, 0.36, 1],
};

export const lifeosInstant: Transition = {
  duration: 0,
};

export const panelEnter = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 4 },
};

export const listItemEnter = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 4 },
};

export const statusPulse = {
  initial: { opacity: 0.55, scale: 0.98 },
  animate: { opacity: 1, scale: 1 },
};
