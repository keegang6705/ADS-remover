console.log("ADSRM/scripts/animeyuzu.js: LOADED");
try {
  document
    .querySelectorAll(".animekimi-banner")
    .forEach((element) => element.remove());
} catch (e) {
  console.log(e);
}