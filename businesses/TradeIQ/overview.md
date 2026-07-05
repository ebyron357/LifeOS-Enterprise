# TradeIQ

## Overview

TradeIQ is the trading intelligence business unit within LifeOS Enterprise. It provides a structured system for managing trading strategies, logging trades, and tracking performance — integrated with real trading platforms via read-only data connections.

---

## Domain

- **Asset classes:** Equities, options, futures, crypto, FX (configurable per operator)
- **Strategy types:** Trend, mean-reversion, event-driven, systematic, discretionary
- **Time horizons:** Intraday, swing, position, long-term

---

## Core Entities (Domain Extensions)

### Strategy (extends Project)
Additional fields:
- `assetClass: string`
- `timeHorizon: "intraday" | "swing" | "position" | "long_term"`
- `maxDrawdown: number` (percentage)
- `expectedReturn: number` (percentage, annualized)
- `status: "active" | "paused" | "backtesting" | "retired"`

### TradeLog (new entity, linked to Strategy)
```
instrumentSymbol: string
direction: "long" | "short"
entryDate: string (ISO 8601)
exitDate?: string
entryPrice: number
exitPrice?: number
size: number
thesis: string
outcome?: "win" | "loss" | "breakeven"
outcomeNotes?: string
```

---

## Integration Requirements

- **Trading Platform Integration (read-only):** Open positions, P&L summary, account balance summaries
- **Market Data (read-only):** Price context for trade log entries
- Both integrations are MCP-server based (see [mcp/](../../mcp/))
- LifeOS stores **no financial transaction data** — only strategy notes and trade thesis records

---

## AI Agent Use Cases (Phase 3+)

1. **Weekly Strategy Brief:** Summarizes each strategy's recent performance and open trades
2. **Research Linker:** Links market research notes to relevant strategy projects
3. **Trade Journal:** Prompts the operator to complete trade log entries for recently closed positions

---

## PRD Reference

[PRD-005: Business Modules — TradeIQ](../../docs/product/prd/PRD-005-business-modules.md#module-tradeiq)
