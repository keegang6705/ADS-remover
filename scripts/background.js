console.log("ADSRM/scripts/background.js:LOADED");


fetch(chrome.runtime.getURL('site-map.json'))
    .then(response => response.json())
    .then(json => {
        chrome.storage.local.set({ siteMap: json }, function() {
            console.log('site-map.json has been saved to chrome.storage.local.');
        });
    })
    .catch(error => {
        console.error('Error loading site-map.json:', error);
    });


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
                let siteMap = result.siteMap || {};

                for (const urlPattern in siteMap) {
                    if (new RegExp(urlPattern.replace(/\*/g, '.*')).test(tab.url)) {
                        const scriptPath = siteMap[urlPattern].path;
                        const activeState = siteMap[urlPattern].active;

                        if (activeState || activeState === null) {
                            chrome.scripting.executeScript({
                                target: { tabId: tabId },
                                files: [scriptPath]
                            });
                            console.log(`Injected script: ${scriptPath} into ${tab.url}`);
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
            let siteMap = result.siteMap || {};
            let matchedPattern = null;
            for (const pattern in siteMap) {
                if (new RegExp(pattern.replace(/\*/g, '.*')).test(url)) {
                    matchedPattern = pattern;
                    break;
                }
            }

            if (matchedPattern) {
                siteMap[matchedPattern].active = !siteMap[matchedPattern].active;
                chrome.storage.local.set({ siteMap: siteMap }, function() {
                    console.log(`Toggled active state for ${matchedPattern} to ${siteMap[matchedPattern].active}`);
                    chrome.tabs.reload(tabId);
                    sendResponse({ success: true, activeState: siteMap[matchedPattern].active });
                });
            } else {
                sendResponse({ success: false, error: "No matching URL pattern found." });
            }
        });
        return true;
    }
});

