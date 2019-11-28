import lightbox from "../../src/core";

const $imgs = Array.from(document.querySelectorAll("*:not(picture) > img, picture"));
console.log("Binding to", $imgs);
lightbox.bind($imgs as HTMLElement[], { duration: 300 });
