/* 
 * ClearURLs
 * Copyright (c) 2017-2020 Kevin Röbert
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
 * Based on 1.27.3 of clearurls MV2  settings.js
* Modified Version:
 * @author      Subham Mahesh (c) 2025
 * @license     LGPL-3.0-or-later
 * @repository  https://github.com/linkumori/linkumori
 * 
This program is free software: you can redistribute it and/or modify
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
 * *
 * 
 * Modifications include:
 * -  Added support for punycode domains in whitelist
 * - Improved color picker initialization and error handling
 * - Enhanced UI for better user experience
 * - Added echanced. import functionality for settings
 * - Whitelist functionality
 * - redisgn ui by manipulating html via js
 * - Added remote URL configuration fields (ruleURL, hashURL)
 * - Added comprehensive security modal system for remote URL configuration
 * - Added LinkumoriI18n number localization for statistics display
 * 
 */
/**
 * first modified:  Jun 14, 2025  by Subham Mahesh
 *secound modified:  august 21, 2025  by Subham Mahesh
 third modified:  september 5, 2025  by Subham Mahesh
 * Due to constraints, later modifications are not tracked inline.
 * To view the full modification history, run:
 *
 *   node linkumori-cli-tool.js
 *
 * Then select "Generate Commit History". This will create a Markdown file
 * where you can browse who modified which files and on what date.
 */
import punycode from '../external_js/light-punycode.js';

var settings = [];
let linkumoriPicker = null; // Initialize as null first

// Security Modal State Management
let securityModalState = {
    hasUserConfirmed: false, // Reset every session, never persisted
    pendingField: null,
    pendingValue: null,
    confirmationPhrase: translate('security_confirmation_phrase'),
    // NEW: Track initial saved values to avoid blocking existing URLs
    initialValues: {
        ruleURL: '',
        hashURL: ''
    },
    hasExistingValues: false
};

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
    return LinkumoriI18n.localizeNumbers(number);
}

/**
 * FIXED: Get localized percentage string using LinkumoriI18n only
 * @param {number} percentage - Percentage number (without % symbol)
 * @returns {string} Localized percentage with symbol
 */
    // Direct conversion using LinkumoriI18n only
function getLocalizedPercentage(percentage) {
    // Direct conversion using LinkumoriI18n only
    const localizedNumber = LinkumoriI18n.localizeNumbers(percentage);
    const percentageSymbol = LinkumoriI18n.getMessage('percentage_symbol') || '%';
    return localizedNumber + percentageSymbol;
}

/**
 * Update display elements with localized numbers
 * This function can be called after language changes to update all number displays
 */
function updateAllLocalizedNumbers() {
    // Re-display bundled rules info with new localization
    displayBundledRulesInfo();
    
    // Re-load and display whitelist to update count
    loadWhitelist();
}

(function () {
    initializeSettings();
})();

/**
 * Initialize the settings page
 */
function initializeSettings() {
    initializeTheme();
    
    // Wait for DOM to be fully ready before proceeding
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            startInitialization();
        });
    } else {
        startInitialization();
    }
}

/**
 * Start the actual initialization process
 */
function startInitialization() {
    LinkumoriI18n.ready().then(() => {
        getData()
            .then(() => {
                setText();
                setupEventHandlers();
                displayBundledRulesInfo();
                updateRemoteRulesFieldsVisibility(); // NEW: Update fields based on toggle

                // Initialize security modals
                initializeSecurityModals();
                
                // Ensure DOM elements exist before applying colors
                setTimeout(() => {
                    initializeColorPicker(); // Initialize color picker after DOM is ready
                    
                    // Apply color after a short delay to ensure color picker is ready
                    setTimeout(() => {
                        refreshColorDisplay();
                    }, 300);
                }, 100);
            })
            .catch(error => {
                showStatus(translate('status_load_settings_failed'), 'error');
                
                // Even if initialization fails, try to show default color after delay
                setTimeout(() => {
                    settings["badged_color"] = '#FFA500';
                    refreshColorDisplay();
                }, 500);
            });
    }).catch(error => {
        console.error('Error waiting for LinkumoriI18n:', error);
        // Continue with initialization even if LinkumoriI18n fails
        getData()
            .then(() => {
                setText();
                setupEventHandlers();
                displayBundledRulesInfo();
                initializeSecurityModals();
                
                setTimeout(() => {
                    initializeColorPicker();
                    setTimeout(() => {
                        refreshColorDisplay();
                    }, 300);
                }, 100);
            })
            .catch(error => {
                showStatus('Failed to load settings', 'error');
                setTimeout(() => {
                    settings["badged_color"] = '#FFA500';
                    refreshColorDisplay();
                }, 500);
            });
    });
}

// ============================================================================
// SECURITY MODAL FUNCTIONS
// ============================================================================
// IMPORTANT: Security consent is NEVER persisted across sessions for maximum security.
// Users must re-confirm their understanding EVERY TIME they visit the settings page.
// This ensures the security warning cannot be bypassed after initial confirmation.
// ============================================================================

/**
 * FIXED: Initialize security modal system with existing value check
 */
function initializeSecurityModals() {
    // Security confirmation is NEVER persisted - always required for NEW entries
    securityModalState.hasUserConfirmed = false;
    
    // NEW: Check if there are existing saved values
    checkExistingURLValues().then(() => {
        // Apply security styling to URL fields only if no existing values
        const ruleURLInput = document.getElementById('ruleURL');
        const hashURLInput = document.getElementById('hashURL');
        
        if (ruleURLInput) {
            if (!securityModalState.hasExistingValues || !ruleURLInput.value.trim()) {
                ruleURLInput.classList.add('security-confirmation-required');
            }
        }
        if (hashURLInput) {
            if (!securityModalState.hasExistingValues || !hashURLInput.value.trim()) {
                hashURLInput.classList.add('security-confirmation-required');
            }
        }
        
        setupModalEventHandlers();
        updateConfirmationPhrase();
    });
}

/**
 * NEW: Check for existing URL values and update security state accordingly
 */
async function checkExistingURLValues() {
    try {
        const [ruleURLResponse, hashURLResponse] = await Promise.all([
            browser.runtime.sendMessage({
                function: "getData",
                params: ["ruleURL"]
            }),
            browser.runtime.sendMessage({
                function: "getData", 
                params: ["hashURL"]
            })
        ]);
        
        const savedRuleURL = ruleURLResponse.response || '';
        const savedHashURL = hashURLResponse.response || '';
        
        // Store initial values
        securityModalState.initialValues.ruleURL = savedRuleURL;
        securityModalState.initialValues.hashURL = savedHashURL;
        
        // If there are existing valid URLs, allow editing without immediate confirmation
        securityModalState.hasExistingValues = !!(savedRuleURL.trim() || savedHashURL.trim());
        
        console.log('Existing URL values found:', {
            ruleURL: savedRuleURL,
            hashURL: savedHashURL,
            hasExistingValues: securityModalState.hasExistingValues
        });
        
    } catch (error) {
        console.warn('Failed to check existing URL values:', error);
        securityModalState.hasExistingValues = false;
    }
}

/**
 * Setup all modal event handlers
 */
function setupModalEventHandlers() {
    // Security disclaimer modal handlers
    const securityModalCancel = document.getElementById('securityModalCancel');
    const securityModalContinue = document.getElementById('securityModalContinue');
    
    if (securityModalCancel) {
        securityModalCancel.onclick = handleSecurityModalCancel;
    }
    
    if (securityModalContinue) {
        securityModalContinue.onclick = handleSecurityModalContinue;
    }
    
    // Confirmation modal handlers
    const confirmationModalCancel = document.getElementById('confirmationModalCancel');
    const confirmationModalConfirm = document.getElementById('confirmationModalConfirm');
    const confirmationInput = document.getElementById('confirmationInput');
    
    if (confirmationModalCancel) {
        confirmationModalCancel.onclick = handleConfirmationModalCancel;
    }
    
    if (confirmationModalConfirm) {
        confirmationModalConfirm.onclick = handleConfirmationModalConfirm;
    }
    
    if (confirmationInput) {
        confirmationInput.oninput = validateConfirmationInput;
        confirmationInput.onpaste = (e) => {
            // Allow paste but validate after a short delay
            setTimeout(validateConfirmationInput, 10);
        };
    }
    
    // Close modal on overlay click
    const securityOverlay = document.getElementById('securityDisclaimerModal');
    const confirmationOverlay = document.getElementById('confirmationModal');
    
    if (securityOverlay) {
        securityOverlay.onclick = (e) => {
            if (e.target === securityOverlay) {
                handleSecurityModalCancel();
            }
        };
    }
    
    if (confirmationOverlay) {
        confirmationOverlay.onclick = (e) => {
            if (e.target === confirmationOverlay) {
                handleConfirmationModalCancel();
            }
        };
    }
    
    // ESC key to close modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (isModalVisible('securityDisclaimerModal')) {
                handleSecurityModalCancel();
            } else if (isModalVisible('confirmationModal')) {
                handleConfirmationModalCancel();
            }
        }
    });
}

/**
 * Show security disclaimer modal
 */
function showSecurityDisclaimerModal() {
    const modal = document.getElementById('securityDisclaimerModal');
    if (!modal) return;

    // Set internationalized modal content
    setModalText();

    // Show the modal with a fade-in animation
    modal.style.display = 'flex';
    requestAnimationFrame(() => {
        modal.classList.add('show');
    });

    // Remove focus from the currently active input field
    const pendingFieldId = securityModalState.pendingField;
    if (pendingFieldId) {
        const field = document.getElementById(pendingFieldId);
        if (field) {
            field.blur();
        }
    }

    // Focus the continue button after a slight delay for accessibility
    const continueButton = document.getElementById('securityModalContinue');
    if (continueButton) {
        setTimeout(() => {
            try {
                continueButton.focus();
            } catch (err) {
                console.warn('Unable to focus continue button:', err);
            }
        }, 300); // Allow modal animation to finish
    }
}


/**
 * Show confirmation modal
 */
