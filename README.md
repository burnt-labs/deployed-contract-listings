# Xion Deployed Contracts Registry

A comprehensive registry of smart contracts deployed on the Xion blockchain, with an interactive web interface for browsing and searching contracts.

🌐 **[Browse Contracts Online](https://burnt-labs.github.io/deployed-contract-listings/)**

## Overview

This repository maintains a curated list of CosmWasm contracts relevant to Xion, including:
- Contract metadata (`name`, `description`, `author`, `deprecated`)
- Mainnet deployment details (`mainnet.code_id`, `mainnet.hash`, `mainnet.governance`) when applicable
- Optional testnet deployment records (`testnet` block with code ID, hash, network, deployer, timestamp)
- Release references (`release.url`, `release.version`)

## Features

- 📝 **Complete Registry**: All contracts deployed on Xion mainnet
- 🔍 **Interactive Browser**: Search and filter contracts via GitHub Pages
- ✅ **Validation Tools**: Automated validation and verification scripts
- 🚀 **Testnet Migration**: Tools to deploy mainnet contracts to testnet
- 🤖 **CI/CD Integration**: Automated validation and site deployment

## Quick Start

### Browse Contracts Online

Visit the [GitHub Pages site](https://burnt-labs.github.io/deployed-contract-listings/) to:
- Search contracts by name, author, or description
- Filter by governance type, deployment status, and testnet availability
- Copy code IDs and hashes with one click
- Access release documentation and proposals

### Local Development

```bash
# Clone the repository
git clone https://github.com/burnt-labs/deployed-contract-listings.git
cd deployed-contract-listings

# Install dependencies
npm install

# Validate contracts.json
npm run validate

# Verify against chain data
npm run verify

# Build the site locally
npm run build-site

# Serve the site locally
npm run serve
```

## Repository Structure

```
deployed-contract-listings/
├── contracts.json          # Main registry of all contracts
├── docs/                   # GitHub Pages site
│   ├── index.html         # Main page
│   ├── style.css          # Styling
│   ├── app.js             # Search and filter logic
│   └── contracts-data.js  # Generated data file
├── scripts/               # Utility scripts
│   ├── validate.js        # Validate JSON structure
│   ├── verify-contracts.js # Verify against chain
│   ├── build-site.js      # Build site data
│   └── migrate-to-testnet.ts # Deploy to testnet
└── .github/workflows/     # CI/CD automation
```

## Contract Data Format

The file is a **JSON array** of contract objects. Extra top-level keys on a contract are not allowed (validation fails on unknown properties).

### Required fields (every entry)

| Field | Type | Notes |
|-------|------|--------|
| `name` | string | Non-empty display name |
| `description` | string | Free-text description |
| `deprecated` | boolean | Whether the listing is considered deprecated |
| `release` | object | `url` (must start with `https://`), `version` (non-empty string; tag, PR link label, commit ref, etc.) |
| `author` | object | `name`, `url` (must start with `https://`) |

### Optional: `mainnet`

If present:

| Field | Type | Notes |
|-------|------|--------|
| `code_id` | string | Digits only (e.g. `"42"`) |
| `hash` | string | Exactly 64 hexadecimal characters (checksum byte order as stored on chain) |
| `governance` | string | Either `Genesis` or a numeric governance proposal ID (digits only) |

`mainnet` may be omitted for **testnet-only** listings (e.g. work not yet on mainnet). Those entries must appear **after** every entry that includes `mainnet` (see ordering below).

### Optional: `testnet`

If present, all of the following are required:

| Field | Type | Notes |
|-------|------|--------|
| `code_id` | string | Digits only |
| `hash` | string | 64 hex characters |
| `network` | string | e.g. `xion-testnet-2` |
| `deployed_by` | string | Deployer address, `xion` + bech32 payload |
| `deployed_at` | string | UTC timestamp `YYYY-MM-DDTHH:mm:ss.sssZ` |

### Example

```json
{
  "name": "Contract Name",
  "description": "Contract description",
  "deprecated": false,
  "release": {
    "url": "https://github.com/...",
    "version": "v1.0.0"
  },
  "author": {
    "name": "Author Name",
    "url": "https://..."
  },
  "mainnet": {
    "code_id": "1",
    "hash": "SHA256_HASH",
    "governance": "Genesis"
  },
  "testnet": {
    "code_id": "501",
    "hash": "TESTNET_HASH",
    "network": "xion-testnet-2",
    "deployed_by": "xion1...",
    "deployed_at": "2025-04-08T18:22:41.924Z"
  }
}
```

The placeholders `SHA256_HASH` / `TESTNET_HASH` are illustrative only; in `contracts.json` each `hash` must be the real **64-character hexadecimal** checksum from chain (see tables above). Use a full `xion1…` testnet deployer address where required.

### Ordering rules

- Entries **with** `mainnet` must be sorted by ascending `mainnet.code_id` (numeric order). Gaps between IDs are OK.
- After the last mainnet-backed entry, you may append entries that **omit** `mainnet` (typically testnet-only). An entry with `mainnet` must not appear after such a row.
- `mainnet.code_id` values must be **unique** across the file.

## Scripts

### Validation

Validate the structure and format of `contracts.json`:

```bash
npm run validate
```

This checks:
- Required fields and types match `scripts/validate.js` (no extra properties)
- `mainnet.code_id` values are unique and listed in non-decreasing order
- `mainnet`-less entries appear only after all `mainnet` entries
- `mainnet` / `testnet` hashes are 64 hex characters; `governance` matches `Genesis` or digits

### Verification

Verify contracts against live chain data:

```bash
npm run verify
```

This checks:
- Contracts exist on chain with matching hashes
- Governance proposals are correctly referenced
- No contracts are missing from the registry

### Testnet Migration

Deploy mainnet contracts to testnet:

```bash
# Set your mnemonic in .env file
echo "MNEMONIC=your mnemonic here" > .env

# Run migration
npm run migrate-testnet
```

### Build Site

Generate the static site data:

```bash
npm run build-site
```

## Adding a New Contract

1. **Via Pull Request** (Recommended):
   - Fork this repository
   - Add your contract to `contracts.json` in the correct position: insert by ascending `mainnet.code_id` when `mainnet` is present; append at the **end** if the entry has no `mainnet`
   - Fill `release` and `author` URLs with `https://` links; set `deprecated` explicitly
   - Run `npm run validate` to check formatting
   - Submit a pull request

2. **Via Governance Proposal**:
   - Contracts deployed via governance are automatically tracked
   - Run `npm run verify` to identify new contracts
   - Update `contracts.json` with the missing entries

## API Endpoints

The registry uses these Xion endpoints:

- **Mainnet API**: https://api.xion-mainnet-1.burnt.com
- **Mainnet RPC**: https://rpc.xion-mainnet-1.burnt.com:443
- **Testnet RPC**: https://rpc.xion-testnet-2.burnt.com:443

## Contributing

We welcome contributions! Please:

1. Ensure your changes pass validation: `npm run validate`
2. Update documentation if needed
3. Follow the existing format and conventions
4. Include relevant links and metadata

## CI/CD

- **Validate** workflow ([`.github/workflows/validate.yml`](.github/workflows/validate.yml)): on pushes to `main` and on PRs when `contracts.json` or validation/verify scripts change — runs `npm run validate` and `npm run verify` (verify is allowed to fail without failing the job).
- **Deploy GitHub Pages** ([`.github/workflows/deploy-site.yml`](.github/workflows/deploy-site.yml)): on pushes to `main` when contracts, `scripts/build-site.js`, or `docs/**` change (or via `workflow_dispatch`) — validates, runs `npm run build-site`, then publishes `docs/`.

## License

MIT License - see LICENSE file for details

## Support

For issues or questions:
- Open an [issue](https://github.com/burnt-labs/deployed-contract-listings/issues)
- Visit [Xion Documentation](https://docs.xion.com)
- Join the [Xion Discord](https://discord.gg/xion)

## Links

- [Xion Mainnet Explorer](https://explorer.xion-mainnet-1.burnt.com)
- [Xion Testnet Explorer](https://explorer.xion-testnet-2.burnt.com)
- [CosmWasm Documentation](https://docs.cosmwasm.com)
- [Burnt Labs](https://burnt.com)