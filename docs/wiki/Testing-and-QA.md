# Testing and QA

Standard evidence includes:
- PowerShell vault audit;
- MAPS validation;
- application unit tests;
- browser/e2e checks;
- production deployment readiness;
- direct HTTP verification.

Production release proof must be kept separate from device-specific acceptance tests.

PR #86 explicitly separates completed deployment from outstanding real-device microphone and screen-share acceptance QA.
