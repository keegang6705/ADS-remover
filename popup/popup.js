console.log("ADSRM/popup/popup.js:LOADED");

const send_email_btn = document.getElementById("btn-send-email");
const donate_btn = document.getElementById("btn-donate");
const settings_btn = document.getElementById("btn-settings");
const toggle_script_btn = document.getElementById("btn-toggle-script");
const download_sitemap_btn = document.getElementById("btn-download-sitemap");

let currentTab = null;
let currentSiteActive = null;



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

download_sitemap_btn.addEventListener("click", function () {
    chrome.storage.local.get("siteMap", function(result) {
        let siteMapData = result.siteMap || {};
        
        if (Object.keys(siteMapData).length === 0) {
            alert("No site-map data found!");
            return;
        }
        
        // Create downloadable JSON file
        const dataStr = JSON.stringify(siteMapData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        
        // Create temporary download link
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = 'site-map.json';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        // Clean up
        URL.revokeObjectURL(url);
        
        console.log("Site-map downloaded successfully");
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
        toggle_script_btn.className = " button btn-active";
        toggle_script_btn.style.borderColor = "#4CAF50";
        toggle_script_btn.style.color = "white";
    } else {
        toggle_script_btn.textContent = "🔴 Script Inactive (Click to Enable)";
        toggle_script_btn.className = "button btn-inactive";
        toggle_script_btn.style.borderColor = "#f44336";
        toggle_script_btn.style.color = "white";
    }
} else {
    chrome.storage.sync.get("settings", function (result) {
        const settings = result.settings || {};
        if (settings["setting3-state"] === true) {
            toggle_script_btn.textContent = "🟡 Using common.js";
            toggle_script_btn.className = "button tn-warning";
            toggle_script_btn.style.borderColor = "#ffd700";
            toggle_script_btn.style.color = "#fff";
            toggle_script_btn.disabled = false;
        } else {
            toggle_script_btn.textContent = "❌ Site Not Supported";
            toggle_script_btn.className = "button btn-unsupported";
            toggle_script_btn.style.borderColor = "#f44336";
            toggle_script_btn.style.color = "white";
            toggle_script_btn.disabled = true;
        }
    });
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

settings_btn.addEventListener("click", function() {
    window.location.href = "./settings/settings.html";
});

// Initialize and load current tab info
loadCurrentTabInfo();

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