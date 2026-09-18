"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { InteractiveCommandCenter } from "@/components/dashboard/InteractiveCommandCenter";
import { ChangePlanPersistence } from "@/components/dashboard/ChangePlanPersistence";
import { InteractionFeedbackProvider } from "@/components/feedback/InteractionFeedback";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { useBrowserStorageString } from "@/lib/lifeos/use-browser-storage";
import type { VaultDashboardData } from "@/lib/lifeos/types";
import type { CommandMapBuildInput } from "@/lib/command-map/types";
import styles from "./OperationsSurface.module.css";

const CommandMap = dynamic(
  () => import("@/components/command-map/CommandMap").then((mod) => mod.CommandMap),
  {
    ssr: false,
    loading: () => (
      <div className={styles.loading} role="status" aria-live="polite">
        Loading command map…
      </div>
    ),
  },
);

const VoiceConsole = dynamic(
  () => import("@/components/voice/VoiceConsole").then((mod) => mod.VoiceConsole),
  { ssr: false },
);

type OperationsSurfaceProps = {
  data: VaultDashboardData;
};

export function OperationsSurface({ data }: OperationsSurfaceProps) {
  const [view, setView] = useBrowserStorageString("lifeos-operations-view-v1", "board");
  const [mapReady, setMapReady] = useState(view === "map");
  const [voiceReady, setVoiceReady] = useState(false);

  useEffect(() => {
    function onView(event: Event) {
      const detail = (event as CustomEvent<{ view?: string }>).detail;
      if (detail?.view === "map" || detail?.view === "board") {
        setView(detail.view);
        if (detail.view === "map") setMapReady(true);
      }
    }
    window.addEventListener("lifeos-operations-view", onView);
    return () => window.removeEventListener("lifeos-operations-view", onView);
  }, [setView]);

  useEffect(() => {
    if (typeof window.requestIdleCallback === "function") {
      const idleId = window.requestIdleCallback(() => setVoiceReady(true), { timeout: 2000 });
      return () => window.cancelIdleCallback(idleId);
    }
    const timeoutId = setTimeout(() => setVoiceReady(true), 250);
    return () => clearTimeout(timeoutId);
  }, []);

  const mapInput: CommandMapBuildInput = useMemo(() => ({
    projects: data.projects.map((project) => ({
      name: project.name,
      path: project.path,
      status: project.status,
      priority: project.priority,
      business: project.business,
      nextAction: project.nextAction,
      waitingOn: project.waitingOn,
      blocker: project.blocker,
      owner: project.owner,
    })),
    agents: data.agents.map((agent) => ({
      name: agent.name,
      status: agent.status,
      purpose: agent.purpose,
    })),
    businesses: data.businesses,
    people: data.people,
  }), [data]);

  function selectView(next: "board" | "map") {
    setView(next);
    if (next === "map") setMapReady(true);
  }

  return (
    <MotionProvider>
      <InteractionFeedbackProvider>
        <section className={styles.surface} aria-label="LifeOS operations surface">
          <div className={styles.switcher} role="tablist" aria-label="Operations view">
            <button
              type="button"
              role="tab"
              aria-selected={view === "board"}
              className={view === "board" ? styles.active : undefined}
              onClick={() => selectView("board")}
            >
              Command Board
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === "map"}
              className={view === "map" ? styles.active : undefined}
              onClick={() => selectView("map")}
            >
              Command Map
            </button>
          </div>

          <div
            role="tabpanel"
            hidden={view !== "board"}
            id="operations-board-panel"
            aria-label="Command board panel"
          >
            <InteractiveCommandCenter projects={data.projects} />
            <ChangePlanPersistence />
          </div>

          <div
            role="tabpanel"
            hidden={view !== "map"}
            id="operations-map-panel"
            aria-label="Command map panel"
          >
            {mapReady ? <CommandMap input={mapInput} /> : null}
          </div>

          {voiceReady ? (
            <VoiceConsole
              projects={data.projects}
              agents={data.agents}
              activeProjects={data.activeProjects}
              waitingOn={data.waitingOn}
              reviewsDue={data.reviewsDue}
            />
          ) : null}
        </section>
      </InteractionFeedbackProvider>
    </MotionProvider>
  );
}
