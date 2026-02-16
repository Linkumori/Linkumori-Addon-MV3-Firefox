/*
 * ClearURLs forks (linkumori) - Enhanced Custom Rules Editor with Provider Import Feature and Provider List Modal
 * Copyright (c) 2025 Subham Mahesh
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * 
 * SVG Icons Attribution (JavaScript Embedded):
 * ===========================================
 * <!--
 *first modified svg apache  license icons by google:  august 21, 2025  by Subham Mahesh
 secound modified svg apache license icons by google:   september 5, 2025  by Subham Mahesh

  Due to constraints, subsequent modifications are not visible inline.
  To view the full modification history, run:

    node linkumori-cli-tool.js

  Then select "Generate Commit History". This will create a Markdown file
  where you can browse who modified which files and on what date.
-->
 * ALL embedded SVG icons are Modified Google Material Icons (Apache License 2.0):
 * 
 * - Arrow Drop Down Icon: derivative of arrow-drop.svg
 *   [Modifications: fill=currentColor (orig: #e3e3e3), width=24px, height=24px, viewBox=unchanged, path=unchanged]
 *   (FAQ accordion questions)
 * 
 * - Edit Icon: derivative of edit.svg
 *   [Modifications: width=12px (orig: 24px), height=12px (orig: 24px), fill=currentColor (orig: #e3e3e3), viewBox=unchanged, path=unchanged]
 *   (provider list edit buttons)
 * 
 * - Copy/Duplicate Icon: derivative of copy.svg
 *   [Modifications: width=12px (orig: 24px), height=12px (orig: 24px), fill=currentColor (orig: #e3e3e3), viewBox=unchanged, path=unchanged]
 *   (provider duplicate buttons)
 * 
 * - Delete Icon: derivative of delete.svg
 *   [Modifications: width=12px (orig: 24px), height=12px (orig: 24px), fill=currentColor (orig: #e3e3e3), viewBox=unchanged, path=unchanged]
 *   (provider delete buttons, array item removal)
 * 
 * - Plus/Add Icon: derivative of plus.svg
 *   [Modifications: width=14px (orig: 24px), height=14px (orig: 24px), fill=currentColor (orig: #e3e3e3), viewBox=unchanged, path=unchanged]
 *   (add provider buttons, add array items)
 * 
 * - Close/Exit Icon: heavily modified derivative of close_24dp_E3E3E3.svg
 *   [Modifications: width=14px (orig: 24px), height=14px (orig: 24px), fill=currentColor (orig: #e3e3e3), viewBox=0 -960 960 960 (orig: 0 0 24 24), path=completely different design]
 *   (modal close buttons, exit editor)
 * 
 * - Save Icon: heavily modified derivative of save.svg
 *   [Modifications: width=14px (orig: 24px), height=14px (orig: 24px), fill=currentColor (orig: #e3e3e3), viewBox=0 0 24 24 (orig: 0 -960 960 960), path=completely different design]
 *   (save provider button)
 * 
 * - Success/Check Icon: derivative of correct-check.svg
 *   [Modifications: width=14px (orig: 24px), height=14px (orig: 24px), fill=currentColor (orig: #e3e3e3), viewBox=unchanged, path=unchanged]
 *   (enforce rules success feedback)
 * 
 * - Warning Triangle Icon: derivative of warning.svg
 *   [Modifications: width=14px (orig: 24px), height=14px (orig: 24px), fill=currentColor (orig: #e3e3e3), viewBox=unchanged, path=unchanged]
 *   (enforce rules error feedback)
 * 
 * Google Material Icons License Information:
 * Source: https://fonts.google.com/icons
 * Licensed under Apache License 2.0
 * Documentation: https://developers.google.com/fonts/docs/material_icons#licensing
 * 
 * Modifications:
 * - Added provider import functionality from bundle/remote rules
 * - Enhanced provider browsing with search and selection
 * - Support for importing from different rule sources
 * - Multi-select provider import with conflict resolution
 * - Real-time provider preview and statistics
 * - Enhanced UI with provider cards and filtering
 * - NEW: Added provider list modal for quick overview and editing
 * - NEW: Fully internationalized (i18n) provider list interface
 */
// Global state
let customRules = { providers: {} };
let currentProvider = null;
let isEditing = false;
let hasUnsavedChanges = false;

// Provider import state
let availableRuleSources = {};
let selectedProviders = new Set();
let currentRuleSource = 'bundled';

// DOM elements
let providerList, editorContent, editorTitle, editorStatus, saveBtn, deleteBtn, exitBtn;
let providerModal, providerForm, modalTitle, importFileInput;
let faqModal, faqBtn;
let providerImportModal, providerImportBtn;
let providerListModal, providerListBtn; // NEW: Provider list modal elements

// ============================================================================
// LINKUMORI I18N NUMBER LOCALIZATION HELPER FUNCTIONS
// ============================================================================

/**
 * Get localized number string using LinkumoriI18n
 * @param {number} number - Number to localize
 * @returns {string} Localized number string
 */
function getLocalizedNumber(number) {
    // Direct conversion using LinkumoriI18n only
    return LinkumoriI18n ? LinkumoriI18n.localizeNumbers(number) : number.toString();
}

/**
 * FIXED: Get localized percentage string using LinkumoriI18n only
 * @param {number} percentage - Percentage number (without % symbol)
 * @returns {string} Localized percentage with symbol
 */
function getLocalizedPercentage(percentage) {
    // Direct conversion using LinkumoriI18n only
    const localizedNumber = LinkumoriI18n ? LinkumoriI18n.localizeNumbers(percentage) : percentage.toString();
    const percentageSymbol = (LinkumoriI18n && LinkumoriI18n.getMessage('percentage_symbol')) || '%';
    return localizedNumber + percentageSymbol;
}

/**
 * Update display elements with localized numbers
 * This function can be called after language changes to update all number displays
 */
function updateAllLocalizedNumbers() {
    // Re-update provider count and rules status with new localization
    updateProviderCount();
    updateRulesStatus();
}

// i18n helper function
function i18n(key, ...substitutions) {
    return (LinkumoriI18n && LinkumoriI18n.getMessage(key, substitutions)) || key;
}

