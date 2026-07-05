# User Story Template

> Use this template when writing user stories and their acceptance criteria.
> Stories are grouped under epics within PRDs.

---

## Epic Template

```markdown
## Epic {ID}: {Epic Name}

**Phase:** {N}
**PRD:** [PRD-{NNN}](link)
**Description:** {One sentence describing what this epic delivers}
```

---

## Story Template

```markdown
### US-{EpicID}-{StoryNum}: {Short Title}

**As an** {user type}
**I want to** {action or capability}
**So that** {benefit or outcome}

**Acceptance Criteria:**
- [ ] {Specific, testable criterion written from the user's perspective}
- [ ] {Specific, testable criterion}
- [ ] {Edge case or error state}

**Notes:**
- {Any clarifying notes for the implementor}
- {Links to wireframes, designs, or related stories}

**Out of Scope:**
- {What this story does NOT include}
```

---

## Writing Good Acceptance Criteria

Acceptance criteria should be:
- **Specific:** Not "it should work" but "clicking Save with no title shows an error message below the field"
- **Testable:** An engineer can write an automated test directly from the criterion
- **User-perspective:** Written from what the user observes, not how the system implements it
- **Complete:** Include happy path, error cases, and edge cases

### Good Examples
- `[ ] Submitting the form with an invalid email shows: "Please enter a valid email address" below the email field`
- `[ ] After 5 failed login attempts in 15 minutes, the login button is disabled and shows: "Too many attempts. Try again in 15 minutes."`
- `[ ] Completing a task that was the project's Next Action prompts: "Define a new Next Action for this project"`

### Bad Examples
- `[ ] Login works` — not specific enough
- `[ ] Store the hash in bcrypt column` — implementation detail, not user-facing
- `[ ] It should be fast` — not testable

---

## Story Sizing Reference

Use T-shirt sizing for estimation when needed:

| Size | Definition |
|------|-----------|
| XS | < 1 day — trivial change, no design needed |
| S | 1–2 days — clear requirement, minimal design |
| M | 3–5 days — well-understood, some design work |
| L | 1–2 weeks — complex or requires significant design |
| XL | > 2 weeks — needs to be split into smaller stories |

Stories sized XL must be decomposed before entering a sprint.
