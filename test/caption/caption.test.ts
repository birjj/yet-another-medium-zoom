///<reference path="../../node_modules/@testing-library/jest-dom/extend-expect.d.ts"/>
import { MediumLightboxCore } from "../../src/core";
import withCaption from "../../src/caption/caption";
import { Classes } from "../../src/types";

const createInstance = () => {
    const inst = withCaption(new MediumLightboxCore());
    inst.setOptions({ duration: 0 }); // so we don't have to use FLIP, which requires DOM simulation
    return inst;
};

describe("withCaption", () => {
    describe("defaultLightboxGenerator()", () => {
        it("augments the lightbox with captions", () => {
            const inst = createInstance();
            const $img = document.createElement("img");
            const caption = `test-${Math.floor(Math.random() * 1000)}`;
            const $lightbox = inst.defaultLightboxGenerator($img, { caption }, $img);

            const $caption = $lightbox.querySelector(`.${Classes.CAPTION}`);
            expect($caption).toBeInstanceOf(HTMLElement);
            if (!$caption) {
                throw new Error("Couldn't find caption");
            }
            expect($caption.textContent).toEqual(caption);
        });

        it("inserts the caption if the caption is given as HTMLElement", () => {
            const inst = createInstance();
            const $img = document.createElement("img");
            const $caption = document.createElement("div");
            $caption.classList.add(`class-${Math.floor(Math.random() * 1000)}`);
            const $lightbox = inst.defaultLightboxGenerator($img, { caption: $caption }, $img);

            expect($lightbox).toContainElement($caption);
        });
    });

    describe("optsFromElm()", () => {
        it("correctly extracts the caption", () => {
            const $img = document.createElement("img");
            const caption = `test-${Math.floor(Math.random() * 1000)}`;
            $img.dataset.caption = caption;

            const inst = createInstance();
            const opts = inst.optsFromElm($img);
            expect(opts.caption).toEqual(caption);
        });
    });
});
