import type { CalendarState } from "./types";

/**
 * A read-only work-time window a user (or, later, an authorized calendar
 * integration) makes available for scheduling. Suggest Only mode never
 * creates or edits calendar events — this module only ever produces
 * *proposed* schedule input, never a calendar write.
 */
export type AvailabilityWindow = {
  start: string;
  end: string;
  /** True for a window pinned by a hard deadline or fixed calendar commitment. */
  fixed: boolean;
  label?: string;
};

export type CalendarIntegrationCapability = {
  connected: boolean;
  /** Present only when `connected` is true. Never stores private event text. */
  provider?: string;
};

/**
 * Inspects whatever calendar integration capability the host application
 * exposes. There is currently no calendar integration wired into Life OS
 * (no OAuth client, no stored tokens, no calendar API route), so this
 * always reports disconnected today — but the shape is intentionally
 * ready for a real read-only integration to be added later without
 * changing any caller.
 */
export function inspectCalendarIntegration(): CalendarIntegrationCapability {
  return { connected: false };
}

/**
 * Produces the calendar state surfaced on a brief. When no integration is
 * connected, the brief must continue to generate — with schedule blocks
 * clearly labeled "availability assumed" rather than pretending to know
 * the user's real calendar.
 */
export function resolveCalendarState(capability: CalendarIntegrationCapability = inspectCalendarIntegration()): CalendarState {
  if (capability.connected) {
    return {
      connected: true,
      mode: "read-only",
      reason: `Read-only availability from ${capability.provider ?? "the connected calendar"}.`,
    };
  }
  return {
    connected: false,
    mode: "availability-assumed",
    reason: "No authorized calendar integration is configured. Schedule times are manual work-window assumptions, not verified availability.",
  };
}

const DEFAULT_WORK_WINDOW: AvailabilityWindow = { start: "09:00", end: "17:00", fixed: false, label: "Assumed work day" };

/**
 * Manual fallback availability used whenever no calendar integration is
 * connected (or a connected integration fails to answer). Callers may pass
 * explicit `manualWindows` (e.g. from verified user settings) to override
 * this default.
 */
export function getAvailabilityWindows(manualWindows?: AvailabilityWindow[]): AvailabilityWindow[] {
  if (manualWindows && manualWindows.length > 0) return manualWindows;
  return [DEFAULT_WORK_WINDOW];
}

export function windowMinutes(window: AvailabilityWindow): number {
  const [startHour, startMinute] = window.start.split(":").map(Number);
  const [endHour, endMinute] = window.end.split(":").map(Number);
  return endHour * 60 + endMinute - (startHour * 60 + startMinute);
}