function showConfirmationModal() {
    const modal = document.getElementById('confirmationModal');
    if (!modal) return;
    
    // Set modal text using i18n
    setConfirmationModalText();
    
    // Clear and reset confirmation input
    const input = document.getElementById('confirmationInput');
    if (input) {
        input.value = '';
        input.classList.remove('shake');
    }
    
    const confirmButton = document.getElementById('confirmationModalConfirm');
    if (confirmButton) {
        confirmButton.disabled = true;
    }
    
    hideConfirmationError();
    
    // Show modal with animation
    modal.style.display = 'flex';
    requestAnimationFrame(() => {
        modal.classList.add('show');
        if (input) {
            setTimeout(() => input.focus(), 300);
        }
    });
}

/**
 * Hide modal with animation
 */
function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

/**
 * Check if modal is visible
 */
function isModalVisible(modalId) {
    const modal = document.getElementById(modalId);
    return modal && modal.style.display !== 'none' && modal.classList.contains('show');
}

/**
 * Handle security modal cancel
 */
function handleSecurityModalCancel() {
    // Clear pending field data
    securityModalState.pendingField = null;
    securityModalState.pendingValue = null;
    
    // Hide modal
    hideModal('securityDisclaimerModal');
    
    // Show status message
    showStatus(translate('security_modal_cancelled'), 'info');
}

/**
 * Handle security modal continue
 */
function handleSecurityModalContinue() {
    // Hide security modal
    hideModal('securityDisclaimerModal');
    
    // Small delay before showing confirmation modal
    setTimeout(() => {
        showConfirmationModal();
    }, 400);
}

/**
 * Handle confirmation modal cancel
 */
function handleConfirmationModalCancel() {
    // Clear pending field data
    securityModalState.pendingField = null;
    securityModalState.pendingValue = null;
    
    // Hide modal
    hideModal('confirmationModal');
    
    // Show status message
    showStatus(translate('security_confirmation_cancelled'), 'info');
}

/**
 * FIXED: Handle confirmation modal confirm with proper state updates
 */
function handleConfirmationModalConfirm() {
    const input = document.getElementById('confirmationInput');
    if (!input) return;
    
    const enteredPhrase = input.value.trim();
    
    if (enteredPhrase === securityModalState.confirmationPhrase) {
        // User confirmed correctly - ONLY for this session, NEVER saved
        securityModalState.hasUserConfirmed = true;
        
        // Hide modal
        hideModal('confirmationModal');
        
        // Process the pending field if it exists
        if (securityModalState.pendingField && securityModalState.pendingValue !== null) {
            const fieldInput = document.getElementById(securityModalState.pendingField);
            if (fieldInput) {
                // Handle single character input vs full value
                if (securityModalState.pendingValue.length === 1) {
                    fieldInput.value += securityModalState.pendingValue;
                } else {
                    fieldInput.value = securityModalState.pendingValue;
                }
                
                fieldInput.focus();
                
                // Re-validate the field
                setTimeout(() => {
                    if (fieldInput.value.trim()) {
                        validateURLField(securityModalState.pendingField);
                    }
                }, 100);
            }
        }
        
        // Update styling for all URL fields (remove security confirmation required class)
        const ruleURLInput = document.getElementById('ruleURL');
        const hashURLInput = document.getElementById('hashURL');
        
        if (ruleURLInput) {
            ruleURLInput.classList.remove('security-confirmation-required');
            ruleURLInput.placeholder = translate('rule_url_placeholder');
        }
        if (hashURLInput) {
            hashURLInput.classList.remove('security-confirmation-required');  
            hashURLInput.placeholder = translate('hash_url_placeholder');
        }
        
        // Update description text to remove restriction notice
        updateURLFieldDescriptions(true);
        
        // Clear pending data
        securityModalState.pendingField = null;
        securityModalState.pendingValue = null;
        
        // Show success message
        showStatus(translate('security_confirmation_session_success'), 'success');
        
    } else {
        // Incorrect phrase - show error
        showConfirmationError();
        
        if (input) {
            input.classList.add('shake');
            input.select();
            
            setTimeout(() => {
                input.classList.remove('shake');
            }, 500);
        }
    }
}

/**
 * Validate confirmation input as user types
 */
function validateConfirmationInput() {
    const input = document.getElementById('confirmationInput');
    const confirmButton = document.getElementById('confirmationModalConfirm');
    
    if (!input || !confirmButton) return;
    
    const enteredPhrase = input.value.trim();
    const isValid = enteredPhrase === securityModalState.confirmationPhrase;
    
    // Enable/disable confirm button
    confirmButton.disabled = !isValid;
    
    // Hide error if input becomes valid
    if (isValid) {
        hideConfirmationError();
    }
}

/**
 * Show confirmation error
 */
function showConfirmationError() {
    const errorElement = document.getElementById('confirmationError');
    if (errorElement) {
        errorElement.style.display = 'block';
    }
}

/**
 * Hide confirmation error
 */
function hideConfirmationError() {
    const errorElement = document.getElementById('confirmationError');
    if (errorElement) {
        errorElement.style.display = 'none';
    }
}

/**
 * Set modal text using i18n
 */
function setModalText() {
    const textElements = [
        { id: 'security_modal_title', key: 'security_modal_title' },
        { id: 'security_modal_advanced_warning', key: 'security_modal_advanced_warning' },
        { id: 'security_modal_main_warning', key: 'security_modal_main_warning' },
        { id: 'security_modal_recommendation', key: 'security_modal_recommendation' },
        { id: 'security_modal_privacy_title', key: 'security_modal_privacy_title' },
        { id: 'security_modal_privacy_text', key: 'security_modal_privacy_text' },
        { id: 'security_modal_risks_title', key: 'security_modal_risks_title' },
        { id: 'security_modal_risk_1', key: 'security_modal_risk_1' },
        { id: 'security_modal_risk_2', key: 'security_modal_risk_2' },
        { id: 'security_modal_risk_3', key: 'security_modal_risk_3' },
        { id: 'security_modal_risk_4', key: 'security_modal_risk_4' },
        { id: 'security_modal_final_warning', key: 'security_modal_final_warning' },
        { id: 'security_modal_cancel', key: 'security_modal_cancel' },
        { id: 'security_modal_continue', key: 'security_modal_continue' }
    ];
    
    textElements.forEach(({ id, key }) => {
        setElementTextFromI18n(id, key);
    });
}

/**
 * Set confirmation modal text using i18n
 */
function setConfirmationModalText() {
    const textElements = [
        { id: 'confirmation_modal_title', key: 'confirmation_modal_title' },
        { id: 'confirmation_modal_text', key: 'confirmation_modal_text' },
        { id: 'confirmation_input_label', key: 'confirmation_input_label' },
        { id: 'confirmation_error_text', key: 'confirmation_error_text' },
        { id: 'confirmation_final_text', key: 'confirmation_final_text' },
        { id: 'confirmation_modal_cancel', key: 'confirmation_modal_cancel' },
        { id: 'confirmation_modal_confirm', key: 'confirmation_modal_confirm' }
    ];
    
    textElements.forEach(({ id, key }) => {
        setElementTextFromI18n(id, key);
    });
    
    // Update confirmation phrase display
    updateConfirmationPhrase();
}

/**
 * Update confirmation phrase display with i18n
 */
function updateConfirmationPhrase() {
    // Get localized confirmation phrase
    const localizedPhrase = translate('security_confirmation_phrase');
    securityModalState.confirmationPhrase = localizedPhrase;
    
    // Update phrase display
    const phraseElement = document.getElementById('confirmation_phrase_text');
    if (phraseElement) {
        phraseElement.textContent = localizedPhrase;
    }
    
    // Update input placeholder
    const inputElement = document.getElementById('confirmationInput');
    if (inputElement) {
        inputElement.placeholder = localizedPhrase;
    }
    
    // Update error message with correct phrase
    const errorElement = document.getElementById('confirmation_error_text');
    if (errorElement) {
        const errorTemplate = translate('confirmation_error_template');
        errorElement.textContent = errorTemplate.replace('%s', localizedPhrase);
    }
}

/**
 * Helper function to set element text from i18n
 */
function setElementTextFromI18n(elementId, i18nKey) {
    const element = document.getElementById(elementId);
    if (element) {
        const text = translate(i18nKey);
        if (text) {
            element.textContent = text;
        }
    }
}

