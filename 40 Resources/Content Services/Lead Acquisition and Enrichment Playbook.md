---
type: resource
status: approved
source: LifeOS requirements and official product documentation
author: LifeOS
topic: lead-acquisition-enrichment
created: 2026-07-16
updated: 2026-07-16
review_date: 2026-08-01
tags:
  - resource
  - lead-generation
  - prospecting
  - clay
  - apollo
  - google-maps
  - enrichment
  - outreach
---

# Lead Acquisition and Enrichment Playbook

## Purpose

Create verified, relevant prospect lists for the Content-to-Lead service and move qualified opportunities into an approved CRM and follow-up workflow.

This is not a mass-scraping or spam system. The purpose is to identify businesses with an observable content, website, search, lead-capture, or follow-up gap and contact them with a relevant, reviewed message.

## Core Workflow

```text
Ideal client profile
  → account discovery
  → account qualification
  → decision-maker discovery
  → contact enrichment
  → contact verification
  → website/content gap research
  → lead scoring
  → reviewed outreach
  → reply classification
  → CRM handoff
  → follow-up and attribution
```

## Recommended Lead Stack

| Function | Primary tool | Role | Evidence or verification |
|---|---|---|---|
| Local business discovery | Google Maps and Google Places API | Find businesses by category, location, service area, and text query | Verify against current Business Profile and company website |
| B2B account and contact discovery | Apollo | Filter accounts and people by company, role, industry, geography, and other attributes | Verify company and contact before outreach |
| Enrichment orchestration | Clay | Combine sources, waterfall enrichments, research, classification, scoring, and handoffs | Retain provider, date, confidence, and source fields |
| Professional context | LinkedIn and Sales Navigator | Confirm role, tenure, company context, mutual connections, and engagement opportunities | Do not automate prohibited scraping or bulk messaging |
| Website and offer research | Company website and Google Search | Confirm services, locations, content gaps, CTA, forms, and current offers | Treat the company website as the primary claim source |
| Technology detection | BuiltWith or Wappalyzer | Identify CMS, analytics, marketing, ecommerce, and form technologies | Verify critical findings manually |
| Email verification | Apollo verification plus an approved specialist verifier when justified | Reduce bounces and invalid addresses | Store verification date and result |
| CRM / system of record | GHL, HubSpot, or client-approved CRM | Store account, contact, source, consent, status, owner, and next action | Never let Clay or a sending tool become the only record |
| Outreach | Client-approved email platform, Apollo sequences, or a dedicated sequencer | Send small, reviewed campaigns and manage replies | Include identity, relevance, opt-out, suppression, and monitoring |
| Automation | Make, Zapier, n8n, or approved native integrations | Move only approved fields and create tasks | Do not automate final qualification or sensitive claims |
| Reporting | CRM + Looker Studio or approved dashboard | Track source, reply, qualification, calls, proposals, customers, and revenue | Reconcile against CRM records |

## Official URLs

### Clay

- Product: https://www.clay.com/
- Enrichment documentation: https://university.clay.com/docs/enrichments
- Lead enrichment tool: https://www.clay.com/tools/enrich-leads

### Apollo

- Product: https://www.apollo.io/
- Prospecting and enrichment: https://www.apollo.io/product/prospect-and-enrich
- Prospecting: https://www.apollo.io/product/prospect

### Google Maps and Places

- Google Maps: https://maps.google.com/
- Places API documentation: https://developers.google.com/maps/documentation/places/web-service
- Text Search: https://developers.google.com/maps/documentation/places/web-service/text-search
- Nearby Search: https://developers.google.com/maps/documentation/places/web-service/nearby-search
- Place Details overview: https://developers.google.com/maps/documentation/places/web-service/op-overview
- Places usage and billing: https://developers.google.com/maps/documentation/places/web-service/usage-and-billing
- Google Business Profile help: https://support.google.com/business/

### LinkedIn

- LinkedIn: https://www.linkedin.com/
- Sales Navigator: https://business.linkedin.com/sales-solutions/sales-navigator

### Technology Research

- BuiltWith: https://builtwith.com/
- Wappalyzer: https://www.wappalyzer.com/

### Verification and Delivery Options

- Hunter: https://hunter.io/
- NeverBounce: https://neverbounce.com/
- ZeroBounce: https://www.zerobounce.net/
- Smartlead: https://www.smartlead.ai/
- Instantly: https://instantly.ai/

