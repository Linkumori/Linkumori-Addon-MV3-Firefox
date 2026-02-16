/**
 * ClearURLs
 * Copyright (c) 2017-2020 Kevin Röbert
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
 *  * This program is free software: you can redistribute it and/or modify
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
 * Modifications include:
 * - Removed bloated datatables library and implemented a dependency-free vanilla JS solution.
 * - Unified i18n messages.json for a consistent user experience.
 * - Added full client-side pagination controls.
 * - Complete internationalization support with number localization.
 * - DataTables-style features and responsive design.
 * - Removed all inline CSS styling in favor of CSS classes.
 * - Added time-based sorting functionality.
 * - Promise-based LinkumoriI18n.ready() implementation.
 * - Improved timestamp handling for localized dates.
 * - Full number localization for all pagination elements.
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

/**
 * Internationalization helper function
 * Uses browser extension i18n API
 */
function translate(key, placeholders = []) {
    try {
        let message = LinkumoriI18n.getMessage(key, placeholders);
        return message || key;
    } catch (error) {
        console.warn('Translation error for key:', key, error);
        return key;
    }
}

/**
 * Localize numbers helper function
 */
function localizeNumber(number) {
    try {
        if (typeof LinkumoriI18n !== 'undefined' && LinkumoriI18n.isReady()) {
            return LinkumoriI18n.localizeNumbers(String(number));
        }
        return String(number);
    } catch (error) {
        console.warn('Number localization error:', error);
        return String(number);
    }
}

/**
 * Set all i18n text content in the UI
 */
function setI18nText() {
    // Page title
    document.title = translate('log_html_page_title');
    
    // Header
    const pageTitle = document.getElementById('page_title');
    if (pageTitle) pageTitle.textContent = translate('log_html_page_title');
    
    // Apply i18n to all elements with data-i18n attribute (except the timestamp header)
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translation = translate(key);
        
        // Skip the timestamp header since it contains the sort button
        if (element.id === 'head_4') {
            return;
        }
        
        if (element.tagName === 'INPUT') {
            element.value = translation;
        } else {
            element.textContent = translation;
        }
    });
    
    // Apply i18n to placeholder attributes
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        element.placeholder = translate(key);
    });
    
    // Apply i18n to title attributes
    document.querySelectorAll('[data-i18n-title]').forEach(element => {
        const key = element.getAttribute('data-i18n-title');
        element.title = translate(key);
    });
    
    // Set table headers specifically (preserving sort button for timestamp)
    document.getElementById('head_1').textContent = translate('log_html_table_head_1');
    document.getElementById('head_2').textContent = translate('log_html_table_head_2');
    document.getElementById('head_3').textContent = translate('log_html_table_head_3');
    
    // Handle timestamp header specially to preserve sort button
    const timestampHeader = document.getElementById('head_4');
    const sortButton = document.getElementById('time-sort-btn');
    if (timestampHeader && sortButton) {
        // Clear text content but preserve the sort button
        const textNode = document.createTextNode(translate('log_html_table_head_4'));
        // Remove all text nodes but keep the sort button
        Array.from(timestampHeader.childNodes).forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
                timestampHeader.removeChild(node);
            }
        });
        // Insert text before the sort button
        timestampHeader.insertBefore(textNode, sortButton);
    }
    
    // Set button texts
    document.getElementById('reset_log_btn_text').textContent = translate('log_html_reset_button');
    document.getElementById('export_log_btn_text').textContent = translate('log_html_export_button');
    document.getElementById('import_log_btn_text').textContent = translate('log_html_import_button');
    
    // Set button titles for accessibility
    document.getElementById('reset_log_btn').setAttribute('title', translate('log_html_reset_button_title'));
    document.getElementById('export_log_btn').setAttribute('title', translate('log_html_export_button_title'));
    document.getElementById('import_log_btn').setAttribute('title', translate('log_html_import_button_title'));
    
    // Localize length selector option display text (preserve values for JavaScript logic)
    const lengthSelect = document.getElementById('length_select');
    if (lengthSelect) {
        Array.from(lengthSelect.options).forEach(option => {
            // Only localize numeric options, skip the "Show All" option
            if (option.value !== '-1' && !isNaN(Number(option.value))) {
                option.textContent = localizeNumber(option.value);
            }
        });
    }
}

/**
 * Reset the global log
 */