function setHTMLContent(element, html) {
    if (!element) {
        return;
    }
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<!doctype html><body>${html || ''}</body>`, 'text/html');
    element.replaceChildren(...Array.from(doc.body.childNodes));
}

/**
 * NEW: Update URL field descriptions based on confirmation state
 */
function updateURLFieldDescriptions(isConfirmed) {
    const ruleURLDescription = document.getElementById('ruleURL_description');
    const hashURLDescription = document.getElementById('hashURL_description');
    
    if (ruleURLDescription) {
        const basicText = translate('setting_rule_url_description');
        const mandatoryText = translate('setting_rule_url_mandatory_hash');
        const securityNotice = translate('remote_rules_security_notice');
        
        if (isConfirmed) {
            setHTMLContent(ruleURLDescription, `${basicText} ${mandatoryText}<br><small style="color: var(--button-danger);">${securityNotice}</small>`);
        } else {
            const restrictionNotice = translate('remote_rules_restriction_notice');
            setHTMLContent(ruleURLDescription, `${basicText} ${mandatoryText}<br><small style="color: var(--button-danger);">${securityNotice}</small><br><strong style="color: var(--button-primary);">${restrictionNotice}</strong>`);
        }
    }
    
    if (hashURLDescription) {
        const basicText = translate('setting_hash_url_description');
        const mandatoryText = translate('setting_hash_url_mandatory');
        const securityNotice = translate('remote_rules_security_notice');
        
        if (isConfirmed) {
            setHTMLContent(hashURLDescription, `${basicText} ${mandatoryText}<br><small style="color: var(--button-danger);">${securityNotice}</small>`);
        } else {
            const restrictionNotice = translate('remote_rules_restriction_notice');
            setHTMLContent(hashURLDescription, `${basicText} ${mandatoryText}<br><small style="color: var(--button-danger);">${securityNotice}</small><br><strong style="color: var(--button-primary);">${restrictionNotice}</strong>`);
        }
    }
}

/**
 * Reset security confirmation (session only - always mandatory)
 * This is for testing/development purposes only - in production,
 * security confirmation resets automatically on every page load
 */
function resetSecurityConfirmation() {
    securityModalState.hasUserConfirmed = false;
    
    // Re-apply security restrictions to URL fields
    const ruleURLInput = document.getElementById('ruleURL');
    const hashURLInput = document.getElementById('hashURL');
    
    if (ruleURLInput) {
        ruleURLInput.classList.add('security-confirmation-required');
        ruleURLInput.placeholder = translate('security_confirmation_required_placeholder');
        ruleURLInput.value = ''; // Clear any values
    }
    if (hashURLInput) {
        hashURLInput.classList.add('security-confirmation-required');
        hashURLInput.placeholder = translate('security_confirmation_required_placeholder');
        hashURLInput.value = ''; // Clear any values
    }
    
    showStatus(translate('security_confirmation_reset'), 'info');
}

// ============================================================================
// COLOR PICKER FUNCTIONS
// ============================================================================

/**
 * Check if all required DOM elements for color picker are ready
 * @returns {boolean} True if all elements exist
 */
function areColorElementsReady() {
    const requiredElements = [
        'badge-demo',
        'badged-color-picker', 
        'color-value'
    ];
    
    for (const elementId of requiredElements) {
        if (!document.getElementById(elementId)) {
            return false;
        }
    }
    
    return true;
}

/**
 * Initialize the color picker
 */
function initializeColorPicker() {
    // Wait for DOM elements to be ready
    if (!areColorElementsReady()) {
        setTimeout(() => initializeColorPicker(), 100);
        return;
    }
    
    try {
        const savedColor = settings["badged_color"] || '#FFA500';
        
        linkumoriPicker = LinkumoriPicker.create({
            el: '#badged-color-picker',
            theme: 'nano',
            appClass: 'linkumori-linkumori-picker',
            default: savedColor,
            components: {
                preview: true,
                opacity: true,
                hue: true,
                interaction: {
                    hex: true,
                    rgba: false,
                    hsla: false,
                    hsva: false,
                    cmyk: false,
                    input: true,
                    clear: false,
                    save: true
                }
            },
            strings: {
                save: translate('color_picker_save'),
                cancel: translate('color_picker_cancel'),
                clear: translate('color_picker_clear')
            }
        });

        if (linkumoriPicker) {
            // Set up color picker event handlers
            linkumoriPicker.on('init', (instance) => {
                const currentColor = instance.getColor().toHEXA().toString();
                updateBadgePreview(currentColor);
                updateColorValue(currentColor);
            });

            linkumoriPicker.on('change', (color, source, instance) => {
                if (color) {
                    const hexColor = color.toHEXA().toString();
                    updateBadgePreview(hexColor);
                    updateColorValue(hexColor);
                }
            });

            linkumoriPicker.on('save', (color, instance) => {
                if (color) {
                    const hexColor = color.toHEXA().toString();
                    updateBadgePreview(hexColor);
                    updateColorValue(hexColor);
                }
            });

            // Apply initial color immediately (fallback if init event doesn't fire)
            setTimeout(() => {
                if (linkumoriPicker && linkumoriPicker.getColor) {
                    const currentColor = linkumoriPicker.getColor().toHEXA().toString();
                    settings["badged_color"] = currentColor;
                    updateBadgePreview(currentColor);
                    updateColorValue(currentColor);
                } else {
                    // If color picker still not ready, use saved value
                    updateBadgePreview(savedColor);
                    updateColorValue(savedColor);
                }
            }, 100);
        }
    } catch (error) {
        showStatus(translate('status_color_picker_failed'), 'error');
        
        // Fallback: at least show the saved color in preview
        const savedColor = settings["badged_color"] || '#FFA500';
        settings["badged_color"] = savedColor;
        updateBadgePreview(savedColor);
        updateColorValue(savedColor);
    }
}

/**
 * Update the badge preview color
 * @param {string} color - Hex color string
 */
function updateBadgePreview(color) {
    if (!color || typeof color !== 'string') {
        return;
    }
    
    
    // Update the badge counter background color
    const badgeCounter = document.getElementById('badge-demo');
    if (badgeCounter) {
        badgeCounter.style.backgroundColor = color;
    }
    
    // Update the color picker element background
    const colorPicker = document.getElementById('badged-color-picker');
    if (colorPicker) {
        colorPicker.style.backgroundColor = color;
        // Also set CSS custom property for the element
        colorPicker.style.setProperty('--linkumori-picker-color', color);
    }
    
    // Update any other elements that should reflect the badge color
    const colorPreview = document.getElementById('color-preview');
    if (colorPreview) {
        colorPreview.style.backgroundColor = color;
    }
}

/**
 * Update the color value display
 * @param {string} color - Hex color string
 */
function updateColorValue(color) {
    if (!color || typeof color !== 'string') {
        return;
    }
    
    const colorValue = document.getElementById('color-value');
    if (colorValue) {
        colorValue.textContent = color.toUpperCase();
    }
}

/**
 * Refresh color display from current settings
 * This is a helper function to ensure color is properly displayed
 */
function refreshColorDisplay() {
    const currentColor = settings["badged_color"] || '#FFA500';
    
    // Check if key DOM elements exist before updating
    const badgeDemo = document.getElementById('badge-demo');
    const colorPicker = document.getElementById('badged-color-picker');
    const colorValue = document.getElementById('color-value');
    
    if (!badgeDemo || !colorPicker || !colorValue) {
        setTimeout(() => refreshColorDisplay(), 100);
        return;
    }
    
    updateBadgePreview(currentColor);
    updateColorValue(currentColor);
    
    // If color picker exists, update its color too
    if (linkumoriPicker && linkumoriPicker.setColor) {
        try {
            linkumoriPicker.setColor(currentColor, false); // false = don't trigger events
        } catch (error) {
        }
    }
}

// ============================================================================
// THEME INITIALIZATION
// ============================================================================

/**
 * Initialize theme system
 */
function initializeTheme() {
    try {
        const themeToggle = document.getElementById('themeToggle');
        const savedTheme = localStorage.getItem('linkumori-theme') || 'dark';
        
        // Apply saved theme
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        // Initialize theme cards
        const themeCards = document.querySelectorAll('.theme-card');
        
        if (themeCards.length > 0) {
            themeCards.forEach(card => {
                // Set active card
                if (card.dataset.theme === savedTheme) {
                    card.classList.add('active');
                } else {
                    card.classList.remove('active');
                }
                
                // Add click handler
                card.addEventListener('click', () => {
                    const newTheme = card.dataset.theme;
                    
                    // Update active state
                    themeCards.forEach(c => c.classList.remove('active'));
                    card.classList.add('active');
                    
                    // Apply theme
                    document.documentElement.setAttribute('data-theme', newTheme);
                    localStorage.setItem('linkumori-theme', newTheme);
                    browser.storage.local.set({'linkumori-theme': newTheme});
                });
            });
        }
        
        // Theme toggle handler (cycles between light and last used dark theme)
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
                
                // Update active card if available
                const currentThemeCards = document.querySelectorAll('.theme-card');
                if (currentThemeCards.length > 0) {
                    currentThemeCards.forEach(card => {
                        if (card.dataset.theme === newTheme) {
                            card.classList.add('active');
                        } else {
                            card.classList.remove('active');
                        }
                    });
                }
            };
        }
    } catch (error) {
        console.error('Theme initialization failed:', error);
        // Fallback - just apply default theme
        document.documentElement.setAttribute('data-theme', 'dark');
    }
}

browser.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
        // Check for theme changes
        if (changes['linkumori-theme']) {
            initializeTheme();
        }
        
        if (changes['globalStatus']) {
            initializeTheme();
        }
    }
});

// ============================================================================
// EVENT HANDLER SETUP
// ============================================================================

/**
 * Set up all event handlers - UPDATED to include import/export
 */
function setupEventHandlers() {
    // Data management buttons
    document.getElementById('reset_settings_btn').onclick = reset;
    document.getElementById('save_settings_btn').onclick = save;
    document.getElementById('export_settings_btn').onclick = exportSettings;
    
    // Set up import file input
    setupImportHandler();
    
    // Set up toggle switches
    setupToggleSwitches();
    
    // Set up whitelist management
    setupWhitelistManagement();
    
    // Set up enhanced URL validation with security modal
    setupEnhancedURLValidation();
}

/**
 * FIXED: Enhanced URL validation with intelligent security modal integration
 */
function setupEnhancedURLValidation() {
    const ruleURLInput = document.getElementById('ruleURL');
    const hashURLInput = document.getElementById('hashURL');
    const urlInputs = [ruleURLInput, hashURLInput];

    urlInputs.forEach((input) => {
        if (!input) return;

        const fieldId = input.id;

        // FIXED: Check if we need security confirmation for this specific field
        const needsSecurityConfirmation = () => {
            // If user already confirmed this session, no need for additional confirmation
            if (securityModalState.hasUserConfirmed) {
                return false;
            }
            
            // If there are existing values and user is just editing, allow it
            if (securityModalState.hasExistingValues) {
                const currentValue = input.value.trim();
                const initialValue = securityModalState.initialValues[fieldId] || '';
                
                // Allow editing existing values without confirmation
                // Only require confirmation if completely clearing the field or making significant changes
                if (initialValue && currentValue) {
                    return false;
                }
            }
            
            return true;
        };

        // FIXED: Block focus and show modal only when necessary
        const handleInteractionBeforeFocus = (e) => {
            if (needsSecurityConfirmation()) {
                e.preventDefault();
                securityModalState.pendingField = fieldId;
                securityModalState.pendingValue = '';
                showSecurityDisclaimerModal();
            }
        };

        input.addEventListener('mousedown', handleInteractionBeforeFocus);
        input.addEventListener('touchstart', handleInteractionBeforeFocus, { passive: false });

        // FIXED: Block input only when security confirmation is actually needed
        input.addEventListener('input', (e) => {
            if (needsSecurityConfirmation()) {
                const attemptedValue = e.target.value.trim();
                if (attemptedValue) {
                    e.target.value = securityModalState.initialValues[fieldId] || ''; // Restore original value
                    securityModalState.pendingField = fieldId;
                    securityModalState.pendingValue = attemptedValue;
                    showSecurityDisclaimerModal();
                }
            } else {
                clearURLValidationMessage(fieldId);
            }
        });

        // FIXED: Block keypress only when necessary
        input.addEventListener('keypress', (e) => {
            if (needsSecurityConfirmation() && e.key.length === 1) {
                e.preventDefault();
                securityModalState.pendingField = fieldId;
                securityModalState.pendingValue = e.key;
                showSecurityDisclaimerModal();
            }
        });

        // FIXED: Block paste only when necessary  
        input.addEventListener('paste', (e) => {
            if (needsSecurityConfirmation()) {
                e.preventDefault();
                const pastedText = (e.clipboardData || window.clipboardData).getData('text').trim();
                if (pastedText) {
                    securityModalState.pendingField = fieldId;
                    securityModalState.pendingValue = pastedText;
                    showSecurityDisclaimerModal();
                }
            }
        });

        // FIXED: Update tooltip and placeholder based on current state
        input.addEventListener('mouseover', () => {
            if (needsSecurityConfirmation()) {
                input.title = translate('security_confirmation_tooltip');
            } else {
                input.title = translate('url_field_editable_tooltip');
            }
        });

        // FIXED: Update placeholder based on state
        input.addEventListener('focus', (e) => {
            if (needsSecurityConfirmation()) {
                e.target.placeholder = translate('security_confirmation_required_placeholder');
            } else {
                // Set appropriate placeholder for editable fields
                if (fieldId === 'ruleURL') {
                    e.target.placeholder = translate('rule_url_placeholder');
                } else if (fieldId === 'hashURL') {
                    e.target.placeholder = translate('hash_url_placeholder');
                }
            }
        });

        // Validate URL on blur after confirmation
        input.addEventListener('blur', () => {
            if (!needsSecurityConfirmation()) {
                validateURLField(fieldId);
            }
        });
    });
}




/**
 * Enhanced URL field validation with security modal
 */
function validateURLField(fieldName) {
    const input = document.getElementById(fieldName);
    if (!input) return;
    
    const value = input.value.trim();
    
    // Empty values are allowed (will use bundled rules)
    if (!value) {
        clearURLValidationMessage(fieldName);
        return true;
    }
    
    // Check if user needs to confirm security disclaimer
    if (!securityModalState.hasUserConfirmed) {
        // Store the field and value for later processing
        securityModalState.pendingField = fieldName;
        securityModalState.pendingValue = value;
        
        // Clear the input temporarily
        input.value = '';
        
        // Show security disclaimer modal
        showSecurityDisclaimerModal();
        return false;
    }
    
    // Validate URL format (existing validation)
    if (!isValidURL(value)) {
        showURLValidationMessage(fieldName, translate('url_validation_invalid'));
        return false;
    }
    
    // Check if HTTPS (recommended)
    if (!value.startsWith('https://')) {
        showURLValidationMessage(fieldName, translate('url_validation_https_recommended'), 'warning');
        return true; // Still valid, just a warning
    }
    
    clearURLValidationMessage(fieldName);
    return true;
}

/**
 * Show URL validation message
 * @param {string} fieldName - Field name
 * @param {string} message - Validation message
 * @param {string} type - Message type (error, warning)
 */
function showURLValidationMessage(fieldName, message, type = 'error') {
    const input = document.getElementById(fieldName);
    if (!input) return;
    
    // Remove existing validation message
    clearURLValidationMessage(fieldName);
    
    // Create validation message element
    const messageElement = document.createElement('div');
    messageElement.className = `url-validation-message url-validation-${type}`;
    messageElement.textContent = message;
    messageElement.id = `${fieldName}_validation`;
    
    // Insert after the input field
    input.parentNode.insertBefore(messageElement, input.nextSibling);
    
    // Add visual feedback to input
    input.classList.add(`validation-${type}`);
}

/**
 * Clear URL validation message
 * @param {string} fieldName - Field name
 */
function clearURLValidationMessage(fieldName) {
    const input = document.getElementById(fieldName);
    const messageElement = document.getElementById(`${fieldName}_validation`);
    
    if (messageElement) {
        messageElement.remove();
    }
    
    if (input) {
        input.classList.remove('validation-error', 'validation-warning');
    }
}

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean} - true if valid URL
 */
function isValidURL(url) {
    if (!url || typeof url !== 'string') {
        return false;
    }
    
    try {
        const urlObj = new URL(url);
        return urlObj.protocol === 'https:' || urlObj.protocol === 'http:';
    } catch (error) {
        return false;
    }
}

/**
 * Set up toggle switches
 */
function setupToggleSwitches() {
    const toggles = [
        { id: 'domainBlocking', storageKey: 'domainBlocking' },
        { id: 'localHostsSkipping', storageKey: 'localHostsSkipping' },
        { id: 'historyListenerEnabled', storageKey: 'historyListenerEnabled' },
        { id: 'contextMenuEnabled', storageKey: 'contextMenuEnabled' },
        { id: 'referralMarketing', storageKey: 'referralMarketing' },
        { id: 'pingBlocking', storageKey: 'pingBlocking' },
        { id: 'eTagFiltering', storageKey: 'eTagFiltering' },
        { id: 'remoteRulesEnabled', storageKey: 'remoteRulesEnabled' }  // NEW

    ];
    
    toggles.forEach(toggle => {
        changeSwitchButton(toggle.id, toggle.storageKey);
    });
}

// ============================================================================
// PUNYCODE UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert domain to punycode format for storage
 * @param {string} domain - Domain to convert
 * @returns {string} Punycode domain
 */
function domainToPunycode(domain) {
    if (!domain || typeof domain !== 'string') {
        return domain;
    }
    
    try {
        // Handle wildcard domains
        if (domain.startsWith('*.')) {
            const baseDomain = domain.substring(2);
            const punycodeBase = punycode.toASCII(baseDomain);
            return '*.' + punycodeBase;
        }
        
        return punycode.toASCII(domain);
    } catch (error) {
        return domain; // Return original if conversion fails
    }
}

/**
 * Convert domain from punycode to Unicode for display
 * @param {string} domain - Punycode domain to convert
 * @returns {string} Unicode domain
 */
function domainToUnicode(domain) {
    if (!domain || typeof domain !== 'string') {
        return domain;
    }
    
    try {
        // Handle wildcard domains
        if (domain.startsWith('*.')) {
            const baseDomain = domain.substring(2);
            const unicodeBase = punycode.toUnicode(baseDomain);
            return '*.' + unicodeBase;
        }
        
        return punycode.toUnicode(domain);
    } catch (error) {
        return domain; // Return original if conversion fails
    }
}

/**
 * Normalize domain for comparison (convert to punycode)
 * @param {string} domain - Domain to normalize
 * @returns {string} Normalized domain
 */
function normalizeDomain(domain) {
    if (!domain || typeof domain !== 'string') {
        return domain;
    }
    
    return domainToPunycode(domain.trim().toLowerCase());
}

// ============================================================================
// WHITELIST MANAGEMENT FUNCTIONS - WITH PUNYCODE SUPPORT AND LOCALIZED NUMBERS
// ============================================================================

/**
 * Set up whitelist management UI - UPDATED WITH PUNYCODE SUPPORT
 */
function setupWhitelistManagement() {
    loadWhitelist();
    
    // Add domain button
    const addBtn = document.getElementById('addWhitelistBtn');
    if (addBtn) {
        addBtn.onclick = addDomainToWhitelist;
    }
    
    // Enter key in input
    const input = document.getElementById('whitelistInput');
    if (input) {
        input.onkeypress = function(e) {
            if (e.key === 'Enter') {
                addDomainToWhitelist();
            }
        };
        
        // Set placeholder text - updated to show punycode support
        input.placeholder = translate('whitelist_input_placeholder');
    }
    
    // Ensure remove handlers are always properly set up
    addWhitelistRemoveHandlers();
}

/**
 * Load and display whitelist from storage - WITH PUNYCODE SUPPORT
 */
async function loadWhitelist() {
    try {
        
        const response = await browser.runtime.sendMessage({
            function: "getData",
            params: ["userWhitelist"]
        });
        
        
        const whitelist = response.response || [];
        
        displayWhitelist(whitelist);
        
        // Re-attach event handlers after DOM update
        setTimeout(() => {
            addWhitelistRemoveHandlers();
        }, 100);
        
    } catch (error) {
        showStatus(translate('whitelist_load_failed'), 'error');
    }
}

/**
 * Display whitelist in UI - WITH PUNYCODE SUPPORT AND LOCALIZED NUMBERS
 */
function displayWhitelist(whitelist) {
    const container = document.getElementById('whitelistList');
    if (!container) {
        return;
    }
    
    if (!whitelist || whitelist.length === 0) {
        setHTMLContent(container, `<div class="whitelist-empty">${translate('whitelist_empty')}</div>`);
        return;
    }
    
    
    // Convert domains to Unicode for display, but keep original for data attributes
    const listHTML = whitelist.map((domain, index) => {
        const originalDomain = domain;
        
        return `
            <div class="whitelist-item">
                <span class="whitelist-domain" title="${escapeHtml(originalDomain)}">${escapeHtml(originalDomain)}</span>
                <button class="whitelist-remove" data-domain="${escapeHtml(originalDomain)}" data-index="${index}" title="${translate('whitelist_remove_button')}">
                    ${translate('whitelist_remove_button')}
                </button>
            </div>
        `;
    }).join('');
    
    const countText = translate('whitelist_count');
    // Use localized number for the count
    const localizedCount = getLocalizedNumber(whitelist.length);
    setHTMLContent(container, listHTML + 
        `<div class="whitelist-count">${countText.replace('%d', localizedCount)}</div>`);
    
}

/**
 * Add event handlers for whitelist remove buttons
 */
function addWhitelistRemoveHandlers() {
    const container = document.getElementById('whitelistList');
    if (!container) {
        return;
    }
    
    // Remove existing event listeners to prevent duplicates
    container.removeEventListener('click', handleWhitelistRemove);
    
    // Add single event listener using event delegation
    container.addEventListener('click', handleWhitelistRemove);
    
}

/**
 * Handle whitelist remove button clicks
 */
function handleWhitelistRemove(event) {
    if (!event.target.classList.contains('whitelist-remove')) {
        return;
    }
    
    const domain = event.target.getAttribute('data-domain');
    
    if (domain) {
        removeDomainFromWhitelist(domain);
    }
}

/**
 * Add domain to whitelist - WITH PUNYCODE SUPPORT
 */
async function addDomainToWhitelist() {
    const input = document.getElementById('whitelistInput');
    if (!input) {
        return;
    }
    
    const rawDomain = input.value.trim();
    
    if (!rawDomain) {
        showStatus(translate('whitelist_enter_domain'), 'error');
        return;
    }
    
    // Validate the domain before converting
    if (!isValidDomain(rawDomain)) {
        showStatus(translate('whitelist_invalid_format'), 'error');
        return;
    }
    
    // Convert to punycode for storage
    const punnycodeDomain = normalizeDomain(rawDomain);
    
    try {
        const response = await browser.runtime.sendMessage({
            function: "addToWhitelist",
            params: [punnycodeDomain]
        });
        
        
        if (response && response.response) {
            input.value = '';
            loadWhitelist();
            const displayDomain = domainToUnicode(punnycodeDomain);
            const successMsg = translate('whitelist_added');
            showStatus(successMsg.replace('%s', displayDomain), 'success');
        } else {
            showStatus(translate('whitelist_already_exists'), 'error');
        }
    } catch (error) {
        showStatus(translate('whitelist_add_failed'), 'error');
    }
}

/**
 * Remove domain from whitelist - WITH PUNYCODE SUPPORT
 */
async function removeDomainFromWhitelist(domain) {
    if (!domain) {
        return;
    }
    
    try {
        
        // Domain should already be in punycode format from storage
        const response = await browser.runtime.sendMessage({
            function: "removeFromWhitelist",
            params: [domain]
        });
        
        
        if (response && response.response) {
            loadWhitelist(); // Reload the list
            const displayDomain = domainToUnicode(domain);
            const successMsg = translate('whitelist_removed');
            showStatus(successMsg.replace('%s', displayDomain), 'success');
        } else {
            showStatus(translate('whitelist_remove_failed'), 'error');
        }
    } catch (error) {
        showStatus(translate('whitelist_remove_failed'), 'error');
    }
}

/**
 * FIXED: Validate domain format - ENHANCED VERSION WITH IMPROVED VALIDATION
 */
function isValidDomain(domain) {
    if (!domain || typeof domain !== 'string') {
        return false;
    }
    
    let testDomain = domain.trim().toLowerCase();
    
    // Handle empty domain after trim
    if (!testDomain) {
        return false;
    }
    
    // Allow wildcards
    if (testDomain.startsWith('*.')) {
        testDomain = testDomain.substring(2);
        if (!testDomain) {
            return false;
        }
    }
    
    // Basic length check
    if (testDomain.length > 253) {
        return false;
    }
    
    // Try to convert to punycode to validate internationalized domains
    try {
        const punnycodeDomain = punycode.toASCII(testDomain);
        
        // Check for punycode conversion issues
        if (!punnycodeDomain || punnycodeDomain.length === 0) {
            return false;
        }
        
        // Enhanced domain validation regex
        // Each label must be 1-63 characters, start and end with alphanumeric
        // Domain must have at least one dot (except for localhost-style names)
        const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        
        // Additional checks
        const parts = punnycodeDomain.split('.');
        
        // Must have at least 2 parts for most domains (domain.tld)
        // Exception: allow single part for special cases like 'localhost'
        if (parts.length < 2 && !isSpecialDomain(testDomain)) {
            return false;
        }
        
        // Validate each part
        for (const part of parts) {
            if (part.length === 0 || part.length > 63) {
                return false;
            }
            // Cannot start or end with hyphen
            if (part.startsWith('-') || part.endsWith('-')) {
                return false;
            }
            // Cannot be all numeric (for TLD)
            if (parts.indexOf(part) === parts.length - 1 && /^\d+$/.test(part)) {
                return false;
            }
        }
        
        const isValid = domainRegex.test(punnycodeDomain);
        return isValid;
        
    } catch (error) {
        console.warn('Punycode conversion failed for domain:', testDomain, error);
        
        // Fallback to basic ASCII validation if punycode conversion fails
        const basicDomainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        
        const parts = testDomain.split('.');
        
        // Basic validation for ASCII domains
        if (parts.length < 2 && !isSpecialDomain(testDomain)) {
            return false;
        }
        
        for (const part of parts) {
            if (part.length === 0 || part.length > 63) {
                return false;
            }
            if (part.startsWith('-') || part.endsWith('-')) {
                return false;
            }
        }
        
        return basicDomainRegex.test(testDomain);
    }
}

/**
 * Check if domain is a special case (like localhost)
 */
function isSpecialDomain(domain) {
    const specialDomains = ['localhost', 'broadcasthost'];
    return specialDomains.includes(domain.toLowerCase());
}

/**
 * Enhanced HTML escaping for better security
 */
function escapeHtml(text) {
    if (!text) return '';
    
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/`/g, '&#x60;');
}

