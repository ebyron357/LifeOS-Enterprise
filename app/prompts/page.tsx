import Link from "next/link";
import { AppShell } from "@/components/os/AppShell";
import { PromptCopyButton } from "@/components/os/PromptCopyButton";
import { getOsContext } from "@/lib/os/page-data";
import { catalogPromptsFromNotes, recommendPrompts, searchPrompts } from "@/lib/prompt-intelligence/catalog";
import { redactSecrets } from "@/lib/prompt-intelligence/security";
import { getVaultIndex } from "@/lib/vault/index";
import { noteHref } from "@/lib/vault/slug";
import { containsRawPlaceholder } from "@/lib/os/templates";

export const dynamic = "force-dynamic";

type PromptsPageProps = {
  searchParams: Promise<{
    q?: string;
    project?: string;
    client?: string;
    agent?: string;
    model?: string;
    task?: string;
    tag?: string;
    status?: string;
  }>;
};

export default async function PromptsPage({ searchParams }: PromptsPageProps) {
  const params = await searchParams;
  const [index, os] = await Promise.all([getVaultIndex(), getOsContext()]);
  const prompts = catalogPromptsFromNotes(index.notes).filter((prompt) => !containsRawPlaceholder(prompt.title));
  const query = params.q ?? "";
  const contextualQuery = [query, params.project, params.task].filter(Boolean).join(" ");
  const results = searchPrompts(prompts, contextualQuery, {
    client: params.client,
    agent: params.agent,
    model: params.model,
    tag: params.tag,
    status: params.status,
  });
  const recommendation = recommendPrompts(prompts, {
    project: params.project || os.resume.focus?.name,
    task: params.task || os.resume.next.detail,
    query,
  })[0];
  const listed = query || params.project || params.client || params.agent || params.model || params.task || params.tag || params.status
    ? results
    : prompts.filter((prompt) => prompt.current).slice(0, 20);

  return (
    <AppShell greeting={os.greeting}>
      <div className="os-grid">
        <header className="os-page-header">
          <p className="widget-eyebrow">Advanced library</p>
          <h1>Prompt Intelligence</h1>
          <p>Find the prompt already used for this work. Do not rebuild it from memory.</p>
        </header>

        {recommendation ? (
          <section className="os-card" aria-labelledby="prompt-recommend-heading">
            <h2 id="prompt-recommend-heading">You already have a prompt for this</h2>
            <p><strong>{recommendation.prompt.title}</strong> v{recommendation.prompt.version}</p>
            <p>{recommendation.reason}</p>
            {recommendation.warning ? <p>{recommendation.warning}</p> : null}
            <Link className="os-primary" href={noteHref(recommendation.prompt.path)}>Open recommended prompt</Link>
          </section>
        ) : null}

        <form className="os-card os-learning" action="/prompts" method="get">
          <h2>Find a prompt</h2>
          <input name="q" defaultValue={query} placeholder="Title, project, or task" aria-label="Search prompts" />
          <div className="os-grid os-grid-2">
            <label>Project
              <input name="project" defaultValue={params.project ?? ""} aria-label="Filter by project" />
            </label>
            <label>Client
              <input name="client" defaultValue={params.client ?? ""} aria-label="Filter by client" />
            </label>
            <label>Agent
              <input name="agent" defaultValue={params.agent ?? ""} aria-label="Filter by agent" />
            </label>
            <label>Task type
              <input name="task" defaultValue={params.task ?? ""} aria-label="Filter by task type" />
            </label>
            <label>Tag
              <input name="tag" defaultValue={params.tag ?? ""} aria-label="Filter by tag" />
            </label>
            <label>Status
              <input name="status" defaultValue={params.status ?? ""} aria-label="Filter by status" />
            </label>
          </div>
          <button type="submit" className="os-primary">Search</button>
        </form>

        <section className="os-card">
          <h2>{query ? "Results" : "Canonical prompts"}</h2>
          {listed.length ? (
            <ul>
              {listed.map((prompt) => {
                const body = redactSecrets(prompt.promptBody).text;
                return (
                  <li key={prompt.id}>
                    <p>
                      <Link href={noteHref(prompt.path)}>{prompt.title}</Link>
                      {" "}
                      <span className="os-badge" data-state={prompt.current ? "available" : "degraded"}>v{prompt.version}</span>
                      {" "}
                      <span className="os-badge">{prompt.lastResultStatus}</span>
                    </p>
                    <p>{prompt.purpose || "No purpose recorded."}</p>
                    <p className="widget-eyebrow">
                      {[prompt.project, prompt.client, prompt.agent, prompt.model].filter(Boolean).join(" · ") || "No linked project or agent yet."}
                      {prompt.recommendedContext ? ` · ${prompt.recommendedContext}` : ""}
                      {prompt.lastResult ? ` · last result: ${prompt.lastResult}` : ""}
                    </p>
                    {prompt.warnings.length ? <p>{prompt.warnings.join(" ")}</p> : null}
                    {prompt.privacyLevel === "private" ? <p>Private prompt body is not shown here.</p> : <PromptCopyButton text={body} />}
                  </li>
                );
              })}
            </ul>
          ) : <p>No matching canonical prompt. Capture it once under 40 Resources/Prompts rather than rebuilding it.</p>}
        </section>
        <p><Link href="/">Back to Command Center</Link> · <Link href="/files">Files</Link></p>
      </div>
    </AppShell>
  );
}
