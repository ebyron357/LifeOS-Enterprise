# People

## Purpose
The People module manages all human participants within LifeOS — operators, team members, collaborators, contractors, and stakeholders. It defines roles, responsibilities, skills, availability, and relationships between people and the businesses, projects, and agents they interact with.

## Inputs
- Person onboarding requests
- Role and responsibility definitions
- Availability and capacity information
- Stakeholder mappings from `/businesses` and `/projects`
- Skill profiles for task assignment optimization

## Outputs
- People registry (searchable directory)
- Role-to-project assignment maps
- Workload and capacity reports
- Stakeholder maps per business
- Org chart structures
- Contact and escalation directories

## Dependencies
| Dependency | Module | Type |
|-----------|--------|------|
| Businesses | /businesses | Owner context |
| Projects | /projects | Assignment target |
| CRM | /crm | External contacts |
| Agents | /agents | AI counterparts |

## Relationships
- People are **assigned to** projects and businesses
- People are **paired with** AI agents for augmentation
- People appear in **escalation rules** across agent and workflow configs
- The CRM module handles **external contacts**; People handles **internal team members**

## Structure
```
people/
├── README.md               # This file
├── _templates/
│   └── person.md           # Person profile template
├── team/                   # Internal team members
└── stakeholders/           # Stakeholders and advisors
```

## Future Extensions
- Skills-based task assignment engine
- Capacity planning dashboard
- 360 feedback integration
- People analytics (contributions, velocity)
- Integration with HR systems
