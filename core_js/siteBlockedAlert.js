/**
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
 *
 * Modified Version:
 * @author      Subham Mahesh (c) 2025
 * @license     LGPL-3.0-or-later
 * @repository  https://github.com/linkumori/linkumori
 *   
 * Modifications include:
 * - Added theme support
 * - Fixed syntax errors and improved code structure
 * - Added proper initialization flow
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
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

/**
 * Translate a string with the i18n API.
 * @param {string} string Name of the attribute used for localization
 * @returns {string} Translated string
 */
const THEME_STORAGE_KEY = 'linkumori-theme';
const LAST_DARK_THEME_STORAGE_KEY = 'linkumori-last-dark-theme';

function translate(string) {
    try {
        return LinkumoriI18n.getMessage(string) || string;
    } catch (error) {
        console.warn('Translation failed for:', string);
        return string;
    }
}

function setHTMLContent(element, html) {
    if (!element) return;
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<!doctype html><body>${html || ''}</body>`, 'text/html');
    element.replaceChildren(...Array.from(doc.body.childNodes));
}

/**
 * Set translated text content for page elements
 */
function setText() {
    try {
        document.title = translate('blocked_html_title');
        
        const titleElement = document.getElementById('title');
        if (titleElement) {
            setHTMLContent(titleElement, translate('blocked_html_title'));
        }
        
        const bodyElement = document.getElementById('body');
        if (bodyElement) {
            setHTMLContent(bodyElement, translate('blocked_html_body'));
        }
        
        const pageElement = document.getElementById('page');
        if (pageElement) {
            pageElement.textContent = translate('blocked_html_button');
        }
    } catch (error) {
        console.error('Error setting text:', error);
    }
}

/**
 * Initialize theme system
 */
function initializeTheme() {
    try {
        if (typeof browser !== 'undefined' && browser.storage && browser.storage.local) {
            browser.storage.local.get([THEME_STORAGE_KEY]).then(result => {
                const savedTheme = result[THEME_STORAGE_KEY] || 'dark';
                document.documentElement.setAttribute('data-theme', savedTheme);
                updateThemeIcons(savedTheme);
            }).catch(error => {
                console.warn('Failed to load theme from browser storage:', error);
                document.documentElement.setAttribute('data-theme', 'dark');
                updateThemeIcons('dark');
            });
            return;
        }

        document.documentElement.setAttribute('data-theme', 'dark');
        updateThemeIcons('dark');
    } catch (error) {
        console.error('Error initializing theme:', error);
        // Fallback to dark theme
        document.documentElement.setAttribute('data-theme', 'dark');
    }
}

/**
 * Toggle between light and dark themes
 */
function toggleTheme() {
    try {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const applyAndSaveTheme = async () => {
            let newTheme = 'dark';
            const payload = {};

            if (currentTheme === 'light') {
                const result = await browser.storage.local.get([LAST_DARK_THEME_STORAGE_KEY]);
                newTheme = result[LAST_DARK_THEME_STORAGE_KEY] || 'dark';
            } else {
                payload[LAST_DARK_THEME_STORAGE_KEY] = currentTheme;
                newTheme = 'light';
            }

            payload[THEME_STORAGE_KEY] = newTheme;
            document.documentElement.setAttribute('data-theme', newTheme);
            updateThemeIcons(newTheme);
            await browser.storage.local.set(payload);
        };

        if (typeof browser !== 'undefined' && browser.storage && browser.storage.local) {
            applyAndSaveTheme().catch(error => {
                console.warn('Failed to save theme to browser storage:', error);
            });
        }
    } catch (error) {
        console.error('Error toggling theme:', error);
    }
}

/**
 * Update theme icons based on current theme
 * @param {string} theme - Current theme name
 */
function updateThemeIcons(theme) {
    try {
        const themeIcon = document.getElementById('themeIcon');
        if (!themeIcon) return;
        
        themeIcon.classList.remove('icon-theme-dark', 'icon-theme-light');
        
        if (theme === 'light') {
            themeIcon.classList.add('icon-theme-light');
            themeIcon.setAttribute('aria-label', translate('theme_light'));
        } else {
            themeIcon.classList.add('icon-theme-dark');
            themeIcon.setAttribute('aria-label', translate('theme_dark'));
        }
    } catch (error) {
        console.error('Error updating theme icons:', error);
    }
}

/**
 * Generic error handler for async operations
 * @param {Error} err - Error object
 */
function handleError(err) {
    console.error('An error occurred:', err);
    
    // Clear any output areas on error
    const cleanTArea = document.getElementById('outputUrls');
    if (cleanTArea) {
        cleanTArea.value = '';
    }
}

/**
 * Set up the page URL from query parameters
 */
function setupPageURL() {
    try {
        const source = new URLSearchParams(window.location.search).get("source");
        const pageElement = document.getElementById('page');
        
        if (source && pageElement) {
            pageElement.href = decodeURIComponent(source);
        }
    } catch (error) {
        console.error('Error setting up page URL:', error);
    }
}

/**
 * Initialize the page
 */
function initializePage() {
    // Initialize theme first
    initializeTheme();
    
    // Wait for LinkumoriI18n to be ready, then set text and URL
    LinkumoriI18n.ready().then(() => {
        setText();
        setupPageURL();
    }).catch(error => {
        console.error('Error initializing i18n:', error);
        // Fallback - try to set URL anyway
        setupPageURL();
    });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePage);
} else {
    initializePage();
}

// Listen for browser storage changes
if (typeof browser !== 'undefined' && browser.storage && browser.storage.onChanged) {
    browser.storage.onChanged.addListener((changes) => {
        if (changes[THEME_STORAGE_KEY]?.newValue) {
            const newTheme = changes[THEME_STORAGE_KEY].newValue;
            document.documentElement.setAttribute('data-theme', newTheme);
            updateThemeIcons(newTheme);
        }
    });
}
