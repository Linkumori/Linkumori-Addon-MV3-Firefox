/* 
 * ClearURLs
* Copyright (c) 2017-2020 Kevin Röbert *
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
 * LICENSING NOTICE:

 * 
 * Modifications include:
 * - added copyurl button and theme fuctionality
 * - integrated LinkumoriI18n for internationalization
 

 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
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
/*jshint esversion: 6 */
var cleanedURLs = [];
var i = 0;
var length = 0;
const THEME_STORAGE_KEY = 'linkumori-theme';
const LAST_DARK_THEME_STORAGE_KEY = 'linkumori-last-dark-theme';

function loadSavedTheme() {
    return browser.storage.local.get([THEME_STORAGE_KEY])
        .then(result => result[THEME_STORAGE_KEY] || 'dark')
        .catch(() => 'dark');
}

function getSavedDarkTheme() {
    return browser.storage.local.get([LAST_DARK_THEME_STORAGE_KEY])
        .then(result => result[LAST_DARK_THEME_STORAGE_KEY] || 'dark')
        .catch(() => 'dark');
}

/**
* Load only when document is ready
*/
document.addEventListener('DOMContentLoaded', function() {
    LinkumoriI18n.ready().then(() => {
        setText();
        loadSavedTheme().then(savedTheme => {
            document.documentElement.setAttribute('data-theme', savedTheme);
            updateThemeIcons(savedTheme);
        });

        document.getElementById('cleanUrlsButton').onclick = cleanURLs;
        document.getElementById('copyUrlsButton').onclick = copyUrls;
        document.getElementById('themeToggle').onclick = toggleTheme;
    });
});

/**
* This function cleans all URLs line by line in the textarea.
*/
function cleanURLs() {
    const cleanTArea = document.getElementById('outputUrls');
    const dirtyTArea = document.getElementById('inputUrls');
    const urls = dirtyTArea.value.split('\n').filter(url => url.trim() !== ''); // Filter out empty lines
    cleanedURLs = [];
    length = urls.length;

    if (length === 0) {
        cleanTArea.value = ''; // Clear output if no URLs are entered
        return;
    }

    // Reset i for each cleaning operation
    i = 0;
    urls.forEach((url, index) => {
        browser.runtime.sendMessage({
            function: "pureCleaning",
            params: [url]
        }).then((data) => {
            cleanedURLs.push(data.response);
            if (index === length - 1) { // Check if it's the last URL processed
                cleanTArea.value = cleanedURLs.join('\n');
            }
        }, handleError);
    });
}

/**
 * Copies the cleaned URLs to the clipboard.
 */
function copyUrls() {
    const outputUrls = document.getElementById('outputUrls');
    if (outputUrls.value.trim() === '') {
        showCopyStatus(translate('copy_urls_empty')); // Use translated message
        return;
    }

    navigator.clipboard.writeText(outputUrls.value).then(() => {
        showCopyStatus(translate('copy_urls_success')); // Use translated message
    }).catch(err => {
        console.error('Failed to copy URLs: ', err);
        showCopyStatus(translate('copy_urls_fail')); // Use translated message
    });
}

/**
 * Shows a temporary status message for copy operations.
 * @param {string} message The message to display.
 */
function showCopyStatus(message) {
    const copyStatus = document.getElementById('copyStatus');
    copyStatus.textContent = message;
    copyStatus.style.display = 'block';
    setTimeout(() => {
        copyStatus.style.display = 'none';
    }, 2000); // Hide after 2 seconds
}

/**
* Translate a string with LinkumoriI18n or fallback to browser.i18n API.
*
* @param {string} string Name of the attribute used for localization
*/
function translate(string)
{
    return LinkumoriI18n.getMessage(string);
}

/**
* Set the text for the UI.
*/
function setText()
{
    document.title = translate('cleanUrlsToolTitle').textContent = translate('cleanUrlsToolTitle');
    document.getElementById('headerTitle').textContent = translate('cleanUrlsToolHeader');
    document.getElementById('inputUrlsDescription').textContent = translate('inputUrlsDescription');
    document.getElementById('cleanUrlsButton').textContent = translate('cleanUrlsButton');
    document.getElementById('copyUrlsButton').textContent = translate('copyUrlsButton');
    document.getElementById('inputUrlsTitle').textContent = translate('inputUrlsTitle');
    document.getElementById('cleanedUrlsTitle').textContent = translate('cleanedUrlsTitle');
    document.getElementById('inputUrls').placeholder = translate('inputUrlsPlaceholder');
    document.getElementById('outputUrls').placeholder = translate('cleanedUrlsPlaceholder');
}

/**
 * Toggles the theme between 'light' and 'dark'.
 */function initializeTheme() {
    const themeToggle = document.getElementById('themeToggle');
    loadSavedTheme().then(savedTheme => {
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeIcons(savedTheme);
    });

    if (themeToggle) {
        themeToggle.onclick = toggleTheme;
    }
}

if (browser?.storage?.onChanged) {
    browser.storage.onChanged.addListener((changes) => {
        if (changes[THEME_STORAGE_KEY]?.newValue) {
            const newTheme = changes[THEME_STORAGE_KEY].newValue;
            document.documentElement.setAttribute('data-theme', newTheme);
            updateThemeIcons(newTheme);
        }
    });
}

/* ---------------------
   Minimal helper fixes
   (kept separate & minimal)
   --------------------- */

/**
 * Generic error handler used by async operations
 */
function handleError(err) {
    console.error('An error occurred:', err);
    const cleanTArea = document.getElementById('outputUrls');
    if (cleanTArea) {
        cleanTArea.value = ''; // keep behavior simple and visible
    }
}

/**
 * Minimal toggleTheme implementation used earlier in DOMContentLoaded
 */
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    if (currentTheme === 'light') {
        getSavedDarkTheme().then(newTheme => {
            document.documentElement.setAttribute('data-theme', newTheme);
            updateThemeIcons(newTheme);
            browser.storage.local.set({
                [THEME_STORAGE_KEY]: newTheme
            }).catch(() => {});
        });
        return;
    }

    const newTheme = 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    updateThemeIcons(newTheme);
    browser.storage.local.set({
        [LAST_DARK_THEME_STORAGE_KEY]: currentTheme,
        [THEME_STORAGE_KEY]: newTheme
    }).catch(() => {});
}

/**
 * Minimal updateThemeIcons to match existing usage (defensive)
 */
function updateThemeIcons(theme) {
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
}