// ============================================================================
// IMPORT/EXPORT FUNCTIONS
// ============================================================================

/**
 * Export settings to a file
 */
function exportSettings() {
    browser.runtime.sendMessage({
        function: "storageAsJSON",
        params: []
    }).then((data) => {
        let blob = new Blob([JSON.stringify(data.response, null, 2)], {type: 'application/json'});

        browser.downloads.download({
            'url': URL.createObjectURL(blob),
            'filename': 'Linkumori-Settings-' + new Date().toISOString().slice(0, 19).replace(/:/g, '-') + '.json',
            'saveAs': true
        }).catch(handleError);
    }).catch(handleError);
}

function importSettings(evt) {
    let file = evt.target.files[0];

    if (!file) {
        alert(translate('settings_import_no_file'));
        return;
    }

    const confirmMessage = translate('settings_import_confirm');

    if (!confirm(confirmMessage)) {
        evt.target.value = '';
        return;
    }

    // Updated expected keys to match new format
    const expectedKeys = [
        "exportMetadata", "dataHash", "badgedStatus", "globalStatus",
        "totalCounter", "cleanedCounter", "hashStatus", "loggingStatus", "log",
        "statisticsStatus", "badged_color", "contextMenuEnabled", "historyListenerEnabled",
        "localHostsSkipping", "referralMarketing", "logLimit", "domainBlocking",
        "pingBlocking", "eTagFiltering", "watchDogErrorCount", "userWhitelist",
        "custom_rules", "types", "pingRequestTypes", "firstInstall", "linkumori-theme",
        "ruleURL", "hashURL" // Added new URL fields
    ];

    let fileReader = new FileReader();

    fileReader.onload = function (e) {
        try {
            let parsed = JSON.parse(e.target.result);

            if (!parsed || typeof parsed !== 'object') {
                alert(translate('settings_import_invalid_file'));
                return;
            }

            // Validate that essential structure exists
            if (!parsed.exportMetadata || typeof parsed.exportMetadata !== 'object') {
                alert(translate('settings_import_invalid_format'));
                return;
            }

            // Check for minimum required metadata
            const requiredMetadata = ['ExtensionName', 'extensionVersion', 'exportDate'];
            const missingMetadata = requiredMetadata.filter(key => !(key in parsed.exportMetadata));
            
            if (missingMetadata.length > 0) {
                alert(translate('settings_import_incomplete_metadata'));
                return;
            }

            // Validate that this is a Linkumori settings file
            if (!parsed.exportMetadata.ExtensionName || 
                !parsed.exportMetadata.ExtensionName.includes('Linkumori')) {
                alert(translate('settings_import_wrong_extension'));
                return;
            }

            const actualKeys = Object.keys(parsed).sort();
            const expectedKeysSorted = [...expectedKeys].sort();

            // More flexible validation - check if all required keys are present
            const missingKeys = expectedKeysSorted.filter(key => !actualKeys.includes(key));
            const unexpectedKeys = actualKeys.filter(key => !expectedKeysSorted.includes(key));

            if (missingKeys.length > 0) {
                console.warn('Missing keys in import file:', missingKeys);
            }

            if (unexpectedKeys.length > 0) {
                console.warn('Unexpected keys in import file:', unexpectedKeys);
            }

            // Ã¢Å"â€¦ Filter out metadata and version-specific keys that shouldn't be imported
            const keysToFilter = [
                "exportMetadata",  // Don't import metadata
                "dataHash",        // Don't import hash (will be regenerated)
                "hashStatus",      // Don't import hash status
                "version",         // Don't import version info
                "totalCounter",    // Don't import usage counters (keep current)
                "cleanedCounter",  // Don't import usage counters (keep current)
                "watchDogErrorCount" // Don't import error counts
            ];

            const filtered = Object.fromEntries(
                Object.entries(parsed).filter(([key]) => !keysToFilter.includes(key))
            );

            const keys = Object.keys(filtered);

            if (keys.length === 0) {
                alert(translate('settings_import_no_data'));
                return;
            }

            // Ã¢Å"â€¦ Use Promise.all for better async handling
            const promises = keys.map(key => 
                browser.runtime.sendMessage({
                    function: "setData",
                    params: [key, filtered[key]]
                })
            );

            Promise.all(promises)
                .then(() => {
                    const importedCount = keys.length;
                    const successMessage = translate('settings_imported');
                    alert(successMessage);
                    
                    // Ã¢Å"â€¦ Wait for saveOnExit to complete before reloading
                    return browser.runtime.sendMessage({ function: "saveOnExit", params: [] });
                })
                .then(() => {
                    // Ã¢Å"â€¦ Send reload message to runtime (like save() and reset() functions do)
                    return browser.runtime.sendMessage({ function: "reload", params: [] });
                })
                .then(() => {
                    // Ã¢Å"â€¦ Add delay before location.reload() (like reset() function does)
                    setTimeout(() => {
                        location.reload();
                    }, 1500);
                })
                .catch(handleError);

        } catch (error) {
            console.error('Import error:', error);
            alert(translate('settings_import_parse_error'));
        }
    };

    fileReader.onerror = function () {
        alert(translate('settings_import_read_error'));
    };

    fileReader.readAsText(file);
}