These are options, not automatic subscription recommendations. Add only when a repeated limitation or ROI case is documented.

## Tool Roles

## 1. Google Maps and Google Places

### Best For

- local service businesses;
- location-based account discovery;
- category and service-area research;
- identifying businesses with incomplete websites, weak lead capture, missing content, or poor conversion paths;
- building a local market map.

### Manual Workflow

1. Define niche, city, radius, and exclusions.
2. Search Google Maps using one category and location at a time.
3. Open the Business Profile.
4. Record only relevant public business facts.
5. Open the official website.
6. Verify services, locations, contact channels, and observed content gap.
7. Record a specific outreach reason.
8. Mark the account qualified, rejected, or review required.

### API Workflow

Use the official Places API for structured applications. Prefer:

- Text Search for queries such as a service and city;
- Nearby Search for place types within a geographic area;
- Place Details when a Place ID is already known.

Use field masks so the application requests only needed fields and controls cost.

### Required Fields

- business name;
- category;
- location or service area;
- website;
- phone when publicly available;
- Google Place ID when using the API;
- rating and review count when relevant;
- source URL;
- date verified;
- observed content or lead gap;
- qualification status.

### Restrictions

- Do not use unauthorized scraping or bypass Google access controls.
- Do not treat a listing as proof of consent to marketing.
- Do not invent email addresses from domains.
- Do not copy reviews into marketing assets without permission and context.
- Do not claim a business has a problem without a documented observation.

## 2. Apollo

### Best For

- B2B company and person search;
- filtering by industry, geography, size, role, seniority, and related attributes;
- identifying likely decision-makers;
- enriching approved account lists;
- optional reviewed sequencing;
- API-backed search and enrichment where allowed by plan and policy.

### Workflow

1. Start with the approved ideal client profile.
2. Build or import the qualified company list.
3. Select the one or two roles most likely to own the problem.
4. Use narrow filters rather than exporting a broad market.
5. Verify employment and company website.
6. Record contact source, verification state, and date.
7. Suppress duplicates, prior opt-outs, clients, partners, and inappropriate contacts.
8. Send only after the personalization evidence and outreach angle are reviewed.

### Do Not

- export huge lists before the offer and niche are proven;
- rely on a job title alone;
- treat a verified email as consent;
- use multiple contacts at one account without an account-level strategy;
- continue contacting an opted-out or inappropriate recipient.

## 3. Clay

### Best For

- orchestrating account and contact data;
- provider waterfall enrichment;
- company and website research;
- AI classification and summarization;
- scoring;
- routing approved records to CRM or outreach;
- reducing manual copy-and-paste across tools.

### Recommended Clay Table Stages

1. Source Account
2. Company Verification
3. Website and Domain
4. ICP Fit
5. Content/Website Gap
6. Contact Role
7. Contact Enrichment
8. Email Verification
9. Personalization Evidence
10. Lead Score
11. Human Approval
12. CRM Sync
13. Outreach Status
14. Reply and Outcome

### Required Provenance Fields

- source platform;
- source URL;
- enrichment provider;
- enrichment date;
- raw value;
- normalized value;
- confidence;
- verification status;
- human-reviewed status;
- suppression status.

### Cost Controls

- test with a small sample first;
- use conditional runs;
- avoid running expensive enrichments on unqualified rows;
- use existing provider accounts when this is cheaper and authorized;
- stop enrichment when the required verified field is found;
- track cost per qualified record and cost per opportunity.

## 4. LinkedIn and Sales Navigator

### Best For

- validating professional role and tenure;
- identifying relationships and mutual connections;
- researching recent posts and company priorities;
- creating warm introductions;
- engaging before outreach;
- building professional authority.

### Workflow

1. Confirm the person and current role.
2. Review company and profile context.
3. Identify one relevant business reason to connect.
4. Prefer warm introductions and useful engagement.
5. Record last contact, next action, and relationship status in LifeOS or CRM.

Do not automate scraping, invitations, or messages in ways that violate platform rules.

## Ideal Client Profile

Every campaign must define:

- target niche;
- geography;
- company size or maturity;
- website or platform type;
- commercial service to grow;
- observable content/lead problem;
- decision-maker roles;
- exclusion rules;
- minimum evidence required;
- offer and CTA.

### Example Content-to-Lead Fit Signals

