# LifeOS Scroll Craft implementation

Date: October 13, 2026. Scope: approved portfolio website scroll functionality, adapted to the LifeOS note reader. This is an implementation record, not an additional governing policy.

## Source and integration decision

Reviewed `nateherkai/scroll-craft` at upstream commit `75d81f74e83692add18cd7a8a8e078b8a887a579`: README, complete skill, runtime interfaces, and relevant typography, motion, and accessibility guidance. The source is a design skill plus a cinematic vanilla-JavaScript engine, not a React package that must be installed.

The chosen integration is an original React implementation of native scroll-driven reading guidance. It follows the source's semantic content, normalized progress, restrained motion, and mobile verification principles. No upstream runtime code or assets were copied, no dependency was added, and the source engine was not modified. Video scrubbing, pinning, pointer effects, generated assets, marketing page rebuilds, and skill-wide creative gates are inapplicable to this approved operational interface scope.

## Implemented behavior

- Notes with two or more rendered level-two/three headings gain a compact, sticky “On this page” guide.
- Real rendered headings determine the section list; fenced code does not become a false section. Duplicate heading labels get unique anchor targets.
- Selecting a section uses ordinary browser anchor navigation, URL history and the existing smooth scroll behavior. Keyboard focus follows the selected heading.
- Native scrolling updates the current section and a small visual reading-progress strip. The strip represents scroll position, not task completion or a claim that the note has been read.
- The guide uses a single pending animation frame for passive scroll/resize events and disconnects observers/listeners when the note changes or unmounts. It has no perpetual animation loop.
- OS reduced motion hides the progress strip and disables smooth scrolling. LifeOS reduced-motion and overload flags now also disable native smooth scrolling and hide the strip. Content stays fully visible in every mode.
- The chapter menu has a bounded scrollable height, wrapping labels and 44-pixel link targets. Existing branding, vault privacy filtering, links, Markdown content, cockpit layouts, mutation routes and authorization are preserved.

## Validation and release boundary

The focused regression tests cover duplicate heading anchors, keyboard focus, native navigation, section tracking, listener cleanup and short-note behavior. Browser tests exercise desktop 1440, laptop 1024 and mobile 390 widths, section navigation, horizontal overflow and all three reduced-motion mechanisms.

Required release validation remains the existing repository gates. Local npm lint, typecheck, unit suite and production build were run for this feature; the pull-request evidence records exact outcomes and remaining environment limitations. Browser results must identify the actual executable and viewports used. A successful local build is not production verification. No production deployment or protected-branch merge is authorized by this change.

## Governance observations

The portfolio audit separately records unrelated Academic Figures MCP / Asset-Aware MCP instructions, stale read-only wording and possible validation duplication with precise source locations. Those findings do not change existing governance through this feature branch. Material policy corrections require owner approval and complete replacement documents.