function setHTMLContent(element, html) {
    if (!element) return;
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<!doctype html><body>${html || ''}</body>`, 'text/html');
    element.replaceChildren(...Array.from(doc.body.childNodes));
}

/**
 * Initialize i18n for all static elements
 */
function initializeI18n() {
    // Update page title
    document.title = i18n('customRulesEditor_title');
    
    // Update all elements with data-i18n attributes
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        const text = i18n(key);
        if (text && text !== key) {
            element.textContent = text;
        }
    });
    
    // Update all elements with data-i18n-title attributes
    const titleElements = document.querySelectorAll('[data-i18n-title]');
    titleElements.forEach(element => {
        const key = element.getAttribute('data-i18n-title');
        const text = i18n(key);
        if (text && text !== key) {
            element.title = text;
        }
    });
    
    // Update all elements with data-i18n-placeholder attributes
    const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
    placeholderElements.forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        const text = i18n(key);
        if (text && text !== key) {
            element.placeholder = text;
        }
    });
}
     initializeTheme();
/**
 * Initialize the editor when DOM is loaded and LinkumoriI18n is ready
 */
document.addEventListener('DOMContentLoaded', function() {
     initializeTheme();
    initializeEditor();
    
    if (typeof LinkumoriI18n !== 'undefined' && LinkumoriI18n.ready) {
        LinkumoriI18n.ready().then(() => {
            initializeI18n();
            initializeApp();
        }).catch(error => {
            console.error('Error waiting for LinkumoriI18n:', error);
            // Continue with initialization even if LinkumoriI18n fails
            initializeApp();
        });
    } else {
        // Continue with initialization even if LinkumoriI18n is not available
        initializeApp();
    }
});

/**
 * Initialize the main application
 */
function initializeApp() {
    setupFAQ();
    setupProviderImport();
    setupProviderListModal(); // NEW: Setup provider list modal
    setupEventListeners();
    loadCustomRules(); // Load this last so UI is ready
}

/**
 * Initialize DOM references and setup
 */
function initializeEditor() {
    providerList = document.getElementById('provider-list');
    editorContent = document.getElementById('editor-content');
    editorTitle = document.getElementById('editor-title');
    editorStatus = document.getElementById('editor-status');
    saveBtn = document.getElementById('save-provider-btn');
    deleteBtn = document.getElementById('delete-provider-btn');
    exitBtn = document.getElementById('exit-editor-btn');
    
    providerModal = document.getElementById('provider-modal');
    providerForm = document.getElementById('provider-form');
    modalTitle = document.getElementById('modal-title');
    importFileInput = document.getElementById('import-file-input');
    
    // FAQ elements
    faqModal = document.getElementById('faq-modal');
    faqBtn = document.getElementById('faq-btn');
    
    // Provider import elements
    providerImportModal = document.getElementById('provider-import-modal');
    providerImportBtn = document.getElementById('import-from-rules-btn');
    
    // NEW: Provider list modal elements
    providerListModal = document.getElementById('provider-list-modal');
    providerListBtn = document.getElementById('provider-list-btn');
}

// ============================================================================
// NEW: PROVIDER LIST MODAL FUNCTIONALITY
// ============================================================================

/*
 * Required i18n keys for provider list modal:
 * - providerList_button: "List All Providers"
 * - providerList_title: "All Providers"
 * - providerList_searchPlaceholder: "Search providers..."
 * - providerList_rules: "Rules"
 * - providerList_rawRules: "Raw Rules" 
 * - providerList_referral: "Referral"
 * - providerList_exceptions: "Exceptions"
 * - providerList_redirections: "Redirections"
 * - providerList_complete: "Complete"
 * - providerList_noUrlPattern: "No URL pattern"
 * - providerList_edit: "Edit"
 * - providerList_duplicate: "Copy"
 * - providerList_delete: "Delete"
 * - providerList_editTooltip: "Edit Provider"
 * - providerList_duplicateTooltip: "Duplicate Provider"
 * - providerList_deleteTooltip: "Delete Provider"
 * - providerList_noProvidersFound: "No custom providers found."
 * - providerList_createFirst: "Create First Provider"
 * - providerList_confirmDelete: "Are you sure you want to delete provider \"{0}\"?"
 * - providerList_deleteFailed: "Failed to delete provider. Please try again."
 * - providerList_copySuffix: "Copy"
 * - button_close: "Close" (reuses existing key)
 */

/**
 * Setup provider list modal functionality
 */
function setupProviderListModal() {
    if (!providerListBtn || !providerListModal) {
        return;
    }
    
    // Provider list button click
    providerListBtn.addEventListener('click', showProviderListModal);
    
    // Provider list modal close buttons
    const listCloseBtn = document.getElementById('provider-list-modal-close');
    const listModalCloseBtn = document.getElementById('provider-list-close-btn');
    
    if (listCloseBtn) {
        listCloseBtn.addEventListener('click', hideProviderListModal);
    }
    
    if (listModalCloseBtn) {
        listModalCloseBtn.addEventListener('click', hideProviderListModal);
    }
    
    // Close provider list modal on background click
    providerListModal.addEventListener('click', function(e) {
        if (e.target === providerListModal) {
            hideProviderListModal();
        }
    });
    
    // Search functionality
    const searchInput = document.getElementById('provider-list-search');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            filterProviderList(this.value);
        });
    }
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && providerListModal && providerListModal.classList.contains('show')) {
            hideProviderListModal();
        }
    });
}

/**
 * Show provider list modal
 */
function showProviderListModal() {
    if (!providerListModal) return;
    
    // Populate the provider list
    populateProviderListModal();
    
    // Show modal
    providerListModal.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    // Focus management for accessibility
    const searchInput = document.getElementById('provider-list-search');
    if (searchInput) {
        searchInput.focus();
    }
}

/**
 * Hide provider list modal
 */
function hideProviderListModal() {
    if (!providerListModal) return;
    
    providerListModal.classList.remove('show');
    document.body.style.overflow = '';
    
    // Return focus to provider list button
    if (providerListBtn) {
        providerListBtn.focus();
    }
}

/**
 * Populate the provider list modal with current providers
 */
function populateProviderListModal() {
    const modalContent = document.getElementById('provider-list-modal-content');
    if (!modalContent) {
        console.error('Provider list modal content element not found');
        return;
    }
    
    const providers = Object.keys(customRules.providers);
    
    if (providers.length === 0) {
        setHTMLContent(modalContent, `
            <div class="provider-list-empty">
                <p>${i18n('providerList_noProvidersFound')}</p>
                <button class="btn btn-primary" id="provider-list-create-first-btn">
                    ${i18n('providerList_createFirst')}
                </button>
            </div>
        `);
        
        // Add event listener for the create first button
        const createFirstBtn = document.getElementById('provider-list-create-first-btn');
        if (createFirstBtn) {
            createFirstBtn.addEventListener('click', function() {
                hideProviderListModal();
                showAddProviderModal();
            });
        }
        
        return;
    }
    
    const providerItems = providers.map(providerName => {
        const provider = customRules.providers[providerName];
        return createProviderListItemHTML(providerName, provider);
    }).join('');
    
    setHTMLContent(modalContent, providerItems);
    
    // Add event listeners to edit buttons
    modalContent.querySelectorAll('.provider-list-edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const providerName = this.dataset.provider;
            hideProviderListModal();
            selectProvider(providerName);
        });
    });
    
    // Add event listeners to delete buttons
    modalContent.querySelectorAll('.provider-list-delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const providerName = this.dataset.provider;
            deleteProviderFromList(providerName);
        });
    });
    
    // Add event listeners to duplicate buttons
    modalContent.querySelectorAll('.provider-list-duplicate-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const providerName = this.dataset.provider;
            duplicateProviderFromList(providerName);
        });
    });
}

/**
 * Create HTML for a provider list item in the modal
 */
function createProviderListItemHTML(providerName, provider) {
    // Calculate provider statistics
    const rulesCount = (provider.rules || []).length;
    const rawRulesCount = (provider.rawRules || []).length;
    const exceptionsCount = (provider.exceptions || []).length;
    const redirectionsCount = (provider.redirections || []).length;
    const referralCount = (provider.referralMarketing || []).length;
    const domainPatternsCount = (provider.domainPatterns || []).length;
    const domainExceptionsCount = (provider.domainExceptions || []).length;
    const domainRedirectionsCount = (provider.domainRedirections || []).length;
    
    const stats = [];
    if (rulesCount > 0) stats.push(`${getLocalizedNumber(rulesCount)} ${i18n('providerList_rules')}`);
    if (rawRulesCount > 0) stats.push(`${getLocalizedNumber(rawRulesCount)} ${i18n('providerList_rawRules')}`);
    if (referralCount > 0) stats.push(`${getLocalizedNumber(referralCount)} ${i18n('providerList_referral')}`);
    if (exceptionsCount > 0) stats.push(`${getLocalizedNumber(exceptionsCount)} ${i18n('providerList_exceptions')}`);
    if (redirectionsCount > 0) stats.push(`${getLocalizedNumber(redirectionsCount)} ${i18n('providerList_redirections')}`);
    if (domainPatternsCount > 0) stats.push(`${getLocalizedNumber(domainPatternsCount)} Domain Patterns`);
    if (domainExceptionsCount > 0) stats.push(`${getLocalizedNumber(domainExceptionsCount)} Domain Exceptions`);
    if (domainRedirectionsCount > 0) stats.push(`${getLocalizedNumber(domainRedirectionsCount)} Domain Redirections`);
    if (provider.completeProvider) stats.push(i18n('providerList_complete'));
    
    return `
        <div class="provider-list-item" data-provider="${escapeHtml(providerName)}">
            <div class="provider-list-item-info">
                <h4 class="provider-list-item-name" title="${escapeHtml(providerName)}">${escapeHtml(providerName)}</h4>
                <p class="provider-list-item-url" title="${escapeHtml(provider.urlPattern || (provider.domainPatterns && provider.domainPatterns.length > 0 ? provider.domainPatterns.join(', ') : ''))}">${escapeHtml(provider.urlPattern || (provider.domainPatterns && provider.domainPatterns.length > 0 ? `Domain: ${provider.domainPatterns.join(', ')}` : i18n('providerList_noUrlPattern')))}</p>
                <div class="provider-list-item-stats">
                    ${stats.map(stat => `<span class="provider-list-item-stat">${stat}</span>`).join('')}
                </div>
            </div>
            <div class="provider-list-item-actions">
                <button class="btn btn-sm btn-primary provider-list-edit-btn" data-provider="${escapeHtml(providerName)}" title="${i18n('providerList_editTooltip')}">
                    <svg width="12" height="12" viewBox="0 -960 960 960" fill="currentColor">
                        <path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/>
                    </svg>
                    ${i18n('providerList_edit')}
                </button>
                <button class="btn btn-sm btn-warning provider-list-duplicate-btn" data-provider="${escapeHtml(providerName)}" title="${i18n('providerList_duplicateTooltip')}">
                    <svg width="12" height="12" viewBox="0 -960 960 960" fill="currentColor">
                        <path d="M120-220v-80h80v80h-80Zm0-140v-80h80v80h-80Zm0-140v-80h80v80h-80ZM260-80v-80h80v80h-80Zm100-160q-33 0-56.5-23.5T280-320v-480q0-33 23.5-56.5T360-880h360q33 0 56.5 23.5T800-800v480q0 33-23.5 56.5T720-240H360Zm0-80h360v-480H360v480Zm40 240v-80h80v80h-80Zm-200 0q-33 0-56.5-23.5T120-160h80v80Zm340 0v-80h80q0 33-23.5 56.5T540-80ZM120-640q0-33 23.5-56.5T200-720v80h-80Zm420 80Z"/>
                    </svg>
                    ${i18n('providerList_duplicate')}
                </button>
                <button class="btn btn-sm btn-danger provider-list-delete-btn" data-provider="${escapeHtml(providerName)}" title="${i18n('providerList_deleteTooltip')}">
                    <svg width="12" height="12" viewBox="0 -960 960 960" fill="currentColor">
                        <path d="m376-300 104-104 104 104 56-56-104-104 104-104-56-56-104 104-104-104-56 56 104 104-104 104 56 56Zm-96 180q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520Zm-400 0v520-520Z"/>
                    </svg>
                    ${i18n('providerList_delete')}
                </button>
            </div>
        </div>
    `;
}

/**
 * Filter provider list based on search term
 */
function filterProviderList(searchTerm) {
    const items = document.querySelectorAll('.provider-list-item');
    const term = searchTerm.toLowerCase().trim();
    
    items.forEach(item => {
        const providerName = item.dataset.provider.toLowerCase();
        const urlPattern = item.querySelector('.provider-list-item-url')?.textContent.toLowerCase() || '';
        
        const matches = providerName.includes(term) || urlPattern.includes(term);
        item.style.display = matches ? 'flex' : 'none';
    });
}

/**
 * Delete provider from list modal
 */
function deleteProviderFromList(providerName) {
    if (!confirm(i18n('providerList_confirmDelete', providerName))) {
        return;
    }
    
    try {
        delete customRules.providers[providerName];
        saveCustomRules();
        
        // Update the modal content
        populateProviderListModal();
        
        // Update the main UI
        updateUI();
        
        // If this was the currently edited provider, show empty state
        if (currentProvider === providerName) {
            currentProvider = null;
            isEditing = false;
            hasUnsavedChanges = false;
            showEmptyState();
        }
        
    } catch (error) {
        alert(i18n('providerList_deleteFailed'));
    }
}

/**
 * Duplicate provider from list modal
 */
function duplicateProviderFromList(providerName) {
    const provider = customRules.providers[providerName];
    if (!provider) return;
    
    let newName = `${providerName}_${i18n('providerList_copySuffix')}`;
    let counter = 1;
    
    while (customRules.providers[newName]) {
        newName = `${providerName}_${i18n('providerList_copySuffix')}_${counter}`;
        counter++;
    }
    
    customRules.providers[newName] = JSON.parse(JSON.stringify(provider));
    saveCustomRules();
    
    // Update the modal content
    populateProviderListModal();
    
    // Update the main UI
    updateUI();
}

// ============================================================================
// PROVIDER IMPORT FUNCTIONALITY (remote + current rules removed)
// ============================================================================

/**
 * Setup provider import functionality
 */
function setupProviderImport() {
    if (!providerImportBtn || !providerImportModal) {
        return;
    }
    
    // Provider import button click
    providerImportBtn.addEventListener('click', showProviderImportModal);
    
    // Provider import modal close buttons
    const importCloseBtn = document.getElementById('provider-import-modal-close');
    const importCancelBtn = document.getElementById('provider-import-cancel');
    const importConfirmBtn = document.getElementById('provider-import-confirm');
    
    if (importCloseBtn) {
        importCloseBtn.addEventListener('click', hideProviderImportModal);
    }
    
    if (importCancelBtn) {
        importCancelBtn.addEventListener('click', hideProviderImportModal);
    }
    
    if (importConfirmBtn) {
        importConfirmBtn.addEventListener('click', confirmProviderImport);
    }
    
    // Close provider import modal on background click
    providerImportModal.addEventListener('click', function(e) {
        if (e.target === providerImportModal) {
            hideProviderImportModal();
        }
    });
    
    // Source selection
    const sourceItems = document.querySelectorAll('.provider-source-item');
    sourceItems.forEach(item => {
        item.addEventListener('click', function() {
            const source = this.dataset.source;
            if (source) {
                selectRuleSource(source);
            }
        });
    });
    
    // Search functionality
    const searchInput = document.getElementById('provider-search');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            filterProviders(this.value);
        });
    }
    
    // Selection controls
    const selectAllBtn = document.getElementById('select-all-btn');
    const clearSelectionBtn = document.getElementById('clear-selection-btn');
    
    if (selectAllBtn) {
        selectAllBtn.addEventListener('click', selectAllProviders);
    }
    
    if (clearSelectionBtn) {
        clearSelectionBtn.addEventListener('click', clearProviderSelection);
    }
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && providerImportModal && providerImportModal.classList.contains('show')) {
            hideProviderImportModal();
        }
    });
}

/**
 * Show provider import modal
 */
async function showProviderImportModal() {
    if (!providerImportModal) return;
    
    // Reset state
    selectedProviders.clear();
    currentRuleSource = 'bundled';
    
    // Show modal
    providerImportModal.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    // Load available rule sources
    await loadAvailableRuleSources();
    
    // Select default source and load providers
    selectRuleSource('bundled');
    
    // Focus management for accessibility
    const firstFocusable = providerImportModal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (firstFocusable) {
        firstFocusable.focus();
    }
}

/**
 * Hide provider import modal
 */
function hideProviderImportModal() {
    if (!providerImportModal) return;
    
    providerImportModal.classList.remove('show');
    document.body.style.overflow = '';
    
    // Clear state
    selectedProviders.clear();
    availableRuleSources = {};
    
    // Return focus to import button
    if (providerImportBtn) {
        providerImportBtn.focus();
    }
}

/**
 * Load available rule sources
 */
async function loadAvailableRuleSources() {
    try {
        // Load bundled rules only
        availableRuleSources.bundled = await loadBundledRulesForImport();
        
        // Update source counts
        updateSourceCounts();
        
    } catch (error) {
        console.error('Error loading rule sources:', error);
        showProviderImportError(i18n('providerImport_failedToLoadSources', error.message));
    }
}

/**
 * Load bundled rules for import
 */
async function loadBundledRulesForImport() {
    try {
        const response = await browser.runtime.sendMessage({
            function: "getBundledRulesOnly"
        });
        
        if (response && response.response && response.response.providers) {
            return response.response;
        }
        
        // Fallback: try to get current rules and extract bundled ones
        const currentResponse = await browser.runtime.sendMessage({
            function: "getData",
            params: ['ClearURLsData']
        });
        
        if (currentResponse && currentResponse.response && currentResponse.response.providers) {
            // This is a merged version, but it's better than nothing
            return currentResponse.response;
        }
        
        throw new Error(i18n('providerImport_noBundledRules'));
    } catch (error) {
        throw new Error(i18n('providerImport_failedToLoadBundled', error.message));
    }
}

/**
 * Update source counts in the sidebar
 */
function updateSourceCounts() {
    const bundledCount = document.getElementById('bundled-count');
    
    if (bundledCount && availableRuleSources.bundled) {
        bundledCount.textContent = getLocalizedNumber(Object.keys(availableRuleSources.bundled.providers || {}).length);
    }
}

/**
 * Select a rule source and display its providers
 */
function selectRuleSource(source) {
    currentRuleSource = source;
    
    // Update source selection UI
    const sourceItems = document.querySelectorAll('.provider-source-item');
    sourceItems.forEach(item => {
        if (item.dataset.source === source) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // Clear current selection
    selectedProviders.clear();
    updateSelectionCount();
    
    // Load providers for selected source
    loadProvidersForSource(source);
}

/**
 * Load providers for a specific source
 */
function loadProvidersForSource(source) {
    const providerGrid = document.getElementById('provider-grid');
    if (!providerGrid) return;
    
    const rules = availableRuleSources[source];
    if (!rules || !rules.providers) {
        showProviderImportError(i18n('providerImport_noProvidersAvailable', source));
        return;
    }
    
    const providers = rules.providers;
    const providerNames = Object.keys(providers);
    
    if (providerNames.length === 0) {
        setHTMLContent(providerGrid, `
            <div class="provider-loading">
                <span>${i18n('providerImport_noProvidersFound', source)}</span>
            </div>
        `);
        return;
    }
    
    // Create provider cards
    const providerCards = providerNames.map(name => {
        const provider = providers[name];
        return createProviderCard(name, provider, source);
    }).join('');
    
    setHTMLContent(providerGrid, providerCards);
    
    // Add click handlers to provider cards
    const cards = providerGrid.querySelectorAll('.provider-card');
    cards.forEach(card => {
        card.addEventListener('click', function(e) {
            // Don't toggle if clicking on checkbox directly
            if (e.target.type === 'checkbox') return;
            
            toggleProviderSelection(this.dataset.provider);
        });
        
        // Handle checkbox clicks
        const checkbox = card.querySelector('.provider-card-checkbox');
        if (checkbox) {
            checkbox.addEventListener('change', function(e) {
                e.stopPropagation();
                if (this.checked) {
                    addProviderToSelection(card.dataset.provider);
                } else {
                    removeProviderFromSelection(card.dataset.provider);
                }
            });
        }
    });
}

/**
 * Create a provider card HTML
 */
function createProviderCard(name, provider, source) {
    // Calculate provider statistics
    const rulesCount = (provider.rules || []).length;
    const rawRulesCount = (provider.rawRules || []).length;
    const exceptionsCount = (provider.exceptions || []).length;
    const redirectionsCount = (provider.redirections || []).length;
    const referralCount = (provider.referralMarketing || []).length;
    const domainPatternsCount = (provider.domainPatterns || []).length;
    const domainExceptionsCount = (provider.domainExceptions || []).length;
    const domainRedirectionsCount = (provider.domainRedirections || []).length;
    
    // Check if provider already exists in custom rules
    const existsInCustom = customRules.providers[name] !== undefined;
    const statusClass = existsInCustom ? 'provider-card-exists' : '';
    const statusText = existsInCustom ? i18n('providerImport_existsInCustom') : '';
    
    return `
        <div class="provider-card ${statusClass}" data-provider="${escapeHtml(name)}" data-source="${source}">
            <div class="provider-card-header">
                <h4 class="provider-card-name" title="${escapeHtml(name)}">${escapeHtml(name)}</h4>
                <input type="checkbox" class="provider-card-checkbox">
            </div>
            <div class="provider-card-url" title="${escapeHtml(provider.urlPattern || (provider.domainPatterns && provider.domainPatterns.length > 0 ? provider.domainPatterns.join(', ') : ''))}">${escapeHtml(provider.urlPattern || (provider.domainPatterns && provider.domainPatterns.length > 0 ? `Domain: ${provider.domainPatterns.join(', ')}` : i18n('providerImport_noUrlPattern')))}</div>
            <div class="provider-card-stats">
                ${rulesCount > 0 ? `<span class="provider-card-stat" title="${i18n('providerImport_rules')}">${getLocalizedNumber(rulesCount)} ${i18n('providerImport_rulesAbbr')}</span>` : ''}
                ${rawRulesCount > 0 ? `<span class="provider-card-stat" title="${i18n('providerImport_rawRules')}">${getLocalizedNumber(rawRulesCount)} ${i18n('providerImport_rawRulesAbbr')}</span>` : ''}
                ${referralCount > 0 ? `<span class="provider-card-stat" title="${i18n('providerImport_referralMarketing')}">${getLocalizedNumber(referralCount)} ${i18n('providerImport_referralAbbr')}</span>` : ''}
                ${exceptionsCount > 0 ? `<span class="provider-card-stat" title="${i18n('providerImport_exceptions')}">${getLocalizedNumber(exceptionsCount)} ${i18n('providerImport_exceptionsAbbr')}</span>` : ''}
                ${redirectionsCount > 0 ? `<span class="provider-card-stat" title="${i18n('providerImport_redirections')}">${getLocalizedNumber(redirectionsCount)} ${i18n('providerImport_redirectionsAbbr')}</span>` : ''}
                ${domainPatternsCount > 0 ? `<span class="provider-card-stat" title="${i18n('providerImport_domainPatterns')}">${getLocalizedNumber(domainPatternsCount)} ${i18n('providerImport_domainPatternsAbbr')}</span>` : ''}
                ${domainExceptionsCount > 0 ? `<span class="provider-card-stat" title="${i18n('providerImport_domainExceptions')}">${getLocalizedNumber(domainExceptionsCount)} ${i18n('providerImport_domainExceptionsAbbr')}</span>` : ''}
                ${domainRedirectionsCount > 0 ? `<span class="provider-card-stat" title="${i18n('providerImport_domainRedirections')}">${getLocalizedNumber(domainRedirectionsCount)} ${i18n('providerImport_domainRedirectionsAbbr')}</span>` : ''}
                ${provider.completeProvider ? `<span class="provider-card-stat" title="${i18n('providerImport_completeProvider')}">${i18n('providerImport_complete')}</span>` : ''}
            </div>
            ${existsInCustom ? `<div style="font-size: 10px; color: var(--button-warning); margin-top: 4px;">${statusText}</div>` : ''}
        </div>
    `;
}

/**
 * Toggle provider selection
 */
function toggleProviderSelection(providerName) {
    const card = document.querySelector(`[data-provider="${providerName}"]`);
    const checkbox = card?.querySelector('.provider-card-checkbox');
    
    if (selectedProviders.has(providerName)) {
        removeProviderFromSelection(providerName);
        if (checkbox) checkbox.checked = false;
    } else {
        addProviderToSelection(providerName);
        if (checkbox) checkbox.checked = true;
    }
}

/**
 * Add provider to selection
 */
function addProviderToSelection(providerName) {
    selectedProviders.add(providerName);
    
    const card = document.querySelector(`[data-provider="${providerName}"]`);
    if (card) {
        card.classList.add('selected');
    }
    
    updateSelectionCount();
}

/**
 * Remove provider from selection
 */
function removeProviderFromSelection(providerName) {
    selectedProviders.delete(providerName);
    
    const card = document.querySelector(`[data-provider="${providerName}"]`);
    if (card) {
        card.classList.remove('selected');
    }
    
    updateSelectionCount();
}

/**
 * Select all visible providers
 */
function selectAllProviders() {
    const visibleCards = document.querySelectorAll('.provider-card:not([style*="display: none"])');
    
    visibleCards.forEach(card => {
        const providerName = card.dataset.provider;
        const checkbox = card.querySelector('.provider-card-checkbox');
        
        if (providerName) {
            addProviderToSelection(providerName);
            if (checkbox) checkbox.checked = true;
        }
    });
}

/**
 * Clear all provider selections
 */
function clearProviderSelection() {
    const selectedCards = document.querySelectorAll('.provider-card.selected');
    
    selectedCards.forEach(card => {
        const providerName = card.dataset.provider;
        const checkbox = card.querySelector('.provider-card-checkbox');
        
        if (providerName) {
            removeProviderFromSelection(providerName);
            if (checkbox) checkbox.checked = false;
        }
    });
    
    selectedProviders.clear();
    updateSelectionCount();
}

/**
 * Filter providers based on search term
 */
function filterProviders(searchTerm) {
    const cards = document.querySelectorAll('.provider-card');
    const term = searchTerm.toLowerCase().trim();
    
    cards.forEach(card => {
        const providerName = card.dataset.provider.toLowerCase();
        const urlPattern = card.querySelector('.provider-card-url')?.textContent.toLowerCase() || '';
        
        const matches = providerName.includes(term) || urlPattern.includes(term);
        card.style.display = matches ? 'block' : 'none';
    });
}

/**
 * Update selection count display
 */
function updateSelectionCount() {
    const selectionCount = document.getElementById('selection-count');
    const importConfirmBtn = document.getElementById('provider-import-confirm');
    
    const count = selectedProviders.size;
    
    if (selectionCount) {
        selectionCount.textContent = i18n('providerImport_selectedCount', getLocalizedNumber(count));
    }
    
    if (importConfirmBtn) {
        importConfirmBtn.disabled = count === 0;
    }
}

/**
 * Confirm provider import
 */
async function confirmProviderImport() {
    if (selectedProviders.size === 0) {
        return;
    }
    
    const importConfirmBtn = document.getElementById('provider-import-confirm');
    if (importConfirmBtn) {
        importConfirmBtn.disabled = true;
        importConfirmBtn.textContent = i18n('providerImport_importing');
    }
    
    try {
        const rules = availableRuleSources[currentRuleSource];
        if (!rules || !rules.providers) {
            throw new Error(i18n('providerImport_noRulesAvailable'));
        }
        
        let importedCount = 0;
        let skippedCount = 0;
        let overwrittenCount = 0;
        
        for (const providerName of selectedProviders) {
            const provider = rules.providers[providerName];
            if (!provider) {
                skippedCount++;
                continue;
            }
            
            // Check if provider already exists
            if (customRules.providers[providerName]) {
                overwrittenCount++;
            } else {
                importedCount++;
            }
            
            // Import the provider (deep copy to avoid reference issues)
            customRules.providers[providerName] = JSON.parse(JSON.stringify(provider));
        }
        
        // Save the updated custom rules
        await saveCustomRules();
        
        // Update UI
        updateUI();
        
        // Hide modal
        hideProviderImportModal();
        
        // Show success message
        const message = i18n('providerImport_completed') + '\n' +
                       i18n('providerImport_importedCount', importedCount) + '\n' +
                       i18n('providerImport_overwrittenCount', overwrittenCount) + '\n' +
                       i18n('providerImport_skippedCount', skippedCount);
        
        alert(message);
        
    } catch (error) {
        console.error('Error importing providers:', error);
        alert(i18n('providerImport_failed', error.message));
    } finally {
        if (importConfirmBtn) {
            importConfirmBtn.disabled = false;
            importConfirmBtn.textContent = i18n('providerImport_import');
        }
    }
}

/**
 * Show provider import error
 */
function showProviderImportError(message) {
    const providerGrid = document.getElementById('provider-grid');
    if (providerGrid) {
        setHTMLContent(providerGrid, `
            <div class="provider-error">
                <span>${escapeHtml(message)}</span>
            </div>
        `);
    }
}

/**
 * Setup FAQ functionality
 */
function setupFAQ() {
    if (!faqBtn || !faqModal) {
        return;
    }
    
    // FAQ button click
    faqBtn.addEventListener('click', showFAQModal);
    
    // FAQ modal close buttons
    const faqCloseBtn = document.getElementById('faq-close-btn');
    const faqModalClose = document.getElementById('faq-modal-close');
    
    if (faqCloseBtn) {
        faqCloseBtn.addEventListener('click', hideFAQModal);
    }
    
    if (faqModalClose) {
        faqModalClose.addEventListener('click', hideFAQModal);
    }
    
    // Close FAQ modal on background click
    faqModal.addEventListener('click', function(e) {
        if (e.target === faqModal) {
            hideFAQModal();
        }
    });
    
    // Setup FAQ accordion functionality
    setupFAQAccordion();
    
    // Close FAQ modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && faqModal && faqModal.classList.contains('show')) {
            hideFAQModal();
        }
    });
}

/**
 * Setup FAQ accordion functionality
 */
function setupFAQAccordion() {
    const faqQuestions = document.querySelectorAll('.faq-question');
    
    faqQuestions.forEach(question => {
        // Replace any existing FAQ question icons with the new SVG
        const existingIcon = question.querySelector('.faq-question-icon');
        if (existingIcon) {
            existingIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M480-360 280-560h400L480-360Z"/></svg>';
        }
        
        question.addEventListener('click', function() {
            const faqItem = this.closest('.faq-item');
            const answer = faqItem.querySelector('.faq-answer');
            const icon = this.querySelector('.faq-question-icon');
            
            // Toggle active state
            const isActive = this.classList.contains('active');
            
            if (isActive) {
                // Close this item
                this.classList.remove('active');
                answer.classList.remove('active');
            } else {
                // Open this item
                this.classList.add('active');
                answer.classList.add('active');
            }
            
            // Animate icon rotation
            if (icon) {
                icon.style.transform = isActive ? 'rotate(0deg)' : 'rotate(180deg)';
            }
        });
    });
}

/**
 * Show FAQ modal
 */
function showFAQModal() {
    if (!faqModal) return;
    
    faqModal.classList.add('show');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
    
    // Focus management for accessibility
    const firstFocusable = faqModal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (firstFocusable) {
        firstFocusable.focus();
    }
}

/**
 * Hide FAQ modal
 */
function hideFAQModal() {
    if (!faqModal) return;
    
    faqModal.classList.remove('show');
    document.body.style.overflow = ''; // Restore background scrolling
    
    // Return focus to FAQ button
    if (faqBtn) {
        faqBtn.focus();
    }
}

// ============================================================================
// MAIN EDITOR FUNCTIONALITY
// ============================================================================

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // Provider management - with null checks
    const addProviderBtn = document.getElementById('add-provider-btn');
    if (addProviderBtn) {
        addProviderBtn.addEventListener('click', showAddProviderModal);
    }

    // Note: create-first-provider is created dynamically, so we'll handle it in showEmptyState()
    
    // Modal controls - with null checks
    const modalClose = document.getElementById('modal-close');
    const modalCancel = document.getElementById('modal-cancel');
    
    if (modalClose) {
        modalClose.addEventListener('click', hideProviderModal);
    }
    if (modalCancel) {
        modalCancel.addEventListener('click', hideProviderModal);
    }
    if (providerForm) {
        providerForm.addEventListener('submit', handleProviderSubmit);
    }
    
    // Editor controls - with null checks
    if (saveBtn) {
        saveBtn.addEventListener('click', saveCurrentProvider);
    }
    if (deleteBtn) {
        deleteBtn.addEventListener('click', deleteCurrentProvider);
    }
    if (exitBtn) {
        exitBtn.addEventListener('click', exitEditor);
    }
    
    // Import/Export - with null checks
    const importRulesBtn = document.getElementById('import-rules-btn');
    const exportRulesBtn = document.getElementById('export-rules-btn');
    
    if (importRulesBtn && importFileInput) {
        importRulesBtn.addEventListener('click', () => importFileInput.click());
    }
    if (exportRulesBtn) {
        exportRulesBtn.addEventListener('click', exportCustomRules);
    }
    if (importFileInput) {
        importFileInput.addEventListener('change', handleFileImport);
    }
    
    // Enforce rules button - with null checks
    const enforceRulesBtn = document.getElementById('enforce-rules-btn');
    if (enforceRulesBtn) {
        enforceRulesBtn.addEventListener('click', enforceRules);
    }
    
    // Close modal on background click - with null checks
    if (providerModal) {
        providerModal.addEventListener('click', function(e) {
            if (e.target === providerModal) {
                hideProviderModal();
            }
        });
    }
        
    // Warn before leaving with unsaved changes
    window.addEventListener('beforeunload', function(e) {
        if (hasUnsavedChanges) {
            e.preventDefault();
            e.returnValue = '';
            return '';
        }
    });
}

/**
 * Exit the current editor session
 */
function exitEditor() {
    if (hasUnsavedChanges) {
        if (!confirm(i18n('customRulesEditor_unsavedChanges'))) {
            return;
        }
    }
    
    currentProvider = null;
    isEditing = false;
    hasUnsavedChanges = false;
    
    updateProviderList(); // Remove active state from all providers
    showEmptyState();
}

/**
 * Enforce rules by reloading the extension
 */
async function enforceRules() {
    try {
        await browser.runtime.sendMessage({
            function: "reload",
            params: []
        });
        
        // Show success feedback
        const enforceBtn = document.getElementById('enforce-rules-btn');
        const originalContent = enforceBtn.innerHTML;
        
        setHTMLContent(enforceBtn, `
            <svg width="14" height="14" viewBox="0 -960 960 960" fill="currentColor">
                <path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/>
            </svg>
            <span>${i18n('customRulesEditor_enforceSuccess')}</span>
        `);
        enforceBtn.classList.remove('btn-info');
        enforceBtn.classList.add('btn-success');
        
        // Reset after 2 seconds
        setTimeout(() => {
            setHTMLContent(enforceBtn, originalContent);
            enforceBtn.classList.remove('btn-success');
            enforceBtn.classList.add('btn-info');
        }, 2000);
        
    } catch (error) {
        // Show error feedback
        const enforceBtn = document.getElementById('enforce-rules-btn');
        const originalContent = enforceBtn.innerHTML;
        
        setHTMLContent(enforceBtn, `
            <svg width="14" height="14" viewBox="0 -960 960 960" fill="currentColor">
                <path d="m40-120 440-760 440 760H40Zm138-80h604L480-720 178-200Zm302-40q17 0 28.5-11.5T520-280q0-17-11.5-28.5T480-320q-17 0-28.5 11.5T440-280q0 17 11.5 28.5T480-240Zm-40-120h80v-200h-80v200Zm40-100Z"/>
            </svg>
            <span>${i18n('customRulesEditor_enforceError')}</span>
        `);
        enforceBtn.classList.remove('btn-info');
        enforceBtn.classList.add('btn-danger');
        
        // Reset after 3 seconds
        setTimeout(() => {
            setHTMLContent(enforceBtn, originalContent);
            enforceBtn.classList.remove('btn-danger');
            enforceBtn.classList.add('btn-info');
        }, 3000);
    }
}

/**
 * Load custom rules from storage
 */
async function loadCustomRules() {
    try {
        const response = await browser.runtime.sendMessage({
            function: "getData",
            params: ['custom_rules']
        });
        
        if (response && response.response) {
            if (typeof response.response === 'string') {
                const data = JSON.parse(response.response);
                customRules = data.providers ? data : { providers: {} };
            } else {
                customRules = response.response.providers ? response.response : { providers: {} };
            }
        } else {
            customRules = { providers: {} };
        }
        
        updateUI();
    } catch (error) {
        customRules = { providers: {} };
        updateUI();
    }
}

/**
 * Save custom rules to storage
 */
async function saveCustomRules() {
    try {
        await browser.runtime.sendMessage({
            function: "setData",
            params: ['custom_rules', JSON.stringify(customRules)]
        });
        
        hasUnsavedChanges = false;
        updateEditorStatus('saved', i18n('status_saved'));
        
        // Notify the background script to reload and re-merge rules
        try {
            await browser.runtime.sendMessage({
                function: "reloadCustomRules"
            });
            
            // Update the rules status display after successful reload
            setTimeout(() => {
                updateRulesStatus();
            }, 500);
            
        } catch (error) {
            // Background script may not support this
        }
        
    } catch (error) {
        updateEditorStatus('error', i18n('status_saveFailed'));
    }
}

/**
 * Update the entire UI
 */
function updateUI() {
    updateProviderList();
    updateProviderCount();
    updateRulesStatus();
    
    if (!currentProvider) {
        showEmptyState();
    }
}

/**
 * Update rules status display with localized numbers
 */
async function updateRulesStatus() {
    try {
        const response = await browser.runtime.sendMessage({
            function: "getCustomRulesStats"
        });
        
        if (response && response.response) {
            const stats = response.response;
            
            // Use localized numbers for display
            const customCountElement = document.getElementById('custom-count');
            const builtinCountElement = document.getElementById('builtin-count');
            const totalCountElement = document.getElementById('total-count');
            
            if (customCountElement) {
                customCountElement.textContent = getLocalizedNumber(stats.customProviders || 0);
            }
            if (builtinCountElement) {
                builtinCountElement.textContent = getLocalizedNumber(stats.builtInProviders || 0);
            }
            if (totalCountElement) {
                totalCountElement.textContent = getLocalizedNumber(stats.totalProviders || 0);
            }
            
            const statusMap = {
                'remote_verified': i18n('hashStatus_remote_verified'),
                'remote_failed': i18n('hashStatus_remote_failed'),
                'hash_url_missing': i18n('hashStatus_hash_url_missing'),
                'remote_rules_loaded': i18n('remote_rules_loaded'),
                'remote_custom_rules_merged': i18n('hash_status_remote_custom_merged'),
                'bundled_rules_loaded': i18n('status_builtinOnly'),
                'bundled_rules_fallback': i18n('hashStatus_bundled_rules_fallback'),
                'bundled_fallback_loaded': i18n('hashStatus_bundled_fallback_loaded'),
                'fallback_rules_used': i18n('status_usingFallback'),
                'fallback_rules_used_after_remote_failure': i18n('hashStatus_fallback_rules_used_after_remote_failure'),
                'fallback_rules_loaded': i18n('fallback_rules_loaded'),
                'cached_rules_used': i18n('status_usingCached'),
                'cache_remote_rules_no_hashurl': i18n('hashStatus_cache_remote_rules_no_hashurl'),
                'cache_remote_rules_after_remote_failure': i18n('hashStatus_cache_remote_rules_after_remote_failure'),
                'cache_remote_rules_after_bundled_failure': i18n('hashStatus_cache_remote_rules_after_bundled_failure'),
                'cache_remote_custom_rules_no_hashurl': i18n('hashStatus_cache_remote_custom_rules_no_hashurl'),
                'cache_remote_custom_rules_after_remote_failure': i18n('hashStatus_cache_remote_custom_rules_after_remote_failure'),
                'cache_remote_custom_rules_after_bundled_failure': i18n('hashStatus_cache_remote_custom_rules_after_bundled_failure'),
                'custom_rules_merged': i18n('status_customMerged'),
                'custom_rules_failed': i18n('status_customFailed')
            };
            
            const statusText = statusMap[stats.hashStatus] || stats.hashStatus || i18n('status_unknown');
            const mergeStatusElement = document.getElementById('merge-status');
            if (mergeStatusElement) {
                mergeStatusElement.textContent = statusText;
            }
        }
    } catch (error) {
        // Set fallback values with localized question marks
        const fallbackText = getLocalizedNumber(0); // This will show localized zero or fallback
        
        const customCountElement = document.getElementById('custom-count');
        const builtinCountElement = document.getElementById('builtin-count');
        const totalCountElement = document.getElementById('total-count');
        const mergeStatusElement = document.getElementById('merge-status');
        
        if (customCountElement) customCountElement.textContent = '?';
        if (builtinCountElement) builtinCountElement.textContent = '?';
        if (totalCountElement) totalCountElement.textContent = '?';
        if (mergeStatusElement) mergeStatusElement.textContent = i18n('status_unavailable');
    }
}

/**
 * Update the provider list in sidebar
 */
function updateProviderList() {
    if (!providerList) return;
    
    const providers = Object.keys(customRules.providers);
    providerList.replaceChildren();
    
    providers.forEach(providerName => {
        const listItem = createProviderListItem(providerName);
        if (listItem) {
            providerList.appendChild(listItem);
        }
    });
}

/**
 * Create a provider list item element
 */
function createProviderListItem(providerName) {
    try {
        const li = document.createElement('li');
        li.className = 'provider-item';
        li.dataset.provider = providerName;
        
        if (currentProvider === providerName) {
            li.classList.add('active');
        }
        
        setHTMLContent(li, `
            <span class="provider-name" title="${escapeHtml(providerName)}">${escapeHtml(providerName)}</span>
            <div class="provider-actions">
                <button class="provider-action-btn edit-provider-btn" data-provider="${escapeHtml(providerName)}" title="${i18n('customRulesEditor_editName')}">
                    <svg width="12" height="12" viewBox="0 -960 960 960" fill="currentColor">
                        <path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/>
                    </svg>
                </button>
                <button class="provider-action-btn duplicate-provider-btn" data-provider="${escapeHtml(providerName)}" title="${i18n('customRulesEditor_duplicate')}">
                    <svg width="12" height="12" viewBox="0 -960 960 960" fill="currentColor">
                        <path d="M120-220v-80h80v80h-80Zm0-140v-80h80v80h-80Zm0-140v-80h80v80h-80ZM260-80v-80h80v80h-80Zm100-160q-33 0-56.5-23.5T280-320v-480q0-33 23.5-56.5T360-880h360q33 0 56.5 23.5T800-800v480q0 33-23.5 56.5T720-240H360Zm0-80h360v-480H360v480Zm40 240v-80h80v80h-80Zm-200 0q-33 0-56.5-23.5T120-160h80v80Zm340 0v-80h80q0 33-23.5 56.5T540-80ZM120-640q0-33 23.5-56.5T200-720v80h-80Zm420 80Z"/>
                    </svg>
                </button>
            </div>
        `);
        
        // Add event listeners
        li.addEventListener('click', (e) => {
            // Don't select if clicking on action buttons
            if (!e.target.closest('.provider-actions')) {
                selectProvider(providerName);
            }
        });
        
        // Edit button
        const editBtn = li.querySelector('.edit-provider-btn');
        if (editBtn) {
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                editProviderName(providerName);
            });
        }
        
        // Duplicate button
        const duplicateBtn = li.querySelector('.duplicate-provider-btn');
        if (duplicateBtn) {
            duplicateBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                duplicateProvider(providerName);
            });
        }
        
        return li;
    } catch (error) {
        console.error('Error creating provider list item:', error);
        return null;
    }
}

/**
 * Update provider count display with localized numbers
 */
function updateProviderCount() {
    const count = Object.keys(customRules.providers).length;
    const countElement = document.getElementById('provider-count');
    
    if (countElement) {
        // Use localized number for display
        countElement.textContent = getLocalizedNumber(count);
        countElement.className = `status-indicator ${count > 0 ? 'status-valid' : 'status-invalid'}`;
    }
}

/**
 * Select and display a provider for editing
 */
function selectProvider(providerName) {
    if (hasUnsavedChanges) {
        if (!confirm(i18n('customRulesEditor_unsavedChanges'))) {
            return;
        }
    }
    
    currentProvider = providerName;
    isEditing = true;
    hasUnsavedChanges = false;
    
    updateProviderList(); // Update active state
    showProviderEditor();
}

/**
 * Show the provider editor interface
 */
function showProviderEditor() {
    if (!currentProvider || !customRules.providers[currentProvider]) {
        showEmptyState();
        return;
    }
    
    const provider = customRules.providers[currentProvider];
    
    if (editorTitle) {
        editorTitle.textContent = i18n('customRulesEditor_editing', currentProvider);
    }
    if (editorStatus) {
        editorStatus.style.display = 'inline-flex';
    }
    if (saveBtn) {
        saveBtn.style.display = 'inline-flex';
    }
    if (deleteBtn) {
        deleteBtn.style.display = 'inline-flex';
    }
    if (exitBtn) {
        exitBtn.style.display = 'inline-flex';
    }
    
    if (editorContent) {
        setHTMLContent(editorContent, createProviderEditorHTML(provider));
        setupProviderEditorEvents();
        updateEditorStatus('valid', i18n('status_validJson'));
    }
}

/**
 * Create the HTML for provider editor
 */
function createProviderEditorHTML(provider) {
    return `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <!-- Basic Settings -->
            <div>
                <h4 style="margin: 0 0 16px 0; color: var(--text-primary); font-size: 14px;">${i18n('customRulesEditor_basicSettings')}</h4>
                
                <div class="form-group">
                    <label class="form-label">${i18n('customRulesEditor_urlPattern')} *</label>
                    <input type="text" class="form-input" id="edit-url-pattern" value="${escapeHtml(provider.urlPattern || '')}" placeholder="${i18n('customRulesEditor_urlPatternPlaceholder') || '^https?:\\/\\/(?:[a-z0-9-]+\\.)*?example\\.com'}">
                    <div class="form-help">${i18n('customRulesEditor_urlPatternHelp')}</div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">${i18n('customRulesEditor_domainPatterns')}</label>
                    <textarea class="form-input" id="edit-domain-patterns" placeholder="||example.com^&#10;||*.example.com^&#10;||another-site.com^&#10;||subdomain.example.com^" rows="5">${escapeHtml((provider.domainPatterns || []).join('\n'))}</textarea>
                    <div class="form-help">${i18n('customRulesEditor_domainPatternsHelp')}</div>
                </div>
                
                <div class="form-checkbox">
                    <input type="checkbox" id="edit-complete-provider" ${provider.completeProvider ? 'checked' : ''}>
                    <label for="edit-complete-provider">${i18n('customRulesEditor_completeProvider')}</label>
                </div>
                
                <div class="form-checkbox">
                    <input type="checkbox" id="edit-force-redirection" ${provider.forceRedirection ? 'checked' : ''}>
                    <label for="edit-force-redirection">${i18n('customRulesEditor_forceRedirection')}</label>
                </div>
            </div>
            
            <!-- Advanced Settings -->
            <div>
                <h4 style="margin: 0 0 16px 0; color: var(--text-primary); font-size: 14px;">${i18n('customRulesEditor_advancedSettings')}</h4>
                
                <!-- Rules Array -->
                <div class="form-group">
                    <label class="form-label">${i18n('customRulesEditor_rules')}</label>
                    <div class="array-editor">
                        <div class="array-header">
                            <span class="array-title">${i18n('customRulesEditor_parameterPatterns')}</span>
                            <button type="button" class="array-add-btn" data-array="rules">${i18n('button_add')}</button>
                        </div>
                        <div class="array-items" id="rules-array">
                            ${createArrayItemsHTML(provider.rules || [], 'rules')}
                        </div>
                    </div>
                </div>
                
                <!-- Referral Marketing Array -->
                <div class="form-group">
                    <label class="form-label">${i18n('customRulesEditor_referralMarketing')}</label>
                    <div class="array-editor">
                        <div class="array-header">
                            <span class="array-title">${i18n('customRulesEditor_referralParameters')}</span>
                            <button type="button" class="array-add-btn" data-array="referralMarketing">${i18n('button_add')}</button>
                        </div>
                        <div class="array-items" id="referralMarketing-array">
                            ${createArrayItemsHTML(provider.referralMarketing || [], 'referralMarketing')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div style="margin-top: 24px;">
            <!-- Raw Rules Array -->
            <div class="form-group">
                <label class="form-label">${i18n('customRulesEditor_rawRules')}</label>
                <div class="array-editor">
                    <div class="array-header">
                        <span class="array-title">${i18n('customRulesEditor_rawRegexPatterns')}</span>
                        <button type="button" class="array-add-btn" data-array="rawRules">${i18n('button_add')}</button>
                    </div>
                    <div class="array-items" id="rawRules-array">
                        ${createArrayItemsHTML(provider.rawRules || [], 'rawRules')}
                    </div>
                </div>
            </div>
            
            <!-- Exceptions Array -->
            <div class="form-group">
                <label class="form-label">${i18n('customRulesEditor_exceptions')}</label>
                <div class="array-editor">
                    <div class="array-header">
                        <span class="array-title">${i18n('customRulesEditor_exceptionPatterns')}</span>
                        <button type="button" class="array-add-btn" data-array="exceptions">${i18n('button_add')}</button>
                    </div>
                    <div class="array-items" id="exceptions-array">
                        ${createArrayItemsHTML(provider.exceptions || [], 'exceptions')}
                    </div>
                </div>
            </div>
            
            <!-- Domain Exceptions Array -->
            <div class="form-group">
                <label class="form-label">${i18n('customRulesEditor_domainExceptions')}</label>
                <textarea class="form-input" id="edit-domain-exceptions" placeholder="||example.com^&#10;||*.subdomain.com^&#10;||exception-site.com^" rows="4">${escapeHtml((provider.domainExceptions || []).join('\n'))}</textarea>
                <div class="form-help">${i18n('customRulesEditor_domainExceptionsHelp')}</div>
            </div>
            
            <!-- Redirections Array -->
            <div class="form-group">
                <label class="form-label">${i18n('customRulesEditor_redirections')}</label>
                <div class="array-editor">
                    <div class="array-header">
                        <span class="array-title">${i18n('customRulesEditor_redirectPatterns')}</span>
                        <button type="button" class="array-add-btn" data-array="redirections">${i18n('button_add')}</button>
                    </div>
                    <div class="array-items" id="redirections-array">
                        ${createArrayItemsHTML(provider.redirections || [], 'redirections')}
                    </div>
                </div>
            </div>
            
            <!-- Domain Redirections Array -->
            <div class="form-group">
                <label class="form-label">${i18n('customRulesEditor_domainRedirections')}</label>
                <textarea class="form-input" id="edit-domain-redirections" placeholder="||example.com$redirect=https://newsite.com&#10;||old-site.com$redirect=https://replacement.com&#10;||redirect-me.com$redirect=https://new-url.com" rows="4">${escapeHtml((provider.domainRedirections || []).join('\n'))}</textarea>
                <div class="form-help">${i18n('customRulesEditor_domainRedirectionsHelp')}</div>
            </div>
            
            <!-- Resource Types -->
            <div class="form-group">
                <label class="form-label">${i18n('customRulesEditor_resourceTypes')}</label>
                <textarea class="form-input" id="edit-resource-types" placeholder="${i18n('customRulesEditor_resourceTypesPlaceholder')}" rows="3">${escapeHtml((provider.resourceTypes || []).join('\n'))}</textarea>
                <div class="form-help">${i18n('customRulesEditor_resourceTypesHelp')}</div>
            </div>
            
            <!-- HTTP Methods -->
            <div class="form-group">
                <label class="form-label">${i18n('customRulesEditor_httpMethods')}</label>
                <textarea class="form-input" id="edit-http-methods" placeholder="${i18n('customRulesEditor_httpMethodsPlaceholder')}" rows="3">${escapeHtml((provider.methods || []).join('\n'))}</textarea>
                <div class="form-help">${i18n('customRulesEditor_httpMethodsHelp')}</div>
            </div>
        </div>
        
        <!-- JSON Editor -->
        <div class="form-group" style="margin-top: 24px;">
            <div class="json-editor">
                <div class="json-editor-header">
                    <span class="json-editor-title">${i18n('customRulesEditor_advancedJsonEditor')}</span>
                    <button type="button" class="btn btn-warning btn-sm" id="sync-from-form-btn">${i18n('customRulesEditor_updateFromForm')}</button>
                </div>
                <div class="json-editor-content">
                    <textarea class="json-editor-textarea" id="json-editor" placeholder="${i18n('customRulesEditor_jsonPlaceholder')}">${JSON.stringify(provider, null, 2)}</textarea>
                    <div id="json-validation" style="display: none;"></div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Create HTML for array items
 */
function createArrayItemsHTML(items, arrayName) {
    if (!items || items.length === 0) {
        return `<div class="array-item array-empty" style="text-align: center; color: var(--text-muted); font-style: italic; padding: 16px;">${i18n('customRulesEditor_noItems')}</div>`;
    }
    
    return items.map((item, index) => `
        <div class="array-item">
            <input type="text" class="array-item-input" value="${escapeHtml(item)}" data-array="${arrayName}" data-index="${index}">
            <button type="button" class="array-item-remove" data-array="${arrayName}" data-index="${index}">${i18n('button_remove')}</button>
        </div>
    `).join('');
}

/**
 * Setup event listeners for provider editor
 */
function setupProviderEditorEvents() {
    // Form inputs change detection
    const inputs = editorContent.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            hasUnsavedChanges = true;
            updateEditorStatus('unsaved', i18n('status_unsavedChanges'));
        });
    });
    
    // Setup mutual exclusivity between urlPattern and domainPatterns
    setupMutualExclusivity();
    
    // JSON editor with validation
    const jsonEditor = document.getElementById('json-editor');
    if (jsonEditor) {
        jsonEditor.addEventListener('input', validateAndUpdateJSON);
    }
    
    // Sync from form button
    const syncBtn = document.getElementById('sync-from-form-btn');
    if (syncBtn) {
        syncBtn.addEventListener('click', syncFromForm);
    }
    
    // Array editor event delegation
    editorContent.addEventListener('click', handleArrayEditorClick);
    editorContent.addEventListener('input', handleArrayEditorInput);
}

