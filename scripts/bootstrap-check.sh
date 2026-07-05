#!/usr/bin/env bash
set -euo pipefail
pnpm lint
pnpm typecheck
pnpm test
pnpm build
