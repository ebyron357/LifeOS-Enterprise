"use client";

import dynamic from "next/dynamic";
import { VoicePresence } from "./VoicePresence";

/**
 * Optional Rive-backed presence. Without a .riv asset URL, CSS presence is used.
 * Keeps Verbal V1 unblocked by missing proprietary animation files.
 */
const RiveCanvas = dynamic(async () => {
  const { useRive } = await import("@rive-app/react-canvas");
  return function RiveInner({ src }: { src: string }) {
    const { RiveComponent } = useRive({ src, autoplay: true });
    return <RiveComponent style={{ width: 52, height: 52 }} />;
  };
}, { ssr: false });

export function VoicePresenceWithOptionalRive({
  state,
  micActive,
  riveSrc,
}: {
  state: string;
  micActive: boolean;
  riveSrc?: string;
}) {
  if (!riveSrc) {
    return <VoicePresence state={state} micActive={micActive} />;
  }
  return (
    <div aria-hidden="true" title="Animated command presence">
      <RiveCanvas src={riveSrc} />
    </div>
  );
}