/**
 * Setup mutual exclusivity between urlPattern and domainPatterns
 */
function setupMutualExclusivity() {
    const urlPatternInput = document.getElementById('edit-url-pattern');
    const domainPatternsInput = document.getElementById('edit-domain-patterns');
    
    if (!urlPatternInput || !domainPatternsInput) return;
    
    // Disable urlPattern when domainPatterns has content
    function updateUrlPatternState() {
        const hasDomainPatterns = domainPatternsInput.value.trim() !== '';
        
        if (hasDomainPatterns) {
            urlPatternInput.disabled = true;
            urlPatternInput.style.opacity = '0.5';
            urlPatternInput.title = i18n('customRulesEditor_urlPatternDisabledTooltip') || 'URL Pattern is disabled when Domain Patterns are used';
        } else {
            urlPatternInput.disabled = false;
            urlPatternInput.style.opacity = '1';
            urlPatternInput.title = '';
        }
    }
    
    // Disable domainPatterns when urlPattern has content
    function updateDomainPatternsState() {
        const hasUrlPattern = urlPatternInput.value.trim() !== '';
        
        if (hasUrlPattern) {
            domainPatternsInput.disabled = true;
            domainPatternsInput.style.opacity = '0.5';
            domainPatternsInput.title = i18n('customRulesEditor_domainPatternsDisabledTooltip') || 'Domain Patterns are disabled when URL Pattern is used';
        } else {
            domainPatternsInput.disabled = false;
            domainPatternsInput.style.opacity = '1';
            domainPatternsInput.title = '';
        }
    }
    
    // Initial state update
    updateUrlPatternState();
    updateDomainPatternsState();
    
    // Listen for urlPattern changes
    urlPatternInput.addEventListener('input', updateDomainPatternsState);
    
    // Listen for domainPatterns changes
    domainPatternsInput.addEventListener('input', updateUrlPatternState);
}

