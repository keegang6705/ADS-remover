const backBtn = document.getElementById("btn-back");
const settingCheckboxes = document.querySelectorAll('input[type="checkbox"][id$="-state"]');

function loadSettings() {
    chrome.storage.sync.get("settings", function(result) {
        if (chrome.runtime.lastError) {
            console.error('Error loading settings:', chrome.runtime.lastError);
            return;
        }

        const settings = result.settings || {};
        settingCheckboxes.forEach(checkbox => {
            checkbox.checked = settings[checkbox.id] === true;
        });
    });
}

function saveSettings() {
    const settings = {};
    settingCheckboxes.forEach(checkbox => {
        settings[checkbox.id] = checkbox.checked;
    });

    chrome.storage.sync.set({ "settings": settings }, function() {
        if (chrome.runtime.lastError) {
            console.error('Error saving settings:', chrome.runtime.lastError);
        }
    });
}

// Add event listeners to checkboxes
settingCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', saveSettings);
});

// Back button handler
backBtn.addEventListener("click", function() {
    window.location.href = "../popup.html";
});

// Initialize settings
loadSettings();