function resetGlobalLog() {
    LinkumoriI18n.ready().then(() => {
        if (confirm(translate('log_html_reset_confirm'))) {
            let obj = {"log": []};
            browser.runtime.sendMessage({
                function: "setData",
                params: ['log', JSON.stringify(obj)]
            }).then(() => {
                location.reload();
            }).catch(handleError);
        }
    }).catch(error => {
        console.warn('I18n not ready for resetGlobalLog, using fallback');
        if (confirm('Are you sure you want to reset the log?')) {
            let obj = {"log": []};
            browser.runtime.sendMessage({
                function: "setData",
                params: ['log', JSON.stringify(obj)]
            }).then(() => {
                location.reload();
            }).catch(handleError);
        }
    });
}

/**
 * This function exports the global log as a JSON file.
 */
function exportGlobalLog() {
    browser.runtime.sendMessage({
        function: "getData",
        params: ['log']
    }).then((data) => {
        let blob = new Blob([JSON.stringify(data.response, null, 2)], {type: 'application/json'});
        browser.downloads.download({
            'url': URL.createObjectURL(blob),
            'filename': 'ClearURLsLogExport.json',
            'saveAs': true
        }).catch(handleError);
    }).catch(handleError);
}

/**
 * This function imports an exported global log and overwrites the old one.
 */
function importGlobalLog(evt) {
    let file = evt.target.files[0];
    if (!file) return;
    
    let fileReader = new FileReader();

    fileReader.onload = function(e) {
        LinkumoriI18n.ready().then(() => {
            try {
                // Basic validation to ensure it's a log file
                const importedData = JSON.parse(e.target.result);
                if (!importedData || !Array.isArray(importedData.log)) {
                    throw new Error(translate('log_html_import_error_invalid_format'));
                }
                browser.runtime.sendMessage({
                    function: "setData",
                    params: ["log", e.target.result]
                }).then(() => {
                    location.reload();
                }, handleError);
            } catch(err) {
                alert(translate('log_html_import_error') + `\n${err.message}`);
                handleError(err);
            }
        }).catch(error => {
            console.warn('I18n not ready for importGlobalLog, using fallback');
            try {
                const importedData = JSON.parse(e.target.result);
                if (!importedData || !Array.isArray(importedData.log)) {
                    throw new Error('Invalid log format');
                }
                browser.runtime.sendMessage({
                    function: "setData",
                    params: ["log", e.target.result]
                }).then(() => {
                    location.reload();
                }, handleError);
            } catch(err) {
                alert('Import error: ' + err.message);
                handleError(err);
            }
        });
    };
    fileReader.readAsText(file);
}

/**
 * Convert timestamp to date string - IMPROVED VERSION
 * Handles both numeric timestamps and localized date strings
 */
function toDate(time) {
    if (!time) return '';
    
    // LinkumoriI18n handles the conversion internally
    if (window.LinkumoriI18n?.isReady()) {
        return LinkumoriI18n.formatDate(time, 'DD/MM/YYYY, HH:mm:ss');
    }
    
    // Fallback also handles conversion
    return new Date(time).toLocaleString();
}


    

    
    // LinkumoriI18n handles the conversion internally

function handleError(error) {
    console.error(`Error: ${error}`);
}

/**
 * Sort logs by timestamp
 */
function sortLogByTime(logs, order = 'desc') {
    return [...logs].sort((a, b) => {
        // Handle both numeric timestamps and string timestamps
        let timeA = a.timestamp || 0;
        let timeB = b.timestamp || 0;
        
        // Convert string timestamps to numbers if possible
        if (typeof timeA === 'string' && !isNaN(Number(timeA))) {
            timeA = Number(timeA);
        } else if (typeof timeA === 'string') {
            // For localized date strings, try to extract a sortable value
            // This is a fallback - ideally we should store numeric timestamps
            timeA = 0;
        }
        
        if (typeof timeB === 'string' && !isNaN(Number(timeB))) {
            timeB = Number(timeB);
        } else if (typeof timeB === 'string') {
            timeB = 0;
        }
        
        return order === 'desc' ? timeB - timeA : timeA - timeB;
    });
}

/**
 * Update sort button appearance
 */
function updateSortButton(sortOrder) {
    const timeSortBtn = document.getElementById('time-sort-btn');
    if (timeSortBtn) {
        timeSortBtn.className = `sort-button active ${sortOrder}`;
        timeSortBtn.setAttribute('title', 
            sortOrder === 'desc' ? 'Click to show oldest first' : 'Click to show newest first'
        );
    }
}

/**
 * Initialize theme on page load
 */