/**
 * Handle clicks in array editors
 */
function handleArrayEditorClick(e) {
    if (e.target.classList.contains('array-add-btn')) {
        const arrayName = e.target.dataset.array;
        if (arrayName) {
            addArrayItem(arrayName);
        }
    } else if (e.target.classList.contains('array-item-remove')) {
        const arrayName = e.target.dataset.array;
        const index = parseInt(e.target.dataset.index);
        if (arrayName && !isNaN(index)) {
            removeArrayItem(arrayName, index);
        }
    }
}

/**
 * Handle input events in array editors
 */
function handleArrayEditorInput(e) {
    if (e.target.classList.contains('array-item-input')) {
        updateArrayItem(e.target);
    }
}

/**
 * Validate and update JSON in real-time
 */
function validateAndUpdateJSON() {
    const jsonEditor = document.getElementById('json-editor');
    const validation = document.getElementById('json-validation');
    
    try {
        const parsed = JSON.parse(jsonEditor.value);
        validation.style.display = 'none';
        hasUnsavedChanges = true;
        updateEditorStatus('valid', i18n('status_validJsonUnsaved'));
    } catch (error) {
        validation.style.display = 'block';
        validation.className = 'json-editor-error';
        validation.textContent = i18n('customRulesEditor_jsonError', error.message);
        updateEditorStatus('invalid', i18n('status_invalidJson'));
    }
}

