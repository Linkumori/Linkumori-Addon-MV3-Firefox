/*
 * Linkumori Clipboard Helper
 * Copyright (c) 2025 Subham Mahesh
 * License: LGPL-3.0-or-later
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

 */

/**
 * Copy text to clipboard using modern API only
 * Same function signature as original but modern implementation
 * @param {string} text - Text to copy to clipboard
 */
function copyToClipboard(text) {
    // Modern clipboard API only
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
    }
}