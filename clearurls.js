/**
 * Original ClearURLs Copyright (c) 2017-2021 Kevin Röbert
 * Modified Version Copyright (c) 2025 Subham Mahesh
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Lesser General Public License for more details.
 *
 * LICENSING NOTICE:
 * This file is part of the Linkumori project and contains modifications to ClearURLs.
 * 
 * MAJOR MODIFICATIONS by Subham Mahesh:
 * PERFORMANCE: Optimized provider initialization and rule matching
 *  INTEGRATION: Enhanced integration with storage.js rule management
 *  WHITELIST: Comprehensive whitelist support with wildcard patterns
 *  RELIABILITY: Improved error handling and initialization retry logic
 *  CLEANUP: Removed unnecessary permission requests and dependencies
 *  EFFICIENCY: Streamlined rule application and URL reconstruction
 *  COMPATIBILITY: Enhanced browser compatibility and method checking
 *  SIMPLICITY: Simple domain pattern matching without complex TLD handling
 * 
 * This modification is part of the larger Linkumori project providing
 * privacy-focused URL cleaning with advanced rule management capabilities.
 * 
 *  * first modified:  Jun 14, 2025  by Subham Mahesh
 *secound modified:  august 21, 2025  by Subham Mahesh
 third modified:  september 5, 2025  by Subham Mahesh
 * Due to constraints, later modifications are not tracked inline.
 * To view the full modification history, run:
 *
 *   node linkumori-cli-tool.js
 *
 * Then select "Generate Commit History". This will create a Markdown file
 * where you can browse who modified which files and on what date.
 * Repository: https://github.com/linkumori/linkumori
 * License: LGPL-3.0-or-later
 */

var providers = [];
var prvKeys = [];
var siteBlockedAlert = 'javascript:void(0)';
var dataHash;
var localDataHash;
var os;
var initializationComplete = false;

"use strict";