/**
 * Sync JSON editor from form data
 */
function syncFromForm() {
    if (!currentProvider) return;
    
    const provider = gatherFormData();
    const jsonEditor = document.getElementById('json-editor');
    jsonEditor.value = JSON.stringify(provider, null, 2);
    validateAndUpdateJSON();
}


/**
 * Gather form data into provider object
 */
function gatherFormData() {
    const urlPattern = document.getElementById('edit-url-pattern')?.value || '';
    const domainPatternsText = document.getElementById('edit-domain-patterns')?.value || '';
    const domainPatterns = domainPatternsText.split('\n').map(p => p.trim()).filter(p => p !== '');
    const domainExceptionsText = document.getElementById('edit-domain-exceptions')?.value || '';
    const domainExceptions = domainExceptionsText.split('\n').map(p => p.trim()).filter(p => p !== '');
    const domainRedirectionsText = document.getElementById('edit-domain-redirections')?.value || '';
    const domainRedirections = domainRedirectionsText.split('\n').map(p => p.trim()).filter(p => p !== '');
    const resourceTypesText = document.getElementById('edit-resource-types')?.value || '';
    const resourceTypes = resourceTypesText.split('\n').map(p => p.trim()).filter(p => p !== '');
    const httpMethodsText = document.getElementById('edit-http-methods')?.value || '';
    const httpMethods = httpMethodsText.split('\n').map(p => p.trim()).filter(p => p !== '');
    const completeProvider = document.getElementById('edit-complete-provider')?.checked || false;
    const forceRedirection = document.getElementById('edit-force-redirection')?.checked || false;
    
    const provider = {
        completeProvider,
        rules: gatherArrayData('rules'),
        referralMarketing: gatherArrayData('referralMarketing'),
        rawRules: gatherArrayData('rawRules'),
        exceptions: gatherArrayData('exceptions'),
        domainExceptions: domainExceptions,
        redirections: gatherArrayData('redirections'),
        domainRedirections: domainRedirections,
        forceRedirection
    };
    
    // Add resourceTypes if specified
    if (resourceTypes.length > 0) {
        provider.resourceTypes = resourceTypes;
    }
    
    // Add methods if specified
    if (httpMethods.length > 0) {
        provider.methods = httpMethods;
    }
    
    // Add either urlPattern or domainPatterns, but not both
    if (domainPatterns.length > 0) {
        provider.domainPatterns = domainPatterns;
    } else if (urlPattern.trim()) {
        provider.urlPattern = urlPattern;
    }
    
    return provider;
}

