#!/usr/bin/env node

/**
 * build-site.js
 * 
 * Generates the contracts-data.js file for the GitHub Pages site
 * from the contracts.json source file.
 * 
 * Usage:
 *   node scripts/build-site.js
 */

const fs = require('fs');
const path = require('path');

// Paths
const CONTRACTS_FILE = path.join(__dirname, '..', 'contracts.json');
const OUTPUT_FILE = path.join(__dirname, '..', 'docs', 'contracts-data.js');

// Ensure docs directory exists
const docsDir = path.join(__dirname, '..', 'docs');
if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
}

try {
    // Read contracts.json
    const contractsData = JSON.parse(fs.readFileSync(CONTRACTS_FILE, 'utf8'));
    
    // Sort contracts by code_id (numeric sort)
    contractsData.sort((a, b) => parseInt(a.code_id) - parseInt(b.code_id));
    
    // Generate JavaScript file with contract data
    const jsContent = `// Auto-generated from contracts.json - DO NOT EDIT DIRECTLY
// Generated on ${new Date().toISOString()}
// Total contracts: ${contractsData.length}

const contractsData = ${JSON.stringify(contractsData, null, 2)};
`;

    // Write to output file
    fs.writeFileSync(OUTPUT_FILE, jsContent);
    
    // Generate statistics
    const stats = {
        total: contractsData.length,
        deprecated: contractsData.filter(c => c.deprecated).length,
        active: contractsData.filter(c => !c.deprecated).length,
        genesis: contractsData.filter(c => c.governance === 'Genesis').length,
        proposal: contractsData.filter(c => c.governance !== 'Genesis').length,
        withTestnet: contractsData.filter(c => c.testnet).length,
        withoutTestnet: contractsData.filter(c => !c.testnet).length,
        authors: [...new Set(contractsData.map(c => c.author.name))].length
    };
    
    console.log('✅ Site data generated successfully!');
    console.log('\n📊 Contract Statistics:');
    console.log(`   Total Contracts: ${stats.total}`);
    console.log(`   Active: ${stats.active} | Deprecated: ${stats.deprecated}`);
    console.log(`   Genesis: ${stats.genesis} | Via Proposal: ${stats.proposal}`);
    console.log(`   With Testnet: ${stats.withTestnet} | Without Testnet: ${stats.withoutTestnet}`);
    console.log(`   Unique Authors: ${stats.authors}`);
    console.log(`\n📁 Output: ${OUTPUT_FILE}`);
    
} catch (error) {
    console.error('❌ Error building site:', error.message);
    process.exit(1);
}