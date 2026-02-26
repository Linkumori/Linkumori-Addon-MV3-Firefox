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
 * patches taken from https://gitlab.com/ClearURLs/ClearUrls/-/blob/m3-migration/core_js/badgedHandler.js?ref_type=heads 
 * for mv3 migration
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
let badges = {};

/**
 * Increases the badged by one.
 */
function increaseBadged(quiet = false, request) {
    if(request === null) return;
    if(!request || typeof request !== 'object') return;

    // Enforce whitelist behavior at badge layer too:
    // whitelisted requests must never increase badge/cleaned counters.
    if (typeof isWhitelisted === 'function' && isWhitelisted(request.url, request)) {
        return;
    }

    if (!quiet) increaseCleanedCounter();

    const tabId = request.tabId;
    const url = request.url;

    if(tabId === -1) return;

    if (badges[tabId] == null) {
        badges[tabId] = {
            counter: 1,
            lastURL: url
        };
    } else {
        badges[tabId].counter += 1;
    }

    if (storage.badgedStatus) {
        // Set badge text
        browser.action.setBadgeText({
            text: (badges[tabId]).counter.toString(), 
            tabId: tabId
        }).catch(handleError);
        
        // SIMPLE FIX: Just read color from storage and apply it
        browser.action.setBadgeBackgroundColor({
            color: storage.badged_color,
            tabId: tabId
        }).catch(handleError);
        
    } else {
        browser.action.setBadgeText({text: "", tabId: tabId}).catch(handleError);
    }
}

/**
 * Call by each tab is updated.
 * And if url has changed.
 */
function handleUpdated(tabId, changeInfo, tabInfo) {
    if(!badges[tabId] || !changeInfo.url) return;

    if (badges[tabId].lastURL !== changeInfo.url) {
        badges[tabId] = {
            counter: 0,
            lastURL: tabInfo.url
        };
    }
}

/**
 * Call by each tab is updated.
 */
browser.tabs.onUpdated.addListener(handleUpdated);