/**
 * Gather array data from form
 */
function gatherArrayData(arrayName) {
    const container = document.getElementById(`${arrayName}-array`);
    if (!container) return [];
    
    const inputs = container.querySelectorAll('.array-item-input');
    return Array.from(inputs)
        .map(input => input.value.trim())
        .filter(value => value !== '');
}

/**
 * Add new item to array
 */
function addArrayItem(arrayName) {
    const container = document.getElementById(`${arrayName}-array`);
    if (!container) return;
    
    // Remove "No items" placeholder if exists
    const placeholder = container.querySelector('.array-empty');
    if (placeholder) {
        placeholder.remove();
    }
    
    const index = container.children.length;
    const itemDiv = document.createElement('div');
    itemDiv.className = 'array-item';
    setHTMLContent(itemDiv, `
        <input type="text" class="array-item-input" value="" data-array="${arrayName}" data-index="${index}" placeholder="${i18n('customRulesEditor_enterPattern', arrayName)}">
        <button type="button" class="array-item-remove" data-array="${arrayName}" data-index="${index}">${i18n('button_remove')}</button>
    `);
    
    container.appendChild(itemDiv);
    hasUnsavedChanges = true;
    updateEditorStatus('unsaved', i18n('status_unsavedChanges'));
    
    // Focus the new input
    const newInput = itemDiv.querySelector('.array-item-input');
    newInput.focus();
    
    // Update indices for all items in this array
    updateArrayIndices(arrayName);
}

