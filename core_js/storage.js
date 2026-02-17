/**
 * 
 * ClearURLs / Linkumori - Core Storage & Rule Management System

 * Original ClearURLs Copyright (c) 2017-2020 Kevin Röbert
 * Modified Version Copyright (c) 2025 Subham Mahesh parts only 
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
 * This file is based on ClearURLs v1.28.0 and patches from the ClearURLs MV3 migration.
 * 
 * MAJOR MODIFICATIONS by Subham Mahesh for Linkumori:
 * • SECURITY: Mandatory hash verification for remote rules with HTTPS enforcement
 * • ARCHITECTURE: Multi-layer fallback chain (remote → cache → bundled → enhanced fallback)
 * • VALIDATION: Strict security validation preventing unauthorized network calls  
 * • MERGING: Intelligent custom rule merging preserving user overrides
 * • MANAGEMENT: Comprehensive whitelist with wildcard and exact domain matching
 * • OPTIMIZATION: Rule minification algorithm removing empty/default values
 * • METADATA: Enhanced rule source tracking and verification status
 * • CONFIGURATION: User-configurable remote rule URLs with validation
 * • RESILIENCE: Graceful degradation with multiple recovery mechanisms
 * • INTEGRITY: SHA-256 hash verification without storage persistence conflicts
 * • MONITORING: Detailed merge statistics and verification status tracking
 * 
 * Rule minification algorithm derived from ClearURLs build tools:
 * https://github.com/ClearURLs/Addon/blob/master/build_tools/minifyDataJSON.js
 * 
 * Repository: https://github.com/linkumori/linkumori
 * License: LGPL-3.0-or-later
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
var storage = [];
var hasPendingSaves = false;
var pendingSaves = new Set();

var tempVerificationCache = {
    lastVerification: null,
    isRemoteVerified: false,
    isCacheUsed: false
};

function normalizeRemoteRuleSetEntry(entry) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
        return null;
    }

    const ruleURL = typeof entry.ruleURL === 'string' ? entry.ruleURL.trim() : '';
    const hashURL = typeof entry.hashURL === 'string' ? entry.hashURL.trim() : '';

    if (!isValidRuleURL(ruleURL) || !isValidRuleURL(hashURL)) {
        return null;
    }

    return { ruleURL, hashURL };
}

function getConfiguredRemoteRuleSets() {
    if (!storage.remoteRulesEnabled) {
        return [];
    }

    const dedupe = new Set();
    const remoteRuleSets = [];

    const primaryRuleURL = typeof storage.ruleURL === 'string' ? storage.ruleURL.trim() : '';
    const primaryHashURL = typeof storage.hashURL === 'string' ? storage.hashURL.trim() : '';
    const hasPrimary = isValidRuleURL(primaryRuleURL) && isValidRuleURL(primaryHashURL);

    if (hasPrimary) {
        const key = `${primaryRuleURL}|||${primaryHashURL}`;
        dedupe.add(key);
        remoteRuleSets.push({ ruleURL: primaryRuleURL, hashURL: primaryHashURL });
    }

    if (Array.isArray(storage.remoteRuleSets)) {
        storage.remoteRuleSets.forEach(entry => {
            const normalized = normalizeRemoteRuleSetEntry(entry);
            if (!normalized) {
                return;
            }

            const key = `${normalized.ruleURL}|||${normalized.hashURL}`;
            if (dedupe.has(key)) {
                return;
            }

            dedupe.add(key);
            remoteRuleSets.push(normalized);
        });
    }

    return remoteRuleSets;
}

function mergeRemoteProviderGroup(providerGroup) {
    const merged = {
        urlPattern: providerGroup[0].data?.urlPattern,
        rules: [],
        rawRules: [],
        referralMarketing: [],
        exceptions: [],
        redirections: [],
        domainPatterns: [],
        domainExceptions: [],
        domainRedirections: [],
        methods: [],
        resourceTypes: [],
        completeProvider: false,
        forceRedirection: false
    };

    providerGroup.forEach(provider => {
        const data = provider.data || {};

        if (Array.isArray(data.rules)) {
            merged.rules = [...new Set([...merged.rules, ...data.rules])];
        }
        if (Array.isArray(data.rawRules)) {
            merged.rawRules = [...new Set([...merged.rawRules, ...data.rawRules])];
        }
        if (Array.isArray(data.referralMarketing)) {
            merged.referralMarketing = [...new Set([...merged.referralMarketing, ...data.referralMarketing])];
        }
        if (Array.isArray(data.exceptions)) {
            merged.exceptions = [...new Set([...merged.exceptions, ...data.exceptions])];
        }
        if (Array.isArray(data.redirections)) {
            merged.redirections = [...new Set([...merged.redirections, ...data.redirections])];
        }
        if (Array.isArray(data.domainPatterns)) {
            merged.domainPatterns = [...new Set([...merged.domainPatterns, ...data.domainPatterns])];
        }
        if (Array.isArray(data.domainExceptions)) {
            merged.domainExceptions = [...new Set([...merged.domainExceptions, ...data.domainExceptions])];
        }
        if (Array.isArray(data.domainRedirections)) {
            merged.domainRedirections = [...new Set([...merged.domainRedirections, ...data.domainRedirections])];
        }
        if (Array.isArray(data.methods)) {
            merged.methods = [...new Set([...merged.methods, ...data.methods])];
        }
        if (Array.isArray(data.resourceTypes)) {
            merged.resourceTypes = [...new Set([...merged.resourceTypes, ...data.resourceTypes])];
        }

        if (data.completeProvider === true) {
            merged.completeProvider = true;
        }
        if (data.forceRedirection === true) {
            merged.forceRedirection = true;
        }
    });

    if (typeof merged.urlPattern !== 'string' || merged.urlPattern.length === 0) {
        delete merged.urlPattern;
    }

    if (merged.rules.length === 0) delete merged.rules;
    if (merged.rawRules.length === 0) delete merged.rawRules;
    if (merged.referralMarketing.length === 0) delete merged.referralMarketing;
    if (merged.exceptions.length === 0) delete merged.exceptions;
    if (merged.redirections.length === 0) delete merged.redirections;
    if (merged.domainPatterns.length === 0) delete merged.domainPatterns;
    if (merged.domainExceptions.length === 0) delete merged.domainExceptions;
    if (merged.domainRedirections.length === 0) delete merged.domainRedirections;
    if (merged.methods.length === 0) delete merged.methods;
    if (merged.resourceTypes.length === 0) delete merged.resourceTypes;
    if (merged.completeProvider !== true) delete merged.completeProvider;
    if (merged.forceRedirection !== true) delete merged.forceRedirection;

    return merged;
}

function createMergedRemoteProviderName(providerGroup) {
    const prioritized = providerGroup.filter(provider => provider.isPrimarySource);
    if (prioritized.length > 0) {
        return prioritized[0].name;
    }

    const names = providerGroup.map(provider => provider.name);
    names.sort((a, b) => a.length - b.length);
    return names[0];
}

function mergeRemoteProvidersByUrlPattern(providers, primaryProviderNames = new Set()) {
    const urlPatternGroups = {};

    Object.entries(providers || {}).forEach(([providerName, providerData]) => {
        const pattern = providerData?.urlPattern || `__NO_PATTERN__${providerName}`;

        if (!urlPatternGroups[pattern]) {
            urlPatternGroups[pattern] = [];
        }

        urlPatternGroups[pattern].push({
            name: providerName,
            data: providerData,
            isPrimarySource: primaryProviderNames.has(providerName)
        });
    });

    const mergedProviders = {};

    Object.values(urlPatternGroups).forEach(providerGroup => {
        if (providerGroup.length === 1) {
            const onlyProvider = providerGroup[0];
            mergedProviders[onlyProvider.name] = onlyProvider.data;
            return;
        }

        const mergedProvider = mergeRemoteProviderGroup(providerGroup);
        const mergedName = createMergedRemoteProviderName(providerGroup);
        mergedProviders[mergedName] = mergedProvider;
    });

    return mergedProviders;
}

function mergeRemoteRulesSources(successfulSources, failedSources = []) {
    const combinedProviders = {};
    const primaryProviderNames = new Set();
    let mergedMetadata = null;

    successfulSources.forEach((source, sourceIndex) => {
        const providers = source.rules?.providers || {};
        const providerNames = Object.keys(providers);

        if (sourceIndex === 0) {
            providerNames.forEach(providerName => primaryProviderNames.add(providerName));
        }

        providerNames.forEach(providerName => {
            combinedProviders[providerName] = providers[providerName];
        });

        if (!mergedMetadata && source.rules?.metadata) {
            mergedMetadata = { ...source.rules.metadata };
        }
    });

    const mergedProviders = mergeRemoteProvidersByUrlPattern(combinedProviders, primaryProviderNames);
    const mergedRules = { providers: mergedProviders };
    const mergedProviderCount = Object.keys(mergedProviders).length;

    if (mergedProviderCount === 0) {
        throw new Error('No providers found after merging remote rule sources');
    }

    const hasRemoteMetadata = !!(mergedMetadata && typeof mergedMetadata === 'object' && !Array.isArray(mergedMetadata));

    if (hasRemoteMetadata) {
        const mergedMetadataName = 'Merged Remote Rules';
        const singleSourceMetadataName = mergedMetadata?.name || 'Remote Rules';

        mergedRules.metadata = {
            ...(mergedMetadata || {}),
            name: successfulSources.length > 1 ? mergedMetadataName : singleSourceMetadataName,
            source: successfulSources.length > 1 ? 'remote_merged' : 'remote',
            sourceURL: successfulSources.length > 1 ? 'multiple' : successfulSources[0].ruleURL,
            providerCount: mergedProviderCount,
            mergedSourceCount: successfulSources.length,
            failedSourceCount: failedSources.length,
            remoteSources: successfulSources.map(source => ({
                ruleURL: source.ruleURL,
                hashURL: source.hashURL,
                providerCount: Object.keys(source.rules?.providers || {}).length
            })),
            failedSources: failedSources.map(source => ({
                ruleURL: source.ruleURL,
                hashURL: source.hashURL,
                error: source.error
            }))
        };
    } else {
        mergedRules.metadata = {
            source: successfulSources.length > 1 ? 'remote_merged' : 'remote',
            sourceURL: successfulSources.length > 1 ? 'multiple' : successfulSources[0].ruleURL,
            providerCount: mergedProviderCount,
            mergedSourceCount: successfulSources.length,
            failedSourceCount: failedSources.length,
            remoteSources: successfulSources.map(source => ({
                ruleURL: source.ruleURL,
                hashURL: source.hashURL,
                providerCount: Object.keys(source.rules?.providers || {}).length
            })),
            failedSources: failedSources.map(source => ({
                ruleURL: source.ruleURL,
                hashURL: source.hashURL,
                error: source.error
            }))
        };
    }

    return mergedRules;
}

function areValidRemoteURLsPresent() {

     if (!storage.remoteRulesEnabled) {
        return false;
    }

    return getConfiguredRemoteRuleSets().length > 0;
}

function saveOnExit() {
    saveOnDisk(Object.keys(storage));
}

function storageAsJSON() {
    let json = {};
    
    const version = browser.runtime.getManifest().version;
    const extensionname = browser.runtime.getManifest().name;
    const rulesInfo = getRulesInfo();
    
    json.exportMetadata = {
        ExtensionName: extensionname,
        extensionVersion: version,
        exportDate: new Date().toISOString(),
        rulesName: rulesInfo.name,
        rulesVersion: rulesInfo.version,
        rulesLicense: rulesInfo.license
    };
    
    Object.entries(storage).forEach(([key, value]) => {
        // Skip ClearURLsData and linkumori-theme from export
        if (key !== 'ClearURLsData' && key !== 'linkumori-theme') {
            json[key] = storageDataAsString(key);
        }
    });

    return json;
}

function minifyCustomRules(data) {
    if (!data || !data.providers) {
        return null;
    }
    
    let minifiedData = { providers: {} };
    
    for (let provider in data.providers) {
        let self = {};
        let hasContent = false;
        
        if (data.providers[provider].completeProvider === true) {
            self.completeProvider = true;
            hasContent = true;
        }
        
        if (data.providers[provider].forceRedirection === true) {
            self.forceRedirection = true;
            hasContent = true;
        }
        
        if (data.providers[provider].urlPattern && data.providers[provider].urlPattern !== "") {
            self.urlPattern = data.providers[provider].urlPattern;
            hasContent = true;
        }
        
        if (data.providers[provider].rules && data.providers[provider].rules.length !== 0) {
            self.rules = data.providers[provider].rules;
            hasContent = true;
        }
        
        if (data.providers[provider].rawRules && data.providers[provider].rawRules.length !== 0) {
            self.rawRules = data.providers[provider].rawRules;
            hasContent = true;
        }
        
        if (data.providers[provider].referralMarketing && data.providers[provider].referralMarketing.length !== 0) {
            self.referralMarketing = data.providers[provider].referralMarketing;
            hasContent = true;
        }
        
        if (data.providers[provider].exceptions && data.providers[provider].exceptions.length !== 0) {
            self.exceptions = data.providers[provider].exceptions;
            hasContent = true;
        }
        
        if (data.providers[provider].redirections && data.providers[provider].redirections.length !== 0) {
            self.redirections = data.providers[provider].redirections;
            hasContent = true;
        }
        
        if (data.providers[provider].domainPatterns && data.providers[provider].domainPatterns.length !== 0) {
            self.domainPatterns = data.providers[provider].domainPatterns;
            hasContent = true;
        }
        
        if (data.providers[provider].domainExceptions && data.providers[provider].domainExceptions.length !== 0) {
            self.domainExceptions = data.providers[provider].domainExceptions;
            hasContent = true;
        }
        
        if (data.providers[provider].domainRedirections && data.providers[provider].domainRedirections.length !== 0) {
            self.domainRedirections = data.providers[provider].domainRedirections;
            hasContent = true;
        }
        
        if (data.providers[provider].methods && data.providers[provider].methods.length !== 0) {
            self.methods = data.providers[provider].methods;
            hasContent = true;
        }
        
        if (data.providers[provider].resourceTypes && data.providers[provider].resourceTypes.length !== 0) {
            self.resourceTypes = data.providers[provider].resourceTypes;
            hasContent = true;
        }
        
        if (hasContent) {
            minifiedData.providers[provider] = self;
        }
    }
    
    if (Object.keys(minifiedData.providers).length === 0) {
        return null;
    }
    
    return minifiedData;
}

function storageDataAsString(key) {
    let value = storage[key];

    switch (key) {
        case "ClearURLsData":
            return null;
        case "log":
            return JSON.stringify(value);
        case "userWhitelist":
            if (Array.isArray(value)) {
                return JSON.stringify(value);
            } else if (typeof value === 'string') {
                return value;
            } else {
                return JSON.stringify([]);
            }
        case "custom_rules":
            const minifiedRules = minifyCustomRules(value);
            if (minifiedRules === null) {
                return JSON.stringify({ providers: {} });
            }
            return JSON.stringify(minifiedRules);
        case "remoteRulescache":
            try { return JSON.stringify(value); } catch (e) { return JSON.stringify(null); }
        case "types":
            return value.toString();
        default:
            return value;
    }
}

function deleteFromDisk(key) {
    browser.storage.local.remove(key).catch(handleError);
}

function saveOnDisk(keys) {
    let json = {};

    keys.forEach(function (key) {
        const value = storageDataAsString(key);
        if (value !== null) {
            json[key] = value;
        }
    });

    browser.storage.local.set(json).catch(handleError);
}

function deferSaveOnDisk(key) {
    if (hasPendingSaves) {
        pendingSaves.add(key);
        return;
    }

    browser.alarms.create("deferSaveOnDisk", {
        delayInMinutes: 1
    });

    hasPendingSaves = true;
}

browser.alarms.onAlarm.addListener(function (alarmInfo) {
    if (alarmInfo.name === "deferSaveOnDisk") {
        saveOnDisk(Array.from(pendingSaves));
        pendingSaves.clear();
        hasPendingSaves = false;
    }
});

async function verifyRulesHash(rulesData, expectedHash) {
    const verificationResult = {
        verified: false,
        computedHash: null,
        expectedHash: expectedHash,
        hashMatch: false,
        timestamp: new Date().toISOString(),
        error: null
    };
    
    try {
        const computedHash = await sha256(rulesData);
        verificationResult.computedHash = computedHash;
        
        verificationResult.hashMatch = computedHash === expectedHash;
        verificationResult.verified = verificationResult.hashMatch;
        
        if (!verificationResult.verified) {
            verificationResult.error = `Hash mismatch: expected ${expectedHash}, got ${computedHash}`;
        }
        
    } catch (error) {
        verificationResult.error = `Hash computation failed: ${error.message}`;
    }
    
    return verificationResult;
}

function saveRemoteRulesCache(remoteRules, meta) {
    if (!storage.remoteRulescache || typeof storage.remoteRulescache !== 'object') {
        storage.remoteRulescache = {};
    }

    storage.remoteRulescache = {
        verified: true,
        data: remoteRules
    };

    try {
        saveOnDisk(['remoteRulescache']);
    } catch (e) {
    }
}

function loadRemoteRulesFromCache(expectedHash = null, cacheReason = 'cache_used') {
    const cache = storage.remoteRulescache;

    if (!cache || typeof cache !== 'object' || Array.isArray(cache)) {
        return null;
    }

    if (cache.verified === false) {
        return null;
    }

    const cachedData = cache.data;
    if (!cachedData || typeof cachedData !== 'object' || !cachedData.providers || Object.keys(cachedData.providers).length === 0) {
        return null;
    }

    storage.rulesMetadata = null;
    
    if (cachedData.metadata) {
        storage.rulesMetadata = cachedData.metadata;
        storage.rulesMetadata.source = 'remote_cache';
        storage.rulesMetadata.sourceURL = 'cache';
    }

    storage.hashStatus = `cache_remote_rules_${cacheReason}`;
    tempVerificationCache.isRemoteVerified = false;
    tempVerificationCache.isCacheUsed = true;

    return cachedData;
}

function fetchRemoteRules(url, expectedHash = null) {
    return new Promise((resolve, reject) => {
        if (!storage.remoteRulesEnabled) {
            reject(new Error('Remote rules are disabled'));
            return;
        }

        if (!areValidRemoteURLsPresent()) {
            reject(new Error('SECURITY BLOCK: Network calls require both valid ruleURL and hashURL'));
            return;
        }
        
        if (!url || typeof url !== 'string' || url.trim() === '') {
            reject(new Error('Invalid URL provided'));
            return;
        }

        if (!expectedHash || typeof expectedHash !== 'string' || expectedHash.trim() === '') {
            const error = new Error('SECURITY ERROR: Hash verification is MANDATORY for remote rules. No expected hash provided.');
            reject(error);
            return;
        }

       fetch(url)
       .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response.text();
        })
        .then(async data => {
            if (!data || data.trim().length === 0) {
                throw new Error('Remote rules file is empty');
            }

            const verification = await verifyRulesHash(data, expectedHash);
            
            tempVerificationCache.lastVerification = verification;
            tempVerificationCache.isRemoteVerified = verification.verified;
            tempVerificationCache.isCacheUsed = false;

            if (!verification.verified) {
                const securityError = new Error(`SECURITY ERROR: ${verification.error}`);
                reject(securityError);
                return;
            }

            let remoteRulesData;
            try {
                remoteRulesData = JSON.parse(data);
            } catch (parseError) {
                throw new Error(`Invalid JSON in remote rules: ${parseError.message}`);
            }

            if (!remoteRulesData || typeof remoteRulesData !== 'object') {
                throw new Error('Remote rules file does not contain valid object');
            }

            storage.rulesMetadata = null;
            
            if (remoteRulesData.metadata) {
                storage.rulesMetadata = remoteRulesData.metadata;
                storage.rulesMetadata.source = 'remote';
                storage.rulesMetadata.sourceURL = url;
            }

            const remoteRules = remoteRulesData;

            if (!remoteRules.providers || typeof remoteRules.providers !== 'object') {
                throw new Error('Remote rules missing providers object');
            }

            const providerCount = Object.keys(remoteRules.providers).length;
            if (providerCount === 0) {
                throw new Error('No providers found in remote rules');
            }

            storage.hashStatus = "remote_verified";
            storage.hashFailureReason = null;

            saveRemoteRulesCache(remoteRules, {
                ruleURL: url,
                hashURL: storage.hashURL || '',
                expectedHash: expectedHash,
                computedHash: verification.computedHash,
                timestamp: verification.timestamp
            });

            resolve(remoteRules);
        })
        .catch(error => {
            storage.hashFailureReason = error.message;
            storage.hashStatus = "remote_failed";
            tempVerificationCache.isRemoteVerified = false;
            reject(error);
        });
    });
}

function fetchRemoteHash(hashUrl) {
    return new Promise((resolve, reject) => {
        if (!storage.remoteRulesEnabled) {
            reject(new Error('Remote rules are disabled'));
            return;
        }

        if (!areValidRemoteURLsPresent()) {
            reject(new Error('SECURITY BLOCK: Network calls require both valid ruleURL and hashURL'));
            return;
        }
        
        if (!hashUrl || typeof hashUrl !== 'string' || hashUrl.trim() === '') {
            reject(new Error('Invalid hash URL provided'));
            return;
        }

        fetch(hashUrl, {
            method: 'GET',
            cache: 'no-store'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response.text();
        })
        .then(hash => {
            const cleanHash = hash.trim();
            if (!cleanHash) {
                throw new Error('Remote hash is empty');
            }
            
            if (!/^[a-fA-F0-9]{32,128}$/.test(cleanHash)) {
                throw new Error('Invalid hash format received');
            }
            
            resolve(cleanHash);
        })
        .catch(error => {
            reject(error);
        });
    });
}

function loadBundledRules() {
    if (!areValidRemoteURLsPresent()) {
        storage.hashStatus = "no_remote_urls";
        storage.hashValidationStatus = 'not_applicable';
        tempVerificationCache.isRemoteVerified = false;
        
        return loadBundledRulesInternal(false);
    }

    const configuredRemoteSets = getConfiguredRemoteRuleSets();

    if (configuredRemoteSets.length === 0) {
        storage.hashStatus = "invalid_remote_urls";
        storage.hashValidationStatus = 'failed_validation';
        tempVerificationCache.isRemoteVerified = false;
        
        return loadBundledRulesInternal(false);
    }

    const fetchJobs = configuredRemoteSets.map(set => {
        return fetchRemoteHash(set.hashURL)
            .then(remoteHash => fetchRemoteRules(set.ruleURL, remoteHash))
            .then(rules => ({
                ruleURL: set.ruleURL,
                hashURL: set.hashURL,
                rules
            }));
    });

    return Promise.allSettled(fetchJobs)
        .then(results => {
            const successful = [];
            const failed = [];

            results.forEach((result, index) => {
                const set = configuredRemoteSets[index];
                if (result.status === 'fulfilled') {
                    successful.push(result.value);
                } else {
                    failed.push({
                        ruleURL: set.ruleURL,
                        hashURL: set.hashURL,
                        error: result.reason?.message || 'Unknown remote source error'
                    });
                }
            });

            if (successful.length === 0) {
                throw new Error(failed.map(item => item.error).join('; ') || 'All remote sources failed');
            }

            const mergedRemoteRules = mergeRemoteRulesSources(successful, failed);
            storage.rulesMetadata = mergedRemoteRules.metadata;
            storage.hashFailureReason = failed.length > 0
                ? failed.map(item => item.error).join('; ')
                : null;

            if (successful.length > 1 && failed.length === 0) {
                storage.hashStatus = "remote_rules_merged";
                storage.hashValidationStatus = 'verified';
            } else if (successful.length > 1 && failed.length > 0) {
                storage.hashStatus = "remote_rules_partially_merged";
                storage.hashValidationStatus = 'partially_verified';
            } else if (successful.length === 1 && failed.length > 0) {
                storage.hashStatus = "remote_partially_verified";
                storage.hashValidationStatus = 'partially_verified';
            } else {
                storage.hashStatus = "remote_verified";
                storage.hashValidationStatus = 'verified';
            }

            tempVerificationCache.isRemoteVerified = true;
            tempVerificationCache.isCacheUsed = false;

            saveRemoteRulesCache(mergedRemoteRules, {
                sourceCount: successful.length,
                failedSourceCount: failed.length,
                timestamp: new Date().toISOString()
            });

            return mergeCustomRules(mergedRemoteRules);
        })
        .catch(() => {
            storage.hashValidationStatus = 'failed';
            tempVerificationCache.isRemoteVerified = false;
            
            const cacheRules = loadRemoteRulesFromCache(null, 'after_remote_failure');
            if (cacheRules) {
                storage.hashValidationStatus = 'cache_used_after_remote_failure';
                return mergeCustomRules(cacheRules);
            }
            
            return loadBundledRulesInternal(true);
        });
}

function loadBundledRulesInternal(isFallback = false) {
    const rulesURL = browser.runtime.getURL('data/linkumori-clearurls-min.json');
    
    return fetch(rulesURL)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText} - Rules file not accessible`);
            }
            return response.text();
        })
        .then(async data => {
            if (!data || data.trim().length === 0) {
                throw new Error('Rules file is empty or contains no data');
            }
            
            let rawRulesData;
            try {
                rawRulesData = JSON.parse(data);
            } catch (parseError) {
                throw new Error(`Invalid JSON in rules file: ${parseError.message}`);
            }
            
            if (!rawRulesData || typeof rawRulesData !== 'object') {
                throw new Error('Rules file does not contain a valid object');
            }
            
            if (rawRulesData.metadata) {
                storage.rulesMetadata = rawRulesData.metadata;
                storage.rulesMetadata.source = 'bundled';
            }
            
            const bundledRules = rawRulesData;
            
            if (!bundledRules.providers || typeof bundledRules.providers !== 'object') {
                throw new Error('Rules file missing providers object');
            }
            
            const providerCount = Object.keys(bundledRules.providers).length;
            if (providerCount === 0) {
                throw new Error('No providers found in rules file');
            }
            
            const bundledRulesHash = await sha256(JSON.stringify(bundledRules, Object.keys(bundledRules).sort()));
            storage.dataHash = bundledRulesHash;
            
            if (isFallback) {
                storage.hashStatus = "bundled_rules_fallback";
            } else {
                storage.hashStatus = "bundled_rules_loaded";
            }
            
            return mergeCustomRules(bundledRules);
        })
        .catch(error => {
            const cacheRules = loadRemoteRulesFromCache(null, 'after_bundled_failure');
            if (cacheRules) {
                storage.hashValidationStatus = 'cache_used_bundled_failed';
                return mergeCustomRules(cacheRules);
            }
            
            if (storage.ClearURLsData && Object.keys(storage.ClearURLsData).length > 0) {
                storage.hashStatus = "cached_rules_used";
                return storage.ClearURLsData;
            }
            
            const fallbackRules = getEnhancedFallbackRules();
            if (isFallback) {
                storage.hashStatus = "fallback_rules_used_after_remote_failure";
            } else {
                storage.hashStatus = "fallback_rules_used";
            }
            return mergeCustomRules(fallbackRules);
        });
}

function getEnhancedFallbackRules() {
    return {
        "metadata": {
            "name": "Enhanced Fallback Rules",
            "version": "1.0.0",
            "license": "LGPL-3.0-or-later",
            "author": "Linkumori",
            "source": "fallback"
        },
        "providers": {
            "globalRules": {
                "urlPattern": ".*",
                "completeProvider": false,
                "rules": [
                    "(?:%3F)?utm(?:_[a-z_]*)?",
                    "(?:%3F)?ga_[a-z_]+",
                    "(?:%3F)?fbclid",
                    "(?:%3F)?gclid",
                    "(?:%3F)?_ga",
                    "(?:%3F)?_gl",
                    "(?:%3F)?twclid",
                    "(?:%3F)?msclkid",
                    "(?:%3F)?dclid",
                    "(?:%3F)?srsltid"
                ],
                "referralMarketing": [
                    "(?:%3F)?ref_?",
                    "(?:%3F)?referrer"
                ],
                "rawRules": [],
                "exceptions": [],
                "redirections": [],
                "forceRedirection": false
            },
            "fallback-google": {
                "urlPattern": "^https?:\\/\\/(?:[a-z0-9-]+\\.)*?google(?:\\.[a-z]{2,}){1,}",
                "completeProvider": false,
                "rules": [
                    "ved", "ei", "uact", "cd", "cad", 
                    "gws_rd", "source", "gs_l"
                ],
                "referralMarketing": ["referrer"],
                "rawRules": [],
                "exceptions": [
                    "^https?:\\/\\/(?:docs|accounts)\\.google(?:\\.[a-z]{2,}){1,}"
                ],
                "redirections": [],
                "forceRedirection": false
            },
            "fallback-amazon": {
                "urlPattern": "^https?:\\/\\/(?:[a-z0-9-]+\\.)*?amazon(?:\\.[a-z]{2,}){1,}",
                "completeProvider": false,
                "rules": [
                    "ref_?", "tag", "pf_rd_[a-z]*", "qid", "sr"
                ],
                "referralMarketing": ["tag"],
                "rawRules": ["\\/ref=[^/?]*"],
                "exceptions": [],
                "redirections": [],
                "forceRedirection": false
            }
        }
    };
}

function mergeCustomRules(bundledRules) {
    return new Promise(async (resolve) => {
        try {
            const result = await browser.storage.local.get(['custom_rules']);
            let customRules = null;
            let customProviderCount = 0;
            
            if (result.custom_rules) {
                try {
                    if (typeof result.custom_rules === 'string') {
                        customRules = JSON.parse(result.custom_rules);
                    } else {
                        customRules = result.custom_rules;
                    }
                    
                    if (customRules && customRules.providers) {
                        customProviderCount = Object.keys(customRules.providers).length;
                    } else if (customRules && typeof customRules === 'object' && !customRules.providers) {
                        customProviderCount = Object.keys(customRules).length;
                        customRules = { providers: customRules };
                    }
                } catch (error) {
                    customRules = null;
                }
            }
            
            if (result.hasOwnProperty('custom_rules') && 
                customRules && 
                customRules.providers && 
                Object.keys(customRules.providers).length === 0) {
                customProviderCount = 0;
                customRules = { providers: {} };
            }
            
            if (!customRules || customProviderCount === 0) {
                storage.ClearURLsData = bundledRules;
                storage.mergeStats = {
                    bundledProviders: Object.keys(bundledRules.providers || {}).length,
                    customProviders: 0,
                    overriddenProviders: 0,
                    totalProviders: Object.keys(bundledRules.providers || {}).length,
                    overriddenProviderNames: []
                };
                
                const ruleString = JSON.stringify(bundledRules, Object.keys(bundledRules).sort());
                const hash = await sha256(ruleString);
                storage.dataHash = hash;
                
                if (storage.hashStatus && storage.hashStatus.startsWith('cache_remote_rules_')) {
                } else if (tempVerificationCache.isRemoteVerified) {
                    storage.hashStatus = "remote_rules_loaded";
                } else if (storage.hashStatus === "hash_url_missing") {
                    storage.hashStatus = "bundled_fallback_loaded";
                } else if (storage.hashStatus === "bundled_rules_fallback") {
                    storage.hashStatus = "bundled_rules_fallback";
                } else if (storage.hashStatus === "fallback_rules_used_after_remote_failure") {
                    storage.hashStatus = "fallback_rules_used_after_remote_failure";
                } else if (storage.hashStatus === "fallback_rules_used") {
                    storage.hashStatus = "fallback_rules_loaded";
                } else {
                    storage.hashStatus = "bundled_rules_loaded";
                }
            } else {
                const bundledProviderNames = Object.keys(bundledRules.providers || {});
                const customProviderNames = Object.keys(customRules.providers || {});
                
                const overriddenProviders = customProviderNames.filter(name => 
                    bundledProviderNames.includes(name)
                );
                
                const filteredBundledProviders = {};
                bundledProviderNames.forEach(providerName => {
                    if (!overriddenProviders.includes(providerName)) {
                        filteredBundledProviders[providerName] = bundledRules.providers[providerName];
                    }
                });
                
                const mergedRules = {
                    providers: {
                        ...filteredBundledProviders,
                        ...customRules.providers
                    }
                };
                
                if (bundledRules.metadata) {
                    mergedRules.metadata = bundledRules.metadata;
                }
                
                storage.mergeStats = {
                    bundledProviders: bundledProviderNames.length,
                    customProviders: customProviderNames.length,
                    overriddenProviders: overriddenProviders.length,
                    totalProviders: Object.keys(mergedRules.providers).length,
                    overriddenProviderNames: overriddenProviders,
                    filteredBundledProviders: Object.keys(filteredBundledProviders).length,
                    newCustomProviders: customProviderNames.filter(name => 
                        !bundledProviderNames.includes(name)
                    ).length
                };
                
                const newCustomProviders = customProviderNames.filter(name => 
                    !bundledProviderNames.includes(name)
                );
                
                storage.ClearURLsData = mergedRules;
                const ruleStringmerge = JSON.stringify(mergedRules, Object.keys(mergedRules).sort());
                const hashmerge = await sha256(ruleStringmerge);
                storage.dataHash = hashmerge;
                
                if (storage.hashStatus && storage.hashStatus.startsWith('cache_remote_rules_')) {
                    storage.hashStatus = storage.hashStatus.replace('cache_remote_rules_', 'cache_remote_custom_rules_');
                } else if (tempVerificationCache.isRemoteVerified) {
                    storage.hashStatus = "remote_custom_rules_merged";
                } else {
                    storage.hashStatus = "custom_rules_merged";
                }
            }
            
            saveOnDisk(['ClearURLsData', 'dataHash', 'hashStatus', 'mergeStats']);
            resolve(storage.ClearURLsData);
            
        } catch (error) {
            storage.ClearURLsData = bundledRules;
            storage.dataHash = "bundled-fallback-" + Date.now();
            storage.hashStatus = "custom_rules_failed";
            storage.mergeStats = {
                bundledProviders: Object.keys(bundledRules.providers || {}).length,
                customProviders: 0,
                overriddenProviders: 0,
                totalProviders: Object.keys(bundledRules.providers || {}).length,
                overriddenProviderNames: [],
                error: error.message
            };
            
            saveOnDisk(['ClearURLsData', 'dataHash', 'hashStatus', 'mergeStats']);
            resolve(storage.ClearURLsData);
        }
    });
}

function reloadCustomRules() {
    return loadBundledRules().then(() => {
        if (typeof updateProviderData === 'function') {
            updateProviderData();
        }
        
        return storage.ClearURLsData;
    }).catch(error => {
        throw error;
    });
}

function isValidRuleURL(url) {
    if (!url || typeof url !== 'string') {
        return false;
    }
    
    const trimmed = url.trim();
    if (trimmed === '') {
        return false;
    }
    
    try {
        const urlObj = new URL(trimmed);
        
        if (urlObj.protocol !== 'https:') {
            return false;
        }
        
        if (!urlObj.hostname || urlObj.hostname.length === 0) {
            return false;
        }
        
        return true;
    } catch (error) {
        return false;
    }
}

function getFallbackRules() {
    return {
        "metadata": {
            "name": "Fallback Rules",
            "version": "1.0.0",
            "license": "LGPL-3.0-or-later",
            "author": "Linkumori",
            "source": "fallback"
        },
        "providers": {
            "globalRules": {
                "urlPattern": ".*",
                "rules": [
                    "(?:%3F)?utm(?:_[a-z_]*)?",
                    "(?:%3F)?ga_[a-z_]+",
                    "(?:%3F)?fbclid",
                    "(?:%3F)?gclid",
                    "(?:%3F)?_ga",
                    "(?:%3F)?_gl"
                ],
                "referralMarketing": [],
                "exceptions": [],
                "redirections": [],
                "forceRedirection": false,
                "patternType": "original"
            }
        }
    };
}

function normalizeRemoteRulescacheShape() {
    const v = storage.remoteRulescache;

    if (typeof v === 'string') {
        try { storage.remoteRulescache = JSON.parse(v); } catch { storage.remoteRulescache = null; }
    }

    if (!storage.remoteRulescache || typeof storage.remoteRulescache !== 'object' || Array.isArray(storage.remoteRulescache)) {
        storage.remoteRulescache = null;
        return;
    }

    if (typeof storage.remoteRulescache.verified === 'undefined') {
        storage.remoteRulescache.verified = true;
        deferSaveOnDisk('remoteRulescache');
    }
}

function genesis() {
    browser.storage.local.get(null).then((items) => {
        initStorage(items);

        loadBundledRules().then(() => {
            start();
            changeIcon();
            contextMenuStart();
            historyListenerStart();
            
        }).catch(error => {
            start();
            changeIcon();
            contextMenuStart();
            historyListenerStart();
        });
    }, handleError);
}

function getData(key) {
    return storage[key];
}

function getEntireData() {
    return storage;
}

function setData(key, value) {
    switch (key) {
        case "ClearURLsData":
        case "log":
            if (typeof value === 'string') {
                storage[key] = JSON.parse(value);
            } else {
                storage[key] = value;
            }
            break;
        case "custom_rules":
            if (typeof value === 'string') {
                storage[key] = JSON.parse(value);
            } else {
                storage[key] = value;
            }
            break;
        case "userWhitelist":
            if (typeof value === 'string') {
                try {
                    storage[key] = JSON.parse(value);
                } catch (e) {
                    storage[key] = value ? [value] : [];
                }
            } else if (Array.isArray(value)) {
                storage[key] = value;
            } else if (value === null || value === undefined) {
                storage[key] = [];
            } else {
                storage[key] = [];
            }
            break;
        case "hashURL":
        case "ruleURL":
            if (value && typeof value === 'string' && value.trim() !== '') {
                const cleanURL = value.trim();
                if (isValidRuleURL(cleanURL)) {
                    storage[key] = cleanURL;
                } else {
                }
            } else {
                storage[key] = '';
            }
            break;
        case "remoteRuleSets": {
            let parsed = value;
            if (typeof value === 'string') {
                try {
                    parsed = JSON.parse(value);
                } catch (e) {
                    parsed = [];
                }
            }

            if (!Array.isArray(parsed)) {
                storage[key] = [];
                break;
            }

            const dedupe = new Set();
            storage[key] = parsed
                .map(normalizeRemoteRuleSetEntry)
                .filter(entry => {
                    if (!entry) {
                        return false;
                    }
                    const pairKey = `${entry.ruleURL}|||${entry.hashURL}`;
                    if (dedupe.has(pairKey)) {
                        return false;
                    }
                    dedupe.add(pairKey);
                    return true;
                });
            break;
        }
        case "types":
            if (typeof value === 'string') {
                storage[key] = value.split(',');
            } else {
                storage[key] = value;
            }
            break;
        case "logLimit":
            storage[key] = Math.max(0, Number(value));
            break;
        case "globalurlcounter":
            storage["totalCounter"] = value;
            delete storage[key];
            deleteFromDisk(key);
            saveOnExit();
            break;
        case "globalCounter":
            storage["cleanedCounter"] = value;
            delete storage[key];
            deleteFromDisk(key);
            saveOnExit();
            break;
        case "remoteRulescache": {
            let parsed = null;
            try {
                parsed = (typeof value === 'string') ? JSON.parse(value) : value;
            } catch (e) {
                parsed = null;
            }
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                storage[key] = parsed;
            } else {
                storage[key] = null;
            }
            break;
        }
        default:
            storage[key] = value;
    }
}

function initStorage(items) {
    initSettings();

    if (!isEmpty(items)) {
        Object.entries(items).forEach(([key, value]) => {
            setData(key, value);
        });
    }

    normalizeRemoteRulescacheShape();
}

function initSettings() {
    storage.ClearURLsData = [];
    storage.dataHash = "";
    storage.remoteRulesEnabled = false;
    storage.rulesMetadata = null;
    storage.badgedStatus = true;
    storage.globalStatus = true;
    storage.totalCounter = 0;
    storage.cleanedCounter = 0;
    storage.hashStatus = "bundled_rules_pending";
    storage.loggingStatus = false;
    storage.log = {"log": []};
    storage.statisticsStatus = true;
    storage.badged_color = "#2563eb";
    storage.remoteRulescache = null;
    storage.remoteRuleSets = [];
    
    storage.hashURL = "";
    storage.ruleURL = "";
    
    storage.contextMenuEnabled = true;
    storage.historyListenerEnabled = true;
    storage.localHostsSkipping = true;
    storage.referralMarketing = false;
    storage.logLimit = 100;
    storage.domainBlocking = true;
    storage.pingBlocking = true;
    storage.eTagFiltering = false;
    storage.watchDogErrorCount = 0;
    storage.userWhitelist = [];
    storage.custom_rules = { providers: {} };
    
    if (getBrowser() === "Firefox") {
        storage.types = ["font", "image", "imageset", "main_frame", "media", "object", "object_subrequest", "other", "script", "stylesheet", "sub_frame", "websocket", "xml_dtd", "xmlhttprequest", "xslt"];
        storage.pingRequestTypes = ["ping", "beacon"];
    } else if (getBrowser() === "Chrome") {
        storage.types = ["main_frame", "sub_frame", "stylesheet", "script", "image", "font", "object", "xmlhttprequest", "ping", "csp_report", "media", "websocket", "other"];
        storage.pingRequestTypes = ["ping"];
    }
}

function loadOldDataFromStore() {
    localDataHash = storage.dataHash;
}

function storeHashStatus(status_code) {
    storage.hashStatus = status_code;
}

function getRulesMetadata() {
    return storage.rulesMetadata || null;
}

function getRulesInfo() {
    const metadata = getRulesMetadata();
    const providers = storage.ClearURLsData?.providers || {};
    const providerCount = Object.keys(providers).length;
    
    // Handle case when metadata is null or undefined
    return {
        hasMetadata: !!metadata,
        name: metadata?.name || 'Unknown',
        version: metadata?.version || 'Unknown',
        license: metadata?.license || 'Unknown',
        author: metadata?.author || 'Unknown',
        lastUpdated: metadata?.lastUpdated || 'Unknown',
        source: metadata?.source || 'Unknown',
        sourceURL: metadata?.sourceURL || 'N/A',
        actualProviderCount: providerCount,
        expectedProviderCount: metadata?.providerCount || 'Unknown',
        hashStatus: storage.hashStatus || 'Unknown'
    };
}

function addToWhitelist(domain) {
    if (!storage.userWhitelist) {
        storage.userWhitelist = [];
    }
    
    if (!domain || typeof domain !== 'string') {
        return false;
    }
    
    const cleanDomain = domain.toLowerCase().trim();
    
    if (!cleanDomain || !isValidWhitelistDomain(cleanDomain)) {
        return false;
    }
    
    if (storage.userWhitelist.includes(cleanDomain)) {
        return false;
    }
    
    storage.userWhitelist.push(cleanDomain);
    
    try {
        saveOnDisk(['userWhitelist']);
    } catch (error) {
    }
    
    return true;
}

function removeFromWhitelist(domain) {
    if (!storage.userWhitelist || storage.userWhitelist.length === 0) {
        return false;
    }
    
    if (!domain || typeof domain !== 'string') {
        return false;
    }
    
    const cleanDomain = domain.toLowerCase().trim();
    
    const index = storage.userWhitelist.indexOf(cleanDomain);
    
    if (index > -1) {
        storage.userWhitelist.splice(index, 1);
        
        try {
            saveOnDisk(['userWhitelist']);
        } catch (error) {
        }
        
        return true;
    }
    
    return false;
}

function getWhitelist() {
    const result = storage.userWhitelist || [];
    return result;
}

function clearWhitelist() {
    storage.userWhitelist = [];
    
    try {
        saveOnDisk(['userWhitelist']);
    } catch (error) {
    }
    
    return true;
}

function isInWhitelist(domain) {
    if (!storage.userWhitelist || storage.userWhitelist.length === 0) {
        return false;
    }
    
    const cleanDomain = domain.toLowerCase().trim();
    const result = storage.userWhitelist.includes(cleanDomain);
    return result;
}

function isValidWhitelistDomain(domain) {
    if (!domain || typeof domain !== 'string') {
        return false;
    }
    
    let testDomain = domain;
    
    if (domain.startsWith('*.')) {
        testDomain = domain.substring(2);
        if (!testDomain) {
            return false;
        }
    }
    
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/;
    const isValid = domainRegex.test(testDomain);
    
    return isValid;
}

function getWhitelistStats() {
    const whitelist = storage.userWhitelist || [];
    const wildcardCount = whitelist.filter(domain => domain.startsWith('*.')).length;
    const exactCount = whitelist.length - wildcardCount;
    
    const stats = {
        total: whitelist.length,
        exact: exactCount,
        wildcard: wildcardCount,
        domains: whitelist
    };
    
    return stats;
}

function getCustomRulesMergeInfo() {
    const mergedData = getData('ClearURLsData') || { providers: {} };
    const customRules = getData('custom_rules') || { providers: {} };
    const hashStatus = getData('hashStatus') || 'unknown';
    const mergeStats = getData('mergeStats') || {};
    
    const allProviders = Object.keys(mergedData.providers || {});
    const customProviderNames = Object.keys(customRules.providers || {});
    
    const mergedCustomProviders = customProviderNames.filter(name => 
        allProviders.includes(name)
    );
    const missingCustomProviders = customProviderNames.filter(name => 
        !allProviders.includes(name)
    );
    
    const info = {
        totalProviders: allProviders.length,
        customProvidersStored: customProviderNames.length,
        customProvidersMerged: mergedCustomProviders.length,
        customProvidersMissing: missingCustomProviders.length,
        hashStatus: hashStatus,
        customProviderNames: customProviderNames,
        mergedCustomProviders: mergedCustomProviders,
        missingCustomProviders: missingCustomProviders,
        sampleBuiltInProviders: allProviders.filter(name => 
            !customProviderNames.includes(name)
        ).slice(0, 5),
        mergeSuccess: missingCustomProviders.length === 0 && customProviderNames.length > 0,
        
        mergeStats: mergeStats,
        overriddenProviders: mergeStats.overriddenProviders || 0,
        overriddenProviderNames: mergeStats.overriddenProviderNames || [],
        newCustomProviders: mergeStats.newCustomProviders || 0,
        filteredBundledProviders: mergeStats.filteredBundledProviders || 0,
        
        providerAnalysis: {
            bundled: {
                total: mergeStats.bundledProviders || 0,
                active: mergeStats.filteredBundledProviders || 0,
                overridden: mergeStats.overriddenProviders || 0
            },
            custom: {
                total: mergeStats.customProviders || 0,
                overrides: mergeStats.overriddenProviders || 0,
                new: mergeStats.newCustomProviders || 0
            },
            final: {
                total: allProviders.length,
                bundledActive: mergeStats.filteredBundledProviders || 0,
                customActive: mergeStats.customProviders || 0
            }
        },
        
        remoteVerificationStatus: tempVerificationCache.isRemoteVerified
    };
    
    return info;
}

function getHashVerificationStatus() {
    return {
        isRemoteVerified: tempVerificationCache.isRemoteVerified,
        isCacheUsed: tempVerificationCache.isCacheUsed,
        lastVerification: tempVerificationCache.lastVerification,
        hashStatus: storage.hashStatus || 'unknown'
    };
}

function getNetworkCallStatus() {
    const configuredRemoteSets = getConfiguredRemoteRuleSets();
    const hasValidUrls = configuredRemoteSets.length > 0;
    const firstRemoteSet = configuredRemoteSets[0] || { ruleURL: '', hashURL: '' };

    return {
        networkCallsAllowed: hasValidUrls,
        ruleURL: firstRemoteSet.ruleURL,
        hashURL: firstRemoteSet.hashURL,
        ruleURLValid: isValidRuleURL(firstRemoteSet.ruleURL),
        hashURLValid: isValidRuleURL(firstRemoteSet.hashURL),
        configuredRemoteSourceCount: configuredRemoteSets.length,
        hashStatus: storage.hashStatus || 'unknown',
        remoteVerified: tempVerificationCache.isRemoteVerified,
        message: hasValidUrls ? 
            `Network calls permitted - ${configuredRemoteSets.length} remote source(s) valid` :
            'Network calls BLOCKED - missing or invalid remote source pairs'
    };
}

genesis();

browser.storage.local.get(['firstInstall']).then(result => {
    if (!result.firstInstall) {
        browser.alarms.create('firstInstallAlarm', { delayInMinutes: 1 });
    browser.tabs.create({
        url: 'html/legal.html',
    });
        browser.storage.local.set({ firstInstall: true });
  }
});
