#!/usr/bin/env node

/**
 * unified-validator.js
 * 
 * Unified contract validation system that combines and optimizes functionality
 * from validate.js, verify-contracts.js, and the new validation scripts.
 * 
 * Features:
 * 1. JSON structure validation (from validate.js)
 * 2. On-chain verification (from verify-contracts.js)
 * 3. Enhanced analysis and recommendations
 * 4. Support for both mainnet and testnet
 * 5. Comprehensive testing capabilities
 * 6. Detailed reporting and actionable recommendations
 * 
 * Usage:
 *   node scripts/unified-validator.js [options]
 * 
 * Options:
 *   --validate-only     Only validate JSON structure
 *   --verify-only      Only verify against on-chain data
 *   --network=mainnet|testnet  Choose network (default: mainnet)
 *   --verbose, -v      Enable verbose output
 *   --test            Run test suite
 *   --help, -h        Show help
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');
const { spawn } = require('child_process');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m'
};

function colorLog(color, message) {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// JSON Schema validation (from validate.js)
const testnetSchema = {
    type: 'object',
    required: ['code_id', 'hash', 'network', 'deployed_by', 'deployed_at'],
    properties: {
        code_id: { type: 'string', pattern: '^[0-9]+$' },
        hash: { 
            type: 'string', 
            pattern: '^[a-fA-F0-9]{64}$',
            message: 'Testnet hash must be 64 hex characters long' 
        },
        network: { type: 'string', minLength: 1 },
        deployed_by: { type: 'string', pattern: '^xion[a-z0-9]+$' },
        deployed_at: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z$' }
    }
};

const schema = {
    type: 'array',
    items: {
        type: 'object',
        required: ['name', 'description', 'code_id', 'hash', 'release', 'author', 'governance', 'deprecated'],
        properties: {
            name: { type: 'string', minLength: 1 },
            description: { type: 'string' },
            code_id: { type: 'string', pattern: '^[0-9]+$' },
            hash: { 
                type: 'string', 
                pattern: '^[A-F0-9]{64}$',
                message: 'Mainnet hash must be 64 characters long and contain only uppercase hex characters'
            },
            release: {
                type: 'object',
                required: ['url', 'version'],
                properties: {
                    url: { type: 'string', pattern: '^https://' },
                    version: { type: 'string', minLength: 1 }
                }
            },
            author: {
                type: 'object',
                required: ['name', 'url'],
                properties: {
                    name: { type: 'string', minLength: 1 },
                    url: { type: 'string', pattern: '^https://' }
                }
            },
            governance: { 
                type: 'string',
                pattern: '^(Genesis|[0-9]+)$'
            },
            deprecated: { type: 'boolean' },
            testnet: { ...testnetSchema, optional: true }
        }
    }
};

class UnifiedValidator {
    constructor(options = {}) {
        this.network = options.network || 'mainnet';
        this.verbose = options.verbose || false;
        this.validateOnly = options.validateOnly || false;
        this.verifyOnly = options.verifyOnly || false;
        
        this.apiBaseUrl = this.network === 'testnet' 
            ? 'https://api.xion-testnet-2.burnt.com'
            : 'https://api.xion-mainnet-1.burnt.com';
        
        this.results = {
            jsonValidation: { valid: false, errors: [] },
            onChainVerification: { success: false, discrepancies: {} },
            summary: {},
            recommendations: []
        };
    }

    log(message, level = 'info') {
        if (this.verbose || level === 'error' || level === 'warning') {
            const colorMap = {
                info: 'cyan',
                success: 'green',
                warning: 'yellow',
                error: 'red',
                debug: 'gray'
            };
            colorLog(colorMap[level] || 'cyan', message);
        }
    }

    // JSON validation methods (from validate.js)
    validateJson(data, schema, path = '') {
        if (schema.type === 'array') {
            if (!Array.isArray(data)) {
                throw new Error(`${path} must be an array`);
            }
            
            // Check for duplicate code IDs
            const codeIds = new Set();
            data.forEach((item, index) => {
                if (item.code_id && codeIds.has(item.code_id)) {
                    throw new Error(`Duplicate code_id ${item.code_id} found`);
                }
                if (item.code_id) codeIds.add(item.code_id);
                this.validateJson(item, schema.items, `${path}[${index}]`);
            });

            // Check code_id ordering
            for (let i = 1; i < data.length; i++) {
                if (data[i-1].code_id && data[i].code_id) {
                    const prevCodeId = parseInt(data[i-1].code_id);
                    const currentCodeId = parseInt(data[i].code_id);
                    if (currentCodeId < prevCodeId) {
                        throw new Error(`Contracts not in code_id order: ${data[i-1].name} (${prevCodeId}) comes before ${data[i].name} (${currentCodeId})`);
                    }
                }
            }
            return;
        }

        if (schema.type === 'object') {
            if (typeof data !== 'object' || data === null) {
                throw new Error(`${path} must be an object`);
            }

            // Check required properties
            for (const required of schema.required || []) {
                if (!(required in data)) {
                    throw new Error(`${path} missing required property: ${required}`);
                }
            }

            // Validate each property
            for (const [key, value] of Object.entries(data)) {
                const propertySchema = schema.properties[key];
                if (!propertySchema) {
                    throw new Error(`${path} has unknown property: ${key}`);
                }
                if (!propertySchema.optional || (key in data)) {
                    this.validateJson(value, propertySchema, `${path}.${key}`);
                }
            }
            return;
        }

        if (schema.type === 'string') {
            if (typeof data !== 'string') {
                throw new Error(`${path} must be a string`);
            }
            if (schema.minLength && data.length < schema.minLength) {
                throw new Error(`${path} must be at least ${schema.minLength} characters`);
            }
            if (schema.pattern) {
                const regex = new RegExp(schema.pattern);
                if (!regex.test(data)) {
                    throw new Error(`${path} ${schema.message || `must match pattern: ${schema.pattern}`}`);
                }
            }
            return;
        }

        if (schema.type === 'boolean') {
            if (typeof data !== 'boolean') {
                throw new Error(`${path} must be a boolean`);
            }
            return;
        }

        throw new Error(`Unknown schema type: ${schema.type}`);
    }

    async validateJsonStructure() {
        this.log('Validating contracts.json structure...');
        
        try {
            const contractsPath = path.join(__dirname, '..', 'contracts.json');
            const data = JSON.parse(fs.readFileSync(contractsPath, 'utf8'));
            this.validateJson(data, schema);
            
            this.results.jsonValidation.valid = true;
            this.log(`✅ contracts.json structure validation passed (${data.length} contracts)`, 'success');
            return true;
        } catch (error) {
            this.results.jsonValidation.valid = false;
            this.results.jsonValidation.errors.push(error.message);
            this.log(`❌ JSON validation failed: ${error.message}`, 'error');
            return false;
        }
    }

    // On-chain verification methods (from verify-contracts.js)
    calculateWasmHash(base64WasmCode) {
        try {
            const wasmBuffer = Buffer.from(base64WasmCode, 'base64');
            
            try {
                const unzippedBuffer = zlib.gunzipSync(wasmBuffer);
                const hash = crypto.createHash('sha256')
                    .update(unzippedBuffer)
                    .digest('hex')
                    .toUpperCase();
                return hash;
            } catch (gzipError) {
                const hash = crypto.createHash('sha256')
                    .update(wasmBuffer)
                    .digest('hex')
                    .toUpperCase();
                return hash;
            }
        } catch (error) {
            this.log(`Error calculating wasm hash: ${error.message}`, 'error');
            return null;
        }
    }

    getStatusString(status) {
        const statusMap = {
            'PROPOSAL_STATUS_UNSPECIFIED': 'Unspecified',
            'PROPOSAL_STATUS_DEPOSIT_PERIOD': 'Deposit Period',
            'PROPOSAL_STATUS_VOTING_PERIOD': 'Voting Period',
            'PROPOSAL_STATUS_PASSED': 'Passed',
            'PROPOSAL_STATUS_REJECTED': 'Rejected',
            'PROPOSAL_STATUS_FAILED': 'Failed'
        };
        return statusMap[status] || status;
    }

    async fetchOnChainContracts() {
        this.log(`Fetching contracts from ${this.network}...`);
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/cosmwasm/wasm/v1/code`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            this.log(`Found ${data.code_infos?.length || 0} contracts on-chain`, 'success');
            return data.code_infos || [];
        } catch (error) {
            this.log(`Failed to fetch on-chain contracts: ${error.message}`, 'error');
            throw error;
        }
    }

    async fetchGovernanceProposals() {
        this.log('Fetching governance proposals...');
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/cosmos/gov/v1/proposals?proposal_status=0`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            this.log(`Found ${data.proposals?.length || 0} governance proposals`, 'success');
            return data.proposals || [];
        } catch (error) {
            this.log(`Failed to fetch governance proposals: ${error.message}`, 'error');
            return [];
        }
    }

    loadLocalContracts() {
        this.log('Loading local contracts.json...');
        
        try {
            const contractsPath = path.join(__dirname, '..', 'contracts.json');
            const contractsData = JSON.parse(fs.readFileSync(contractsPath, 'utf8'));
            
            this.log(`Loaded ${contractsData.length} contracts from contracts.json`, 'success');
            return contractsData;
        } catch (error) {
            this.log(`Failed to load contracts.json: ${error.message}`, 'error');
            throw error;
        }
    }

    async verifyOnChainContracts() {
        this.log('Verifying contracts against on-chain data...');
        
        try {
            const [localContracts, onChainContracts, proposals] = await Promise.all([
                this.loadLocalContracts(),
                this.fetchOnChainContracts(),
                this.fetchGovernanceProposals()
            ]);

            // Create maps for efficient lookup
            const localCodeIdMap = new Map();
            const localHashMap = new Map();
            const onChainCodeIdMap = new Map();
            const onChainHashMap = new Map();
            
            // Process local contracts
            localContracts.forEach(contract => {
                localCodeIdMap.set(contract.code_id, contract);
                localHashMap.set(contract.hash, contract);
            });
            
            // Process on-chain contracts
            onChainContracts.forEach(contract => {
                onChainCodeIdMap.set(contract.code_id, contract);
                onChainHashMap.set(contract.data_hash.toUpperCase(), contract);
            });

            // Analyze discrepancies
            const discrepancies = {
                missingFromJson: [],
                missingFromChain: [],
                hashMismatches: [],
                governanceIssues: [],
                deprecatedIssues: []
            };

            // Find contracts on-chain but not in JSON
            onChainContracts.forEach(chainContract => {
                const codeId = chainContract.code_id;
                if (!localCodeIdMap.has(codeId)) {
                    discrepancies.missingFromJson.push({
                        codeId,
                        hash: chainContract.data_hash.toUpperCase(),
                        creator: chainContract.creator
                    });
                }
            });
            
            // Find contracts in JSON but not on-chain
            localContracts.forEach(localContract => {
                const codeId = localContract.code_id;
                if (!onChainCodeIdMap.has(codeId)) {
                    discrepancies.missingFromChain.push({
                        codeId,
                        name: localContract.name,
                        hash: localContract.hash,
                        governance: localContract.governance,
                        deprecated: localContract.deprecated
                    });
                }
            });
            
            // Find hash mismatches
            localContracts.forEach(localContract => {
                const chainContract = onChainCodeIdMap.get(localContract.code_id);
                if (chainContract && localContract.hash !== chainContract.data_hash.toUpperCase()) {
                    discrepancies.hashMismatches.push({
                        codeId: localContract.code_id,
                        name: localContract.name,
                        localHash: localContract.hash,
                        chainHash: chainContract.data_hash.toUpperCase(),
                        governance: localContract.governance
                    });
                }
            });

            // Analyze governance issues
            this.analyzeGovernanceIssues(localContracts, proposals, discrepancies);

            // Analyze deprecated contracts
            this.analyzeDeprecatedContracts(localContracts, onChainContracts, discrepancies);

            this.results.onChainVerification.success = true;
            this.results.onChainVerification.discrepancies = discrepancies;
            this.results.summary = {
                totalLocalContracts: localContracts.length,
                totalOnChainContracts: onChainContracts.length,
                totalProposals: proposals.length,
                discrepancies: {
                    missingFromJson: discrepancies.missingFromJson.length,
                    missingFromChain: discrepancies.missingFromChain.length,
                    hashMismatches: discrepancies.hashMismatches.length,
                    governanceIssues: discrepancies.governanceIssues.length,
                    deprecatedIssues: discrepancies.deprecatedIssues.length
                }
            };

            this.generateRecommendations(discrepancies);
            return true;
        } catch (error) {
            this.log(`On-chain verification failed: ${error.message}`, 'error');
            this.results.onChainVerification.success = false;
            return false;
        }
    }

    analyzeGovernanceIssues(localContracts, proposals, discrepancies) {
        const proposalHashMap = new Map();
        
        proposals.forEach(proposal => {
            if (proposal.messages) {
                proposal.messages.forEach((msg, idx) => {
                    if (msg['@type'] === '/cosmwasm.wasm.v1.MsgStoreCode') {
                        const hash = this.calculateWasmHash(msg.wasm_byte_code);
                        if (hash) {
                            proposalHashMap.set(hash, {
                                proposalId: proposal.id,
                                proposalTitle: proposal.title,
                                status: this.getStatusString(proposal.status),
                                messageIndex: idx + 1
                            });
                        }
                    }
                });
            }
        });
        
        localContracts.forEach(contract => {
            if (contract.governance === 'Genesis') {
                const proposalInfo = proposalHashMap.get(contract.hash);
                if (proposalInfo) {
                    discrepancies.governanceIssues.push({
                        codeId: contract.code_id,
                        name: contract.name,
                        hash: contract.hash,
                        governance: contract.governance,
                        proposal: proposalInfo
                    });
                }
            }
        });
    }

    analyzeDeprecatedContracts(localContracts, onChainContracts, discrepancies) {
        const deprecatedContracts = localContracts.filter(c => c.deprecated === true);
        
        deprecatedContracts.forEach(contract => {
            const chainContract = onChainContracts.find(c => c.code_id === contract.code_id);
            if (chainContract) {
                discrepancies.deprecatedIssues.push({
                    codeId: contract.code_id,
                    name: contract.name,
                    hash: contract.hash,
                    governance: contract.governance,
                    issue: 'Deprecated contract still exists on-chain'
                });
            }
        });
    }

    generateRecommendations(discrepancies) {
        this.log('Generating recommendations...');
        
        // Ensure recommendations array is initialized
        if (!this.results.recommendations) {
            this.results.recommendations = [];
        }
        
        if (discrepancies.missingFromJson && discrepancies.missingFromJson.length > 0) {
            this.results.recommendations.push({
                type: 'missing_from_json',
                priority: 'high',
                message: `Add ${discrepancies.missingFromJson.length} missing contracts to contracts.json`,
                action: 'Review on-chain contracts and add missing entries to contracts.json'
            });
        }
        
        if (discrepancies.missingFromChain && discrepancies.missingFromChain.length > 0) {
            this.results.recommendations.push({
                type: 'missing_from_chain',
                priority: 'medium',
                message: `Remove ${discrepancies.missingFromChain.length} contracts from contracts.json that no longer exist on-chain`,
                action: 'Verify contracts are truly removed from chain before removing from JSON'
            });
        }
        
        if (discrepancies.hashMismatches && discrepancies.hashMismatches.length > 0) {
            this.results.recommendations.push({
                type: 'hash_mismatch',
                priority: 'high',
                message: `Fix ${discrepancies.hashMismatches.length} hash mismatches between JSON and on-chain data`,
                action: 'Update hash values in contracts.json to match on-chain data'
            });
        }
        
        if (discrepancies.governanceIssues && discrepancies.governanceIssues.length > 0) {
            this.results.recommendations.push({
                type: 'governance_issue',
                priority: 'medium',
                message: `Review ${discrepancies.governanceIssues.length} contracts marked as Genesis but uploaded via proposals`,
                action: 'Update governance field to reflect actual proposal ID'
            });
        }
    }


    // Main validation method
    async validate() {
        try {
            colorLog('cyan', `🔍 Starting unified contract validation for ${this.network}...`);
            
            let success = true;


            if (!this.verifyOnly) {
                success = await this.validateJsonStructure() && success;
            }

            if (!this.validateOnly) {
                success = await this.verifyOnChainContracts() && success;
            }

            this.printResults();
            return success;
            
        } catch (error) {
            colorLog('red', `❌ Validation failed: ${error.message}`);
            return false;
        }
    }

    printResults() {
        colorLog('cyan', '\n📊 Unified Validation Results');
        colorLog('cyan', '=' .repeat(50));
        
        // JSON validation results
        if (!this.verifyOnly) {
            if (this.results.jsonValidation.valid) {
                colorLog('green', '✅ JSON structure validation passed');
            } else {
                colorLog('red', '❌ JSON structure validation failed');
                this.results.jsonValidation.errors.forEach(error => {
                    colorLog('red', `   ${error}`);
                });
            }
        }

        // On-chain verification results
        if (!this.validateOnly && this.results.onChainVerification.success) {
            const summary = this.results.summary;
            const discrepancies = this.results.onChainVerification.discrepancies;
            
            colorLog('blue', '\n📈 On-chain Verification Summary:');
            colorLog('gray', `   Local contracts: ${summary.totalLocalContracts}`);
            colorLog('gray', `   On-chain contracts: ${summary.totalOnChainContracts}`);
            colorLog('gray', `   Governance proposals: ${summary.totalProposals}`);
            
            const totalDiscrepancies = Object.values(summary.discrepancies).reduce((sum, count) => sum + count, 0);
            if (totalDiscrepancies === 0) {
                colorLog('green', '\n✅ All contracts match perfectly! No discrepancies found.');
            } else {
                colorLog('yellow', `\n⚠️  Total discrepancies: ${totalDiscrepancies}`);
                this.printDiscrepancies(discrepancies);
            }
        }

        // Recommendations
        if (this.results.recommendations.length > 0) {
            this.printRecommendations();
        }
    }

    printDiscrepancies(discrepancies) {
        if (discrepancies.missingFromJson.length > 0) {
            colorLog('red', '\n📝 Contracts on-chain but missing from contracts.json:');
            discrepancies.missingFromJson.forEach(item => {
                colorLog('red', `   Code ID ${item.codeId}: ${item.hash}`);
            });
        }
        
        if (discrepancies.missingFromChain.length > 0) {
            colorLog('yellow', '\n🔍 Contracts in contracts.json but missing from chain:');
            discrepancies.missingFromChain.forEach(item => {
                colorLog('yellow', `   Code ID ${item.codeId} (${item.name}): ${item.hash}`);
            });
        }
        
        if (discrepancies.hashMismatches.length > 0) {
            colorLog('red', '\n⚠️  Hash mismatches:');
            discrepancies.hashMismatches.forEach(item => {
                colorLog('red', `   Code ID ${item.codeId} (${item.name}):`);
                colorLog('red', `     JSON:  ${item.localHash}`);
                colorLog('red', `     Chain: ${item.chainHash}`);
            });
        }
        
        if (discrepancies.governanceIssues.length > 0) {
            colorLog('yellow', '\n🏛️  Governance issues:');
            discrepancies.governanceIssues.forEach(item => {
                colorLog('yellow', `   Code ID ${item.codeId} (${item.name}): Marked as Genesis but uploaded via Proposal ${item.proposal.proposalId}`);
            });
        }
        
        if (discrepancies.deprecatedIssues.length > 0) {
            colorLog('yellow', '\n🗑️  Deprecated contract issues:');
            discrepancies.deprecatedIssues.forEach(item => {
                colorLog('yellow', `   Code ID ${item.codeId} (${item.name}): ${item.issue}`);
            });
        }
    }

    printRecommendations() {
        colorLog('blue', '\n💡 Recommendations:');
        this.results.recommendations.forEach((rec, index) => {
            const priorityColor = rec.priority === 'high' ? 'red' : 'yellow';
            colorLog(priorityColor, `   ${index + 1}. [${rec.priority.toUpperCase()}] ${rec.message}`);
            colorLog('gray', `      Action: ${rec.action}`);
        });
    }
}

// CLI interface
async function main() {
    const args = process.argv.slice(2);
    const options = {
        network: 'mainnet',
        verbose: false,
        validateOnly: false,
        verifyOnly: false,
    };
    
    // Parse command line arguments
    args.forEach(arg => {
        if (arg.startsWith('--network=')) {
            options.network = arg.split('=')[1];
        } else if (arg === '--verbose' || arg === '-v') {
            options.verbose = true;
        } else if (arg === '--validate-only') {
            options.validateOnly = true;
        } else if (arg === '--verify-only') {
            options.verifyOnly = true;
        } else if (arg === '--help' || arg === '-h') {
            console.log(`
Unified Contract Validator - Comprehensive contract validation tool

Usage: node scripts/unified-validator.js [options]

Options:
  --validate-only         Only validate JSON structure
  --verify-only          Only verify against on-chain data
  --network=mainnet|testnet    Network to validate against (default: mainnet)
  --verbose, -v          Enable verbose output
  --help, -h             Show this help message

Examples:
  node scripts/unified-validator.js
  node scripts/unified-validator.js --validate-only
  node scripts/unified-validator.js --verify-only
  node scripts/unified-validator.js --network=testnet --verbose
            `);
            process.exit(0);
        }
    });
    
    if (!['mainnet', 'testnet'].includes(options.network)) {
        colorLog('red', '❌ Invalid network. Use --network=mainnet or --network=testnet');
        process.exit(1);
    }
    
    const validator = new UnifiedValidator(options);
    const success = await validator.validate();
    
    process.exit(success ? 0 : 1);
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { UnifiedValidator };
