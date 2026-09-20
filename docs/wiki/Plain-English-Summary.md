# Plain-English Summary

## What this is

LifeOS Enterprise is a personal and business operating system that lives in a
single GitHub repository. It is two things stacked on top of each other:

1. **A structured notes vault.** Plain Markdown files organised into numbered
   folders (`00 Home`, `01 Inbox`, `10 Projects`, `20 Areas`, `30 Goals`,
   `40 Resources`, `50 People`, `60 Reviews`, `70 Journal`, `80 SOPs`,
   `90 Archive`, `99 Templates`). You can open the repository directly in
   Obsidian and work with it as a normal notebook.
2. **A web application that reads that vault.** A Next.js site presents the same
   notes as a command center: today's priorities, active projects, tasks,
   people, journal entries, reviews, search, and a read-only note reader.

The important design decision is that the notes are the database. There is no
separate hidden store you can lose access to. If the web app were switched off
tomorrow, every note would still be readable in any text editor.

## Who it is for

- **The owner/operator** running several projects and businesses at once who
  wants one daily screen instead of five tools.
- **Anyone already using Obsidian** who wants a web view and a review discipline
  layered on top without abandoning plain files.
- **A buyer or team** who wants a self-hosted, vendor-neutral alternative to
  Notion/ClickUp-style workspaces where data ownership is absolute.

## What you actually do with it

- Capture anything into an inbox, then process it during a daily or weekly review.
- Keep projects honest: every active project must state its status, priority,
  next action, and a review date.
- Open a single Command Center each day and see what is active, what is blocked,
  what needs review, and what learning is due.
- Browse and search the whole vault from a web browser instead of needing the
  desktop app.
- Optionally talk to it. There is a voice console that uses the browser's own
  speech features, with paid text-to-speech only if the owner explicitly enables
  and pays for it.

## The safety rule that shapes everything

The web application is **read-only by default**. It will not silently change your
notes. When a change is proposed through the app, it is staged in the browser and
can only become permanent through a reviewed draft pull request on GitHub. Direct
writes to the `main` branch are structurally disallowed. Any integration whose
credentials are missing is shown as *unavailable* rather than pretending to be
connected.

## What it is not

- It is not a hosted SaaS product with sign-ups and multiple tenants. It is one
  owner's workspace, deployed from one repository.
- It is not a live collaboration tool. There is no multi-user editing.
- It is not an autonomous agent that acts on your behalf without permission.
  Consequential actions require owner approval, and the approval machinery
  refuses to run at all if its durable storage is not configured.
- It is not finished in the formal sense. The repository's own status document
  states that automated validation has passed but **owner acceptance is still
  outstanding**, and that some features (realtime voice transport, the full
  Resource Intelligence intake pipeline) are deliberately deferred.