/**
 * Remove item from array
 */
function removeArrayItem(arrayName, index) {
    const container = document.getElementById(`${arrayName}-array`);
    if (!container) return;
    
    const items = container.querySelectorAll('.array-item');
    if (items[index]) {
        items[index].remove();
        hasUnsavedChanges = true;
        updateEditorStatus('unsaved', i18n('status_unsavedChanges'));
        
        // Update indices for remaining items
        updateArrayIndices(arrayName);
        
        // Add placeholder if no items left
        if (container.children.length === 0) {
            setHTMLContent(container, `<div class="array-item array-empty" style="text-align: center; color: var(--text-muted); font-style: italic; padding: 16px;">${i18n('customRulesEditor_noItems')}</div>`);
        }
    }
}

/**
 * Update array item value
 */
function updateArrayItem(input) {
    hasUnsavedChanges = true;
    updateEditorStatus('unsaved', i18n('status_unsavedChanges'));
}

/**
 * Update array indices after removal or addition
 */
function updateArrayIndices(arrayName) {
    const container = document.getElementById(`${arrayName}-array`);
    if (!container) return;
    
    const items = container.querySelectorAll('.array-item:not(.array-empty)');
    
    items.forEach((item, index) => {
        const input = item.querySelector('.array-item-input');
        const removeButton = item.querySelector('.array-item-remove');
        
        if (input) {
            input.dataset.index = index;
        }
        if (removeButton) {
            removeButton.dataset.index = index;
        }
    });
}

/**
 * Save current provider (modified to update form first)
 */
async function saveCurrentProvider() {
    if (!currentProvider) return;
    
    try {
        // First, sync form data to JSON editor to ensure everything is up to date
        syncFromForm();
        
        let provider;
        
        // Try to get data from JSON editor first
        const jsonEditor = document.getElementById('json-editor');
        if (jsonEditor && jsonEditor.value.trim()) {
            try {
                provider = JSON.parse(jsonEditor.value);
            } catch (error) {
                // Fall back to form data if JSON is invalid
                provider = gatherFormData();
            }
        } else {
            provider = gatherFormData();
        }
        
        // Validate required fields - either urlPattern or domainPatterns must be present
        if ((!provider.urlPattern || provider.urlPattern.trim() === '') && 
            (!provider.domainPatterns || provider.domainPatterns.length === 0)) {
            alert(i18n('customRulesEditor_urlPatternOrDomainPatternsRequired') || 'Either URL Pattern or Domain Patterns is required');
            return;
        }
        
        // Validate mutual exclusivity
        if (provider.urlPattern && provider.urlPattern.trim() !== '' && 
            provider.domainPatterns && provider.domainPatterns.length > 0) {
            alert(i18n('customRulesEditor_urlPatternAndDomainPatternsExclusive') || 'URL Pattern and Domain Patterns cannot be used together');
            return;
        }
        
        // Validate URL pattern as regex if present
        if (provider.urlPattern && provider.urlPattern.trim() !== '') {
            try {
                new RegExp(provider.urlPattern);
            } catch (error) {
                alert(i18n('customRulesEditor_invalidUrlPattern', error.message));
                return;
            }
        }
        
        // Validate domain patterns format if present
        if (provider.domainPatterns && provider.domainPatterns.length > 0) {
            for (const pattern of provider.domainPatterns) {
                if (!pattern || pattern.trim() === '') {
                    alert(i18n('customRulesEditor_emptyDomainPattern') || 'Domain patterns cannot be empty');
                    return;
                }
                // Basic validation for domain pattern format
                if (!pattern.includes('.') && !pattern.startsWith('||') && !pattern.includes('*')) {
                    alert(i18n('customRulesEditor_invalidDomainPattern', pattern) || `Invalid domain pattern: ${pattern}`);
                    return;
                }
            }
        }
        
        customRules.providers[currentProvider] = provider;
        await saveCustomRules();
        
    } catch (error) {
        updateEditorStatus('error', i18n('status_saveFailed'));
    }
}

/**
 * Delete current provider
 */
async function deleteCurrentProvider() {
    if (!currentProvider) return;
    
    if (!confirm(i18n('customRulesEditor_confirmDelete', currentProvider))) {
        return;
    }
    
    try {
        delete customRules.providers[currentProvider];
        await saveCustomRules();
        
        currentProvider = null;
        isEditing = false;
        hasUnsavedChanges = false;
        
        updateUI();
        showEmptyState();
        
    } catch (error) {
        updateEditorStatus('error', i18n('status_deleteFailed'));
    }
}

/**
 * Show empty state
 */
function showEmptyState() {
    if (!editorTitle) return;
    
    editorTitle.textContent = i18n('customRulesEditor_selectProvider');
    
    if (editorStatus) editorStatus.style.display = 'none';
    if (saveBtn) saveBtn.style.display = 'none';
    if (deleteBtn) deleteBtn.style.display = 'none';
    if (exitBtn) exitBtn.style.display = 'none';
    
    const hasProviders = Object.keys(customRules.providers).length > 0;
    
    if (editorContent) {
        setHTMLContent(editorContent, `
            <div class="empty-state">
                <h3>${hasProviders ? i18n('customRulesEditor_selectProviderTitle') : i18n('customRulesEditor_welcome')}</h3>
                <p>${hasProviders ? i18n('customRulesEditor_selectProviderDescription') : i18n('customRulesEditor_description')}</p>
                <button class="btn btn-primary" id="empty-state-add-btn">
                    <svg width="14" height="14" viewBox="0 -960 960 960" fill="currentColor">
                        <path d="M440-120v-320H120v-80h320v-320h80v320h320v80H520v320h-80Z"/>
                    </svg>
                    ${hasProviders ? i18n('customRulesEditor_addAnother') : i18n('customRulesEditor_createFirst')}
                </button>
            </div>
        `);
        
        // Add event listener for the dynamically created button
        const addBtn = document.getElementById('empty-state-add-btn');
        if (addBtn) {
            addBtn.addEventListener('click', showAddProviderModal);
        }
    }
}

/**
 * Show add/edit provider modal
 */
function showAddProviderModal(editProvider = null) {
    if (!providerModal || !modalTitle || !providerForm) {
        console.error('Provider modal elements not found');
        return;
    }
    
    const isEdit = editProvider !== null;
    
    modalTitle.textContent = isEdit ? i18n('customRulesEditor_editProvider') : i18n('customRulesEditor_addNewProvider');
    
    if (isEdit && customRules.providers[editProvider]) {
        const provider = customRules.providers[editProvider];
        const providerNameInput = document.getElementById('provider-name');
        const urlPatternInput = document.getElementById('url-pattern');
        const domainPatternsInput = document.getElementById('domain-patterns');
        const completeProviderInput = document.getElementById('complete-provider');
        const forceRedirectionInput = document.getElementById('force-redirection');
        const urlPatternRadio = document.getElementById('pattern-type-url');
        const domainPatternsRadio = document.getElementById('pattern-type-domain');
        
        if (providerNameInput) providerNameInput.value = editProvider;
        if (completeProviderInput) completeProviderInput.checked = provider.completeProvider || false;
        if (forceRedirectionInput) forceRedirectionInput.checked = provider.forceRedirection || false;
        
        // Set pattern type and values based on provider data
        if (provider.urlPattern) {
            if (urlPatternRadio) urlPatternRadio.checked = true;
            if (urlPatternInput) urlPatternInput.value = provider.urlPattern;
            if (domainPatternsInput) domainPatternsInput.value = '';
        } else if (provider.domainPatterns && provider.domainPatterns.length > 0) {
            if (domainPatternsRadio) domainPatternsRadio.checked = true;
            if (domainPatternsInput) domainPatternsInput.value = provider.domainPatterns.join('\n');
            if (urlPatternInput) urlPatternInput.value = '';
        } else {
            // Default to URL pattern for new providers
            if (urlPatternRadio) urlPatternRadio.checked = true;
            if (urlPatternInput) urlPatternInput.value = '';
            if (domainPatternsInput) domainPatternsInput.value = '';
        }
        
        updatePatternTypeDisplay();
    } else {
        providerForm.reset();
        // Default to URL pattern for new providers
        const urlPatternRadio = document.getElementById('pattern-type-url');
        if (urlPatternRadio) urlPatternRadio.checked = true;
        updatePatternTypeDisplay();
    }
    
    // Setup pattern type change listeners
    setupPatternTypeListeners();
    
    providerForm.dataset.editProvider = editProvider || '';
    providerModal.classList.add('show');
}

