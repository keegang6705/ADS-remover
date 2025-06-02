console.log("ADSRM/ads-handle/common.js: LOADED");

try {
  document.querySelectorAll("a[href*='slot'], a[href*='panama'], a[href*='casino'], a[href*='888'], a[href*='666']").forEach((a) => {
      a.remove();
  });
  document.querySelectorAll("img").forEach((img) => {
    const src = img.src.toLowerCase();
    const alt = (img.alt || "").toLowerCase();
    const isAd = (
      src.includes("slot") ||
      src.includes("casino") ||
      alt.includes("slot") ||
      alt.includes("advertisement")
    );
    if (isAd) {
      const parent = img.closest("a") || img;
      parent.remove();
    }
  });

} catch (e) {
  console.warn("Ad removal error:", e);
}
