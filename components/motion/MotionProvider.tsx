"use client";

import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { useReducedMotion } from "motion/react";
import { resolveMotionPreference, type ResolvedMotionPreference } from "@/lib/motion/preferences";
import { lifeosFade, lifeosInstant, lifeosSoftSpring, lifeosSpring } from "@/lib/motion/config";

type MotionContextValue = ResolvedMotionPreference & {
  transition: typeof lifeosSpring | typeof lifeosInstant;
  softTransition: typeof lifeosSoftSpring | typeof lifeosInstant;
  fadeTransition: typeof lifeosFade | typeof lifeosInstant;
};

const MotionContext = createContext<MotionContextValue | null>(null);

function subscribeDocumentFlags(onStoreChange: () => void) {
  if (typeof document === "undefined") return () => undefined;
  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-lifeos-reduced-motion", "data-lifeos-overloaded"],
  });
  return () => observer.disconnect();
}

function getDocumentFlagsSnapshot() {
  if (typeof document === "undefined") return "false|false";
  const root = document.documentElement;
  return `${root.dataset.lifeosReducedMotion === "true"}|${root.dataset.lifeosOverloaded === "true"}`;
}

export function MotionProvider({ children }: { children: ReactNode }) {
  const osReducedMotion = useReducedMotion();
  const flagSnapshot = useSyncExternalStore(subscribeDocumentFlags, getDocumentFlagsSnapshot, () => "false|false");
  const [lifeosReducedMotionRaw, overloadedRaw] = flagSnapshot.split("|");

  const resolved = resolveMotionPreference({
    lifeosReducedMotion: lifeosReducedMotionRaw === "true",
    overloaded: overloadedRaw === "true",
    osReducedMotion,
  });

  const value = useMemo<MotionContextValue>(() => ({
    ...resolved,
    transition: resolved.allowMotion ? lifeosSpring : lifeosInstant,
    softTransition: resolved.allowMotion ? lifeosSoftSpring : lifeosInstant,
    fadeTransition: resolved.allowMotion ? lifeosFade : lifeosInstant,
  }), [resolved]);

  return <MotionContext.Provider value={value}>{children}</MotionContext.Provider>;
}

export function useLifeosMotion(): MotionContextValue {
  const value = useContext(MotionContext);
  if (!value) {
    return {
      allowMotion: false,
      allowDecorativeMotion: false,
      reason: "unknown",
      transition: lifeosInstant,
      softTransition: lifeosInstant,
      fadeTransition: lifeosInstant,
    };
  }
  return value;
}
