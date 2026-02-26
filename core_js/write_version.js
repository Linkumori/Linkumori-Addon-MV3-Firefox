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
 *
 * Modified Version:
 * @author      Subham Mahesh (c) 2025
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
 * - Enhanced error handling and validation
 * - Safe DOM manipulation with fallbacks
 * - Support for additional manifest fields
 * - Improved browser compatibility
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
 * Enhanced version and manifest information writer with improved error handling.
 * Safely writes version, name, and other manifest data into page elements.
 * 
 * @author Subham Mahesh
 * @since 2025
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
(function() {
    'use strict';
    
    /**
     * Safely get manifest data with error handling
     * @returns {Object|null} Manifest object or null if unavailable
     */
    function getManifestSafely() {
        try {
            if (typeof browser !== 'undefined' && browser.runtime && browser.runtime.getManifest) {
                return browser.runtime.getManifest();
            }
            
            // Fallback for Chrome/Chromium
            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getManifest) {
                return chrome.runtime.getManifest();
            }
            
            return null;
        } catch (error) {
            return null;
        }
    }
    
    /**
     * Safely set element text content with validation
     * @param {string} elementId - ID of the target element
     * @param {string} content - Content to set
     * @param {string} fallback - Fallback content if setting fails
     */
    function setElementTextSafely(elementId, content, fallback = 'Unknown') {
        try {
            const element = document.getElementById(elementId);
            if (element) {
                // ENHANCEMENT: Validate content before setting
                const safeContent = (content && typeof content === 'string') ? content.trim() : fallback;
                element.textContent = safeContent;
                
                // ENHANCEMENT: Set title attribute for accessibility
                if (safeContent !== fallback) {
                    element.setAttribute('title', safeContent);
                }
            }
        } catch (error) {
            // Silent fallback - just continue execution
        }
    }
    
    /**
     * Main function to populate manifest information
     */
    function populateManifestInfo() {
        const manifest = getManifestSafely();
        
        if (!manifest) {
            // ENHANCEMENT: Graceful fallback when manifest is unavailable
            setElementTextSafely('version', 'N/A');
            setElementTextSafely('name', 'Extension');
            return;
        }
        
        // ENHANCEMENT: Set version with validation
        const version = manifest.version || 'Unknown';
        setElementTextSafely('version', version);
        
        // ENHANCEMENT: Set name with validation  
        const name = manifest.name || 'Extension';
        setElementTextSafely('name', name);
        
        // ENHANCEMENT: Optional additional manifest fields
        setElementTextSafely('description', manifest.description, '');
        setElementTextSafely('author', manifest.author, '');
        
        // ENHANCEMENT: Set manifest version if element exists
        if (manifest.manifest_version) {
            setElementTextSafely('manifest_version', `Manifest V${manifest.manifest_version}`);
        }
        
        // ENHANCEMENT: Set homepage URL if available
        if (manifest.homepage_url) {
            setElementTextSafely('homepage', manifest.homepage_url);
            
            // ENHANCEMENT: Make homepage a clickable link if possible
            try {
                const homepageElement = document.getElementById('homepage');
                if (homepageElement && homepageElement.tagName.toLowerCase() === 'a') {
                    homepageElement.href = manifest.homepage_url;
                    homepageElement.target = '_blank';
                    homepageElement.rel = 'noopener noreferrer';
                }
            } catch (linkError) {
                // Continue silently if link setting fails
            }
        }
    }
    
    // ENHANCEMENT: Wait for DOM to be ready before executing
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', populateManifestInfo);
    } else {
        // DOM is already ready
        populateManifestInfo();
    }
    
    // ENHANCEMENT: Re-populate if page becomes visible (for SPAs)
    if (typeof document.addEventListener === 'function') {
        document.addEventListener('visibilitychange', function() {
            if (!document.hidden) {
                populateManifestInfo();
            }
        });
    }
    
})();