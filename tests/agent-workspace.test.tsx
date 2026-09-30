import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AgentConversationWorkspace } from "@/components/agent/AgentConversationWorkspace";
import { resetVoiceSettingsMemoryForTests, VOICE_SETTINGS_KEY } from "@/lib/voice/settings-store";

const vault = {
  priorities: [{ name: "LifeOS Enterprise", path: "Projects/LifeOS Enterprise.md", status: "active", priority: "P0", business: "LifeOS", nextAction: "Verify.", reviewDate: "2026-08-26", waitingOn: "", blocker: "" }],
  projects: [{ name: "LifeOS Enterprise", path: "Projects/LifeOS Enterprise.md", status: "active", priority: "P0", business: "LifeOS", nextAction: "Verify.", reviewDate: "2026-08-26", waitingOn: "", blocker: "" }],
  agents: [],
  activeProjects: 1,
  waitingOn: 0,
  reviewsDue: 0,
};

const TURN_RESULT = {
  reply: "1 blocked, 0 waiting, 0 reviews due.",
  spokenReply: "1 blocked, 0 waiting, 0 reviews due.",
  state: "idle",
  mission: "Answer from LifeOS context.",
  currentTask: "lifeos.read_attention",
  nextStep: "Ask a follow-up or stop the session.",
  lastCompletedStep: "1 blocked, 0 waiting, 0 reviews due.",
  waitingForOwner: false,
  invocations: [],
  results: [],
  approvals: [],
  activity: [],
  teaching: null,
  evidence: [],
};

type SessionPayload = Record<string, unknown>;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

