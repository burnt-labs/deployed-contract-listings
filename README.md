# Xion Deployed Contracts Registry

A comprehensive registry of smart contracts deployed on the Xion blockchain, with an interactive web interface for browsing and searching contracts.

🌐 **[Browse Contracts Online](https://burnt-labs.github.io/deployed-contract-listings/)**

## Overview

This repository maintains a curated list of all smart contracts deployed on Xion mainnet, including:
- Contract metadata (name, description, author)
- Deployment information (code ID, hash, governance)
- Testnet deployment status
- Release and documentation links

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

Each contract in `contracts.json` follows this structure:

```json
{
  "name": "Contract Name",
  "description": "Contract description",
  "code_id": "1",
  "hash": "SHA256_HASH",
  "governance": "Genesis | <proposal_id>",
  "deprecated": false,
  "release": {
    "url": "https://github.com/...",
    "version": "v1.0.0"
  },
  "author": {
    "name": "Author Name",
    "url": "https://..."
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

## Scripts

### Validation

Validate the structure and format of `contracts.json`:

```bash
npm run validate
```

This checks:
- Required fields are present
- Data types are correct
- Code IDs are unique and ordered
- Hash format is valid

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
   - Add your contract to `contracts.json` in the correct position (ordered by code_id)
   - Ensure all required fields are filled
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

GitHub Actions automatically:
- Validates `contracts.json` on every push and PR
- Verifies contracts against chain data
- Builds and deploys the GitHub Pages site
- Runs on changes to contracts or site files

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