class URLHashParams {
    constructor(url) {
        Object.defineProperty(this, "_params", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this._params = new Multimap();
        const hash = url.hash.slice(1);
        const params = hash.split('&');
        for (const p of params) {
            const param = p.split('=');
            if (!param[0])
                continue;
            const key = param[0];
            let value = null;
            if (param.length === 2 && param[1]) {
                value = param[1];
            }
            this._params.put(key, value);
        }
    }
    append(name, value = null) {
        this._params.put(name, value);
    }
    delete(name) {
        this._params.delete(name);
    }
    get(name) {
        const [first] = this._params.get(name);
        if (first) {
            return first;
        }
        return null;
    }
    getAll(name) {
        return this._params.get(name);
    }
    keys() {
        return this._params.keys();
    }
    toString() {
        const rtn = [];
        this._params.forEach((key, value) => {
            if (value) {
                rtn.push(key + '=' + value);
            }
            else {
                rtn.push(key);
            }
        });
        return rtn.join('&');
    }
}

class Multimap {
    constructor() {
        Object.defineProperty(this, "_map", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_size", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this._size = 0;
        this._map = new Map();
    }
    get size() {
        return this._size;
    }
    get(key) {
        const values = this._map.get(key);
        if (values) {
            return new Set(values);
        }
        else {
            return new Set();
        }
    }
    put(key, value) {
        let values = this._map.get(key);
        if (!values) {
            values = new Set();
        }
        const count = values.size;
        values.add(value);
        if (values.size === count) {
            return false;
        }
        this._map.set(key, values);
        this._size++;
        return true;
    }
    has(key) {
        return this._map.has(key);
    }
    hasEntry(key, value) {
        const values = this._map.get(key);
        if (!values) {
            return false;
        }
        return values.has(value);
    }
    delete(key) {
        const values = this._map.get(key);
        if (values && this._map.delete(key)) {
            this._size -= values.size;
            return true;
        }
        return false;
    }
    deleteEntry(key, value) {
        const values = this._map.get(key);
        if (values) {
            if (!values.delete(value)) {
                return false;
            }
            this._size--;
            return true;
        }
        return false;
    }
    clear() {
        this._map.clear();
        this._size = 0;
    }
    entries() {
        const self = this;
        function* gen() {
            for (const [key, values] of self._map.entries()) {
                for (const value of values) {
                    yield [key, value];
                }
            }
        }
        return gen();
    }
    values() {
        const self = this;
        function* gen() {
            for (const [, value] of self.entries()) {
                yield value;
            }
        }
        return gen();
    }
    keys() {
        return this._map.keys();
    }
    forEach(callback, thisArg) {
        for (const [key, value] of this.entries()) {
            callback.call(thisArg === undefined ? this : thisArg, key, value, this);
        }
    }
    [Symbol.iterator]() {
        return this.entries();
    }
}


function matchDomainPattern(url, patterns) {
    if (!patterns || patterns.length === 0) return false;

    try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname.toLowerCase();
        const pathname = urlObj.pathname;
        const fullUrl = url.toLowerCase();

        return patterns.some(pattern => {
            if (!pattern) return false;
            const p = pattern.trim();

            // Handle domain+path patterns: ||example.com/path
            if (p.startsWith('||') && p.includes('/') && !p.endsWith('^')) {
                const urlPart = p.slice(2); // Remove ||
                const slashIndex = urlPart.indexOf('/');
                const domainPart = urlPart.slice(0, slashIndex).toLowerCase();
                const pathPart = urlPart.slice(slashIndex);

                const domainMatches = hostname === domainPart || hostname.endsWith('.' + domainPart);
                const pathMatches = pathname.startsWith(pathPart);

                return domainMatches && pathMatches;
            }

            function wildcardDomainToRegex(domainPattern) {
                // Escape dots first, then expand wildcard behavior.
                let regexPattern = domainPattern.replace(/\./g, '\\.');

                // Support multi-part TLD matching for trailing wildcard TLD forms:
                //   ||example.*^  -> example.com, example.co.uk, example.gov.in, ...
                //   ||*.example.*^ -> a.example.com, a.example.co.uk, ...
                if (domainPattern.endsWith('.*')) {
                    regexPattern = regexPattern.replace(/\\\.\*$/, '(?:\\.[^.]+)+');
                }

                // Remaining wildcards match within a single DNS label.
                regexPattern = regexPattern.replace(/\*/g, '[^.]*');
                return '^' + regexPattern + '$';
            }

            // Handle AdBlock-style patterns: ||example.com^
            if (p.startsWith('||') && p.endsWith('^')) {
                const domain = p.slice(2, -1).toLowerCase();

                if (domain.includes('*')) {
                    return new RegExp(wildcardDomainToRegex(domain), 'i').test(hostname);
                }

                return hostname === domain || hostname.endsWith('.' + domain);
            }

            // ----- NEW: handle patterns that start with '||' but don't match above -----
            if (p.startsWith('||')) {
                // treat as hostname (possibly with wildcard), strip leading '||'
                const domainPattern = p.slice(2);
                // if contains '/', treat as domain+path handled earlier; otherwise domain wildcard
                if (!domainPattern.includes('/')) {
                    if (domainPattern.includes('*')) {
                        return new RegExp(wildcardDomainToRegex(domainPattern), 'i').test(hostname);
                    } else {
                        return hostname === domainPattern.toLowerCase() || hostname.endsWith('.' + domainPattern.toLowerCase());
                    }
                }
                // otherwise fall through to other checks (shouldn't usually get here)
            }

            // Handle other patterns with wildcards
            if (p.includes('*')) {
                const regexPattern = p
                    .replace(/\./g, '\\.')
                    .replace(/\*/g, '.*');
                return new RegExp(regexPattern, 'i').test(fullUrl);
            }

            // Simple string matching
            return fullUrl.includes(p.toLowerCase());
        });
    } catch (e) {
        return false;
    }
}



function isWhitelisted(url) {
    if (!storage.userWhitelist || storage.userWhitelist.length === 0) {
        return false;
    }
    
    try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname.toLowerCase();
        
        const isWhitelistedResult = storage.userWhitelist.some(domain => {
            const cleanDomain = domain.toLowerCase().trim();
            
            if (hostname === cleanDomain) {
                return true;
            }
            
            if (cleanDomain.startsWith('*.')) {
                const baseDomain = cleanDomain.substring(2);
                return hostname === baseDomain || hostname.endsWith('.' + baseDomain);
            }
            
            return hostname.endsWith('.' + cleanDomain);
        });
        
        return isWhitelistedResult;
    } catch (e) {
        return false;
    }
}