/**
 * Set up the import file input event handler
 */
function setupImportHandler() {
    const importInput = document.getElementById('importSettings');
    const importButton = document.getElementById('import_settings_btn');
    
    if (importInput && importButton) {
        // Set up the button click to trigger file dialog
        importButton.addEventListener('click', function() {
            importInput.click();
        });
        
        // Set up the file input change handler
        importInput.addEventListener('change', importSettings);
    } else {
        if (!importInput) {
            console.warn('Import input element not found');
        }
        if (!importButton) {
            console.warn('Import button element not found');
        }
    }
}

// ============================================================================
// ORIGINAL SETTINGS FUNCTIONS
// ============================================================================

/**
 * Reset everything to default values.
 */
function reset() {
    const confirmMsg = translate('confirm_reset_settings');
    if (!confirm(confirmMsg)) {
        return;
    }
    
    showStatus(translate('status_resetting_settings'), 'info');
    
    browser.runtime.sendMessage({
        function: "initSettings",
        params: []
    }).then(() => {
        return browser.runtime.sendMessage({
            function: "saveOnExit",
            params: []
        });
    }).then(() => {
        return browser.runtime.sendMessage({
            function: "reload",
            params: []
        });
    }).then(() => {
        showStatus(translate('status_reset_successful'), 'success');
        setTimeout(() => {
            location.reload();
        }, 1500);
    }).catch(error => {
        showStatus(translate('status_reset_failed'), 'error');
    });
}

