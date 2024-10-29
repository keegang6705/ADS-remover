console.log("ADSRM/scripts/animeyuzu.js: LOADED");
try {
  document
    .querySelectorAll(".animekimi-banner.lazy")
    .forEach((element) => element.remove());
} catch (e) {
  console.log(e);
}