function removeFieldsFormURL(provider, pureUrl, quiet = false, request = null) {
    let url = pureUrl;
    let domain = "";
    let fragments = "";
    let fields = "";
    let rules = provider.getRules();
    let changes = false;
    let rawRules = provider.getRawRules();
    let urlObject = new URL(url);

    if (storage.localHostsSkipping && checkLocalURL(urlObject)) {
        return {
            "changes": false,
            "url": url,
            "cancel": false
        }
    }

    let re = provider.getRedirection(url);
    if (re !== null) {
        url = decodeURL(re);

        if (!quiet) {
            pushToLog(pureUrl, url, translate('log_redirect'));
            increaseTotalCounter(1);
            increaseBadged(false, request)
        }

        return {
            "redirect": true,
            "url": url
        }
    }

    if (provider.isCaneling() && storage.domainBlocking) {
        if (!quiet) pushToLog(pureUrl, pureUrl, translate('log_domain_blocked'));
        increaseTotalCounter(1);
        increaseBadged(false, request);
        return {
            "cancel": true,
            "url": url
        }
    }

    rawRules.forEach(function (rawRule) {
        let beforeReplace = url;
        url = url.replace(new RegExp(rawRule, "gi"), "");

        if (beforeReplace !== url) {
            if (storage.loggingStatus && !quiet) {
                pushToLog(beforeReplace, url, rawRule);
            }

            increaseBadged(false, request);
            changes = true;
        }
    });

    urlObject = new URL(url);
    fields = urlObject.searchParams;
    fragments = extractFragments(urlObject);
    domain = urlWithoutParamsAndHash(urlObject).toString();

    if (fields.toString() !== "" || fragments.toString() !== "") {
        rules.forEach(rule => {
            const beforeFields = fields.toString();
            const beforeFragments = fragments.toString();
            let localChange = false;

            const fieldsToDelete = [];
            for (const field of fields.keys()) {
                if (new RegExp("^"+rule+"$", "gi").test(field)) {
                    fieldsToDelete.push(field);
                    localChange = true;
                }
            }
            fieldsToDelete.forEach(field => fields.delete(field));

            const fragmentsToDelete = [];
            for (const fragment of fragments.keys()) {
                if (new RegExp("^"+rule+"$", "gi").test(fragment)) {
                    fragmentsToDelete.push(fragment);
                    localChange = true;
                }
            }
            fragmentsToDelete.forEach(fragment => fragments.delete(fragment));

            if (localChange) {
                changes = true;
                
                if (storage.loggingStatus) {
                    let tempURL = domain;
                    let tempBeforeURL = domain;

                    if (fields.toString() !== "") tempURL += "?" + fields.toString();
                    if (fragments.toString() !== "") tempURL += "#" + fragments.toString();
                    if (beforeFields.toString() !== "") tempBeforeURL += "?" + beforeFields.toString();
                    if (beforeFragments.toString() !== "") tempBeforeURL += "#" + beforeFragments.toString();

                    if (!quiet) pushToLog(tempBeforeURL, tempURL, rule);
                }

                increaseBadged(false, request);
            }
        });

        let finalURL = domain;

        if (fields.toString() !== "") finalURL += "?" + urlSearchParamsToString(fields);
        if (fragments.toString() !== "") finalURL += "#" + fragments.toString();

        url = finalURL.replace(new RegExp("\\?&"), "?").replace(new RegExp("#&"), "#");
    }

    return {
        "changes": changes,
        "url": url
    }
}

