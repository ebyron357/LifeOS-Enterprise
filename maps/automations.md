# Automations Signpost

## Projects
- [Automations](../Automations): active automation records.
- [Workflows](../workflows): executable workflow definitions.

## State
- [Routine registry](../Automations/ROUTINE_REGISTRY.json): canonical Pulse registry.
- [Run evidence](../Automations/runs): evidence emitted by routines.

## Skills
- [SOPs](../80%20SOPs): canonical operating procedures.
- [Scripts](../scripts): local validation and support scripts.

## Memory
- [Master map](../MAPS.md): top-level router.
- [MAPS operating model](../architecture/MAPS_OPERATING_MODEL.md): governance.

## Routines
- [MAPS Integrity workflow](../.github/workflows/maps-integrity.yml): scheduled runner for `maps-integrity-check`.
- Every unattended recurring routine must be registered.
- Every completed run must leave inspectable evidence.

## Not here
- Secrets and credentials.
- Unregistered recurring jobs.
- Dashboard-only status.
