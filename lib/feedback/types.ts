export type InteractionFeedbackKind =
  | "saving"
  | "staging"
  | "approval-required"
  | "success"
  | "failure"
  | "offline"
  | "authentication-required"
  | "invalid"
  | "reverted"
  | "info";

export type InteractionFeedback = {
  id: string;
  kind: InteractionFeedbackKind;
  title: string;
  detail?: string;
  /** Honest persistence boundary copy. */
  persistence: "browser-only" | "canonical" | "none";
  dismissible?: boolean;
  createdAt: number;
};

export const feedbackKindLabels: Record<InteractionFeedbackKind, string> = {
  saving: "Saving",
  staging: "Staged",
  "approval-required": "Approval required",
  success: "Success",
  failure: "Failed",
  offline: "Offline",
  "authentication-required": "Authentication required",
  invalid: "Invalid action",
  reverted: "Reverted",
  info: "Notice",
};