/**
 * Save all settings.
 */
function save() {
    const saveBtn = document.getElementById('save_settings_btn_text');
    const originalText = saveBtn.textContent;
    
    saveBtn.textContent = translate('status_saving');
    saveBtn.parentElement.disabled = true;
    
    const typesValue = document.querySelector('input[name=types]').value;
    const logLimitValue = Math.max(0, Math.min(5000, parseInt(document.querySelector('input[name=logLimit]').value) || 1000));
    const ruleURLValue = document.querySelector('input[name=ruleURL]').value.trim();
    const hashURLValue = document.querySelector('input[name=hashURL]').value.trim();
    
    // Validate URLs before saving
    let urlValidationPassed = true;
    
    if (ruleURLValue && !isValidURL(ruleURLValue)) {
        showStatus(translate('save_invalid_rule_url'), 'error');
        urlValidationPassed = false;
    }
    
    if (hashURLValue && !isValidURL(hashURLValue)) {
        showStatus(translate('save_invalid_hash_url'), 'error');
        urlValidationPassed = false;
    }
    
    if (!urlValidationPassed) {
        saveBtn.textContent = originalText;
        saveBtn.parentElement.disabled = false;
        return;
    }
    
    // Get current color from picker or fallback to saved value
    let currentColor = settings["badged_color"] || '#FFA500';
    if (linkumoriPicker && linkumoriPicker.getColor) {
        try {
            currentColor = linkumoriPicker.getColor().toHEXA().toString();
        } catch (error) {
        }
    }
    
    // Save all settings
    Promise.all([
        saveData("badged_color", currentColor),
        saveData("types", typesValue),
        saveData("logLimit", logLimitValue),
        saveData("ruleURL", ruleURLValue),
        saveData("hashURL", hashURLValue)
    ])
        .then(() => {
            // Update the settings object and UI
            settings["badged_color"] = currentColor;
            settings["ruleURL"] = ruleURLValue;
            settings["hashURL"] = hashURLValue;
            updateBadgePreview(currentColor);
            updateColorValue(currentColor);
            return browser.runtime.sendMessage({
                function: "setBadgedStatus",
                params: []
            });
        })
        .then(() => browser.runtime.sendMessage({
            function: "saveOnExit",
            params: []
        }))
        .then(() => {
            showStatus(translate('status_save_successful'), 'success');
            saveBtn.textContent = translate('status_saved');
            setTimeout(() => {
                saveBtn.textContent = originalText;
                saveBtn.parentElement.disabled = false;
            }, 2000);
        })
        .then(() => browser.runtime.sendMessage({
            function: "reload",
            params: []
        }))
        .catch(error => {
            showStatus(translate('status_save_failed'), 'error');
            saveBtn.textContent = originalText;
            saveBtn.parentElement.disabled = false;
        });
}

/**
 * Show status message to user
 * @param {string} message - Message to display
 * @param {string} type - Type of message (success, error, info)
 */
function showStatus(message, type = 'info') {
    const statusElement = document.getElementById('statusMessage');
    if (!statusElement) return;
    
    statusElement.textContent = message;
    statusElement.className = `status-message status-${type}`;
    statusElement.style.display = 'block';
    
    // Auto-hide after 5 seconds for success/info messages
    if (type === 'success' || type === 'info') {
        setTimeout(() => {
            statusElement.style.display = 'none';
        }, 5000);
    }
}

/**
 * Get all settings data from storage.
 */
async function getData() {
    try {
        // Load input field values - UPDATED to include URL fields
        await loadData("types");
        await loadData("logLimit");
        await loadData("ruleURL");
        await loadData("hashURL");
        await loadData("remoteRulesEnabled");

        
        // Load color picker value first (but don't apply to DOM yet)
        const colorResponse = await browser.runtime.sendMessage({
            function: "getData",
            params: ["badged_color"]
        });
        
        const savedColor = colorResponse.response || '#FFA500';
        settings["badged_color"] = savedColor;
        
        
        // Don't apply color here - wait for DOM to be ready
        
        // Update log limit label
        const logLimitLabel = document.getElementById('logLimit_label');
        if (logLimitLabel) {
            logLimitLabel.textContent = translate('setting_log_limit_label_with_range');
        }
        
        // Load toggle settings
        await loadData("contextMenuEnabled");
        await loadData("historyListenerEnabled");
        await loadData("localHostsSkipping");
        await loadData("referralMarketing");
        await loadData("domainBlocking");
        await loadData("pingBlocking");
        await loadData("eTagFiltering");
        
        // Load whitelist data
        await loadData("userWhitelist");
        
        // Check browser for ETag support and remove context menu on Android
       const info = await browser.runtime.getPlatformInfo();
        if (info.os === 'android') {
            const contextMenuToggle = document.getElementById('contextMenuEnabled');
            if (contextMenuToggle) {
                // Remove the entire toggle container (parent element)
                contextMenuToggle.parentElement.remove();
            }
        }
        
    } catch (error) {
    }
}

/**
 * Display information about bundled rules with metadata and custom rules - ENHANCED WITH LOCALIZED NUMBERS AND OVERRIDE STATISTICS
 */