function start() {
    function getKeys(obj) {
        prvKeys = [];
        for (const key in obj) {
            prvKeys.push(key);
        }
    }

    function createProviders() {
        let data = storage.ClearURLsData;
        
        if (!data || !data.providers) {
            return;
        }

        providers = [];

        for (let p = 0; p < prvKeys.length; p++) {
            providers.push(new Provider(prvKeys[p], data.providers[prvKeys[p]].getOrDefault('completeProvider', false),
                data.providers[prvKeys[p]].getOrDefault('forceRedirection', false)));

            let urlPattern = data.providers[prvKeys[p]].getOrDefault('urlPattern', '');
            let domainPatterns = data.providers[prvKeys[p]].getOrDefault('domainPatterns', []);
            
            if (urlPattern) {
                providers[p].setURLPattern(urlPattern);
            } else if (domainPatterns.length > 0) {
                providers[p].setURLDomainPattern(domainPatterns);
            }

            let rules = data.providers[prvKeys[p]].getOrDefault('rules', []);
            for (let r = 0; r < rules.length; r++) {
                providers[p].addRule(rules[r]);
            }

            let rawRules = data.providers[prvKeys[p]].getOrDefault('rawRules', []);
            for (let raw = 0; raw < rawRules.length; raw++) {
                providers[p].addRawRule(rawRules[raw]);
            }

            let referralMarketingRules = data.providers[prvKeys[p]].getOrDefault('referralMarketing', []);
            for (let referralMarketing = 0; referralMarketing < referralMarketingRules.length; referralMarketing++) {
                providers[p].addReferralMarketing(referralMarketingRules[referralMarketing]);
            }

            let exceptions = data.providers[prvKeys[p]].getOrDefault('exceptions', []);
            for (let e = 0; e < exceptions.length; e++) {
                providers[p].addException(exceptions[e]);
            }
            
            let domainExceptions = data.providers[prvKeys[p]].getOrDefault('domainExceptions', []);
            for (let ude = 0; ude < domainExceptions.length; ude++) {
                providers[p].addDomainException(domainExceptions[ude]);
            }

            let redirections = data.providers[prvKeys[p]].getOrDefault('redirections', []);
            for (let re = 0; re < redirections.length; re++) {
                providers[p].addRedirection(redirections[re]);
            }
            
            let domainRedirections = data.providers[prvKeys[p]].getOrDefault('domainRedirections', []);
            for (let udr = 0; udr < domainRedirections.length; udr++) {
                providers[p].addDomainRedirection(domainRedirections[udr]);
            }

            let methods = data.providers[prvKeys[p]].getOrDefault('methods', []);
            for (let re = 0; re < methods.length; re++) {
                providers[p].addMethod(methods[re]);
            }

            let resourceTypes = data.providers[prvKeys[p]].getOrDefault('resourceTypes', []);
            for (let rt = 0; rt < resourceTypes.length; rt++) {
                providers[p].addResourceType(resourceTypes[rt]);
            }
        }
    }

    function initializeProviders() {
        if (!storage.ClearURLsData || !storage.ClearURLsData.providers) {
            return false;
        }

        getKeys(storage.ClearURLsData.providers);
        createProviders();
        
        setupWebRequestListener();
        
        return true;
    }

    function setupWebRequestListener() {
        if (browser.webRequest.onBeforeRequest.hasListener(promise)) {
            return;
        }

        function promise(requestDetails) {
            if (isDataURL(requestDetails)) {
                return {};
            } else {
                return clearUrl(requestDetails);
            }
        }

        function isDataURL(requestDetails) {
            const s = requestDetails.url;
            return s.substring(0, 4) === "data";
        }

        browser.webRequest.onBeforeRequest.addListener(
            promise,
            {urls: ["<all_urls>"], types: getData("types").concat(getData("pingRequestTypes"))},
            ["blocking"]
        );
    }

    let initAttempts = 0;
    const maxInitAttempts = 50;
    
    function tryInitialize() {
        initAttempts++;
        
        if (initializeProviders()) {
            initializationComplete = true;
            console.log('ClearURLs initialized');
            return;
        }
        
        if (initAttempts < maxInitAttempts) {
            setTimeout(tryInitialize, 200);
        } else {
            setupWebRequestListener();
            console.warn('ClearURLs initialized with limited functionality');
        }
    }
    
    tryInitialize();

    loadOldDataFromStore();
    setBadgedStatus();

    function Provider(_name, _completeProvider = false, _forceRedirection = false, _isActive = true) {
        let name = _name;
        let urlPattern;
        let domainPatterns = [];
        let enabled_rules = {};
        let disabled_rules = {};
        let enabled_exceptions = {};
        let disabled_exceptions = {};
        let enabled_domain_exceptions = [];
        let enabled_domain_redirections = [];
        let canceling = _completeProvider;
        let enabled_redirections = {};
        let disabled_redirections = {};
        let active = _isActive;
        let enabled_rawRules = {};
        let disabled_rawRules = {};
        let enabled_referralMarketing = {};
        let disabled_referralMarketing = {};
        let methods = [];
        let resourceTypes = [];

        if (_completeProvider) {
            enabled_rules[".*"] = true;
        }

        this.shouldForceRedirect = function () {
            return _forceRedirection;
        };

        this.getName = function () {
            return name;
        };

        this.setURLPattern = function (urlPatterns) {
            urlPattern = new RegExp(urlPatterns, "i");
        };

        this.setURLDomainPattern = function (patterns) {
            domainPatterns = patterns || [];
        };

        this.isCaneling = function () {
            return canceling;
        };

        this.matchURL = function (url) {
            if (urlPattern) {
                return urlPattern.test(url) && !(this.matchException(url));
            } else if (domainPatterns.length > 0) {
                return matchDomainPattern(url, domainPatterns) && !(this.matchException(url));
            }
            return false;
        };

        this.applyRule = (enabledRuleArray, disabledRulesArray, rule, isActive = true) => {
            if (isActive) {
                enabledRuleArray[rule] = true;

                if (disabledRulesArray[rule] !== undefined) {
                    delete disabledRulesArray[rule];
                }
            } else {
                disabledRulesArray[rule] = true;

                if (enabledRuleArray[rule] !== undefined) {
                    delete enabledRuleArray[rule];
                }
            }
        };

        this.addRule = function (rule, isActive = true) {
            this.applyRule(enabled_rules, disabled_rules, rule, isActive);
        };

        this.getRules = function () {
            if (!storage.referralMarketing) {
                return Object.keys(Object.assign(enabled_rules, enabled_referralMarketing));
            }

            return Object.keys(enabled_rules);
        };

        this.addRawRule = function (rule, isActive = true) {
            this.applyRule(enabled_rawRules, disabled_rawRules, rule, isActive);
        };

        this.getRawRules = function () {
            return Object.keys(enabled_rawRules);
        };

        this.addReferralMarketing = function (rule, isActive = true) {
            this.applyRule(enabled_referralMarketing, disabled_referralMarketing, rule, isActive);
        };

        this.addException = function (exception, isActive = true) {
            if (isActive) {
                enabled_exceptions[exception] = true;

                if (disabled_exceptions[exception] !== undefined) {
                    delete disabled_exceptions[exception];
                }
            } else {
                disabled_exceptions[exception] = true;

                if (enabled_exceptions[exception] !== undefined) {
                    delete enabled_exceptions[exception];
                }
            }
        };

        this.addDomainException = function (exception) {
            if (enabled_domain_exceptions.indexOf(exception) === -1) {
                enabled_domain_exceptions.push(exception);
            }
        };

        this.addMethod = function (method) {
            if (methods.indexOf(method) === -1) {
                methods.push(method);
            }
        }

        this.matchMethod = function (details) {
            if (!methods.length) return true;
            return methods.indexOf(details['method']) > -1;
        }

        this.addResourceType = function (resourceType) {
            if (resourceTypes.indexOf(resourceType) === -1) {
                resourceTypes.push(resourceType);
            }
        };

        this.matchResourceType = function (details) {
            if (!resourceTypes.length) {
                if (storage.types && storage.types.length > 0) {
                    return storage.types.indexOf(details['type']) > -1;
                }
                return true;
            }
            return resourceTypes.indexOf(details['type']) > -1;
        };

        this.matchException = function (url) {
            let result = false;

            if (url === siteBlockedAlert) return true;

            for (const exception in enabled_exceptions) {
                if (result) break;

                let exception_regex = new RegExp(exception, "i");
                result = exception_regex.test(url);
            }
            
            if (!result && enabled_domain_exceptions.length > 0) {
                result = matchDomainPattern(url, enabled_domain_exceptions);
            }

            return result;
        };

        this.addRedirection = function (redirection, isActive = true) {
            if (isActive) {
                enabled_redirections[redirection] = true;

                if (disabled_redirections[redirection] !== undefined) {
                    delete disabled_redirections[redirection];
                }
            } else {
                disabled_redirections[redirection] = true;

                if (enabled_redirections[redirection] !== undefined) {
                    delete enabled_redirections[redirection];
                }
            }
        };

        this.addDomainRedirection = function (redirection) {
            if (enabled_domain_redirections.indexOf(redirection) === -1) {
                enabled_domain_redirections.push(redirection);
            }
        };

        this.getRedirection = function (url) {
            let re = null;

            for (const redirection in enabled_redirections) {
                let result = (url.match(new RegExp(redirection, "i")));

                if (result && result.length > 0 && redirection) {
                    re = (new RegExp(redirection, "i")).exec(url)[1];

                    break;
                }
            }
            
            if (!re && enabled_domain_redirections.length > 0) {
                for (const domainRedirection of enabled_domain_redirections) {
                    if (domainRedirection.includes('$redirect=')) {
                        const [pattern, redirectTarget] = domainRedirection.split('$redirect=');
                        if (matchDomainPattern(url, [pattern.trim()])) {
                            re = redirectTarget;
                            break;
                        }
                    }
                }
            }

            return re;
        };
    }

    function clearUrl(request) {
        if (isWhitelisted(request.url)) {
            if (storage.loggingStatus) {
                pushToLog(request.url, request.url, translate('log_whitelist_bypass'));
            }
            return {};
        }

        const URLbeforeReplaceCount = countFields(request.url);

        increaseTotalCounter(URLbeforeReplaceCount);

        if (storage.globalStatus) {
            let result = {
                "changes": false,
                "url": "",
                "redirect": false,
                "cancel": false
            };

            if (storage.pingBlocking && storage.pingRequestTypes.includes(request.type)) {
                pushToLog(request.url, request.url, translate('log_ping_blocked'));
                increaseBadged(false, request);
                increaseTotalCounter(1);
                return {cancel: true};
            }

            for (let i = 0; i < providers.length; i++) {
                if (!providers[i].matchMethod(request)) continue;
                if (!providers[i].matchResourceType(request)) continue;
                if (providers[i].matchURL(request.url)) {
                    result = removeFieldsFormURL(providers[i], request.url, false, request);
                }

                if (result.redirect) {
                    if (providers[i].shouldForceRedirect() &&
                        request.type === 'main_frame') {
                        browser.tabs.update(request.tabId, {url: result.url}).catch(handleError);
                        return {cancel: true};
                    }

                    return {
                        redirectUrl: result.url
                    };
                }

                if (result.cancel) {
                    if (request.type === 'main_frame') {
                        const blockingPage = browser.runtime.getURL("html/siteBlockedAlert.html?source=" + encodeURIComponent(request.url));
                        browser.tabs.update(request.tabId, {url: blockingPage}).catch(handleError);

                        return {cancel: true};
                    } else {
                        return {
                            redirectUrl: siteBlockedAlert
                        };
                    }
                }

                if (result.changes) {
                    return {
                        redirectUrl: result.url
                    };
                }
            }
        }

        return {};
    }
}
