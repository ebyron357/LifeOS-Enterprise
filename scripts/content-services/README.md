# Offline Content-to-Lead records

Implements the approved local-record slice of issue #14 / LIFEOS-CONTENT-LEAD-003. The scripts read the existing canonical templates and create private local Markdown. They do not contact providers, import prospects, send outreach, change CRM data or run a commercial campaign.

PowerShell 5.1 or 7 is supported. From the repository root:

```powershell
./scripts/content-services/New-ContentCampaign.ps1 -Title 'Example briefing' -Client 'Internal example' -ContentType article -PrimaryTopic 'Source review' -SearchIntent informational -FunnelStage awareness -ConversionGoal 'Review the checklist' -Owner 'Example operator' -WhatIf

./scripts/content-services/New-LeadProspect.ps1 -AccountName 'Synthetic example' -Website 'https://example.test' -SourcePlatform 'Manual synthetic test' -SourceUrl 'https://example.test/about' -ObservedGap 'Synthetic observation, not a real prospect' -Owner 'Example operator' -WhatIf

./scripts/content-services/Test-ContentServices.ps1
```

`-WhatIf` and `-DryRun` validate the complete record without creating files or directories. Remove the switch only after reviewing inputs. Default output is `private/content-services/campaigns/` or `private/content-services/prospects/`, ignored by Git and excluded from the web vault index. Each record also has `private: true`, `publish: false`, and `web_visibility: private`. No generated prospect record belongs in a commit or public export. A custom `-OutputDirectory` is allowed outside Git checkouts; within this repository only the ignored private output tree is accepted. Symlink/reparse-point destinations are rejected. Local filesystem access permissions still apply.

All required text is preserved in quoted YAML values; single-line and common credential-pattern checks run before writes. Review arbitrary free text yourself: pattern checks cannot recognize every possible secret. Output reports a path and creation state, not record contents. Dates default to UTC today with review seven days later; `-Date` and `-ReviewDate` accept valid `yyyy-MM-dd` dates, with review no earlier than creation. Filenames are sanitized for Windows/macOS/Linux. Existing files and sanitized-name collisions are never overwritten, including concurrent creation races.

Prospects start `researching`, `not-contacted`, email verification `unknown`, and suppression `restricted`, overriding the legacy template's permissive default. To record an already completed suppression review, explicitly pass `-SuppressionStatus clear -SuppressionReviewNote 'Evidence of the completed review...'`. This records the supplied review; it never establishes consent, authorizes outreach or verifies contact data. Opt-out and other suppression values remain intact. Contact fields stay blank.

Optional `-Project` and prospect `-Campaign` values are stored exactly as supplied. Use an existing canonical record reference when applicable. This slice does not implement the remaining metadata/audit contract, network integrations, pilot, publishing gates or business outcomes from issue #14. The PR remains draft for the governed acceptance process.

Tests use temporary directories and synthetic `example.test` data, require no Pester or credentials, and clean up their own fixture directory. Vault Health executes them on the existing Windows runner under both PowerShell 7 and Windows PowerShell 5.1.