function displayBundledRulesInfo() {
    // Get ClearURLsData, rulesMetadata, custom_rules, and merge statistics in parallel
    Promise.all([
        browser.runtime.sendMessage({
            function: "getData",
            params: ["ClearURLsData"]
        }),
        browser.runtime.sendMessage({
            function: "getData", 
            params: ["rulesMetadata"]
        }),
        browser.runtime.sendMessage({
            function: "getData",
            params: ["custom_rules"]
        }),
        browser.runtime.sendMessage({
            function: "getData",
            params: ["hashStatus"]
        }),
        browser.runtime.sendMessage({
            function: "getRuleSourceInfo",
            params: []
        }),
        browser.runtime.sendMessage({
            function: "getMergeStatistics",
            params: []
        })
    ]).then(([rulesResponse, metadataResponse, customRulesResponse, hashStatusResponse, sourceInfoResponse, mergeStatsResponse]) => {
        const rulesData = rulesResponse.response;
        const metadata = metadataResponse.response;
        const customRules = customRulesResponse.response;
        const hashStatus = hashStatusResponse.response;
        const sourceInfo = sourceInfoResponse.response || {};
        const mergeStats = mergeStatsResponse.response || {};
        const statusElement = document.getElementById('bundled_rules_status');
        
        const statusLabel = translate('rules_status_label');

        if (rulesData && rulesData.providers) {
            const providerCount = Object.keys(rulesData.providers).length;
            const ruleCount = Object.values(rulesData.providers)
                .reduce((total, provider) => total + (provider.rules ? provider.rules.length : 0), 0);
            
            if (statusElement) {
                const statusActive = translate('rules_status_active');
                const totalProvidersLabel = translate('rules_total_providers_label');
                const totalRulesLabel = translate('rules_total_rules_label');
                
                // Build basic info HTML with localized numbers
                let html = `
                    <strong>${statusLabel}</strong> ${statusActive}<br>
                    <strong>${totalProvidersLabel}</strong> ${getLocalizedNumber(providerCount)}<br>
                    <strong>${totalRulesLabel}</strong> ${getLocalizedNumber(ruleCount)}
                `;
                
                // Add rule source information
                if (sourceInfo.source) {
                    const sourceLabel = translate('rules_source_label');
                    let sourceText = sourceInfo.source;
                    
                    switch (sourceInfo.source) {
                        case 'remote':
                            sourceText = translate('rules_source_remote');
                            if (sourceInfo.sourceURL) {
                                html += `<br><strong>${sourceLabel}</strong> ${sourceText} (${sourceInfo.sourceURL})`;
                            } else {
                                html += `<br><strong>${sourceLabel}</strong> ${sourceText}`;
                            }
                            break;
                        case 'bundled':
                            sourceText = translate('rules_source_bundled');
                            html += `<br><strong>${sourceLabel}</strong> ${sourceText}`;
                            break;
                        case 'bundled_fallback':
                            sourceText = translate('rules_source_bundled_fallback');
                            html += `<br><strong>${sourceLabel}</strong> ${sourceText}`;
                            break;
                        case 'fallback':
                            sourceText = translate('rules_source_fallback');
                            html += `<br><strong>${sourceLabel}</strong> ${sourceText}`;
                            break;
                        default:
                            html += `<br><strong>${sourceLabel}</strong> ${sourceText}`;
                    }
                }
                
                // ENHANCED: Add provider composition breakdown with localized numbers (only when there are custom rules)
                if (mergeStats && mergeStats.hasCustomRules) {
                    const compositionLabel = translate('rules_composition_label');
                    html += `<br><br><strong>${compositionLabel}</strong><br>`;
                    
                    // Base providers (bundled/remote active after filtering)
                    const baseProvidersLabel = mergeStats.source === 'remote' ? 
                        (translate('active_remote_providers_label')) :
                        (translate('active_bundled_providers_label'));
                    html += `<strong>${baseProvidersLabel}</strong> ${getLocalizedNumber(mergeStats.filteredBundledProviders || 0)}<br>`;
                    
                    // Custom providers breakdown
                    const customProvidersLabel = translate('custom_providers_label');
                    html += `<strong>${customProvidersLabel}</strong> ${getLocalizedNumber(mergeStats.customProviders || 0)}`;
                    
                    // Show override information if any
                    if (mergeStats.hasOverrides) {
                        const overriddenLabel = translate('overridden_providers_label');
                        const newCustomLabel = translate('new_custom_providers_label');
                        html += ` (${overriddenLabel} ${getLocalizedNumber(mergeStats.overriddenProviders)}, ${newCustomLabel} ${getLocalizedNumber(mergeStats.newCustomProviders)})`;
                        
                        // List overridden provider names
                        if (mergeStats.overriddenProviderNames && mergeStats.overriddenProviderNames.length > 0) {
                            const overriddenProvidersLabel = translate('overridden_providers_list_label');
                            html += `<br><strong>${overriddenProvidersLabel}</strong> ${mergeStats.overriddenProviderNames.join(', ')}`;
                        }
                    }
                    
                    // Show composition percentages with localized numbers
                    if (mergeStats.mergeRatio) {
                        const compositionBreakdownLabel = translate('composition_breakdown_label');
                        const bundledPercentage = getLocalizedPercentage(mergeStats.mergeRatio.bundledPercentage);
                        const customPercentage = getLocalizedPercentage(mergeStats.mergeRatio.customPercentage);
                        html += `<br><strong>${compositionBreakdownLabel}</strong> ${bundledPercentage} Base, ${customPercentage} Custom`;
                    }
                }
                // Note: When there are no custom rules, we don't show additional breakdown
                // since "Total Providers" already shows the bundled provider count
                
                // Add metadata info if available with proper spacing
                if (metadata && metadata.name) {
                    const rulesNameLabel = translate('rules_name_label');
                    const rulesVersionLabel = translate('rules_version_label');
                    const rulesLicenseLabel = translate('rules_license_label');
                    const rulesAuthorLabel = translate('rules_author_label');
                    const rulesLastUpdatedLabel = translate('rules_last_updated_label');
                    
                    html += `<br><br><strong>${translate('rules_metadata_section')}</strong><br>`;
                    html += `<strong>${rulesNameLabel}</strong> ${metadata.name}<br>`;
                    html += `<strong>${rulesVersionLabel}</strong> ${metadata.version || 'Unknown'}<br>`;
                    
                    if (metadata.license) {
                        html += `<strong>${rulesLicenseLabel}</strong> ${metadata.license}<br>`;
                    }
                    if (metadata.author) {
                        html += `<strong>${rulesAuthorLabel}</strong> ${metadata.author}<br>`;
                    }
                    if (metadata.lastUpdated) {
                        html += `<strong>${rulesLastUpdatedLabel}</strong> ${metadata.lastUpdated}`;
                    }
                }
                
                // Add hash status info with proper spacing
                if (hashStatus) {
                    const hashStatusLabel = translate('rules_hash_status_label');
                    let statusText = hashStatus;
                    
                    // Translate common hash status values
                switch (hashStatus) {
                    case 'remote_verified':
                        statusText = translate('hashStatus_remote_verified');
                        break;
                    case 'remote_failed':
                        statusText = translate('hashStatus_remote_failed');
                        break;
                    case 'hash_url_missing':
                        statusText = translate('hashStatus_hash_url_missing');
                        break;
                    case 'remote_rules_loaded':
                        statusText = translate('remote_rules_loaded'); // EXISTING KEY
                        break;
                    case 'remote_custom_rules_merged':
                        statusText = translate('hash_status_remote_custom_merged'); // EXISTING KEY
                        break;

                    // Bundled rule states
                    case 'bundled_rules_loaded':
                        statusText = translate('status_builtinOnly'); // EXISTING KEY
                        break;
                    case 'bundled_rules_fallback':
                        statusText = translate('hashStatus_bundled_rules_fallback');
                        break;
                    case 'bundled_fallback_loaded':
                        statusText = translate('hashStatus_bundled_fallback_loaded');
                        break;

                    // Fallback rule states
                    case 'fallback_rules_used':
                        statusText = translate('status_usingFallback'); // EXISTING KEY
                        break;
                    case 'fallback_rules_used_after_remote_failure':
                        statusText = translate('hashStatus_fallback_rules_used_after_remote_failure');
                        break;
                    case 'fallback_rules_loaded':
                        statusText = translate('fallback_rules_loaded'); // EXISTING KEY
                        break;

                    // Cache states (in-memory)
                    case 'cached_rules_used':
                        statusText = translate('status_usingCached'); // EXISTING KEY
                        break;

                    // Remote cache states (persistent cache)
                    case 'cache_remote_rules_no_hashurl':
                        statusText = translate('hashStatus_cache_remote_rules_no_hashurl');
                        break;
                    case 'cache_remote_rules_after_remote_failure':
                        statusText = translate('hashStatus_cache_remote_rules_after_remote_failure');
                        break;
                    case 'cache_remote_rules_after_bundled_failure':
                        statusText = translate('hashStatus_cache_remote_rules_after_bundled_failure');
                        break;

                    // Remote cache + custom rule states
                    case 'cache_remote_custom_rules_no_hashurl':
                        statusText = translate('hashStatus_cache_remote_custom_rules_no_hashurl');
                        break;
                    case 'cache_remote_custom_rules_after_remote_failure':
                        statusText = translate('hashStatus_cache_remote_custom_rules_after_remote_failure');
                        break;
                    case 'cache_remote_custom_rules_after_bundled_failure':
                        statusText = translate('hashStatus_cache_remote_custom_rules_after_bundled_failure');
                        break;

                    // Custom rule states
                    case 'custom_rules_merged':
                        statusText = translate('status_customMerged'); // EXISTING KEY
                        break;
                    case 'custom_rules_failed':
                        statusText = translate('status_customFailed'); // EXISTING KEY
                        break;
                }

                    
                    html += `<br><strong>${hashStatusLabel}</strong> ${statusText}`;
                }
                
                setHTMLContent(statusElement, html);
                statusElement.style.color = 'var(--button-success)';
            }
        } else {
            if (statusElement) {
                setHTMLContent(statusElement, `<strong>${statusLabel}</strong> ${translate('rules_status_not_loaded')}`);
                statusElement.style.color = 'var(--button-danger)';
            }
        }
    }).catch(error => {
        console.error('Error loading rules info:', error);
        const statusElement = document.getElementById('bundled_rules_status');
        if (statusElement) {
            const statusLabel = translate('rules_status_label');
            setHTMLContent(statusElement, `<strong>${statusLabel}</strong> ${translate('rules_status_error')}`);
            statusElement.style.color = 'var(--button-danger)';
        }
    });
}

/**
 * Load data from storage and update UI elements.
 * @param {string} name - Data/variable name
 * @returns {Promise<data>} Requested data
 */
async function loadData(name) {
    return new Promise((resolve, reject) => {
        browser.runtime.sendMessage({
            function: "getData",
            params: [name]
        }).then(data => {
            settings[name] = data.response;
            
            // Update input elements
            const inputElement = document.querySelector(`input[name=${name}]`);
            if (inputElement) {
                inputElement.value = data.response || '';
            }
            
            resolve(data);
        }).catch(error => {
            reject(error);
        });
    });
}

/**
 * Save data to storage.
 * @param {string} key - Key of the data to save
 * @param {*} data - Data to save
 * @returns {Promise<message>} Message from background script
 */
async function saveData(key, data) {
    return new Promise((resolve, reject) => {
        browser.runtime.sendMessage({
            function: "setData",
            params: [key, data]
        }).then(message => {
            resolve(message);
        }).catch(error => {
            reject(error);
        });
    });
}

/**
 * Change the value of a toggle switch.
 * @param {string} id - HTML element ID
 * @param {string} storageID - Storage key ID
 */
function changeSwitchButton(id, storageID) {
    const element = document.getElementById(id);
    
    if (!element) {
        return;
    }

    // Set initial state
    setSwitchButton(id, storageID);

    // Add click handler
    element.onclick = function() {
        const isActive = element.classList.contains('active');
        const newValue = !isActive;
        
        // Update UI immediately
        if (newValue) {
            element.classList.add('active');
        } else {
            element.classList.remove('active');
        }

        // Save to storage
        browser.runtime.sendMessage({
            function: "setData",
            params: [storageID, newValue]
        }).then(() => {
            settings[storageID] = newValue;
            
            // Special handling for globalStatus
            if (storageID === "globalStatus") {
                return browser.runtime.sendMessage({
                    function: "changeIcon",
                    params: []
                });
            }
        }).then(() => {
            return browser.runtime.sendMessage({
                function: "saveOnExit",
                params: []
            });
        }).catch(error => {
            // Revert UI on error
            if (newValue) {
                element.classList.remove('active');
            } else {
                element.classList.add('active');
            }
            const errorMsg = translate('status_save_setting_failed');
            showStatus(errorMsg.replace('%s', storageID), 'error');
        });
    };
}

/**
 * Set the visual state of a toggle switch.
 * @param {string} id - HTML element ID
 * @param {string} varname - Variable name in settings
 */
