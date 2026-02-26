/**

 * 
 * ClearURLs
* Copyright (c) 2017-2025 Kevin Röbert
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
 * @license     GPL-3.0-or-later
 * @repository  https://github.com/linkumori/linkumori
 * 
 * LICENSING NOTICE:
 * This modified version is distributed under GPL-3.0-or-later
 * This is permitted under GPL v3 Section 7, which allows
 * removal of additional permissions when conveying covered works. All
 * additional permissions have been removed.
 * 
 * Modifications include:
 * - removed firefox flagged to inorder to allow firefox user to use this code 
 * - added whitelist check for eTag filtering
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
 */
/**
 * first modified:  Jun 14, 2025  by Subham Mahesh

 * Due to constraints, later modifications are not tracked inline.
 * To view the full modification history, run:
 *
 *   node linkumori-cli-tool.js
 *
 * Then select "Generate Commit History". This will create a Markdown file
 * where you can browse who modified which files and on what date.
 */
function eTagFilter(requestDetails) {
    if(!requestDetails.responseHeaders || !storage.eTagFiltering
        || storage.localHostsSkipping && checkLocalURL(new URL(requestDetails.url))) return {};
    
    // ============================================================
    // WHITELIST CHECK - EARLY EXIT BEFORE ANY PROCESSING
    // ============================================================
    if (isWhitelisted(requestDetails.url, requestDetails)) {
        return {}; 
    }

    for(let i=0; i < requestDetails.responseHeaders.length; i++) {
        const header = requestDetails.responseHeaders[i];

        if(header.name.toString().toLowerCase() !== "etag") {
            continue;
        }

        const etag = header.value.toLowerCase();
        const w = etag.startsWith('w');
        const quotes = etag.endsWith('"');

        let len = etag.length;
        if (w) len -= 2;
        if (quotes) len -= 2;

        // insert dummy etag
        requestDetails.responseHeaders[i].value = generateDummyEtag(len, quotes, w);

        pushToLog(requestDetails.url, requestDetails.url, translate("eTag_filtering_log"), {
            logCategory: 'feature',
            requestMethod: requestDetails && typeof requestDetails.method === 'string' ? requestDetails.method : null,
            requestType: requestDetails && typeof requestDetails.type === 'string' ? requestDetails.type : null
        });

        break;
    }

    return {responseHeaders: requestDetails.responseHeaders};
}

/**
 * Generates a random ETag.
 * 
 * Must be ASCII characters placed between double quotes.
 * See: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/ETag
 */
function generateDummyEtag(len, quotes = true, w = false) {
    let rtn = randomASCII(len);

    if (quotes) rtn = '"' + rtn + '"';
    if (w) rtn = 'W/' + rtn;

    return rtn;
}


browser.webRequest.onHeadersReceived.addListener(
    eTagFilter,
    {urls: ["<all_urls>"]},
    ["blocking", "responseHeaders"]
);
