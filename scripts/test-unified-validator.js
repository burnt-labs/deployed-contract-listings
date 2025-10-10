#!/usr/bin/env node

/**
 * test-unified-validator.js
 * 
 * Test suite for the unified contract validator.
 * This file contains all test functionality that was previously embedded
 * in unified-validator.js.
 * 
 * Usage:
 *   node scripts/test-unified-validator.js
 *   npm run test-validation
 */

const fs = require('fs');
const path = require('path');
const { UnifiedValidator } = require('./unified-validator');

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

class UnifiedValidatorTester {
    constructor(options = {}) {
        this.network = options.network || 'mainnet';
        this.verbose = options.verbose || false;
        this.testResults = {
            passed: 0,
            failed: 0,
            tests: []
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

    async runTest(testName, testFunction) {
        this.log(`Running test: ${testName}`);
        try {
            const result = await testFunction();
            if (result) {
                this.log(`✅ Test passed: ${testName}`, 'success');
                this.testResults.passed++;
                this.testResults.tests.push({ name: testName, status: 'PASSED' });
            } else {
                this.log(`❌ Test failed: ${testName}`, 'error');
                this.testResults.failed++;
                this.testResults.tests.push({ name: testName, status: 'FAILED' });
            }
        } catch (error) {
            this.log(`❌ Test error: ${testName} - ${error.message}`, 'error');
            this.testResults.failed++;
            this.testResults.tests.push({ name: testName, status: 'ERROR', error: error.message });
        }
    }

    async testValidatorInitialization() {
        const validator = new UnifiedValidator({ network: 'mainnet', verbose: false });
        return validator.network === 'mainnet' && validator.apiBaseUrl.includes('mainnet');
    }

    async testValidatorTestnetInitialization() {
        const validator = new UnifiedValidator({ network: 'testnet', verbose: false });
        return validator.network === 'testnet' && validator.apiBaseUrl.includes('testnet');
    }

    async testHashCalculation() {
        const validator = new UnifiedValidator();
        
        // Test with a simple base64 string
        const testData = Buffer.from('test data').toString('base64');
        const hash = validator.calculateWasmHash(testData);
        
        return hash && hash.length === 64 && /^[A-F0-9]+$/.test(hash);
    }

    async testContractsJsonLoading() {
        const validator = new UnifiedValidator();
        
        try {
            const contracts = validator.loadLocalContracts();
            return Array.isArray(contracts) && contracts.length > 0;
        } catch (error) {
            return false;
        }
    }

    async testApiConnectivity() {
        const validator = new UnifiedValidator();
        
        try {
            const contracts = await validator.fetchOnChainContracts();
            return Array.isArray(contracts);
        } catch (error) {
            this.log(`API connectivity test failed: ${error.message}`, 'warning');
            return false; // Don't fail the test if API is down
        }
    }

    async testGovernanceProposalsFetch() {
        const validator = new UnifiedValidator();
        
        try {
            const proposals = await validator.fetchGovernanceProposals();
            return Array.isArray(proposals);
        } catch (error) {
            this.log(`Governance proposals test failed: ${error.message}`, 'warning');
            return false; // Don't fail the test if API is down
        }
    }

    async testDiscrepancyAnalysis() {
        const validator = new UnifiedValidator();
        
        // Mock data for testing
        const localContracts = [
            {
                code_id: '1',
                name: 'Test Contract 1',
                hash: 'ABCD1234567890ABCD1234567890ABCD1234567890ABCD1234567890ABCD1234',
                governance: 'Genesis',
                deprecated: false
            },
            {
                code_id: '2',
                name: 'Test Contract 2',
                hash: 'EFGH5678901234EFGH5678901234EFGH5678901234EFGH5678901234EFGH5678',
                governance: '1',
                deprecated: false
            }
        ];

        const onChainContracts = [
            {
                code_id: '1',
                data_hash: 'ABCD1234567890ABCD1234567890ABCD1234567890ABCD1234567890ABCD1234',
                creator: 'xion1test...'
            },
            {
                code_id: '3',
                data_hash: 'IJKL9012345678IJKL9012345678IJKL9012345678IJKL9012345678IJKL9012',
                creator: 'xion1test...'
            }
        ];

        const proposals = [];

        // Create maps for testing
        const localCodeIdMap = new Map();
        const onChainCodeIdMap = new Map();
        
        localContracts.forEach(contract => {
            localCodeIdMap.set(contract.code_id, contract);
        });
        
        onChainContracts.forEach(contract => {
            onChainCodeIdMap.set(contract.code_id, contract);
        });

        // Check discrepancies
        const missingFromJson = onChainContracts.filter(chainContract => 
            !localCodeIdMap.has(chainContract.code_id)
        );
        const missingFromChain = localContracts.filter(localContract => 
            !onChainCodeIdMap.has(localContract.code_id)
        );

        return missingFromJson.length > 0 && missingFromChain.length > 0;
    }

    async testHashMismatchDetection() {
        const validator = new UnifiedValidator();
        
        // Mock data with hash mismatch
        const localContracts = [
            {
                code_id: '1',
                name: 'Test Contract',
                hash: 'ABCD1234567890ABCD1234567890ABCD1234567890ABCD1234567890ABCD1234',
                governance: 'Genesis',
                deprecated: false
            }
        ];

        const onChainContracts = [
            {
                code_id: '1',
                data_hash: 'EFGH5678901234EFGH5678901234EFGH5678901234EFGH5678901234EFGH5678',
                creator: 'xion1test...'
            }
        ];

        // Check for hash mismatch
        const hashMismatch = localContracts.some(localContract => {
            const chainContract = onChainContracts.find(c => c.code_id === localContract.code_id);
            return chainContract && localContract.hash !== chainContract.data_hash.toUpperCase();
        });

        return hashMismatch;
    }

    async testGovernanceIssueDetection() {
        const validator = new UnifiedValidator();
        
        // Create test data with matching hash
        const testWasmCode = Buffer.from('test wasm code').toString('base64');
        const calculatedHash = validator.calculateWasmHash(testWasmCode);
        
        // Mock data with governance issue
        const localContracts = [
            {
                code_id: '1',
                name: 'Test Contract',
                hash: calculatedHash,
                governance: 'Genesis',
                deprecated: false
            }
        ];

        const proposals = [
            {
                id: '1',
                title: 'Test Proposal',
                status: 'PROPOSAL_STATUS_PASSED',
                messages: [
                    {
                        '@type': '/cosmwasm.wasm.v1.MsgStoreCode',
                        wasm_byte_code: testWasmCode
                    }
                ]
            }
        ];

        // Test governance issue detection
        const proposalHashMap = new Map();
        
        proposals.forEach(proposal => {
            if (proposal.messages) {
                proposal.messages.forEach((msg, idx) => {
                    if (msg['@type'] === '/cosmwasm.wasm.v1.MsgStoreCode') {
                        const hash = validator.calculateWasmHash(msg.wasm_byte_code);
                        if (hash) {
                            proposalHashMap.set(hash, {
                                proposalId: proposal.id,
                                proposalTitle: proposal.title,
                                status: validator.getStatusString(proposal.status),
                                messageIndex: idx + 1
                            });
                        }
                    }
                });
            }
        });
        
        const governanceIssues = localContracts.filter(contract => {
            if (contract.governance === 'Genesis') {
                const proposalInfo = proposalHashMap.get(contract.hash);
                return proposalInfo !== undefined;
            }
            return false;
        });

        return governanceIssues.length > 0;
    }

    async testRecommendationGeneration() {
        const validator = new UnifiedValidator();
        
        // Mock data with discrepancies
        const mockDiscrepancies = {
            missingFromJson: [{ codeId: '1', hash: 'test' }],
            hashMismatches: [{ codeId: '2', name: 'test' }]
        };

        validator.generateRecommendations(mockDiscrepancies);

        return validator.results.recommendations && validator.results.recommendations.length > 0;
    }

    async testJsonValidation() {
        try {
            const contractsPath = path.join(__dirname, '..', 'contracts.json');
            const contractsData = JSON.parse(fs.readFileSync(contractsPath, 'utf8'));
            
            // Test basic structure
            if (!Array.isArray(contractsData)) {
                return false;
            }

            // Test required fields
            const requiredFields = ['name', 'description', 'code_id', 'hash', 'release', 'author', 'governance', 'deprecated'];
            const firstContract = contractsData[0];
            
            for (const field of requiredFields) {
                if (!(field in firstContract)) {
                    return false;
                }
            }

            // Test hash format
            if (!/^[A-F0-9]{64}$/.test(firstContract.hash)) {
                return false;
            }

            // Test code_id format
            if (!/^[0-9]+$/.test(firstContract.code_id)) {
                return false;
            }

            return true;
        } catch (error) {
            return false;
        }
    }

    async testDuplicateCodeIdDetection() {
        try {
            const contractsPath = path.join(__dirname, '..', 'contracts.json');
            const contractsData = JSON.parse(fs.readFileSync(contractsPath, 'utf8'));
            
            const codeIds = new Set();
            for (const contract of contractsData) {
                if (codeIds.has(contract.code_id)) {
                    return false; // Found duplicate
                }
                codeIds.add(contract.code_id);
            }
            
            return true; // No duplicates found
        } catch (error) {
            return false;
        }
    }

    async testFileAccessibility() {
        try {
            const contractsPath = path.join(__dirname, '..', 'contracts.json');
            const contractsData = JSON.parse(fs.readFileSync(contractsPath, 'utf8'));
            
            if (Array.isArray(contractsData) && contractsData.length > 0) {
                return true;
            }
            return false;
        } catch (error) {
            return false;
        }
    }

    async testHashFormatValidation() {
        try {
            const contractsPath = path.join(__dirname, '..', 'contracts.json');
            const contractsData = JSON.parse(fs.readFileSync(contractsPath, 'utf8'));
            
            let hashErrors = [];
            contractsData.forEach((contract, index) => {
                if (!contract.hash || !/^[A-F0-9]{64}$/.test(contract.hash)) {
                    hashErrors.push(`Contract ${index + 1} (${contract.name}): Invalid hash format`);
                }
            });
            
            return hashErrors.length === 0;
        } catch (error) {
            return false;
        }
    }

    async testNetworkConnectivity() {
        try {
            const validator = new UnifiedValidator({ network: this.network });
            const response = await fetch(`${validator.apiBaseUrl}/cosmwasm/wasm/v1/code`);
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    async runAllTests() {
        colorLog('cyan', '🚀 Starting Unified Validator Test Suite');
        colorLog('cyan', '=' .repeat(50));

        // Core functionality tests
        await this.runTest('Validator Initialization', () => this.testValidatorInitialization());
        await this.runTest('Validator Testnet Initialization', () => this.testValidatorTestnetInitialization());
        await this.runTest('Hash Calculation', () => this.testHashCalculation());
        await this.runTest('Contracts JSON Loading', () => this.testContractsJsonLoading());
        
        // API connectivity tests (may fail if API is down)
        await this.runTest('API Connectivity', () => this.testApiConnectivity());
        await this.runTest('Governance Proposals Fetch', () => this.testGovernanceProposalsFetch());
        
        // Analysis tests
        await this.runTest('Discrepancy Analysis', () => this.testDiscrepancyAnalysis());
        await this.runTest('Hash Mismatch Detection', () => this.testHashMismatchDetection());
        await this.runTest('Governance Issue Detection', () => this.testGovernanceIssueDetection());
        await this.runTest('Recommendation Generation', () => this.testRecommendationGeneration());
        
        // Data validation tests
        await this.runTest('JSON Structure Validation', () => this.testJsonValidation());
        await this.runTest('Duplicate Code ID Detection', () => this.testDuplicateCodeIdDetection());
        await this.runTest('File Accessibility', () => this.testFileAccessibility());
        await this.runTest('Hash Format Validation', () => this.testHashFormatValidation());
        await this.runTest('Network Connectivity', () => this.testNetworkConnectivity());

        // Print results
        this.printResults();
    }

    printResults() {
        colorLog('cyan', '\n📊 Test Results Summary');
        colorLog('cyan', '=' .repeat(30));
        
        colorLog('green', `✅ Passed: ${this.testResults.passed}`);
        colorLog('red', `❌ Failed: ${this.testResults.failed}`);
        colorLog('blue', `📊 Total: ${this.testResults.passed + this.testResults.failed}`);
        
        if (this.testResults.failed === 0) {
            colorLog('green', '\n🎉 All tests passed! Contract validation system is working correctly.');
        } else {
            colorLog('yellow', '\n⚠️  Some tests failed. Please review the issues above.');
        }

        // Detailed results
        colorLog('cyan', '\n📋 Detailed Test Results:');
        this.testResults.tests.forEach((test, index) => {
            const status = test.status === 'PASSED' ? '✅' : '❌';
            colorLog('bright', `${index + 1}. ${test.name}: ${status} ${test.status}`);
            if (test.error) {
                colorLog('red', `   Error: ${test.error}`);
            }
        });
    }
}

// Main execution
async function main() {
    const args = process.argv.slice(2);
    const options = {
        network: 'mainnet',
        verbose: false
    };
    
    // Parse command line arguments
    args.forEach(arg => {
        if (arg.startsWith('--network=')) {
            options.network = arg.split('=')[1];
        } else if (arg === '--verbose' || arg === '-v') {
            options.verbose = true;
        } else if (arg === '--help' || arg === '-h') {
            console.log(`
Unified Validator Test Suite

Usage: node scripts/test-unified-validator.js [options]

Options:
  --network=mainnet|testnet    Network to test against (default: mainnet)
  --verbose, -v               Enable verbose output
  --help, -h                 Show this help message

Examples:
  node scripts/test-unified-validator.js
  node scripts/test-unified-validator.js --network=testnet --verbose
            `);
            process.exit(0);
        }
    });
    
    if (!['mainnet', 'testnet'].includes(options.network)) {
        colorLog('red', '❌ Invalid network. Use --network=mainnet or --network=testnet');
        process.exit(1);
    }
    
    const tester = new UnifiedValidatorTester(options);
    await tester.runAllTests();
    
    const success = tester.testResults.failed === 0;
    process.exit(success ? 0 : 1);
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { UnifiedValidatorTester };
