console.log("ADSRM/popup/popup.js:LOADED");

const send_email_btn = document.getElementById("btn-send-email");
const donate_btn = document.getElementById("btn-donate");
const settings_btn = document.getElementById("btn-settings");
const settings_container = document.getElementById("settings-container");
const reset_btn = document.getElementById("btn-reset");
const toggle_script_btn = document.getElementById("btn-toggle-script");
var settingCheckboxes = document.querySelectorAll('input[type="checkbox"][id$="-state"]');

reset_btn.addEventListener("click", function () {
    chrome.storage.sync.clear(function() {
      });
      
});

send_email_btn.addEventListener("click", function () {
    chrome.tabs.create({
        url: 'https://mail.google.com/mail/u/0/?fs=1&to=darunphobwi@gmail.com&su=ADSRM-BugReport&body=อธิบายปัญหาของคุณ:&tf=cm'
    });
});

donate_btn.addEventListener("click", function () {
    chrome.tabs.create({
        url: 'https://keegang.000.pe/menu/donate'
    });
});

toggle_script_btn.addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        var activeTab = tabs[0];
        chrome.runtime.sendMessage({ message: "toggleActiveState" ,url:activeTab.url ,tabId:activeTab.id }, function(response) {
            console.log("Response from service worker:", response);
        });
    });
});



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
});