function setSwitchButton(id, varname) {
    const element = document.getElementById(id);
    if (element && settings[varname] !== undefined) {
        if (settings[varname]) {
            element.classList.add('active');
        } else {
            element.classList.remove('active');
        }
    }
}
function updateRemoteRulesFieldsVisibility() {
    const remoteRulesEnabled = settings.remoteRulesEnabled;
    const ruleURLInput = document.getElementById('ruleURL');
    const hashURLInput = document.getElementById('hashURL');
    const ruleURLLabel = document.getElementById('ruleURL_label');
    const hashURLLabel = document.getElementById('hashURL_label');
    const ruleURLDescription = document.getElementById('ruleURL_description');
    const hashURLDescription = document.getElementById('hashURL_description');
    
    [ruleURLInput, hashURLInput].forEach(input => {
        if (input) {
            input.disabled = !remoteRulesEnabled;
            input.style.opacity = remoteRulesEnabled ? '1' : '0.5';
            if (!remoteRulesEnabled) {
                input.value = '';
                input.placeholder = translate('remote_rules_disabled_placeholder');
            }
        }
    });
    
    [ruleURLLabel, hashURLLabel].forEach(label => {
        if (label) {
            label.style.opacity = remoteRulesEnabled ? '1' : '0.5';
        }
    });
    
    [ruleURLDescription, hashURLDescription].forEach(desc => {
        if (desc) {
            if (remoteRulesEnabled) {
                // Show normal descriptions
                const basicText = desc.id === 'ruleURL_description' ? 
                    translate('setting_rule_url_description') : 
                    translate('setting_hash_url_description');
                const mandatoryText = desc.id === 'ruleURL_description' ? 
                    translate('setting_rule_url_mandatory_hash') : 
                    translate('setting_hash_url_mandatory');
                const securityNotice = translate('remote_rules_security_notice');
                setHTMLContent(desc, `${basicText} ${mandatoryText}<br><small style="color: var(--button-danger);">${securityNotice}</small>`);
            } else {
                // Show disabled message
                const disabledMessage = translate('remote_rules_disabled_description');
                setHTMLContent(desc, `<strong style="color: var(--text-muted);">${disabledMessage}</strong>`);
                desc.style.opacity = '0.7';
            }
        }
    });
}

/**
 * Set the text content for UI elements.
 */
function setText() {
    // Set page title and header
    document.title = translate('settings_html_page_title');
    setElementText('page_title', 'settings_html_page_title');
    setElementText('remote_rules_enabled', 'remote_rules_enabled');
setElementText('remote_rules_enabled_description', 'remote_rules_enabled_description');

    // Import and export 
    document.getElementById('export_settings_btn_text').textContent = translate('setting_html_export_button');
    document.getElementById('export_settings_btn').setAttribute('title', translate('setting_html_export_button_title'));
    document.getElementById('import_settings_btn_text').textContent = translate('setting_html_import_button');
    document.getElementById('importSettings').setAttribute('title', translate('setting_html_import_button_title'));
    
    // Data management section
    setElementText('reset_settings_btn_text', 'setting_html_reset_button');
    
    // General settings section
    setElementText('general_settings_title', 'general_settings_title');
    setElementHTML('types_label', 'setting_types_label');
    setElementText('logLimit_label', 'setting_log_limit_label_with_range');
    
    // Remote URL fields - ENHANCED WITH MANDATORY HASH INFORMATION
    setElementText('ruleURL_label', 'setting_rule_url_label');
    setElementText('ruleURL_description', 'setting_rule_url_description');
    setElementText('hashURL_label', 'setting_hash_url_label');
    setElementText('hashURL_description', 'setting_hash_url_description');
    
    // Set appropriate placeholders - always locked initially (never persisted)
    const ruleURLInput = document.getElementById('ruleURL');
    const hashURLInput = document.getElementById('hashURL');
    
    if (ruleURLInput) {
        ruleURLInput.placeholder = translate('security_confirmation_required_placeholder');
    }
    if (hashURLInput) {
        hashURLInput.placeholder = translate('security_confirmation_required_placeholder');
    }
    
    // Enhanced URL field descriptions with security notice - always locked initially
    const ruleURLDescription = document.getElementById('ruleURL_description');
    if (ruleURLDescription) {
        const basicText = translate('setting_rule_url_description');
        const mandatoryText = translate('setting_rule_url_mandatory_hash');
        const securityNotice = translate('remote_rules_security_notice');
        const restrictionNotice = translate('remote_rules_restriction_notice');
        
        // Always show restriction notice initially since consent is never persisted
        setHTMLContent(ruleURLDescription, `${basicText} ${mandatoryText}<br><small style="color: var(--button-danger);">${securityNotice}</small><br><strong style="color: var(--button-primary);">${restrictionNotice}</strong>`);
    }
    
    const hashURLDescription = document.getElementById('hashURL_description');
    if (hashURLDescription) {
        const basicText = translate('setting_hash_url_description');
        const mandatoryText = translate('setting_hash_url_mandatory');
        const securityNotice = translate('remote_rules_security_notice');
        const restrictionNotice = translate('remote_rules_restriction_notice');
        
        // Always show restriction notice initially since consent is never persisted
        setHTMLContent(hashURLDescription, `${basicText} ${mandatoryText}<br><small style="color: var(--button-danger);">${securityNotice}</small><br><strong style="color: var(--button-primary);">${restrictionNotice}</strong>`);
    }
    
    // Appearance settings section
    setElementText('appearance_settings_title', 'appearance_settings_title');
    setElementText('badge_color_label', 'badge_color_label');
    setElementText('badge_preview_label', 'badge_preview_label');
    setElementText('badge_color_description', 'badge_color_description');
    
    // Theme selection section
    setElementText('theme_selection_label', 'theme_selection_label');
    setElementText('theme_description', 'theme_description');
    setElementText('theme_name_light', 'theme_name_light');
    setElementText('theme_name_dark', 'theme_name_dark');
    setElementText('theme_name_midnight', 'theme_name_midnight');
    setElementText('theme_name_forest', 'theme_name_forest');
    setElementText('theme_name_sunset', 'theme_name_sunset');
    // Language selector section
setElementText('language_selector_label', 'language_selector_label');
setElementText('language_selector_description', 'language_selector_description');

// Whitelist examples
setElementHTML('whitelist_examples_text', 'whitelist_examples_text');
    
    // Feature toggles section
    setElementText('feature_toggles_title', 'feature_toggles_title');
    setElementText('domain_blocking_enabled', 'domain_blocking_enabled');
    setElementText('domain_blocking_enabled_description', 'domain_blocking_enabled_description');
    setElementText('local_hosts_skipping', 'local_hosts_skipping');
    setElementText('local_hosts_skipping_description', 'local_hosts_skipping_description');
    setElementText('history_listener_enabled', 'history_listener_enabled');
    setElementText('history_listener_enabled_description', 'history_listener_enabled_description');
    setElementText('context_menu_enabled', 'context_menu_enabled');
    setElementText('context_menu_enabled_description', 'context_menu_enabled_description');
    setElementText('referral_marketing_enabled', 'referral_marketing_enabled');
    setElementText('referral_marketing_enabled_description', 'referral_marketing_enabled_description');
    setElementText('ping_blocking_enabled', 'ping_blocking_enabled');
    setElementText('ping_blocking_enabled_description', 'ping_blocking_enabled_description');
    setElementText('eTag_filtering_enabled', 'eTag_filtering_enabled');
    setElementText('eTag_filtering_enabled_description', 'eTag_filtering_enabled_description');
    
    // Whitelist section
    setElementText('whitelist_section_title', 'whitelist_section_title');
    setElementText('whitelist_section_description', 'whitelist_section_description');
    setElementText('whitelist_add_label', 'whitelist_add_label');
    setElementText('whitelist_add_button', 'whitelist_add_button');
    setElementText('whitelist_list_label', 'whitelist_list_label');

    // Rules section
    setElementText('bundled_rules_section_title', 'bundled_rules_section_title');
    setElementText('bundled_rules_description', 'bundled_rules_description');
    
    // Save section
    setElementText('save_settings_btn_text', 'settings_html_save_button');
    
    // Set tooltips
    setElementTooltip('reset_settings_btn', 'setting_html_reset_button_title');
    setElementTooltip('save_settings_btn', 'settings_html_save_button_title');
}

/**
 * Helper function to safely set element text content
 * @param {string} id - Element ID
 * @param {string} translationKey - Translation key
 */
function setElementText(id, translationKey) {
    const element = document.getElementById(id);
    if (element) {
        const text = translate(translationKey);
        if (text) {
            element.textContent = text;
        }
    }
}
/**
 * Helper function to safely set element HTML content
 * @param {string} id - Element ID
 * @param {string} translationKey - Translation key
 */
function setElementHTML(id, translationKey) {
    const element = document.getElementById(id);
    if (element) {
        const html = translate(translationKey);
        if (html) {
            setHTMLContent(element, html);
        }
    }
}
/**
 * Helper function to safely set element tooltip
 * @param {string} id - Element ID
 * @param {string} translationKey - Translation key
 */
function setElementTooltip(id, translationKey) {
    const element = document.getElementById(id);
    if (element) {
        const tooltip = translate(translationKey);
        if (tooltip) {
            element.setAttribute('title', tooltip);
        }
    }
}

/**
 * Translate a string with the i18n API.
 * @param {string} string - Name of the attribute used for localization
 * @param {...(string|number)} placeholders - Array of placeholders
 * @returns {string} Translated string or empty string if translation fails
 */
function translate(string, ...placeholders) {
    try {
        return LinkumoriI18n.getMessage(string, placeholders) || '';
    } catch (error) {
        return '';
    }
}

/**
 * Handle successful responses from background script
 * @param {Object} message - Response message
 */
function handleResponse(message) {
}

/**
 * Handle errors gracefully
 * @param {Error} error - Error object
 */
function handleError(error) {
}

// For testing/admin purposes - call from console
window.resetLinkumoriSecurity = resetSecurityConfirmation;