function initializeTheme() {
    const savedTheme = localStorage.getItem('linkumori-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

/**
 * DataTables-style state persistence
 */
function saveState() {
    const state = {
        page: window.currentPage || 1,
        length: parseInt(document.getElementById('length_select').value),
        search: document.getElementById('search_input').value,
        sortOrder: window.sortOrder || 'desc',
        time: Date.now()
    };
    localStorage.setItem('linkumori-log-state', JSON.stringify(state));
}

function loadState() {
    try {
        const saved = localStorage.getItem('linkumori-log-state');
        if (saved) {
            const state = JSON.parse(saved);
            // Only restore if less than 1 hour old (like DataTables)
            if (Date.now() - state.time < 3600000) {
                window.currentPage = state.page || 1;
                window.sortOrder = state.sortOrder || 'desc';
                document.getElementById('length_select').value = state.length || 25;
                document.getElementById('search_input').value = state.search || '';
                return true;
            }
        }
    } catch (e) {
        console.warn('Failed to load pagination state:', e);
    }
    return false;
}

/**
 * Show/hide loading indicator
 */
function showLoading(show = true) {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        if (show) {
            loadingOverlay.classList.add('show');
        } else {
            loadingOverlay.classList.remove('show');
        }
    }
}

/**
 * Show user-friendly error message
 */
function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.animation = 'slideIn 0.3s ease';
    
    document.body.appendChild(errorDiv);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (errorDiv.parentNode) {
                    errorDiv.parentNode.removeChild(errorDiv);
                }
            }, 300);
        }
    }, 5000);
}

/**
 * DataTables pagination logic with responsive button count
 */
function getPageNumbers(totalPages, currentPage, maxButtons = 7) {
    const pages = [];
    const half = Math.floor(maxButtons / 2);
    const showFirstLast = maxButtons >= 5;
    
    // Helper function to create range of numbers
    function range(start, end) {
        const result = [];
        for (let i = start; i < end; i++) {
            result.push(i);
        }
        return result;
    }
    
    // If total pages fit within max buttons, show all
    if (totalPages <= maxButtons) {
        return range(1, totalPages + 1);
    }
    
    // Handle special cases for mobile/small screens
    if (maxButtons === 3) {
        if (currentPage <= 1) {
            return [1, 2, '...'];
        } else if (currentPage >= totalPages) {
            return ['...', totalPages - 1, totalPages];
        } else {
            return ['...', currentPage, '...'];
        }
    }
    
    if (maxButtons === 5) {
        if (currentPage <= 2) {
            return [1, 2, 3, '...', totalPages];
        } else if (currentPage >= totalPages - 1) {
            return [1, '...', totalPages - 2, totalPages - 1, totalPages];
        } else {
            return [1, '...', currentPage, '...', totalPages];
        }
    }
    
    // Main logic for larger button counts (DataTables standard)
    const boundarySize = showFirstLast ? 2 : 1;
    const leftOffset = showFirstLast ? 1 : 0;
    
    if (currentPage <= half) {
        // Near the beginning
        pages.push(...range(1, maxButtons - boundarySize + 1));
        pages.push('...');
        if (showFirstLast) {
            pages.push(totalPages);
        }
    } else if (currentPage >= totalPages - half) {
        // Near the end
        if (showFirstLast) {
            pages.push(1);
        }
        pages.push('...');
        pages.push(...range(totalPages - (maxButtons - boundarySize) + 1, totalPages + 1));
    } else {
        // In the middle
        if (showFirstLast) {
            pages.push(1);
        }
        pages.push('...');
        pages.push(...range(currentPage - half + leftOffset, currentPage + half - leftOffset + 1));
        pages.push('...');
        if (showFirstLast) {
            pages.push(totalPages);
        }
    }
    
    return pages;
}

/**
 * Create properly styled pagination button with CSS classes
 * NOW WITH LOCALIZED NUMBERS!
 */
function createPaginationButton(text, onClick, action = null) {
    const button = document.createElement('button');
    
    // Localize the button text if it's a number
    if (typeof text === 'number' || (typeof text === 'string' && !isNaN(Number(text)))) {
        button.textContent = localizeNumber(text);
    } else {
        button.textContent = text;
    }
    
    button.className = 'pagination-btn';
    button.addEventListener('click', onClick);
    if (action) {
        button.setAttribute('data-action', action);
    }
    
    return button;
}

/**
 * Show language change status message
 */
