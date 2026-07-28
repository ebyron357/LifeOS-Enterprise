"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { MotionStatus } from "@/components/motion/MotionStatus";
import {
  feedbackKindLabels,
  type InteractionFeedback,
  type InteractionFeedbackKind,
} from "@/lib/feedback/types";
import styles from "./InteractionFeedback.module.css";

type PushInput = {
  kind: InteractionFeedbackKind;
  title: string;
  detail?: string;
  persistence?: InteractionFeedback["persistence"];
  dismissible?: boolean;
};

type FeedbackContextValue = {
  items: InteractionFeedback[];
  push: (input: PushInput) => string;
  dismiss: (id: string) => void;
  clear: () => void;
};

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

function persistenceCopy(persistence: InteractionFeedback["persistence"]) {
  if (persistence === "browser-only") return "Staged in this browser only — canonical vault unchanged.";
  if (persistence === "canonical") return "Confirmed against the canonical system.";
  return "No persistence action occurred.";
}

export function InteractionFeedbackProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<InteractionFeedback[]>([]);

  const dismiss = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const push = useCallback((input: PushInput) => {
    const id = `feedback-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const next: InteractionFeedback = {
      id,
      kind: input.kind,
      title: input.title,
      detail: input.detail,
      persistence: input.persistence ?? "none",
      dismissible: input.dismissible ?? true,
      createdAt: Date.now(),
    };
    setItems((current) => [next, ...current].slice(0, 4));
    return id;
  }, []);

  const value = useMemo(() => ({ items, push, dismiss, clear }), [items, push, dismiss, clear]);

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <div className={styles.region} aria-label="Interaction feedback">
        <div className="sr-only" aria-live="polite">
          {items[0] ? `${feedbackKindLabels[items[0].kind]}: ${items[0].title}. ${items[0].detail ?? ""} ${persistenceCopy(items[0].persistence)}` : ""}
        </div>
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item.id} className={styles.item} data-kind={item.kind}>
              <div className={styles.copy}>
                <span className={styles.kind}>{feedbackKindLabels[item.kind]}</span>
                <MotionStatus className={styles.title} tone={item.kind === "failure" || item.kind === "invalid" ? "danger" : item.kind === "success" ? "success" : item.kind === "approval-required" || item.kind === "staging" ? "warning" : "info"}>
                  {item.title}
                </MotionStatus>
                {item.detail ? <p className={styles.detail}>{item.detail}</p> : null}
                <p className={styles.persistence}>{persistenceCopy(item.persistence)}</p>
              </div>
              {item.dismissible ? (
                <button type="button" className={styles.dismiss} onClick={() => dismiss(item.id)}>
                  Dismiss
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </FeedbackContext.Provider>
  );
}

export function useInteractionFeedback(): FeedbackContextValue {
  const value = useContext(FeedbackContext);
  if (!value) {
    return {
      items: [],
      push: () => "",
      dismiss: () => undefined,
      clear: () => undefined,
    };
  }
  return value;
}
