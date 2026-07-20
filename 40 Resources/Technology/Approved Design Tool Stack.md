# Approved Design Tool Stack

**Status:** Canonical  
**Owner:** EAB Byron  
**Last reviewed:** 2026-07-19  
**Review cadence:** Quarterly or when a repeated workflow limitation appears

## Purpose

This document is the canonical source of truth for design tools approved for active use across LifeOS projects. It replaces scattered tool suggestions and prevents duplicate subscriptions, unnecessary platform switching, and unstructured experimentation.

Tools are approved only when they strengthen a real workflow involving website design, brand systems, packaging, marketing content, accessibility, design-to-code, or production quality control.

## Operating Rules

1. Use the smallest effective tool stack.
2. Do not add another general-purpose website generator when an approved tool already performs the same job.
3. Every project must identify its primary design tool, production tool, and quality-control tool.
4. Experimental tools must be tested on one controlled project before broader adoption.
5. Final production assets must remain in the appropriate source-of-truth system: Figma for interface systems, Adobe Illustrator for vector and print masters, GitHub for code and governed documentation, and approved project repositories for implementation.
6. AI-generated output is never considered final until it passes visual, accessibility, brand, and production review.

# Approved Core Stack

## Figma

**Status:** Approved — Primary interface design system  
**Use for:** Website and application design, wireframes, prototypes, components, variables, design systems, and developer handoff.

**Required role:**
- Primary source of truth for approved interface design.
- Store reusable components, layout rules, typography, colors, spacing, and interaction states.
- Use before development when visual direction has not already been approved.

## Adobe Illustrator

**Status:** Approved — Primary vector and print production tool  
**Use for:** Logos, packaging, labels, dielines, print-ready artwork, vector masters, and manufacturing files.

**Required role:**
- Source of truth for production vector artwork.
- Preserve editable master files.
- Use for packaging geometry, bleeds, safe areas, barcodes, QR codes, and print exports.

## Adobe Photoshop

**Status:** Approved — Primary raster editing tool  
**Use for:** Photo cleanup, retouching, compositing, resizing, mockup preparation, and image optimization.

**Required role:**
- Use for image corrections and production-ready raster assets.
- Do not replace original source photography without preserving the original.

## Adobe Express and Canva

**Status:** Approved — Fast branded content production  
**Use for:** Social posts, flyers, postcards, presentations, simple marketing assets, and rapid branded variations.

**Required role:**
- Use approved brand colors, typography, logos, and imagery.
- Do not treat generated templates as final without brand review.

## v0 and Figma Make

**Status:** Approved — Rapid concept generation  
**Use for:** Early interface concepts, design exploration, component ideas, and rapid design-to-code prototypes.

**Required role:**
- Use for exploration, not as an automatic production source of truth.
- Final implementation must be reviewed and integrated through the project repository.

## Codex, GitHub, and Vercel

**Status:** Approved — Production implementation and deployment  
**Use for:** Code implementation, version control, pull requests, automated checks, preview deployments, and production releases.

**Required role:**
- GitHub is the source of truth for code and change history.
- Use branches and pull requests for material changes.
- Verify builds, responsive behavior, and live deployment before completion.

# Newly Approved Tools

## SuperDesign

**Status:** Approved — Use now  
**Primary use:** Generate wireframes, interface directions, and multiple design options inside Cursor, VS Code, Windsurf, or compatible agent workflows.

**Best fit:**
- D’Affordable Homes
- ClientVerse
- Take A Sweet Bakery
- Real-estate platform interfaces
- Early concept exploration before coding

**Operating rule:** Use SuperDesign to compare visual directions before committing development resources. Do not let it replace the approved Figma design system or production review.

## Onlook

**Status:** Approved — Use now  
**Primary use:** Visually inspect and edit supported Next.js and Tailwind interfaces while preserving the underlying code workflow.

**Best fit:**
- Live visual refinement of Next.js websites
- Layout, spacing, typography, and responsive corrections
- Faster collaboration between visual review and code changes

**Operating rule:** Changes must still be committed through GitHub, tested, and reviewed before deployment. Do not edit production without a branch or verified rollback path.

## Figma Simple Design System

**Status:** Approved — Use now  
**Primary use:** Establish a consistent bridge between Figma variables, components, React implementation, Storybook, and code references.

**Best fit:**
- Creating one reusable design-system standard across websites
- Preventing code from drifting away from approved design
- Standardizing components, tokens, states, and documentation

**Operating rule:** Use as a reference architecture, then adapt it to the brand and technical requirements of each project. Do not copy generic styling into production unchanged.

## Adobe React Aria

**Status:** Approved — Use now  
**Primary use:** Build accessible React interactions and components with strong keyboard, focus, and screen-reader behavior.

