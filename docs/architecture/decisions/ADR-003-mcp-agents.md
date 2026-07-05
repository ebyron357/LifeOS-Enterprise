# ADR-003: MCP as Agent Integration Standard

**Status:** Accepted
**Date:** 2026-07-05
**Deciders:** LifeOS Enterprise founding team

---

## Context

LifeOS Enterprise agents need to interact with the platform and with external tools. Multiple integration patterns exist: custom API clients, LangChain tools, function calling schemas, and the emerging Model Context Protocol (MCP) standard.

A consistent integration standard reduces agent development time, improves interoperability, and allows the same agent to work with multiple LLM providers.

## Decision

**Model Context Protocol (MCP)** is the standard for all agent tool integration in LifeOS Enterprise.

All platform capabilities exposed to agents are defined as MCP servers. All external integrations accessible to agents are wrapped as MCP servers. Agents connect to MCP servers via the standard MCP client protocol.

## Options Considered

| Option | Pros | Cons |
|--------|------|------|
| Custom API clients per agent | Full control | No standard; high duplication |
| LangChain tools | Popular ecosystem | Framework lock-in; Python-centric |
| OpenAI function calling only | Simple | Provider lock-in |
| MCP (Model Context Protocol) | Open standard; provider-agnostic; composable | Newer ecosystem; less tooling |

## Consequences

**Positive:**
- Provider-agnostic: agents work with any MCP-compatible LLM
- Composable: MCP servers are reusable across agents
- Standard protocol: tooling, SDKs, and community resources
- Clear capability boundary: agents only see what their MCP servers expose

**Negative:**
- MCP ecosystem is still maturing
- Requires MCP server implementation for every tool integration

## Mitigations

- Build thin MCP adapter wrappers for common integrations
- Monitor MCP specification evolution and update server implementations accordingly
- See [MCP Integrations](../../../mcp/README.md) for the integration catalog
