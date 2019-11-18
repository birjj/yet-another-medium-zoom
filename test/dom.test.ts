import { cloneImage } from "../src/dom";

describe("cloneImage(<img>)", () => {
    it("copies correctly", () => {
        const $img = document.createElement("img");
        $img.src = "https://imgur.com/a";
        $img.classList.add("test");
        const $copied = cloneImage($img);
        expect($copied).toEqual($img);
        expect($copied).not.toBe($img);
    });

    it("sets new src", () => {
        const $img = document.createElement("img");
        $img.src = "https://imgur.com/a";
        $img.classList.add("test");
        const $copied = cloneImage($img, "https://imgur.com/b");
        expect($copied.src).toEqual("https://imgur.com/b");
    });

    it("removes srcset when updating src", () => {
        const $img = document.createElement("img");
        $img.srcset = "a.png 320w, b.png 480w";
        $img.src = "https://imgur.com/a";
        $img.classList.add("test");
        const $copied = cloneImage($img, "https://imgur.com/b");
        expect($copied.srcset).toEqual("");
    });
});

describe("cloneImage(<picture>)", () => {
    it("copies with content", () => {
        const $picture = document.createElement("picture");
        const $src = document.createElement("source");
        $src.srcset = "https://imgur.com/a";
        $src.media = "(min-width: 800px)";
        $picture.appendChild($src);
        const $img = document.createElement("img");
        $img.src = "https://imgur.com/b";
        $picture.appendChild($img);
        
        const $copied = cloneImage($picture);
        expect($copied).toEqual($picture);
        expect($copied).not.toBe($picture);
    });

    it("returns <img> when updating src", () => {
        const $picture = document.createElement("picture");
        const $src = document.createElement("source");
        $src.srcset = "https://imgur.com/a";
        $src.media = "(min-width: 800px)";
        $picture.appendChild($src);
        const $img = document.createElement("img");
        $img.src = "https://imgur.com/b";
        $picture.appendChild($img);
        
        const $copied = cloneImage($picture, "https://imgur.com/c");
        expect($copied).toBeInstanceOf(HTMLImageElement);
        expect($copied.src).toEqual("https://imgur.com/c");
    });
});

describe("cloneImage(<svg>)", () => {
    it("copies with content", () => {
        const $svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        $svg.setAttributeNS(null, "viewBox", "0 0 20 20");
        const $content = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        $content.setAttributeNS(null, "r", "10");
        $svg.appendChild($content);
        const $copied = cloneImage($svg);
        expect($copied).toEqual($svg);
    });
});