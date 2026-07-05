# PRD-004: MCP Integrations

**Status:** Draft
**Phase:** 4
**Version:** 0.1
**Last Updated:** 2026-07-05

---

## Overview

The MCP Integrations phase connects LifeOS Enterprise to the tools operators already use. All integrations are implemented as MCP servers, making them available to AI agents and surfaced contextually in the platform UI.

---

## Goals

1. Calendar events are visible in project and daily view
2. Email and Slack messages tagged to a project become tasks or notes
3. GitHub PRs and issues are linked to platform projects
4. Finance data (invoices, payments) is summarized on project views
5. All integrations are MCP-server based and reusable by agents

---

## Integration Catalog

### INT-001: Calendar (Google Calendar / Outlook)
**Direction:** Read (write for meeting creation)
**Data:** Events, attendees, availability
**Platform surface:** Upcoming events on project view; daily brief

### INT-002: Communication (Slack)
**Direction:** Read
**Data:** Messages in designated channels; @mentions
**Platform surface:** Messages tagged `#lifeos:<project-id>` become tasks or notes
**Agent use:** Morning Brief includes unread tagged messages

### INT-003: Email (Gmail / Outlook)
**Direction:** Read
**Data:** Emails in designated labels/folders
**Platform surface:** Flagged emails become tasks; email threads linked to contacts
**Agent use:** Task Creator can parse email content

### INT-004: GitHub
**Direction:** Read (write for issue creation)
**Data:** PRs, issues, commit summaries
**Platform surface:** PR/issue status on linked project; overdue PRs flagged
**Agent use:** Task Creator can create GitHub issues from platform tasks

### INT-005: Finance (QuickBooks / Xero)
**Direction:** Read
**Data:** Invoice status, payment history, expense summaries
**Platform surface:** Project billing status; business unit P&L summary
**Agent use:** Morning Brief includes overdue invoices

---

## Acceptance Criteria

### AC-001: MCP Server Standard
- [ ] Each integration is implemented as a standalone MCP server
- [ ] MCP servers are versioned independently of the platform
- [ ] MCP server tool schemas are documented in [mcp/](../../../mcp/)
- [ ] MCP servers handle auth token refresh without operator intervention
- [ ] MCP server failures degrade gracefully (platform functions without them)

### AC-002: Calendar
- [ ] Events for linked contacts appear on contact view
- [ ] Events within a project context window appear on project view
- [ ] Event creation from platform task respects attendee availability

### AC-003: Slack
- [ ] Messages with `#lifeos:<project-id>` tag are captured within 60 seconds
- [ ] Operator can review and approve/reject captured messages before they become tasks
- [ ] Integration requires only read:messages Slack scope

### AC-004: GitHub
- [ ] GitHub repos can be linked to platform projects
- [ ] Open PRs older than 3 days without review are flagged in project view
- [ ] Issue creation from platform task preserves task title, description, and assignee

### AC-005: Finance
- [ ] Invoice status (draft/sent/paid/overdue) visible on linked project
- [ ] Overdue invoices appear in Morning Brief
- [ ] No financial transaction data stored in LifeOS — summary only, linked by reference ID

---

## Security Notes

- OAuth tokens for integrations stored encrypted, never in plaintext
- Minimum required scopes requested for each integration (principle of least privilege)
- Integration tokens rotated on schedule; revocable by operator at any time
- See [Security Standards](../../standards/security.md)
