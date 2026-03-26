# deployed-contract-listings — CLAUDE.md

Registry of deployed CosmWasm contracts on Xion. Powers the contract explorer/listing site deployed to GitHub Pages.

## GitHub Workflows

### `validate.yml`

**Triggered by:** Push to `main` (path filter: contracts + scripts), PRs

Validates `contracts.json` schema and contract data integrity.

### `deploy-site.yml`

**Triggered by:** Push to `main` (path filter: contracts + build scripts + docs), `workflow_dispatch`

Builds the site data and deploys to GitHub Pages.

## Upstream Triggers

None.

## Downstream Triggers

None.

## Adding a Contract Listing

Edit `contracts.json` following the existing schema. Push to main — validation runs automatically, then the site redeploys.
