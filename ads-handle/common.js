(async () => {
  try {
    let blacklist = await fetch("https://raw.githubusercontent.com/keegang6705/GET/refs/heads/main/BrowserExtension/ADSRM/blacklisted.txt")
      .then(r => r.text())
      .catch(() => localStorage.getItem("adsrm_blacklist_cache"));

    if (!blacklist) throw new Error("No blacklist available");
    localStorage.setItem("adsrm_blacklist_cache", blacklist);
    
    const keywords = blacklist.split('\n').filter(l => l.trim()).map(k => k.toLowerCase());
    console.log("ADSRM keywords loaded:", keywords);
    
    document.querySelectorAll("a").forEach(a => 
      keywords.some(k => (a.href || "").toLowerCase().includes(k)) && a.remove()
    );

    document.querySelectorAll("img").forEach(img => {
      const src = (img.src || "").toLowerCase();
      const alt = (img.alt || "").toLowerCase();
      const parent = img.parentElement;
      const isAd = keywords.some(k => src.includes(k)) ||
                   alt.includes('advertisement') ||
                   alt.includes('ads') ||
                   (parent && (parent.className + parent.id).toLowerCase().includes('ad'));
      
      isAd && (img.closest("a") || img).remove();
    });

    document.querySelectorAll('#sticky-bottom3,.floating_content,.sticky-bottom3-inside,.advertisement:not(img),#ads:not(img),[class*="advertisement"]:not(img),[id*="ads"]:not(img)').forEach(el => el.remove());
  } catch (e) {
    console.warn("ADSRM error:", e);
  }
})();
