export type MotionPreferenceInput = {
  /** Explicit LifeOS workspace reduced-motion preference. */
  lifeosReducedMotion?: boolean;
  /** Cognitive overload mode suppresses nonessential motion. */
  overloaded?: boolean;
  /** OS / browser preference from Motion's useReducedMotion or matchMedia. */
  osReducedMotion?: boolean | null;
};

export type ResolvedMotionPreference = {
  allowMotion: boolean;
  allowDecorativeMotion: boolean;
  reason: "enabled" | "lifeos" | "overload" | "os" | "unknown";
};

/**
 * Resolves whether LifeOS may play motion.
 * Overload and LifeOS toggles win over OS preference for decorative motion.
 */
export function resolveMotionPreference(input: MotionPreferenceInput = {}): ResolvedMotionPreference {
  if (input.overloaded) {
    return { allowMotion: false, allowDecorativeMotion: false, reason: "overload" };
  }
  if (input.lifeosReducedMotion) {
    return { allowMotion: false, allowDecorativeMotion: false, reason: "lifeos" };
  }
  if (input.osReducedMotion) {
    return { allowMotion: false, allowDecorativeMotion: false, reason: "os" };
  }
  if (input.osReducedMotion === null || input.osReducedMotion === undefined) {
    return { allowMotion: true, allowDecorativeMotion: true, reason: "unknown" };
  }
  return { allowMotion: true, allowDecorativeMotion: true, reason: "enabled" };
}

export function readLifeosMotionFlags(root: ParentNode | null = typeof document !== "undefined" ? document.documentElement : null) {
  if (!root || !(root instanceof HTMLElement)) {
    return { lifeosReducedMotion: false, overloaded: false };
  }
  return {
    lifeosReducedMotion: root.dataset.lifeosReducedMotion === "true",
    overloaded: root.dataset.lifeosOverloaded === "true",
  };
}
