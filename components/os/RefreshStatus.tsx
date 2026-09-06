"use client";

import { useRouter } from "next/navigation";

export function RefreshStatus({ label = "Check again" }: { label?: string }) {
  const router = useRouter();
  return (
    <button type="button" className="os-secondary" onClick={() => router.refresh()}>
      {label}
    </button>
  );
}
