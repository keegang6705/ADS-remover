(async () => {
  try {
    // Fetch user's provider preferences
    const LOCAL_STORAGE_KEY = 'adsrm_providers';
    let providers = await chrome.storage.local.get(LOCAL_STORAGE_KEY)
      .then(result => result[LOCAL_STORAGE_KEY])
      .catch(() => null);

    if (!providers) {
      // If no providers set, use default provider as fallback
      let defaultBlacklist = await fetch("https://raw.githubusercontent.com/keegang6705/GET/refs/heads/main/BrowserExtension/ADSRM/blacklisted")
        .then(r => r.text())
        .catch(() => localStorage.getItem("adsrm_blacklist_cache"));
      
      if (!defaultBlacklist) throw new Error("No blacklist available");
      localStorage.setItem("adsrm_blacklist_cache", defaultBlacklist);
      return defaultBlacklist.split('\n').filter(l => l.trim()).map(k => k.toLowerCase());
    }

    // Fetch and combine blacklists from all active providers
    const activeProviders = providers.blacklists.filter(p => p.active);
    console.log("ADSRM active providers:", activeProviders.length);

    let allKeywords = new Set();
    await Promise.all(activeProviders.map(async provider => {
      try {
        const response = await fetch(provider.url);
        const text = await response.text();
        const keywords = text.split('\n')
          .filter(l => l.trim())
          .map(k => k.toLowerCase());
        keywords.forEach(k => allKeywords.add(k));
      } catch (error) {
        console.warn(`ADSRM: Failed to fetch blacklist from ${provider.url}:`, error);
      }
    }));

    const keywords = Array.from(allKeywords);
    console.log("ADSRM keywords loaded:", keywords);
    
    document.querySelectorAll("a").forEach(a => {
      const href = (a.href || "").toLowerCase();
      const matchedKeyword = keywords.find(k => href.includes(k));
      if (matchedKeyword) {
        console.log("ADSRM removed link:", {
          element: a,
          url: href,
          matchedKeyword: matchedKeyword
        });
        a.remove();
      }
    });

    document.querySelectorAll("img").forEach(img => {
      const src = (img.src || "").toLowerCase();
      const alt = (img.alt || "").toLowerCase();
      const parent = img.parentElement;
      const parentClasses = parent ? Array.from(parent.classList) : [];
      const parentId = parent ? parent.id : '';
      
      let matchInfo = null;
      const matchedKeyword = keywords.find(k => src.includes(k) || alt.includes(k));
      
      if (matchedKeyword) {
        matchInfo = { type: 'keyword', value: matchedKeyword };
      } else if (parent && (
        parentClasses.some(cls => /^ad$|^ads$|^advert/i.test(cls)) || // Exact class match
        /^ad$|^ads$|^advert/i.test(parentId) // Exact ID match
      )) {
        matchInfo = { type: 'parent', value: `classes: [${parentClasses.join(', ')}], id: ${parentId}` };
      }
      
      if (matchInfo) {
        console.log("ADSRM removed image:", {
          element: img,
          src: src,
          alt: alt,
          parent: parent,
          matchType: matchInfo.type,
          matchValue: matchInfo.value
        });
        (img.closest("a") || img).remove();
      }
    });

    document.querySelectorAll('#sticky-bottom3,.floating_content,.sticky-bottom3-inside,.advertisement:not(img),#ads:not(img),[class*="advertisement"]:not(img),[id*="ads"]:not(img)').forEach(el => {
      console.log("ADSRM removed element by selector:", {
        element: el,
        selector: el.id ? `#${el.id}` : el.className
      });
      el.remove();
    });
  } catch (e) {
    console.warn("ADSRM error:", e);
  }
})();
