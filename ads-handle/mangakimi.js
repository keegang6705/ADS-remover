console.log("ADSRM/ads-handle/mangakimi.js: LOADED");
try {
  document
    .querySelectorAll(".header-ads-section")
    .forEach((element) => element.remove());
} catch (e) {
  console.log(e);
}