function showLanguageChangeStatus(langCode, type) {
    LinkumoriI18n.ready().then(() => {
        const statusElement = document.getElementById('statusMessage');
        if (!statusElement) return;

        const langInfo = LANGUAGE_MAPPINGS[langCode];
        let message;
        
        if (type === 'success') {
            message = translate('status_language_changed_success', langInfo.native);
            statusElement.className = 'status-message status-success';
        } else {
            message = translate('status_language_change_failed', langInfo.native);
            statusElement.className = 'status-message status-error';
        }
        
        statusElement.textContent = message;
        statusElement.style.display = 'block';
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            statusElement.style.display = 'none';
        }, 3000);
    }).catch(error => {
        console.warn('I18n not ready for showLanguageChangeStatus');
    });
}

/**
 * Initialize the main application
 * This function contains all the main application logic that needs to run after i18n is ready
 */
function initializeApplication() {
    // Initialize theme first (doesn't need i18n)
    initializeTheme();

    // --- State variables ---
    let fullLog = [];
    window.currentPage = 1;
    window.sortOrder = 'desc'; // Default to newest first

    // --- DOM element references ---
    const tbody = document.getElementById('tbody');
    const searchInput = document.getElementById('search_input');
    const lengthSelect = document.getElementById('length_select');
    const paginationInfo = document.getElementById('pagination-info');
    const paginationControls = document.getElementById('pagination-controls');
    const timeSortBtn = document.getElementById('time-sort-btn');

    // Handle sort button click
    if (timeSortBtn) {
        timeSortBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            window.sortOrder = window.sortOrder === 'desc' ? 'asc' : 'desc';
            updateSortButton(window.sortOrder);
            window.currentPage = 1; // Reset to first page when sorting
            renderTable();
        });
    }

    // Enhanced renderTable with loading states and sorting
    function renderTable() {
        showLoading(true);
        
        // Use setTimeout to allow UI to update before heavy computation
        setTimeout(() => {
            LinkumoriI18n.ready().then(() => {
                try {
                    // 1. Sort by timestamp first
                    const sortedLog = sortLogByTime(fullLog, window.sortOrder);

                    // 2. Filter
                    const searchTerm = searchInput.value.toLowerCase();
                    const filteredLog = searchTerm
                        ? sortedLog.filter(entry =>
                            (entry.before && entry.before.toLowerCase().includes(searchTerm)) ||
                            (entry.after && entry.after.toLowerCase().includes(searchTerm)) ||
                            (entry.rule && entry.rule.toLowerCase().includes(searchTerm))
                          )
                        : sortedLog;

                    // 3. Paginate
                    const itemsPerPage = parseInt(lengthSelect.value, 10);
                    const totalItems = filteredLog.length;
                    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
                    if (window.currentPage > totalPages) {
                        window.currentPage = totalPages;
                    }

                    const startIndex = (window.currentPage - 1) * itemsPerPage;
                    const endIndex = startIndex + itemsPerPage;
                    const paginatedLog = itemsPerPage === -1 ? filteredLog : filteredLog.slice(startIndex, endIndex);

                    // 4. Render Table Rows
                    tbody.innerHTML = '';
                    if (paginatedLog.length === 0) {
                        const row = tbody.insertRow();
                        row.className = 'empty-row';
                        const cell = row.insertCell(0);
                        cell.colSpan = 4;
                        cell.textContent = searchTerm ? translate('datatable_zero_records') : translate('datatable_empty_table');
                    } else {
                        paginatedLog.forEach(log => {
                            const row = tbody.insertRow();
                            row.insertCell(0).textContent = log.before;
                            row.insertCell(1).textContent = log.after;
                            row.insertCell(2).textContent = log.rule;
                            row.insertCell(3).textContent = toDate(log.timestamp);
                        });
                    }
                    
                    // 5. Render Pagination Controls
                    if (itemsPerPage !== -1) {
                        renderPagination(totalItems, totalPages, startIndex, Math.min(endIndex, totalItems));
                    } else {
                        // Show all entries, no pagination needed - WITH LOCALIZED NUMBERS
                        paginationInfo.textContent = translate('datatable_showing_all', [localizeNumber(totalItems)]);
                        paginationControls.innerHTML = '';
                    }
                    
                    showLoading(false);
                    saveState(); // Save state after successful render
                } catch (error) {
                    showLoading(false);
                    handleError(error);
                    showErrorMessage(translate('error_rendering_table'));
                }
            }).catch(error => {
                console.warn('I18n not ready for renderTable, using fallback');
                try {
                    // Fallback rendering without translations
                    const sortedLog = sortLogByTime(fullLog, window.sortOrder);
                    const searchTerm = searchInput.value.toLowerCase();
                    const filteredLog = searchTerm
                        ? sortedLog.filter(entry =>
                            (entry.before && entry.before.toLowerCase().includes(searchTerm)) ||
                            (entry.after && entry.after.toLowerCase().includes(searchTerm)) ||
                            (entry.rule && entry.rule.toLowerCase().includes(searchTerm))
                          )
                        : sortedLog;

                    const itemsPerPage = parseInt(lengthSelect.value, 10);
                    const totalItems = filteredLog.length;
                    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
                    if (window.currentPage > totalPages) {
                        window.currentPage = totalPages;
                    }

                    const startIndex = (window.currentPage - 1) * itemsPerPage;
                    const endIndex = startIndex + itemsPerPage;
                    const paginatedLog = itemsPerPage === -1 ? filteredLog : filteredLog.slice(startIndex, endIndex);

                    tbody.innerHTML = '';
                    if (paginatedLog.length === 0) {
                        const row = tbody.insertRow();
                        row.className = 'empty-row';
                        const cell = row.insertCell(0);
                        cell.colSpan = 4;
                        cell.textContent = searchTerm ? 'No records found' : 'No data available';
                    } else {
                        paginatedLog.forEach(log => {
                            const row = tbody.insertRow();
                            row.insertCell(0).textContent = log.before;
                            row.insertCell(1).textContent = log.after;
                            row.insertCell(2).textContent = log.rule;
                            row.insertCell(3).textContent = toDate(log.timestamp);
                        });
                    }
                    
                    if (itemsPerPage !== -1) {
                        renderPagination(totalItems, totalPages, startIndex, Math.min(endIndex, totalItems));
                    } else {
                        paginationInfo.textContent = `Showing all ${totalItems} entries`;
                        paginationControls.innerHTML = '';
                    }
                    
                    showLoading(false);
                    saveState();
                } catch (fallbackError) {
                    showLoading(false);
                    handleError(fallbackError);
                    showErrorMessage('Error rendering table');
                }
            });
        }, 10);
    }
    
    function renderPagination(totalItems, totalPages, startIndex, endIndex) {
        LinkumoriI18n.ready().then(() => {
            // Update info text - WITH LOCALIZED NUMBERS!
            if (totalItems === 0) {
                paginationInfo.textContent = translate('datatable_info_empty');
            } else {
                const start = startIndex + 1;
                const end = Math.min(endIndex, totalItems);
                paginationInfo.textContent = translate('datatable_showing_entries', [
                    localizeNumber(start), 
                    localizeNumber(end), 
                    localizeNumber(totalItems)
                ]);
            }
            
        
        // Clear old controls
        paginationControls.innerHTML = '';
        if (totalPages <= 1) return;

        // DataTables responsive pagination: Adjust button count based on screen width
        const containerWidth = paginationControls.offsetWidth || window.innerWidth;
        let maxButtons = 7; // Default DataTables standard
        
        // Responsive button count like DataTables
        if (containerWidth < 480) {
            maxButtons = 3; // Mobile: Previous, Current, Next
        } else if (containerWidth < 768) {
            maxButtons = 5; // Tablet: Fewer buttons
        }

        // "First" button with DataTables styling
        const firstButton = createPaginationButton(translate('pagination_first'), () => {
            if (window.currentPage > 1) {
                window.currentPage = 1;
                renderTable();
            }
        });
        firstButton.setAttribute('aria-label', translate('pagination_first_aria'));
        firstButton.setAttribute('data-dt-idx', 'first');
        if (window.currentPage === 1) firstButton.disabled = true;
        paginationControls.appendChild(firstButton);

        // "Previous" button with accessibility
        const prevButton = createPaginationButton(translate('pagination_previous'), () => {
            if (window.currentPage > 1) {
                window.currentPage--;
                renderTable();
            }
        });
        prevButton.setAttribute('aria-label', translate('pagination_previous_aria'));
        prevButton.setAttribute('data-dt-idx', 'previous');
        if (window.currentPage === 1) prevButton.disabled = true;
        paginationControls.appendChild(prevButton);

        // Page number buttons with DataTables logic (responsive count)
        const pages = getPageNumbers(totalPages, window.currentPage, maxButtons);
        pages.forEach((page, index) => {
            if (page === '...') {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '…'; // Using proper ellipsis character
                ellipsis.className = 'pagination-ellipsis';
                ellipsis.setAttribute('aria-hidden', 'true');
                paginationControls.appendChild(ellipsis);
            } else {
                const pageButton = createPaginationButton(page, () => {
                    if (window.currentPage !== page) {
                        window.currentPage = page;
                        renderTable();
                    }
                });
                
                // DataTables accessibility attributes
                pageButton.setAttribute('aria-label', translate('pagination_page_aria', [page]));
                pageButton.setAttribute('data-dt-idx', page);
                
                if (page === window.currentPage) {
                    pageButton.classList.add('active');
                    pageButton.disabled = true;
                    pageButton.setAttribute('aria-current', 'page');
                    pageButton.setAttribute('aria-label', translate('pagination_current_page_aria', [page]));
                }
                paginationControls.appendChild(pageButton);
            }
        });

        // "Next" button with accessibility
        const nextButton = createPaginationButton(translate('pagination_next'), () => {
            if (window.currentPage < totalPages) {
                window.currentPage++;
                renderTable();
            }
        });
        nextButton.setAttribute('aria-label', translate('pagination_next_aria'));
        nextButton.setAttribute('data-dt-idx', 'next');
        if (window.currentPage === totalPages) nextButton.disabled = true;
        paginationControls.appendChild(nextButton);

        // "Last" button with accessibility
        const lastButton = createPaginationButton(translate('pagination_last'), () => {
            if (window.currentPage < totalPages) {
                window.currentPage = totalPages;
                renderTable();
            }
        });
        lastButton.setAttribute('aria-label', translate('pagination_last_aria'));
        lastButton.setAttribute('data-dt-idx', 'last');
        if (window.currentPage === totalPages) lastButton.disabled = true;
        paginationControls.appendChild(lastButton);
    }
        )}

    // --- Event Listeners ---
    document.getElementById('reset_log_btn').addEventListener('click', resetGlobalLog);
    document.getElementById('export_log_btn').addEventListener('click', exportGlobalLog);
    document.getElementById('importLog').addEventListener('change', importGlobalLog);

    searchInput.addEventListener('input', () => {
        window.currentPage = 1;
        renderTable();
    });
    
    lengthSelect.addEventListener('change', () => {
        window.currentPage = 1;
        renderTable();
    });

    // --- Initial data fetch with state restoration ---
    const stateRestored = loadState(); // Try to restore previous state
    
    // Initialize sort button appearance
    updateSortButton(window.sortOrder);
    
    browser.runtime.sendMessage({ function: "getData", params: ['log'] })
        .then((data) => {
            if (data && data.response && Array.isArray(data.response.log)) {
                fullLog = data.response.log;
            } else {
                fullLog = [];
            }
            
            // If state was restored, ensure current page is valid
            if (stateRestored) {
                const itemsPerPage = parseInt(lengthSelect.value, 10);
                if (itemsPerPage !== -1) {
                    const maxPages = Math.ceil(fullLog.length / itemsPerPage);
                    if (window.currentPage > maxPages) {
                        window.currentPage = Math.max(1, maxPages);
                    }
                }
            }
            
            renderTable(); // Initial render
        })
        .catch(error => {
            handleError(error);
            fullLog = [];
            renderTable();
            
            // Show user-friendly error message
            LinkumoriI18n.ready().then(() => {
                showErrorMessage(translate('error_loading_data'));
            }).catch(() => {
                showErrorMessage('Error loading data');
            });
        });
}

// Listen for storage changes to sync theme across tabs/pages
window.addEventListener('storage', function(e) {
    if (e.key === 'linkumori-theme' && e.newValue) {
        document.documentElement.setAttribute('data-theme', e.newValue);
    }
});

// Main application entry point using Promise-based LinkumoriI18n.ready()
document.addEventListener('DOMContentLoaded', function() {
    // Wait for LinkumoriI18n to be ready using promise-based approach
    LinkumoriI18n.ready().then(() => {
        // Set all i18n text first
        setI18nText();
        
        // Now initialize the entire application
        initializeApplication();
        
    }).catch(error => {
        console.error('Failed to initialize i18n:', error);
        
        // Fallback: Initialize basic functionality without proper i18n
        initializeTheme();
        
        // Show error message to user
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.textContent = 'Failed to load internationalization. Some features may not work properly.';
        document.body.appendChild(errorMessage);
        
        // Try to initialize basic functionality anyway
        try {
            initializeApplication();
        } catch (secondaryError) {
            console.error('Critical initialization failure:', secondaryError);
        }
    });
});