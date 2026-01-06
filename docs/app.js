// Main application logic for the contracts browser

let allContracts = [];
let filteredContracts = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // contractsData is loaded from contracts-data.js
    allContracts = contractsData || [];
    
    // Populate author dropdown
    populateAuthorFilter();
    
    // Set default filter to active contracts only
    document.getElementById('statusFilter').value = 'active';
    
    // Apply initial filter
    filterContracts();
    
    setupEventListeners();
});

// Setup event listeners for search and filters
function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    const authorFilter = document.getElementById('authorFilter');
    const governanceFilter = document.getElementById('governanceFilter');
    const statusFilter = document.getElementById('statusFilter');
    const testnetFilter = document.getElementById('testnetFilter');

    searchInput.addEventListener('input', filterContracts);
    authorFilter.addEventListener('change', filterContracts);
    governanceFilter.addEventListener('change', filterContracts);
    statusFilter.addEventListener('change', filterContracts);
    testnetFilter.addEventListener('change', filterContracts);
}

// Populate author filter dropdown
function populateAuthorFilter() {
    const authorFilter = document.getElementById('authorFilter');
    const authors = new Map();
    
    // Collect unique authors with their counts
    allContracts.forEach(contract => {
        const authorName = contract.author.name;
        authors.set(authorName, (authors.get(authorName) || 0) + 1);
    });
    
    // Sort authors alphabetically
    const sortedAuthors = Array.from(authors.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    
    // Add options to dropdown
    sortedAuthors.forEach(([name, count]) => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = `${name} (${count})`;
        authorFilter.appendChild(option);
    });
}

// Filter contracts based on search and filter criteria
function filterContracts() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const authorValue = document.getElementById('authorFilter').value;
    const governanceValue = document.getElementById('governanceFilter').value;
    const statusValue = document.getElementById('statusFilter').value;
    const testnetValue = document.getElementById('testnetFilter').value;

    filteredContracts = allContracts.filter(contract => {
        // Search filter
        const matchesSearch = !searchTerm || 
            contract.name.toLowerCase().includes(searchTerm) ||
            contract.description.toLowerCase().includes(searchTerm) ||
            contract.author.name.toLowerCase().includes(searchTerm) ||
            (contract.mainnet && contract.mainnet.code_id.includes(searchTerm)) ||
            (contract.testnet && contract.testnet.code_id.includes(searchTerm));

        // Author filter
        const matchesAuthor = !authorValue || contract.author.name === authorValue;

        // Governance filter (only applies to contracts with mainnet)
        const matchesGovernance = !governanceValue ||
            !contract.mainnet ||
            (governanceValue === 'Genesis' && contract.mainnet.governance === 'Genesis') ||
            (governanceValue === 'Proposal' && contract.mainnet.governance !== 'Genesis');

        // Status filter
        const matchesStatus = !statusValue ||
            (statusValue === 'active' && !contract.deprecated) ||
            (statusValue === 'deprecated' && contract.deprecated);

        // Testnet filter
        const matchesTestnet = !testnetValue ||
            (testnetValue === 'testnet' && contract.testnet) ||
            (testnetValue === 'no-testnet' && !contract.testnet);

        return matchesSearch && matchesAuthor && matchesGovernance && matchesStatus && matchesTestnet;
    });

    renderContracts();
    updateStats();
}

// Render contracts to the grid
function renderContracts() {
    const grid = document.getElementById('contractsGrid');
    const noResults = document.getElementById('noResults');

    if (filteredContracts.length === 0) {
        grid.innerHTML = '';
        noResults.style.display = 'block';
        return;
    }

    noResults.style.display = 'none';
    grid.innerHTML = filteredContracts.map(contract => createContractCard(contract)).join('');

    // Add copy functionality to all copy buttons
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            copyToClipboard(btn.dataset.value, btn);
        });
    });
}