**Best fit:**
- ClientVerse
- D’Affordable Homes
- Real-estate portals
- Forms, dialogs, menus, tabs, selectors, and complex interactive controls

**Operating rule:** Use when it improves accessibility without forcing generic visual styling. Components must still match the project design system and pass accessibility testing.

## PackCAD Mockup with Blender

**Status:** Approved — Use now  
**Primary use:** Convert packaging artwork and dielines into realistic 3D packaging presentations and product renders.

**Best fit:**
- THE ALTERNATIVE beverage cans
- ALT syrups
- Bravo Paws packaging
- Boxes, labels, bottles, and presentation mockups

**Operating rule:** 3D renders are presentation assets, not manufacturing proof. Final dimensions, dielines, bleeds, legal copy, barcodes, QR codes, and print files must still be verified in Adobe Illustrator and the production QA process.

# Approved Quality-Control Tools

## Axe or Accessibility Insights

**Status:** Approved — Required for website accessibility review  
**Use for:** Automated accessibility checks, keyboard issues, semantic problems, contrast warnings, and developer guidance.

**Operating rule:** Automated checks do not replace manual keyboard, mobile, screen-reader, and visual review.

## GSAP

**Status:** Approved — Conditional use  
**Use for:** High-quality web motion, interaction feedback, premium transitions, and carefully controlled animation.

**Operating rule:** Use only when motion improves comprehension, hierarchy, storytelling, or conversion. Do not add animation merely for decoration. Respect reduced-motion preferences and performance budgets.

# Controlled Pilot Tools

The following tools are not approved for broad adoption. They may be tested on one controlled project with documented results.

## OpenPencil

**Status:** Controlled pilot  
**Potential use:** AI-native vector and interface design experimentation.

**Pilot requirement:** Compare output quality, editability, export reliability, learning curve, and duplication against Figma and Adobe tools.

## Open Design

**Status:** Controlled pilot  
**Potential use:** AI design workspaces, reusable skills, plugins, systems, and templates.

**Pilot requirement:** Determine whether it improves LifeOS agent workflows without creating another isolated platform.

## Avocado Studio

**Status:** Controlled pilot  
**Potential use:** Preview-based editing of supported Next.js content and components.

**Pilot requirement:** Test only in a branch or non-production environment. Confirm code quality, rollback, security, and compatibility with the existing stack.

## Figma Code Connect

**Status:** Controlled pilot pending plan eligibility and project need  
**Potential use:** Connect production components to matching Figma components.

**Pilot requirement:** Confirm Figma plan access, component maturity, and whether the project has a stable design system worth connecting.

# Tool Selection by Work Type

| Work type | Primary tool | Supporting tools | Quality control |
|---|---|---|---|
| Website interface design | Figma | SuperDesign, v0, Figma Make | Brand review, accessibility review |
| Next.js visual refinement | Figma + project code | Onlook | GitHub PR, build, responsive QA |
| Production implementation | Codex + GitHub | Vercel | Automated checks and live verification |
| Accessible React components | Project code | React Aria | Axe or Accessibility Insights |
| Logo and vector design | Adobe Illustrator | Figma for interface usage | Vector and export QA |
| Packaging production | Adobe Illustrator | PackCAD Mockup, Blender, Photoshop | Prepress and manufacturing QA |
| Social and promotional content | Adobe Express or Canva | Photoshop, approved templates | Brand and copy review |
| Premium website motion | Project code | GSAP | Performance and reduced-motion QA |

# Project Adoption Priorities

1. Use SuperDesign during early design exploration before development begins.
2. Use Onlook on one active Next.js website to validate visual editing and code quality.
3. Establish a Figma Simple Design System reference for one website, then reuse the operating pattern.
4. Add React Aria where projects contain complex interactive controls.
5. Use PackCAD Mockup and Blender for packaging presentations while preserving Illustrator as the manufacturing source of truth.
6. Add Axe or Accessibility Insights to every active website quality-control process.
7. Use GSAP only on projects where motion has a clear business or usability purpose.

# Explicitly Not Approved

The following practices are not approved:

- Adding multiple general-purpose website generators that duplicate v0, Figma Make, Replit, Codex, or existing development workflows.
- Purchasing tools before a specific repeated limitation is documented.
- Treating AI-generated mockups, logos, interfaces, or packaging as final production work without expert review.
- Allowing visual-editing tools to bypass GitHub history, testing, or deployment controls.
- Maintaining separate conflicting tool lists across projects.

# Review and Change Control

Any future change to this stack must replace this document with a complete updated version. The update must:

1. Preserve all still-approved tools and rules.
2. Add newly approved tools in the correct category.
3. Remove tools that are obsolete, duplicative, insecure, unsupported, or no longer useful.
4. Record the new review date.
5. Reconcile duplicates and conflicting guidance.
6. Keep this file as the single canonical approved design-tool inventory.
