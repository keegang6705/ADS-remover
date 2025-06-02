console.log("ADSRM/popup/popup.js:LOADED");

const send_email_btn = document.getElementById("btn-send-email");
const donate_btn = document.getElementById("btn-donate");
const settings_btn = document.getElementById("btn-settings");
const settings_container = document.getElementById("settings-container");
const reset_btn = document.getElementById("btn-reset");
const toggle_script_btn = document.getElementById("btn-toggle-script");
var settingCheckboxes = document.querySelectorAll('input[type="checkbox"][id$="-state"]');

// Store current tab info
let currentTab = null;
let currentSiteActive = null;

reset_btn.addEventListener("click", function () {
    chrome.storage.sync.clear(function() {
        console.log("Settings cleared");
    });
});

send_email_btn.addEventListener("click", function () {
    chrome.tabs.create({
        url: 'https://mail.google.com/mail/u/0/?fs=1&to=darunphobwi@gmail.com&su=ADSRM-BugReport&body=อธิบายปัญหาของคุณ:&tf=cm'
    });
});

donate_btn.addEventListener("click", function () {
    chrome.tabs.create({
        url: 'https://keegang.cc/donate'
    });
});

toggle_script_btn.addEventListener("click", function () {
    if (!currentTab) return;
    
    // Disable button temporarily to prevent double clicks
    toggle_script_btn.disabled = true;
    
    chrome.runtime.sendMessage({ 
        message: "toggleActiveState",
        url: currentTab.url,
        tabId: currentTab.id 
    }, function(response) {
        console.log("Response from service worker:", response);
        
        if (response && response.success) {
            currentSiteActive = response.activeState;
            updateToggleButtonState();
        } else {
            console.error("Toggle failed:", response?.error || "Unknown error");
        }
        
        // Re-enable button
        toggle_script_btn.disabled = false;
    });
});

function updateToggleButtonState() {
    if (!currentTab) {
        toggle_script_btn.textContent = "Toggle Script";
        toggle_script_btn.className = "btn-default";
        toggle_script_btn.disabled = true;
        return;
    }
    
    // Check if current site is supported
    chrome.storage.local.get("siteMap", function(result) {
        let siteMapData = result.siteMap || {};
        let sites = siteMapData.sites || {};
        let matchedPattern = null;
        let isSupported = false;
        
        // Check if current URL matches any pattern
        for (const pattern in sites) {
            if (new RegExp(pattern.replace(/\*/g, '.*')).test(currentTab.url)) {
                matchedPattern = pattern;
                isSupported = true;
                currentSiteActive = sites[pattern].active;
                break;
            }
        }
        
        if (isSupported) {
            toggle_script_btn.disabled = false;
            if (currentSiteActive !== false) {
                toggle_script_btn.textContent = "🟢 Script Active (Click to Disable)";
                toggle_script_btn.className = "btn-active";
                toggle_script_btn.style.borderColor = "#4CAF50";
                toggle_script_btn.style.color = "white";
            } else {
                toggle_script_btn.textContent = "🔴 Script Inactive (Click to Enable)";
                toggle_script_btn.className = "btn-inactive";
                toggle_script_btn.style.borderColor = "#f44336";
                toggle_script_btn.style.color = "white";
            }
        } else {
            toggle_script_btn.textContent = "❌ Site Not Supported";
            toggle_script_btn.className = "btn-unsupported";
            toggle_script_btn.style.backgroundColor = "#9E9E9E";
            toggle_script_btn.style.color = "white";
            toggle_script_btn.disabled = true;
        }
    });
}

function loadCurrentTabInfo() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs && tabs.length > 0) {
            currentTab = tabs[0];
            console.log("Current tab:", currentTab.url);
            updateToggleButtonState();
        }
    });
}

function loadSettings() {
    chrome.storage.sync.get("settings", function(result) {
        if (chrome.runtime.lastError) {
            console.error('Error loading settings:', chrome.runtime.lastError);
            return;
        }

        var settings = result.settings || {};
        for (var i = 0; i < settingCheckboxes.length; i++) {
            var checkbox = settingCheckboxes[i];
            checkbox.checked = settings[checkbox.id] === true;
        }
    });
}

function saveSettings() {
    var settings = {};
    for (var i = 0; i < settingCheckboxes.length; i++) {
        var checkbox = settingCheckboxes[i];
        settings[checkbox.id] = checkbox.checked;
    }

    chrome.storage.sync.set({ "settings": settings }, function() {
        if (chrome.runtime.lastError) {
            console.error('Error saving settings:', chrome.runtime.lastError);
        } else {
            console.log("ADSRM/popup/popup.js:SETTING SAVED");
        }
    });
}

for (var i = 0; i < settingCheckboxes.length; i++) {
    var checkbox = settingCheckboxes[i];
    checkbox.addEventListener('change', function() {
        console.log("ADSRM/popup/popup.js:SETTING CHANGED");
        saveSettings();
    });
}

settings_btn.addEventListener("click", function() {
    if (settings_container.style.display === "none") {
        settings_container.style.display = "block";
    } else {
        settings_container.style.display = "none";
    }
});

// Initialize settings and load current tab info
chrome.storage.sync.get("settings", function(result) {
    if (chrome.runtime.lastError) {
        console.error('Error loading settings:', chrome.runtime.lastError);
        return;
    }

    var settings = result.settings;
    if (!settings || Object.keys(settings).length === 0) {
        saveSettings();
    } else {
        loadSettings();
    }
    
    // Load current tab info after settings are loaded
    loadCurrentTabInfo();
});

// Listen for tab changes to update button state
chrome.tabs.onActivated.addListener(function(activeInfo) {
    loadCurrentTabInfo();
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete' && currentTab && tabId === currentTab.id) {
        currentTab = tab;
        updateToggleButtonState();
    }
});