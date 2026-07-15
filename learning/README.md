# Learning

## Purpose
The Learning module is the professional development and capability-building layer of LifeOS. It tracks learning objectives, courses, skills, books, research papers, and training programs for both human operators and AI agent improvement. Learning feeds directly into the knowledge engine and skill profiles in `/people`.

## Inputs
- Learning objectives from operators and business owners
- Course completions and certifications
- Book and article summaries from `/notebooklm`
- Skill gap assessments from `/people`
- AI research outputs from `/agents`

## Outputs
- Learning progress tracking
- Skill acquisition records
- Synthesized learning summaries → `/knowledge`
- Learning recommendations per role and business objective
- Team capability reports

## Dependencies
| Dependency | Module | Type |
|-----------|--------|------|
| Knowledge | /knowledge | Output target |
| People | /people | Skill profiles |
| NotebookLM | /notebooklm | Content processor |
| Businesses | /businesses | Strategic objectives |

## Relationships
- Learning outcomes **feed** the knowledge engine
- Learning is **personalized** to people's roles and business goals
- AI agents **recommend** learning based on skill gaps and project needs
- Learning records are **linked** to skill profiles in `/people`

## Structure
```
learning/
├── README.md               # This file
├── objectives/             # Active learning goals
├── library/                # Books, courses, resources
├── completed/              # Completed learning records
└── summaries/              # Synthesized key takeaways
```

## Future Extensions
- AI-personalized learning path generator
- Automated course discovery and recommendation
- Learning velocity metrics
- Team knowledge coverage maps
- Integration with learning platforms (Coursera, Udemy, etc.)