function installFetch(options: {
  session?: SessionPayload | "reject";
  speak?: () => Response;
  turn?: () => Promise<Response> | Response;
} = {}) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const fetchMock = vi.fn(async (input: RequestInfo | URL, _init?: RequestInit) => {
    const url = String(input);
    if (url.includes("/api/lifeos/agent/session")) {
      if (options.session === "reject") throw new TypeError("Failed to fetch");
      return jsonResponse(options.session ?? { ok: true, tools: [], sessionToken: null });
    }
    if (url.includes("/api/lifeos/voice/speak")) {
      return options.speak ? options.speak() : jsonResponse({ ok: false, fallbackToBrowser: true, error: "Unavailable." }, 502);
    }
    if (url.includes("/api/lifeos/agent/turn")) {
      return options.turn ? options.turn() : jsonResponse({ ok: true, result: TURN_RESULT });
    }
    return jsonResponse({ ok: false }, 404);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

class MockUtterance {
  text: string;
  lang = "";
  rate = 1;
  pitch = 1;
  voice: unknown = null;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: ((event: { error?: string }) => void) | null = null;
  constructor(text: string) {
    this.text = text;
  }
}

const FAKE_VOICES = [
  { voiceURI: "us-1", name: "Alpha US", lang: "en-US", default: true },
  { voiceURI: "uk-1", name: "Beta UK", lang: "en-GB", default: false },
  { voiceURI: "fr-1", name: "Amelie", lang: "fr-FR", default: false },
];

function installSpeech(voices = FAKE_VOICES) {
  const spoken: MockUtterance[] = [];
  vi.stubGlobal("SpeechSynthesisUtterance", MockUtterance);
  vi.stubGlobal("speechSynthesis", {
    cancel: vi.fn(),
    speak: vi.fn((utterance: MockUtterance) => spoken.push(utterance)),
    getVoices: () => voices,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
  return spoken;
}

function settingsPanel() {
  return within(screen.getByRole("region", { name: "Voice settings" }));
}

const openaiConfiguredSession = {
  ok: true,
  tools: [],
  sessionToken: null,
  tts: {
    activeProvider: "openai",
    fallbackProvider: "browser",
    providers: [
      { id: "openai", configured: true, reason: null },
      { id: "browser", configured: true, reason: "Browser speech fallback is available client-side." },
    ],
  },
  localeDefaults: { locale: "en-US", transcriptionLanguage: "en-US" },
};

describe("conversation workspace", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetVoiceSettingsMemoryForTests();
    installFetch();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("renders voice, screen, agent, teaching, and evidence surfaces", () => {
    render(<AgentConversationWorkspace vault={vault} />);
    expect(screen.getByRole("heading", { name: "Conversation" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /start conversation/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /share screen/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /pause agent/i })).toBeInTheDocument();
    expect(screen.getByText(/No screen is being shared/i)).toBeInTheDocument();
  });

  it("submits a typed turn through the agent request path with the response style", async () => {
    window.localStorage.setItem(VOICE_SETTINGS_KEY, JSON.stringify({ responseStyle: "concise" }));
    render(<AgentConversationWorkspace vault={vault} />);
    fireEvent.change(screen.getByLabelText("Ask LifeOS"), { target: { value: "What needs attention?" } });
    fireEvent.click(screen.getByRole("button", { name: /^send$/i }));
    expect(await screen.findByText(/Answer from LifeOS context/i)).toBeInTheDocument();
    const turnCall = vi.mocked(fetch).mock.calls.find(([url]) => String(url) === "/api/lifeos/agent/turn");
    expect(turnCall).toBeDefined();
    expect(JSON.parse(String((turnCall![1] as RequestInit).body))).toMatchObject({ text: "What needs attention?", responseStyle: "concise" });
  });

  it("blocks a second typed turn while one is in flight and keeps the draft", async () => {
    let release: (() => void) | null = null;
    const fetchMock = installFetch({
      turn: () => new Promise<Response>((resolve) => {
        release = () => resolve(jsonResponse({ ok: true, result: TURN_RESULT }));
      }),
    });
    render(<AgentConversationWorkspace vault={vault} />);
    const box = screen.getByLabelText("Ask LifeOS");
    fireEvent.change(box, { target: { value: "First question" } });
    fireEvent.click(screen.getByRole("button", { name: /^send$/i }));
    fireEvent.change(box, { target: { value: "Second question" } });
    fireEvent.click(screen.getByRole("button", { name: /^send$/i }));
    expect(screen.getByTestId("turn-notice")).toHaveTextContent(/Still working on your last request/);
    expect(box).toHaveValue("Second question");
    expect(fetchMock.mock.calls.filter(([url]) => String(url) === "/api/lifeos/agent/turn")).toHaveLength(1);
    await act(async () => {
      release?.();
    });
    expect(await screen.findByText(/Answer from LifeOS context/i)).toBeInTheDocument();
  });

  it("hydrates saved voice settings even when the session fetch fails, without overwriting them", async () => {
    const saved = JSON.stringify({ provider: "browser", locale: "zh-TW", transcriptionLanguage: "fr-FR", responseStyle: "coach", speechRate: 1.3, pitch: 0.8 });
    window.localStorage.setItem(VOICE_SETTINGS_KEY, saved);
    installFetch({ session: "reject" });
    render(<AgentConversationWorkspace vault={vault} />);
    const panel = settingsPanel();
    await waitFor(() => expect(panel.getByLabelText("Locale")).toHaveValue("zh-TW"));
    expect(panel.getByLabelText("Input language")).toHaveValue("fr-FR");
    expect(panel.getByLabelText("Response style")).toHaveValue("coach");
    expect(panel.getByLabelText("Speed")).toHaveValue("1.3");
    expect(await screen.findByRole("alert")).toHaveTextContent(/Unable to load agent session metadata/);
    expect(window.localStorage.getItem(VOICE_SETTINGS_KEY)).toBe(saved);
  });

  it("clears the error and retries session metadata from Try again without a reload", async () => {
    let sessionCalls = 0;
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      if (String(input).includes("/api/lifeos/agent/session")) {
        sessionCalls += 1;
        if (sessionCalls === 1) throw new TypeError("Failed to fetch");
        return jsonResponse(openaiConfiguredSession);
      }
      return jsonResponse({ ok: false }, 404);
    }));
    render(<AgentConversationWorkspace vault={vault} />);
    expect(await screen.findByRole("alert")).toHaveTextContent(/Unable to load agent session metadata/);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
    await waitFor(() => expect(sessionCalls).toBe(2));
    const provider = settingsPanel().getByLabelText("Provider");
    await waitFor(() => expect(within(provider).getByRole("option", { name: /OpenAI voice \(owner secret required\)/ })).not.toBeDisabled());
  });

  it("does not auto-select OpenAI even when the server reports it configured", async () => {
    installFetch({ session: openaiConfiguredSession });
    render(<AgentConversationWorkspace vault={vault} />);
    const provider = settingsPanel().getByLabelText("Provider");
    await waitFor(() => expect(within(provider).getByRole("option", { name: /OpenAI voice \(owner secret required\)/ })).not.toBeDisabled());
    expect(provider).toHaveValue("browser");
    expect(window.localStorage.getItem(VOICE_SETTINGS_KEY)).toBeNull();
  });

  it("shows OpenAI as unavailable with the server reason and never calls /voice/speak", async () => {
    const spoken = installSpeech();
    window.localStorage.setItem(VOICE_SETTINGS_KEY, JSON.stringify({ provider: "openai" }));
    const fetchMock = installFetch({
      session: {
        ...openaiConfiguredSession,
        tts: {
          activeProvider: "browser",
          fallbackProvider: "browser",
          providers: [
            { id: "openai", configured: false, reason: "Paid TTS authorization secret is not set (LIFEOS_TTS_SECRET or LIFEOS_WRITE_SECRET)." },
            { id: "browser", configured: true, reason: null },
          ],
        },
      },
    });
    render(<AgentConversationWorkspace vault={vault} />);
    const panel = settingsPanel();
    expect(await panel.findByText(/openai unavailable: Paid TTS authorization secret is not set/)).toBeInTheDocument();
    expect(within(panel.getByLabelText("Provider")).getByRole("option", { name: /OpenAI voice \(unavailable\)/ })).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/owner write secret/i), { target: { value: "tts-secret" } });
    fireEvent.click(panel.getByRole("button", { name: /preview voice/i }));
    await waitFor(() => expect(spoken).toHaveLength(1));
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes("/api/lifeos/voice/speak"))).toBe(false);
    expect(screen.getByTestId("speech-runtime")).toHaveTextContent(
      /Speaking with browser voice \(system default\) — OpenAI unavailable: Paid TTS authorization secret is not set/,
    );
  });

  it("shows a visible fallback indicator when /voice/speak returns fallbackToBrowser", async () => {
    const spoken = installSpeech();
    window.localStorage.setItem(VOICE_SETTINGS_KEY, JSON.stringify({ provider: "openai", openaiVoice: "nova" }));
    const fetchMock = installFetch({
      session: openaiConfiguredSession,
      speak: () => jsonResponse({ ok: false, provider: "openai", fallbackToBrowser: true, error: "OpenAI returned 500." }, 502),
    });
    render(<AgentConversationWorkspace vault={vault} />);
    await waitFor(() => expect(settingsPanel().getByLabelText("Provider")).toHaveValue("openai"));
    // Without the owner secret OpenAI is not attempted.
    expect(await screen.findByTestId("openai-fallback-note")).toHaveTextContent(/enter the owner secret/);
    fireEvent.change(screen.getByLabelText(/owner write secret/i), { target: { value: "tts-secret" } });
    await waitFor(() => expect(screen.queryByTestId("openai-fallback-note")).toBeNull());
    fireEvent.click(settingsPanel().getByRole("button", { name: /preview voice/i }));
    await waitFor(() => expect(spoken).toHaveLength(1));
    const speakCall = fetchMock.mock.calls.find(([url]) => String(url).includes("/api/lifeos/voice/speak"));
    const init = speakCall![1] as RequestInit;
    expect(JSON.parse(String(init.body))).toMatchObject({ provider: "openai", voice: "nova" });
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer tts-secret");
    const runtime = screen.getByTestId("speech-runtime");
    expect(runtime).toHaveAttribute("aria-live", "polite");
    expect(runtime).toHaveTextContent("Speaking with browser voice (system default) — OpenAI unavailable: OpenAI returned 500.");
  });

  it("lists browser voices for the selected locale and previews with the chosen voice", async () => {
    const spoken = installSpeech();
    window.localStorage.setItem(VOICE_SETTINGS_KEY, JSON.stringify({ locale: "en-GB" }));
    render(<AgentConversationWorkspace vault={vault} />);
    const panel = settingsPanel();
    const voiceSelect = panel.getByLabelText("Voice");
    await waitFor(() => expect(within(voiceSelect).getAllByRole("option").map((option) => option.textContent)).toEqual(["System default", "Beta UK"]));
    fireEvent.change(voiceSelect, { target: { value: "uk-1" } });
    expect(JSON.parse(window.localStorage.getItem(VOICE_SETTINGS_KEY) ?? "{}")).toMatchObject({ locale: "en-GB", browserVoiceURI: "uk-1" });
    fireEvent.click(panel.getByRole("button", { name: /preview voice/i }));
    await waitFor(() => expect(spoken).toHaveLength(1));
    expect(spoken[0].lang).toBe("en-GB");
    expect((spoken[0].voice as { name: string }).name).toBe("Beta UK");
    expect(screen.getByTestId("speech-runtime")).toHaveTextContent("Speaking with browser voice (Beta UK).");
  });

  it("warns instead of silently switching language when no installed voice matches the locale", async () => {
    installSpeech();
    window.localStorage.setItem(VOICE_SETTINGS_KEY, JSON.stringify({ locale: "zh-TW" }));
    render(<AgentConversationWorkspace vault={vault} />);
    expect(await screen.findByTestId("no-voice-warning")).toHaveTextContent(/No installed browser voice matches zh-TW/);
    fireEvent.change(settingsPanel().getByLabelText("Locale"), { target: { value: "fr-FR" } });
    await waitFor(() => expect(screen.queryByTestId("no-voice-warning")).toBeNull());
  });

  it("offers the OpenAI voice allowlist when OpenAI is selected and persists the choice", async () => {
    installSpeech();
    window.localStorage.setItem(VOICE_SETTINGS_KEY, JSON.stringify({ provider: "openai", responseStyle: "coach" }));
    installFetch({ session: openaiConfiguredSession });
    render(<AgentConversationWorkspace vault={vault} />);
    const voiceSelect = settingsPanel().getByLabelText("Voice");
    await waitFor(() => expect(within(voiceSelect).getAllByRole("option")).toHaveLength(12));
    expect(within(voiceSelect).getAllByRole("option")[0]).toHaveTextContent("Style default (sage)");
    fireEvent.change(voiceSelect, { target: { value: "ballad" } });
    expect(voiceSelect).toHaveValue("ballad");
    expect(JSON.parse(window.localStorage.getItem(VOICE_SETTINGS_KEY) ?? "{}")).toMatchObject({ provider: "openai", openaiVoice: "ballad" });
  });

  it("shows capability and privacy notes before the microphone starts", () => {
    render(<AgentConversationWorkspace vault={vault} />);
    expect(screen.getByTestId("voice-privacy-note")).toHaveTextContent(/processed by your browser or operating system's speech service/);
    expect(screen.getByTestId("voice-privacy-note")).toHaveTextContent(/reply text is sent to OpenAI/);
    expect(screen.getByTestId("voice-privacy-note")).toHaveTextContent(/Nothing is recorded or stored by LifeOS/);
    // jsdom has no SpeechRecognition / speechSynthesis.
    const notes = screen.getAllByTestId("voice-capability-note").map((note) => note.textContent).join(" ");
    expect(notes).toMatch(/Speech recognition isn't supported/);
    expect(notes).toMatch(/Speech synthesis isn't supported/);
  });
});
