# Deployment and Operations

Core operational checks:
- vault structural audit;
- MAPS integrity;
- web application tests/build;
- Vercel production status;
- exact release closeout record;
- optional voice/browser capability;
- agent write-governance path;
- note metadata integrity.

Production is private: Vercel Authentication protects All Deployments, so direct HTTP verification needs a logged-in Vercel session or the Vercel tools. Access state is recorded in `docs/CANONICAL_LIVE_STATUS.md`.

The vault remains canonical for LifeOS content. Browser-staged changes should not silently bypass the governed write path.
