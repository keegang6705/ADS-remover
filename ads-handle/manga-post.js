console.log("ADSRM/scripts/manga-post.js: LOADED");
try {
  document
    .getElementById("FloatingLayer508").remove();
} catch (e) {
  console.log(e);
}
try {
  document
    .querySelector('a[title="A1"]').remove();
} catch (e) {
  console.log(e);
}
