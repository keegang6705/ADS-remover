console.log("ADSRM/scripts/background.js:LOADED");
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    chrome.storage.sync.get("settings", function(result) {
      var ADSRM_enable = true;
      if (chrome.runtime.lastError) {
        console.log('Error loading setting:', settings, chrome.runtime.lastError);
        ADSRM_enable = true;
      }
    
      var settingValue = result.settings
      if (JSON.stringify(settingValue) === "{}"){
        ADSRM_enable = true;
      }
      try{
      ADSRM_enable = settingValue["setting2-state"];
      } catch {
        ADSRM_enable = true
      }
    if (ADSRM_enable && changeInfo.status === "loading") {
        
    }
      
  });
  });
  