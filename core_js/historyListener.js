/**

 * 
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
 * Modified Version:
 * @author      Subham Mahesh (c) 2025 for modification part only
 * @license     LGPL-3.0-or-later
 * @repository  https://github.com/linkumori/linkumori
 * 

 * 
 * Modifications include:
 * -  whitelist check 
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
 *//**
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

function historyListenerStart() {
    if(storage.historyListenerEnabled) {
        browser.webNavigation.onHistoryStateUpdated.addListener(historyCleaner);
    }
}

/**
* Function that is triggered on history changes. Injects script into page
* to clean links that were pushed to the history stack with the
* history.replaceState method.
* @param  {state object} details The state object is a JavaScript object
* which is associated with the new history entry created by replaceState()
*/
async function historyCleaner(details) {
    if(storage.globalStatus) {
        // ============================================================
        // WHITELIST CHECK - EARLY EXIT BEFORE ANY PROCESSING
        // ============================================================
        if (isWhitelisted(details.url)) {
            return; // Skip ALL history processing for whitelisted domains
        }

        const urlBefore = details.url;
        const urlAfter = pureCleaning(details.url);

        if(urlBefore !== urlAfter) {
            
            try {
                // Use the modern scripting API for Manifest V3
                await browser.scripting.executeScript({
                    target: {
                        tabId: details.tabId,
                        frameIds: details.frameId ? [details.frameId] : undefined
                    },
                    func: (cleanUrl) => {
                        history.replaceState(null, "", cleanUrl);
                    },
                    args: [urlAfter]
                });
            } catch (error) {
                onError(error);
            }
        }
    }
}

function onError(error) {
    console.error(`Linkumori Error: ${error}`);
}
