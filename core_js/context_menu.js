/**
* * ClearURLs
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
 * Modified Version:
 * @author      Subham Mahesh (c) 2025 for modification part only
 * @license     LGPL-3.0-or-later
 * @repository  https://github.com/linkumori/linkumori
 * https://gitlab.com/ClearURLs/ClearUrls/-/blob/m3-migration/core_js/context_menu.js?ref_type=heads
 * 
 * Modifications include:
 * - added LOCAL STORAGE ON SYNC ENABLE OR DISABLE CONTEXT MENU ADDITIONAL FLAG FOR PREVENT DUPLICATE REMOVE ON INSTALL CONEXT MENU AND MODIFIED CONTEXT MENU FUCTION 
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
// Flag to prevent duplicate event listeners
let contextMenuClickListenerRegistered = false;

async function contextMenuStart() {
    try {
        // Always remove existing context menus first
        await browser.contextMenus.removeAll();
        
        if (storage.contextMenuEnabled) {
            LinkumoriI18n.ready().then(() => {
                browser.contextMenus.create({
                    id: "copy-link-to-clipboard",
                    title: translate("clipboard_copy_link"),
                    contexts: ["link"]
                });

                // Only register the click listener once
                if (!contextMenuClickListenerRegistered) {
                    browser.contextMenus.onClicked.addListener(async (info, tab) => {
                        if (info.menuItemId === "copy-link-to-clipboard") {
                            try {
                                const url = pureCleaning(info.linkUrl);
                                
                                // Check if copyToClipboard function exists
                                const results = await browser.scripting.executeScript({
                                    target: { tabId: tab.id },
                                    func: () => typeof copyToClipboard === 'function'
                                });

                                // If function doesn't exist, inject the clipboard helper script
                                if (!results || !results[0] || results[0].result !== true) {
                                    await browser.scripting.executeScript({
                                        target: { tabId: tab.id },
                                        files: ["/core_js/clipboard-helper.js"]
                                    });
                                }

                                // Execute the copy function with the cleaned URL
                                await browser.scripting.executeScript({
                                    target: { tabId: tab.id },
                                    func: (cleanUrl) => {
                                        copyToClipboard(cleanUrl);
                                    },
                                    args: [url]
                                });

                            } catch (error) {
                                console.error("Failed to copy text: " + error);
                            }
                        }
                    });
                    
                    contextMenuClickListenerRegistered = true;
                }
            }); // <-- Close .then()
        } // <-- Close if (storage.contextMenuEnabled)
    } catch (error) {
        handleError(error);
    }
}

// Listen for storage changes to update context menu in real-time
browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.contextMenuEnabled) {
        // Update storage variable
        storage.contextMenuEnabled = changes.contextMenuEnabled.newValue;
        
        // Restart context menu with new setting
        contextMenuStart();
    }
});

function handleError(error) {
    console.error("Context menu error: " + error);
}