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
 *
 * Modified Version:
 * @author      Subham Mahesh (c) 2025
 * @license     LGPL-3.0-or-later
 * @repository  https://github.com/linkumori/linkumori
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
 * Modifications include:
 * - changed dirtyurl and cleanurl
 * - watchdog now skips when both remote and built‑in rules are disabled
 * 
https://gitlab.com/ClearURLs/ClearUrls/-/blob/m3-migration/core_js/watchdog.js?ref_type=heads.
 */
/*jshint esversion: 6 */
/*
* This script is responsible to check in fixed intervals, that ClearURLs works properly.
* In issue #203, some users reported, that ClearURLs filter function doesn't work after
* some time, but without any recognizable reason.
*
* This watchdog restarts the whole Add-on, when the check fails.
*/
/**
 * first modified:  Jun 14, 2025  by Subham Mahesh
 * second modified: Feb 18, 2026  – watchdog now inactive when both remote and built‑in rules are disabled

 * Due to constraints, later modifications are not tracked inline.
 * To view the full modification history, run:
 *
 *   node linkumori-cli-tool.js
 *
 * Then select "Generate Commit History". This will create a Markdown file
 * where you can browse who modified which files and on what date.
 */
const __dirtyURL = "https://linkumori.com?utm_source=addon";
const __cleanURL = new URL("https://linkumori.com").toString();

browser.alarms.create("watchdog", {
    periodInMinutes: 1,
});

browser.alarms.onAlarm.addListener(function (alarmInfo) {
    if (alarmInfo.name === "watchdog" && isStorageAvailable() && storage.globalStatus) {
        // If neither remote nor built‑in rules are enabled, there is no baseline
        // rule set to test – the watchdog would always fail, so we skip.
        if (!storage.remoteRulesEnabled && !storage.builtInRulesEnabled) {
            return;
        }

        if (new URL(pureCleaning(__dirtyURL, true)).toString() !== __cleanURL) {
            storage.watchDogErrorCount += 1;
            saveOnExit();
            if (storage.watchDogErrorCount < 3) reload();
        } else if (storage.watchDogErrorCount > 0) {
            storage.watchDogErrorCount = 0;
            saveOnExit();
        }
    }
});
