///<reference path="../node_modules/@testing-library/jest-dom/extend-expect.d.ts"/>
import { defaultLightboxGenerator, getSrcFromImage, getHighestFromSrcSet, isValidImage, generateLightboxImg, getHighResFromImage } from "../src/dom";
import { Classes } from "../src/types";

describe("generateLightboxImg", () => {
    it("copies the src from <img>", () => {
        const $img = document.createElement("img");
        const url = "https://google.com/";
        $img.src = url;
        const $lightboxImg = generateLightboxImg($img);
        expect($lightboxImg.src).toStrictEqual(url);
        expect($lightboxImg).not.toBe($img);
    });

    it("overwrites the src in <img> if new one is given", () => {
        const $img = document.createElement("img");
        const url = "https://google.com/";
        const newUrl = "https://google.dk/";
        $img.src = url;
        const $lightboxImg = generateLightboxImg($img, newUrl);
        expect($lightboxImg.src).toStrictEqual(newUrl);
        expect($lightboxImg).not.toBe($img);
    });

    it("copies the src from <picture>", () => {
        const $picture = document.createElement("picture");
        const $img = document.createElement("img");
        const url = "https://google.com/";
        $img.src = url;
        $picture.appendChild($img);
        const $lightboxImg = generateLightboxImg($picture);
        expect($lightboxImg.src).toStrictEqual(url);
        expect($lightboxImg).toBeInstanceOf(HTMLImageElement);
    });

    it("overwrites the src in <picture> if new one is given", () => {
        const $picture = document.createElement("picture");
        const $img = document.createElement("img");
        const url = "https://google.com/";
        const newUrl = "https://google.dk/";
        $img.src = url;
        $picture.appendChild($img);
        const $lightboxImg = generateLightboxImg($picture, newUrl);
        expect($lightboxImg.src).toStrictEqual(newUrl);
        expect($lightboxImg).toBeInstanceOf(HTMLImageElement);
    })
});

describe("isValidImage", () => {
    it("returns true for <img> and <picture>", () => {
        const $img = document.createElement("img");
        expect(isValidImage($img)).toStrictEqual(true);

        const $picture = document.createElement("picture");
        $picture.appendChild($img);
        expect(isValidImage($picture)).toStrictEqual(true);
    });

    it("returns false for <div>", () => {
        const $div = document.createElement("div");
        expect(isValidImage($div)).toStrictEqual(false);
    });
});

describe("getHighResFromImage", () => {
    it("extracts the src from normal <img>", () => {
        const $img = document.createElement("img");
        const url = "https://google.com/";
        $img.src = url;
        expect(getHighResFromImage($img, Infinity)).toStrictEqual(url);
    });

    it("extracts the high-res source from responsive <img>", () => {
        const $img = document.createElement("img");
        const url = "https://google.com/";
        const srcset = `450.jpg 450w,
            900.jpg 900w,
            1920.jpg 1920w,
            5184.jpg 5184w`;
        $img.src = url;
        $img.srcset = srcset;
        expect(getHighResFromImage($img, Infinity)).toStrictEqual("5184.jpg");
    });

    it("extracts the high-res from <source> when given <picture>", () => {
        const $picture = document.createElement("picture");
        const $img = document.createElement("img");
        const url = "https://google.com/";
        const srcset = `450.jpg 450w,
            900.jpg 900w,
            1920.jpg 1920w,
            5184.jpg 5184w`;
        $img.src = url;
        const $src = document.createElement("source");
        $src.srcset = srcset;
        $picture.appendChild($src);
        $picture.appendChild($img);

        expect(getHighResFromImage($picture, Infinity)).toStrictEqual("5184.jpg");
    });
});

describe("getHighestFromSrcSet", () => {
    it("gets highest from normal srcset", () => {
        const srcset = `450.jpg 450w,
            900.jpg 900w,
            1920.jpg 1920w,
            5184.jpg 5184w`;

        const result = getHighestFromSrcSet(srcset, Infinity);
        expect(result).toEqual({ src: "5184.jpg", width: 5184 });
    });

    it("gets highest from srcset with additional whitespace", () => {
        const srcset = `450.jpg    450w,

            900.jpg 900w,       1920.jpg 1920w  ,
               5184.jpg 5184w`;

        const result = getHighestFromSrcSet(srcset, Infinity);
        expect(result).toEqual({ src: "5184.jpg", width: 5184 });
    });

    it("gets highest from unsorted srcset", () => {
        const srcset = `450.jpg 450w,
            5184.jpg 5184w,
            1920.jpg 1920w,
            900.jpg 900w`;

        const result = getHighestFromSrcSet(srcset, Infinity);
        expect(result).toEqual({ src: "5184.jpg", width: 5184 });
    });

    it("gets the smallest that's bigger than a given width", () => {
        const srcset = `450.jpg 450w,
            5184.jpg 5184w,
            1920.jpg 1920w,
            900.jpg 900w`;

        const result = getHighestFromSrcSet(srcset, 1000);
        expect(result).toEqual({ src: "1920.jpg", width: 1920 });
    });
});

describe("getSrcFromImage", () => {
    it("extracts source from <img>", () => {
        const $img = document.createElement("img");
        const url = "https://google.com/";
        $img.src = url;
        expect(getSrcFromImage($img)).toStrictEqual(url);
    });

    it("extracts source from <picture>", () => {
        const $picture = document.createElement("picture");
        const $img = document.createElement("img");
        const url = "https://google.com/";
        $img.src = url;
        $picture.appendChild($img);

        expect(getSrcFromImage($picture)).toStrictEqual(url);
    });
});

describe("defaultLightboxGenerator", () => {
    it("inserts the given image", () => {
        const $img = document.createElement("img");
        const $lightbox = defaultLightboxGenerator($img, {}, $img);

        expect($lightbox).toContainElement($img);
    });

    it("adds the class from options", () => {
        const $img = document.createElement("img");
        const opts = {
            class: `class-${Math.floor(Math.random()*1000)}`
        };
        const $lightbox = defaultLightboxGenerator($img, opts, $img);

        expect($lightbox).toHaveClass(opts.class);
    });

    it("adds loading indicator if we give a highres", () => {
        const $img = document.createElement("img");
        const opts = {
            highres: "https://google.com"
        };
        const $lightbox = defaultLightboxGenerator($img, opts, $img);

        const $loader = $lightbox.querySelector(`.${Classes.LOADER}`);
        expect($loader).not.toEqual(undefined);
    });

    it("adds the base classes to elements", () => {
        const $img = document.createElement("img");
        const opts = {
            highres: "https://google.com"
        };
        const $lightbox = defaultLightboxGenerator($img, opts, $img);
        const $loader = $lightbox.querySelector(`.${Classes.LOADER}`);

        expect($lightbox).toHaveClass(Classes.WRAPPER, Classes.HAS_HIGHRES);
        expect($img.parentElement).toHaveClass(Classes.IMG_WRAPPER);
        expect($loader).toHaveClass(Classes.LOADER);
    });
});
