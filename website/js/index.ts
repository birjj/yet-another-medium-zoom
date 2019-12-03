import lightbox from "../../src/core";

const $imgs = Array.from(document.querySelectorAll("*:not(picture) > img, picture"));
lightbox.bind($imgs as HTMLElement[]);