- strong services but weak or absent educational content;
- no clear service page for a profitable offering;
- content without lead magnets or CTAs;
- lead magnet without delivery or nurture;
- forms with no visible next step;
- outdated content;
- thin local-service pages;
- weak internal linking;
- no conversion measurement;
- no Search Console or analytics baseline;
- no content refresh system;
- disconnected CRM and content reporting.

## Lead Qualification Score

Score from 0–100:

| Factor | Weight |
|---|---:|
| ICP fit | 20 |
| Commercial service opportunity | 15 |
| Observable content/lead gap | 20 |
| Ability to contact appropriate owner | 10 |
| Website and data confidence | 10 |
| Estimated urgency or trigger | 10 |
| Ability to demonstrate relevant proof | 10 |
| Compliance and reputation fit | 5 |

Suggested routing:

- 80–100: reviewed priority outreach;
- 65–79: nurture or additional research;
- 50–64: low priority;
- below 50: reject or archive.

A score does not authorize outreach. Human review remains required.

## Prospect Record Fields

- account name;
- website;
- operating context;
- industry;
- location;
- source;
- source URL;
- observed gap;
- evidence URL;
- ICP score;
- qualification status;
- contact name;
- role;
- professional profile URL;
- email;
- email verification status and date;
- phone when appropriate and lawfully used;
- suppression status;
- consent or lawful-basis note where applicable;
- outreach angle;
- owner;
- next action;
- review date;
- CRM ID;
- campaign;
- reply status;
- opportunity status;
- revenue attribution.

## Outreach Standard

Every message must:

- identify the sender accurately;
- use a real observation rather than false familiarity;
- explain why the recipient was selected;
- make one relevant offer;
- avoid exaggerated claims;
- provide a clear, low-friction next step;
- include required opt-out language;
- stop after opt-out;
- be recorded in the CRM or approved tracker.

### Outreach Structure

1. Specific observed issue or opportunity
2. Why it matters commercially
3. One useful suggestion or proof asset
4. Offer for a small next step
5. Identification and opt-out

## Reply Classification

- Positive — interested
- Referral — another person owns it
- Timing — revisit later
- Information request
- Objection
- Not relevant
- Opt-out
- Invalid contact
- Auto-reply
- Unclear — human review

Automations may classify but must not send sensitive or high-stakes replies without review.

## CRM Handoff

A qualified lead handoff must include:

- source and campaign;
- account and contact;
- observed gap;
- evidence links;
- qualification score;
- outreach history;
- reply summary;
- owner;
- next action;
- due date;
- suppression and consent status;
- relevant content or proof asset.

## Compliance and Reputation Rules

- Maintain a suppression list.
- Honor opt-outs immediately.
- Review jurisdiction-specific marketing, privacy, and data rules.
- Use business-relevant contact information only.
- Minimize data collected.
- Protect exported lead lists.
- Do not share or resell lists without a lawful, documented basis.
- Delete stale or unnecessary data according to policy.
- Separate client-owned lists from internal prospecting.
- Never send from a client's identity without explicit authorization.
- Do not use deceptive subject lines, impersonation, fabricated relationships, or fake urgency.

## Pilot Standard

Before scaling:

1. Select one niche.
2. Build 25–50 qualified accounts.
3. Research the observed gap.
4. Identify appropriate contacts.
5. Verify all available contact fields.
6. Review every message.
7. Send a small batch.
8. Track delivery, replies, opt-outs, meetings, and quality.
9. Update qualification and messaging based on evidence.
10. Scale only if the pilot meets the approved thresholds.

## Metrics

- accounts discovered;
- accounts qualified;
- contact match rate;
- verified email rate;
- enrichment cost;
- cost per qualified lead;
- bounce rate;
- reply rate;
- positive reply rate;
- opt-out rate;
- meeting rate;
- proposal rate;
- customer rate;
- revenue by source;
- time from discovery to handoff;
- data correction rate.

## Evidence Status

- Tool capabilities: verified against current official product or platform documentation at the review date.
- Fit for a specific campaign: requires live testing.
- Contact accuracy: requires record-level verification.
- Legal/compliance suitability: requires jurisdiction and campaign review.

## Linked Records

- [[20 Areas/Content-to-Lead Services]]
- [[10 Projects/Operationalize Content-to-Lead Service]]
- [[40 Resources/Content Services/Content-to-Lead Agency Operating System]]
- [[40 Resources/Content Services/Content Services Tool Stack]]