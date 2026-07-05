# Data Flow

## Core Write Path

All state mutations follow this path:

```
User/Agent Action
      │
      ▼
API Command (validated against schema)
      │
      ▼
Authorization Check (RBAC)
      │
      ▼
Domain Logic (business rules applied)
      │
      ▼
Event Emitted (immutable, timestamped)
      │
      ├──► Event Store (append-only log)
      │
      └──► Event Bus (async fanout)
                │
                ├──► Read Model Update (projected state)
                ├──► Knowledge Graph Update
                ├──► Agent Trigger (if subscribed)
                └──► Automation Trigger (if configured)
```

---

## Core Read Path

```
User/Agent Query
      │
      ▼
API Query (validated parameters)
      │
      ▼
Authorization Check (scope enforcement)
      │
      ▼
Read Model / Knowledge Graph
      │
      ▼
Response (shaped to schema)
```

---

## Agent Action Flow

```
Trigger (event, schedule, or user request)
      │
      ▼
Agent receives context (scoped to their permissions)
      │
      ▼
Agent reasons and produces action plan
      │
      ▼
Confidence threshold check
      │
      ├── High confidence ──► Execute action (logged)
      │
      └── Low confidence ──► Surface recommendation to human
                                    │
                                    ├── Approved ──► Execute action (logged)
                                    └── Rejected ──► Log + learn
```

---

## Automation Trigger Flow

```
Event emitted on event bus
      │
      ▼
Automation engine evaluates trigger conditions
      │
      ▼
Matching workflow found
      │
      ▼
Step 1: Execute (action or agent call)
      │
      ▼
Step N: Execute (chain of steps)
      │
      ▼
Completion event emitted
      │
      └──► Notification / next trigger (if chained)
```

---

## Knowledge Graph Update Flow

```
New entity created or updated
      │
      ▼
Entity Extractor identifies relationships
      │
      ▼
Graph nodes and edges updated
      │
      ▼
Search index updated
      │
      ▼
Affected agents notified (if subscribed)
```

---

## Cross-Business Data Flow

Business units are logically isolated. Cross-business access requires:

1. An explicit link entity (e.g., a shared contact, a shared project)
2. The requesting user having permissions in both business units
3. An audit event logged for the cross-business access

Data from one business unit never appears in another business unit's feed without explicit linkage.