// Create HTML for a contract card
function createContractCard(contract) {
    const isDeprecated = contract.deprecated;
    const hasMainnet = contract.mainnet;
    const hasTestnet = contract.testnet;
    const isGenesis = hasMainnet && contract.mainnet.governance === 'Genesis';
    
    // Build tags based on availability
    const tags = [];
    tags.push(isDeprecated ? '<span class="ui-badge ui-badge-error">Deprecated</span>' : '<span class="ui-badge ui-badge-success">Active</span>');
    if (hasMainnet) {
        tags.push('<span class="ui-badge" style="background: rgba(202, 240, 51, 0.15); color: var(--xion-success); border: 1px solid rgba(202, 240, 51, 0.3);">Mainnet</span>');
        if (isGenesis) {
            tags.push('<span class="ui-badge ui-badge-warning">Genesis</span>');
        }
    }
    if (hasTestnet) {
        tags.push('<span class="ui-badge" style="background: rgba(59, 130, 246, 0.15); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.3);">Testnet</span>');
    }
    
    // Helper function to create a data row
    const createDataRow = (label, value, copyValue = null) => {
        const copyBtn = copyValue ? `
            <button class="copy-btn" data-value="${copyValue}" title="Copy ${label}" style="margin-left: auto;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
            </button>
        ` : '';
        return `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span class="ui-small-text ui-text-secondary" style="min-width: 80px; text-transform: uppercase; letter-spacing: 0.05em;">${label}:</span>
                <span style="flex: 1; display: flex; align-items: center; gap: 0.5rem; background: rgba(18, 18, 18, 0.8); padding: 0.375rem 0.625rem; border-radius: var(--xion-radius-sm); border: 1px solid var(--xion-border); font-family: 'Courier New', monospace; font-size: 0.85rem;">
                    ${value}
                    ${copyBtn}
                </span>
            </div>
        `;
    };
    
    // Build mainnet section
    let mainnetSection = '';
    if (hasMainnet) {
        const truncatedMainnetHash = `${contract.mainnet.hash.substring(0, 8)}...${contract.mainnet.hash.substring(contract.mainnet.hash.length - 8)}`;
        mainnetSection = `
            <div style="margin-bottom: 1rem; padding: 1rem; background: rgba(202, 240, 51, 0.05); border: 1px solid rgba(202, 240, 51, 0.2); border-radius: var(--xion-radius-md);">
                <div class="ui-small-text ui-text-secondary" style="margin-bottom: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--xion-success);">Mainnet</div>
                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                    ${createDataRow('Code ID', contract.mainnet.code_id, contract.mainnet.code_id)}
                    ${createDataRow('Hash', truncatedMainnetHash, contract.mainnet.hash)}
                    ${createDataRow('Governance', contract.mainnet.governance)}
                </div>
            </div>
        `;
    }
    
    // Build testnet section
    let testnetSection = '';
    if (hasTestnet) {
        const truncatedTestnetHash = `${contract.testnet.hash.substring(0, 8)}...${contract.testnet.hash.substring(contract.testnet.hash.length - 8)}`;
        // Format date to show only date part (YYYY-MM-DD)
        const deployedDate = new Date(contract.testnet.deployed_at).toISOString().split('T')[0];
        testnetSection = `
            <div style="margin-bottom: 1rem; padding: 1rem; background: rgba(59, 130, 246, 0.05); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: var(--xion-radius-md);">
                <div class="ui-small-text ui-text-secondary" style="margin-bottom: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #3b82f6;">Testnet</div>
                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                    ${createDataRow('Code ID', contract.testnet.code_id, contract.testnet.code_id)}
                    ${createDataRow('Hash', truncatedTestnetHash, contract.testnet.hash)}
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span class="ui-small-text ui-text-secondary" style="min-width: 80px; text-transform: uppercase; letter-spacing: 0.05em;">Deployed:</span>
                        <span style="flex: 1; display: flex; align-items: center; gap: 0.5rem; background: rgba(18, 18, 18, 0.8); padding: 0.375rem 0.625rem; border-radius: var(--xion-radius-sm); border: 1px solid var(--xion-border); font-family: 'Courier New', monospace; font-size: 0.85rem;">
                            <span>${escapeHtml(contract.testnet.deployed_by)}</span>
                            <span style="color: var(--xion-secondary-text);">•</span>
                            <span>${deployedDate}</span>
                        </span>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Build action buttons
    let actionButtons = '';
    if (contract.release && contract.release.url) {
        actionButtons += `<a href="${escapeHtml(contract.release.url)}" target="_blank" class="ui-button ui-button-outlined" style="flex: 1; font-size: 0.85rem; padding: 0.625rem 1rem;">View Release</a>`;
    }
    if (hasMainnet && !isGenesis) {
        actionButtons += `<a href="https://api.xion-mainnet-1.burnt.com/cosmos/gov/v1/proposals/${contract.mainnet.governance}" target="_blank" class="ui-button ui-button-outlined" style="flex: 1; font-size: 0.85rem; padding: 0.625rem 1rem;">View Proposal</a>`;
    }

    return `
        <div class="ui-glass-panel contract-card" style="padding: 1.5rem; transition: all 0.2s; cursor: pointer; animation: ui-slide-up 0.3s ease;">
            <div class="contract-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                <div>
                    <div class="ui-heading-3" style="margin-bottom: 0.25rem;">${escapeHtml(contract.name)}</div>
                    <div class="ui-small-text ui-text-secondary">
                        by <a href="${escapeHtml(contract.author.url)}" target="_blank" style="color: var(--xion-warning); text-decoration: none;">${escapeHtml(contract.author.name)}</a>
                    </div>
                </div>
                <div class="ui-flex ui-gap-sm" style="flex-wrap: wrap;">
                    ${tags.join('')}
                </div>
            </div>
            
            <div class="ui-text-secondary ui-mb-md" style="line-height: 1.5;">${escapeHtml(contract.description)}</div>
            
            ${hasMainnet || hasTestnet ? `
            <div class="ui-mb-md" style="display: flex; flex-direction: column; gap: 0;">
                ${mainnetSection}
                ${testnetSection}
            </div>
            ` : ''}
            
            ${actionButtons ? `
            <div class="ui-flex ui-gap-sm" style="margin-top: 1rem;">
                ${actionButtons}
            </div>
            ` : ''}
        </div>
    `;
}

// Update statistics display
function updateStats() {
    const statsElement = document.getElementById('contractCount');
    const totalCount = allContracts.length;
    const filteredCount = filteredContracts.length;
    
    if (filteredCount === totalCount) {
        statsElement.textContent = `${totalCount} contracts`;
    } else {
        statsElement.textContent = `${filteredCount} of ${totalCount} contracts`;
    }
}

// Copy text to clipboard
function copyToClipboard(text, button) {
    navigator.clipboard.writeText(text).then(() => {
        // Visual feedback
        const originalHTML = button.innerHTML;
        button.classList.add('copied');
        button.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
        `;
        
        setTimeout(() => {
            button.classList.remove('copied');
            button.innerHTML = originalHTML;
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy:', err);
    });
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}