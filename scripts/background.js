console.log("ADSRM/scripts/background.js:LOADED");

// Function to load and update site map
function loadSiteMap() {
    fetch(chrome.runtime.getURL('site-map.json'))
        .then(response => response.json())
        .then(newSiteMapData => {
            // Get current stored site map to preserve activation states
            chrome.storage.local.get("siteMap", function(result) {
                let currentSiteMapData = result.siteMap || {};
                let shouldUpdate = false;
                
                // Check if new version exists or if no current data
                if (!currentSiteMapData.version || 
                    !newSiteMapData.version || 
                    currentSiteMapData.version !== newSiteMapData.version ||
                    !currentSiteMapData.sites) {
                    
                    shouldUpdate = true;
                    console.log('New site-map version detected or first load');
                }
                
                if (shouldUpdate) {
                    // Preserve existing activation states
                    let preservedStates = {};
                    if (currentSiteMapData.sites) {
                        for (const urlPattern in currentSiteMapData.sites) {
                            if (currentSiteMapData.sites[urlPattern].hasOwnProperty('active')) {
                                preservedStates[urlPattern] = currentSiteMapData.sites[urlPattern].active;
                            }
                        }
                    }
                    
                    // Update site map with new data while preserving states
                    let updatedSiteMapData = {
                        version: newSiteMapData.version,
                        "fall-back": newSiteMapData["fall-back"],
                        sites: {}
                    };
                    
                    for (const urlPattern in newSiteMapData.sites) {
                        updatedSiteMapData.sites[urlPattern] = {
                            path: newSiteMapData.sites[urlPattern].path,
                            active: preservedStates.hasOwnProperty(urlPattern) 
                                ? preservedStates[urlPattern] 
                                : newSiteMapData.sites[urlPattern].active
                        };
                    }
                    
                    chrome.storage.local.set({ siteMap: updatedSiteMapData }, function() {
                        console.log('site-map.json has been updated and saved to chrome.storage.local.');
                        console.log('Version:', updatedSiteMapData.version);
                    });
                } else {
                    console.log('Site-map is up to date, version:', currentSiteMapData.version);
                }
            });
        })
        .catch(error => {
            console.error('Error loading site-map.json:', error);
        });
}

// Load site map on startup
loadSiteMap();

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    chrome.storage.sync.get("settings", function(result) {
        let ADSRM_enable = true;
        if (chrome.runtime.lastError) {
            console.log('Error loading setting:', result.settings, chrome.runtime.lastError);
            ADSRM_enable = true;
        }
        let settingValue = result.settings;
        if (JSON.stringify(settingValue) === "{}"){
            ADSRM_enable = true;
        }
        try {
            ADSRM_enable = settingValue["setting2-state"];
        } catch {
            ADSRM_enable = true;
        }
        if (ADSRM_enable && changeInfo.status === "loading") {
            chrome.storage.local.get("siteMap", function(result) {
                let siteMapData = result.siteMap || {};
                let sites = siteMapData.sites || {};
                let fallbackScript = siteMapData["fall-back"] || "/ads-handle/common.js";

                let scriptExecuted = false;
                
                // Check for specific site matches first
                for (const urlPattern in sites) {
                    if (new RegExp(urlPattern.replace(/\*/g, '.*')).test(tab.url)) {
                        const scriptPath = sites[urlPattern].path;
                        const activeState = sites[urlPattern].active;

                        if (activeState !== false) {
                            // If path is empty, use fallback script
                            const scriptToExecute = scriptPath || fallbackScript;
                            
                            if (scriptToExecute) {
                                chrome.scripting.executeScript({
                                    target: { tabId: tabId },
                                    files: [scriptToExecute]
                                });
                                console.log(`Injected script: ${scriptToExecute} into ${tab.url}`);
                                scriptExecuted = true;
                            }
                        }
                        break;
                    }
                }
            });
        }
    });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === "toggleActiveState") {
        const url = request.url;
        const tabId = request.tabId;
        chrome.storage.local.get("siteMap", function(result) {
            let siteMapData = result.siteMap || {};
            let sites = siteMapData.sites || {};
            let matchedPattern = null;
            
            for (const pattern in sites) {
                if (new RegExp(pattern.replace(/\*/g, '.*')).test(url)) {
                    matchedPattern = pattern;
                    break;
                }
            }

            if (matchedPattern) {
                sites[matchedPattern].active = !sites[matchedPattern].active;
                siteMapData.sites = sites;
                
                chrome.storage.local.set({ siteMap: siteMapData }, function() {
                    console.log(`Toggled active state for ${matchedPattern} to ${sites[matchedPattern].active}`);
                    chrome.tabs.reload(tabId);
                    sendResponse({ success: true, activeState: sites[matchedPattern].active });
                });
            } else {
                sendResponse({ success: false, error: "No matching URL pattern found." });
            }
        });
        return true;
    }
    
    // Add message handler to manually check for updates
    if (request.message === "checkSiteMapUpdate") {
        loadSiteMap();
        sendResponse({ success: true, message: "Site map update check initiated" });
        return true;
    }
});