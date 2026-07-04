# CRM

## Purpose
The CRM (Customer Relationship Management) module manages all external relationships — customers, leads, partners, vendors, and prospects — across LifeOS businesses. It tracks interactions, pipelines, deal stages, and relationship health to ensure no relationship is neglected and every opportunity is captured.

## Inputs
- Contact and company data (manual or via integration)
- Interaction logs (emails, calls, meetings)
- Deal and pipeline updates
- Lead generation outputs from Marketing agents
- Meeting notes and follow-up actions

## Outputs
- Contact and company registry
- Sales pipeline views per business
- Relationship health scores
- Follow-up action queues
- Deal won/lost analytics
- Customer lifetime value tracking

## Dependencies
| Dependency | Module | Type |
|-----------|--------|------|
| Businesses | /businesses | Owner context |
| People | /people | Internal contact mapping |
| Projects | /projects | Linked deals |
| Finance | /finance | Revenue attribution |
| Agents/Sales | /agents | Pipeline automation |
| Automations | /automations | Follow-up triggers |

## Relationships
- CRM contacts are **external** (customers, partners, vendors) vs. `/people` which is **internal**
- CRM pipelines are **linked to** businesses and projects
- Sales agent **operates within** the CRM module
- Revenue from deals is **tracked in** `/finance`

## Structure
```
crm/
├── README.md               # This file
├── _templates/
│   ├── contact.md          # Contact profile template
│   ├── company.md          # Company profile template
│   └── deal.md             # Deal and opportunity template
├── contacts/               # Individual contact records
├── companies/              # Company records
└── pipeline/               # Sales pipeline stages
```

## Future Extensions
- AI-powered relationship health scoring
- Automated follow-up scheduling via AI agent
- Email and calendar integration for interaction tracking
- Customer segmentation and cohort analysis
- Integration with Shopify for customer purchase history