/**
 * Setup pattern type change listeners
 */
function setupPatternTypeListeners() {
    const urlPatternRadio = document.getElementById('pattern-type-url');
    const domainPatternsRadio = document.getElementById('pattern-type-domain');
    
    if (urlPatternRadio) {
        urlPatternRadio.addEventListener('change', updatePatternTypeDisplay);
    }
    if (domainPatternsRadio) {
        domainPatternsRadio.addEventListener('change', updatePatternTypeDisplay);
    }
}

/**
 * Update pattern type display based on radio selection
 */
function updatePatternTypeDisplay() {
    const urlPatternRadio = document.getElementById('pattern-type-url');
    const urlPatternGroup = document.getElementById('url-pattern-group');
    const domainPatternsGroup = document.getElementById('domain-patterns-group');
    
    if (urlPatternRadio && urlPatternRadio.checked) {
        if (urlPatternGroup) urlPatternGroup.style.display = 'block';
        if (domainPatternsGroup) domainPatternsGroup.style.display = 'none';
    } else {
        if (urlPatternGroup) urlPatternGroup.style.display = 'none';
        if (domainPatternsGroup) domainPatternsGroup.style.display = 'block';
    }
}

/**
 * Hide provider modal
 */
function hideProviderModal() {
    if (!providerModal || !providerForm) {
        return;
    }
    
    providerModal.classList.remove('show');
    providerForm.reset();
    delete providerForm.dataset.editProvider;
}

/**
 * Handle provider form submission
 */
async function handleProviderSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(providerForm);
    const providerName = formData.get('provider-name') || document.getElementById('provider-name').value;
    const patternType = formData.get('pattern-type');
    const urlPattern = document.getElementById('url-pattern').value || '';
    const domainPatternsText = document.getElementById('domain-patterns').value || '';
    const domainPatterns = domainPatternsText.split('\n').map(p => p.trim()).filter(p => p !== '');
    const completeProvider = document.getElementById('complete-provider').checked;
    const forceRedirection = document.getElementById('force-redirection').checked;
    
    const editProvider = providerForm.dataset.editProvider;
    const isEdit = editProvider !== '';
    
    // Validation
    if (!providerName) {
        alert(i18n('customRulesEditor_providerNameRequired') || 'Provider name is required');
        return;
    }
    
    // Validate pattern type selection
    if (patternType === 'urlPattern') {
        if (!urlPattern || urlPattern.trim() === '') {
            alert(i18n('customRulesEditor_urlPatternRequired') || 'URL Pattern is required');
            return;
        }
        
        // Validate regex
        try {
            new RegExp(urlPattern);
        } catch (error) {
            alert(i18n('customRulesEditor_invalidUrlPattern', error.message));
            return;
        }
    } else if (patternType === 'domainPatterns') {
        if (domainPatterns.length === 0) {
            alert(i18n('customRulesEditor_domainPatternsRequired') || 'At least one domain pattern is required');
            return;
        }
        
        // Validate domain patterns
        for (const pattern of domainPatterns) {
            if (!pattern.includes('.') && !pattern.startsWith('||') && !pattern.includes('*')) {
                alert(i18n('customRulesEditor_invalidDomainPattern', pattern) || `Invalid domain pattern: ${pattern}`);
                return;
            }
        }
    } else {
        alert(i18n('customRulesEditor_patternTypeRequired') || 'Please select a pattern type');
        return;
    }
    
    // Check for duplicate name (only if not editing the same provider)
    if (!isEdit && customRules.providers[providerName]) {
        alert(i18n('customRulesEditor_providerNameExists'));
        return;
    }
    
    // Create provider object
    const provider = {
        completeProvider,
        rules: [],
        referralMarketing: [],
        rawRules: [],
        exceptions: [],
        domainExceptions: [],
        redirections: [],
        domainRedirections: [],
        forceRedirection
    };
    
    // Add either urlPattern or domainPatterns based on selection
    if (patternType === 'urlPattern') {
        provider.urlPattern = urlPattern;
    } else if (patternType === 'domainPatterns') {
        provider.domainPatterns = domainPatterns;
    }
    
    try {
        // If editing and name changed, remove old entry
        if (isEdit && editProvider !== providerName) {
            delete customRules.providers[editProvider];
        }
        
        customRules.providers[providerName] = provider;
        await saveCustomRules();
        
        hideProviderModal();
        updateUI();
        selectProvider(providerName);
        
    } catch (error) {
        alert(i18n('customRulesEditor_failedToSaveProvider'));
    }
}

/**
 * Edit provider name
 */
function editProviderName(providerName) {
    showAddProviderModal(providerName);
}

/**
 * Duplicate provider
 */
function duplicateProvider(providerName) {
    const provider = customRules.providers[providerName];
    if (!provider) return;
    
    let newName = `${providerName}_${i18n('customRulesEditor_copy')}`;
    let counter = 1;
    
    while (customRules.providers[newName]) {
        newName = `${providerName}_${i18n('customRulesEditor_copy')}_${counter}`;
        counter++;
    }
    
    customRules.providers[newName] = JSON.parse(JSON.stringify(provider));
    saveCustomRules();
    updateUI();
    selectProvider(newName);
}

/**
 * Export custom rules to file
 */
function exportCustomRules() {
    try {
        const blob = new Blob([JSON.stringify(customRules, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        browser.downloads.download({
            url: url,
            filename: 'clearurls_custom_rules.json',
            saveAs: true
        }).then(() => {
            // Success
        }).catch(error => {
            // Fallback for browsers that don't support downloads API
            const a = document.createElement('a');
            a.href = url;
            a.download = 'clearurls_custom_rules.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
        
    } catch (error) {
        alert(i18n('customRulesEditor_exportFailed'));
    }
}

/**
 * Handle file import
 */
function handleFileImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const imported = JSON.parse(event.target.result);
            
            // Flexible structure validation - handle different formats
            let providersData;
            if (imported.providers && typeof imported.providers === 'object') {
                // Standard format: {providers: {...}}
                providersData = imported.providers;
            } else if (typeof imported === 'object' && !Array.isArray(imported)) {
                // Direct providers format: {provider1: {...}, provider2: {...}}
                // Check if it looks like a providers object
                const keys = Object.keys(imported);
                if (keys.length > 0 && keys.every(key => typeof imported[key] === 'object' && imported[key] !== null)) {
                    providersData = imported;
                } else {
                    throw new Error(i18n('customRulesEditor_invalidFileStructure'));
                }
            } else {
                throw new Error(i18n('customRulesEditor_invalidFileStructure'));
            }
            
            // Additional validation - ensure we have at least one provider
            if (!providersData || Object.keys(providersData).length === 0) {
                throw new Error(i18n('customRulesEditor_noProvidersInFile') || 'No providers found in file');
            }
            
            // Validate each provider
            for (const [name, provider] of Object.entries(providersData)) {
                // Either urlPattern or domainPatterns must be present
                if (!provider.urlPattern && (!provider.domainPatterns || provider.domainPatterns.length === 0)) {
                    throw new Error(i18n('customRulesEditor_providerMissingUrlPatternOrDomainPatterns', name) || `Provider "${name}" must have either urlPattern or domainPatterns`);
                }
                
                // Validate mutual exclusivity
                if (provider.urlPattern && provider.domainPatterns && provider.domainPatterns.length > 0) {
                    throw new Error(i18n('customRulesEditor_providerHasBothPatternTypes', name) || `Provider "${name}" cannot have both urlPattern and domainPatterns`);
                }
                
                // Validate regex if urlPattern exists
                if (provider.urlPattern) {
                    new RegExp(provider.urlPattern);
                }
                
                // Validate domain patterns if they exist
                if (provider.domainPatterns && provider.domainPatterns.length > 0) {
                    for (const pattern of provider.domainPatterns) {
                        if (!pattern || pattern.trim() === '') {
                            throw new Error(i18n('customRulesEditor_providerHasEmptyDomainPattern', name) || `Provider "${name}" has empty domain patterns`);
                        }
                    }
                }
            }
            
            if (confirm(i18n('customRulesEditor_importConfirm'))) {
                // Ensure we always save in the standard format
                customRules = { providers: providersData };
                saveCustomRules();
                updateUI();
                showEmptyState();
            }
            
        } catch (error) {
            alert(i18n('customRulesEditor_importFailed', error.message));
        } finally {
            // Reset file input
            e.target.value = '';
        }
    };
    
    reader.readAsText(file);
}

/**
 * Update editor status indicator
 */
function updateEditorStatus(type, message) {
    if (!editorStatus) return;
    
    editorStatus.className = `status-indicator status-${type}`;
    editorStatus.textContent = message;
}

/**
 * Setup theme toggle functionality
 */
function initializeTheme() {
   const themeToggle = document.getElementById('themeToggle');
        const savedTheme = localStorage.getItem('linkumori-theme') || 'dark';
        
        // Apply saved theme
        document.documentElement.setAttribute('data-theme', savedTheme);
    
    // Apply saved theme
   if (themeToggle) {
            themeToggle.onclick = () => {
                const currentTheme = document.documentElement.getAttribute('data-theme');
                let newTheme;
                
                if (currentTheme === 'light') {
                    // Switch to last used dark theme or default dark
                    newTheme = localStorage.getItem('linkumori-last-dark-theme') || 'dark';
                } else {
                    // Save current dark theme and switch to light
                    localStorage.setItem('linkumori-last-dark-theme', currentTheme);
                    newTheme = 'light';
                }
                
                // Apply theme
                document.documentElement.setAttribute('data-theme', newTheme);
                localStorage.setItem('linkumori-theme', newTheme);
                browser.storage.local.set({'linkumori-theme': newTheme});
            };
    }
}
/**
 * Initialize theme on page load
 */


/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Handle errors
 */
function handleError(error) {
    console.error('Custom Rules Editor Error:', error);
}

// Listen for storage changes to sync theme across tabs/pages
window.addEventListener('storage', function(e) {
    if (e.key === 'linkumori-theme' && e.newValue) {
        document.documentElement.setAttribute('data-theme', e.newValue);
    }
});

// Periodic theme sync fallback
setInterval(function() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const savedTheme = localStorage.getItem('linkumori-theme') || 'dark';
    
    if (currentTheme !== savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    }
}, 1000);
