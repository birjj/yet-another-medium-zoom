import lightbox from "../../src/core";

const $img = document.querySelector("img");
const result = (async () => {
    const $lightbox = await lightbox.open($img);
    console.log($lightbox);
})();
console.log(result);
