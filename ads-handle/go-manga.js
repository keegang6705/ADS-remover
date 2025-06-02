console.log("ADSRM/ads-handle/common.js: LOADED");
try{
document.querySelectorAll('#sticky-bottom3, .floating_content, .center_gomanga, .sticky-bottom3-inside').forEach(el => el.remove());

document.querySelectorAll('a[href*="link_to.php?url="] img').forEach(img => img.remove());

document.querySelectorAll('a[href*="link_to.php?url="]').forEach(a => a.remove());
} catch (e) {
  console.warn("Ad removal error:", e);
}
