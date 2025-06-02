console.log("ADSRM/ads-handle/common.js: LOADED");

(async () => {
  const URL = "https://raw.githubusercontent.com/keegang6705/GET/refs/heads/main/BrowserExtension/ADSRM/blacklisted.json";
  const LOCAL_KEY = "adsrm_blacklist_cache";

  try {
    let localData = JSON.parse(localStorage.getItem(LOCAL_KEY) || "{}");
    let useRemote = true;

    // ลองโหลด JSON จาก GitHub
    const response = await fetch(URL);
    const remoteData = await response.json();

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

    // ลบ <img> ที่ src หรือ alt ตรงกับ keyword
    document.querySelectorAll("img").forEach((img) => {
      const src = (img.src || "").toLowerCase();
      const alt = (img.alt || "").toLowerCase();
      if (keywords.some(k => src.includes(k) || alt.includes(k))) {
        const target = img.closest("a") || img;
        target.remove();
      }
    });

    // ลบโฆษณาตาม container class/id ทั่วไป
    document.querySelectorAll('#sticky-bottom3, .floating_content, .center_gomanga, .sticky-bottom3-inside')
      .forEach(el => el.remove());

  } catch (e) {
    console.warn("ADSRM error:", e);
  }
})();
