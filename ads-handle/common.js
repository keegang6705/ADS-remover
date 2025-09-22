console.log("ADSRM/ads-handle/common.js: LOADED");

(async () => {
  const URL = "https://raw.githubusercontent.com/keegang6705/GET/refs/heads/main/BrowserExtension/ADSRM/blacklisted.json";
  const LOCAL_KEY = "adsrm_blacklist_cache";

  try {
    let localData = JSON.parse(localStorage.getItem(LOCAL_KEY) || "{}");
    let useRemote = true;

    // ลองโหลด JSON จาก GitHub
    const response = await fetch(URL);
    const text = await response.text();
    // Remove trailing commas to fix invalid JSON
    const cleanJson = text.replace(/,(\s*[}\]])/g, '$1');
    const remoteData = JSON.parse(cleanJson);

    // เช็คว่า remote version ใหม่กว่า
    if (!localData.version || remoteData.version > localData.version) {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(remoteData));
      localData = remoteData;
      console.log("ADSRM: Blacklist updated to version", remoteData.version);
    } else {
      useRemote = false;
      console.log("ADSRM: Using cached blacklist version", localData.version);
    }

    const keywords = (localData.list || []).map(k => k.toLowerCase());

    // ลบ <a> ที่ลิงก์ไปเว็บโฆษณา
    document.querySelectorAll("a").forEach((a) => {
      const href = (a.href || "").toLowerCase();
      if (keywords.some(k => href.includes(k))) {
        a.remove();
      }
    });

    // ลบ <img> ที่มีลักษณะเป็นโฆษณา
    document.querySelectorAll("img").forEach((img) => {
      const src = (img.src || "").toLowerCase();
      const alt = (img.alt || "").toLowerCase();
      const parent = img.parentElement;
      const hasAdClass = parent && (
        parent.className.toLowerCase().includes('ad') || 
        parent.id.toLowerCase().includes('ad')
      );
      
      // ตรวจสอบว่าเป็นโฆษณาหรือไม่
      const matchedKeyword = keywords.find(k => src.includes(k));
      const isAd = matchedKeyword || // URL ตรงกับ keyword
                   alt.includes('advertisement') || // alt text มีคำว่า advertisement
                   alt.includes('ads') || // alt text มีคำว่า ads
                   hasAdClass; // parent element มี class หรือ id ที่เกี่ยวกับโฆษณา
      
      if (isAd) {
        console.log('ADSRM: Removing image:', {
          src,
          alt,
          parentClass: parent ? parent.className : '',
          parentId: parent ? parent.id : '',
          reason: matchedKeyword ? `matched keyword: ${matchedKeyword}` :
                 alt.includes('advertisement') ? 'contains "advertisement"' :
                 alt.includes('ads') ? 'contains "ads"' :
                 'has ad class/id'
        });
        const target = img.closest("a") || img;
        target.remove();
      }
    });

    // ลบโฆษณาตาม container class/id ทั่วไป
    document.querySelectorAll([
      '#sticky-bottom3',
      '.floating_content',
      '.sticky-bottom3-inside',
      '.advertisement:not(img)',
      '#ads:not(img)',
      '[class*="advertisement"]:not(img)',
      '[id*="ads"]:not(img)'
    ].join(', '))
      .forEach(el => el.remove());

  } catch (e) {
    console.warn("ADSRM error:", e);
  }
})();
