import { NextResponse } from "next/server";
import { getVaultDashboardData } from "@/lib/lifeos/vault-data";
import { rateLimit } from "@/lib/voice/security";
import { createInitialGameState, reduceGameState, repairGameState } from "@/lib/game/state";
import type { GameAction } from "@/lib/game/types";

export const runtime = "nodejs";

type TransitionBody = {
  rawState?: string;
  action?: GameAction;
};

export async function GET(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "local";
  if (!rateLimit(`game-session:${ip}`, 90)) {
    return NextResponse.json({ ok: false, error: "Rate limit exceeded." }, { status: 429 });
  }
  const data = await getVaultDashboardData();
  const nowIso = new Date().toISOString();
  const seed = createInitialGameState({ nowIso, projects: data.projects });
  return NextResponse.json({
    ok: true,
    seed,
    date: nowIso.slice(0, 10),
    quests: seed.questsByDate[nowIso.slice(0, 10)],
  });
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "local";
  if (!rateLimit(`game-transition:${ip}`, 120)) {
    return NextResponse.json({ ok: false, error: "Rate limit exceeded." }, { status: 429 });
  }
  let body: TransitionBody;
  try {
    body = await request.json() as TransitionBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const data = await getVaultDashboardData();
  const nowIso = new Date().toISOString();
  const context = { nowIso, projects: data.projects };
  const repaired = repairGameState(body.rawState ?? null, context);
  const action = body.action ?? { type: "repair-state" };
  const next = reduceGameState(repaired.state, action, context);

  return NextResponse.json({
    ok: true,
    state: next,
    diagnostics: repaired.diagnostics,
  });
}
