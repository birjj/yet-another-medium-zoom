///<reference path="../../node_modules/@testing-library/jest-dom/extend-expect.d.ts"/>
import { MediumLightboxCore } from "../../src/core";
import withAlbum, { AlbumEntry, AlbumOptions } from "../../src/album/album";
import FLIP from "../../src/flip";
jest.mock("../../src/flip", () => {
    const flipModule = jest.genMockFromModule("../../src/flip") as any;
    for (let method of ["first", "last", "invert", "play"]) {
        flipModule.default.prototype[method as "first" | "last" | "invert" | "play"] = jest.fn(
            function(this: any) {
                return this;
            }
        );
    }
    return flipModule;
});

import { mocked } from "ts-jest/utils";
import { Classes } from "../../src/types";

beforeEach(() => {
    mocked(FLIP).mockClear();
});
function dispatchEvent<EventConstructor extends new (a: string, b?: object) => Event>(
    E: EventConstructor,
    type: string,
    opts?: ConstructorParameters<EventConstructor>[1],
    target: HTMLElement | Document | Window = document
) {
    const ev = new E(type, {
        bubbles: true,
        ...opts,
    });
    target.dispatchEvent(ev);
}

const createInstance = () => {
    const inst = withAlbum(new MediumLightboxCore());
    inst.setOptions({ duration: 0 }); // so we don't have to use FLIP, which requires DOM simulation
    return inst;
};

function createAlbum(albumLen = 3) {
    const album: AlbumEntry<MediumLightboxCore>[] = [];
    for (let i = 0; i < albumLen; ++i) {
        const $img = document.createElement("img");
        $img.classList.add(`class-${i}`);
        album.push({ img: $img });
    }
    return album;
}

describe("withAlbum", () => {
    it("adds album-specific default options", () => {
        const inst = createInstance();
        expect(inst.options.wrapAlbum).toStrictEqual(false);
    });

    describe("defaultLightboxGenerator()", () => {
        it("augments the lightbox with left/right buttons", () => {
            const album = createAlbum();
            const inst = createInstance();
            const $lightbox = inst.defaultLightboxGenerator(album[1].img, { album }, album[1].img);

            const $left = $lightbox.querySelector(`.${Classes.ALBUM_PREV}`);
            const $right = $lightbox.querySelector(`.${Classes.ALBUM_NEXT}`);

            expect($left).toBeInstanceOf(HTMLButtonElement);
            expect($right).toBeInstanceOf(HTMLButtonElement);
        });

        it("doesn't have left/right for first/last image if not wrapping", () => {
            const album = createAlbum();
            const inst = createInstance();
            const $firstLightbox = inst.defaultLightboxGenerator(
                album[0].img,
                { album },
                album[0].img
            );
            const $lastLightbox = inst.defaultLightboxGenerator(
                album[2].img,
                { album },
                album[2].img
            );
            const $firstLeft = $firstLightbox.querySelector(`.${Classes.ALBUM_PREV}`);
            const $lastRight = $lastLightbox.querySelector(`.${Classes.ALBUM_NEXT}`);

            expect($firstLeft).toBeNull();
            expect($lastRight).toBeNull();
        });

        it("has left/right for first/last image if wrapping", () => {
            const album = createAlbum();
            const inst = createInstance();
            const $firstLightbox = inst.defaultLightboxGenerator(
                album[0].img,
                { album, wrapAlbum: true },
                album[0].img
            );
            const $lastLightbox = inst.defaultLightboxGenerator(
                album[2].img,
                { album, wrapAlbum: true },
                album[2].img
            );
            const $firstLeft = $firstLightbox.querySelector(`.${Classes.ALBUM_PREV}`);
            const $lastRight = $lastLightbox.querySelector(`.${Classes.ALBUM_NEXT}`);

            expect($firstLeft).toBeInstanceOf(HTMLButtonElement);
            expect($lastRight).toBeInstanceOf(HTMLButtonElement);
        });

        it("goes backwards/forwards when clicking prev/next", () => {
            const album = createAlbum();
            const inst = createInstance();
            const $lightbox = inst.defaultLightboxGenerator(album[1].img, { album }, album[1].img);
            inst.moveToAlbumEntry = jest.fn();

            const $left = $lightbox.querySelector(`.${Classes.ALBUM_PREV}`) as HTMLButtonElement;
            const $right = $lightbox.querySelector(`.${Classes.ALBUM_NEXT}`) as HTMLButtonElement;

            $left.click();
            expect(inst.moveToAlbumEntry).toHaveBeenCalledWith(album[0], "prev");
            $right.click();
            expect(inst.moveToAlbumEntry).toHaveBeenCalledWith(album[2], "next");
        });
    });

    describe("optsFromElm()", () => {
        it("correctly finds all other images with the same album", () => {
            const $img1 = document.createElement("img");
            const $img2 = document.createElement("img");
            $img1.dataset.album = $img2.dataset.album = "test";
            $img2.dataset.duration = "500";
            document.body.appendChild($img1);
            document.body.appendChild($img2);

            const inst = createInstance();
            const opts = inst.optsFromElm($img1);
            expect(opts.album).toContainEqual({
                img: $img2,
                opts: { album: expect.anything(), duration: 500 },
            });
        });
    });

    describe("moveToAlbumEntry()", () => {
        function getImgWrapper($lightbox: HTMLElement) {
            const $wrapper = $lightbox.querySelector(`.${Classes.IMG_WRAPPER}`);
            if (!$wrapper) {
                throw new Error("Couldn't find img wrapper");
            }
            return $wrapper as HTMLElement;
        }

        it("adds the correct animation class", () => {
            const album = createAlbum();
            const leftInst = createInstance();
            const rightInst = createInstance();
            leftInst.open(album[1].img, { album });
            rightInst.open(album[1].img, { album });
            if (!leftInst.active || !rightInst.active) {
                throw new Error("Failed to open on one of the instances");
            }
            const $leftWrapper = getImgWrapper(leftInst.active.$lightbox);
            const $rightWrapper = getImgWrapper(rightInst.active.$lightbox);

            leftInst.moveToAlbumEntry(album[0], "prev");
            expect($leftWrapper).toHaveClass(`${Classes.IMG_WRAPPER}--out-right`);
            rightInst.moveToAlbumEntry(album[2], "next");
            expect($rightWrapper).toHaveClass(`${Classes.IMG_WRAPPER}--out-left`);
        });

        it("adds the correct animation class to the new ligthbox", () => {
            const album = createAlbum();
            const leftInst = createInstance();
            const rightInst = createInstance();
            leftInst.open(album[1].img, { album });
            rightInst.open(album[1].img, { album });
            if (!leftInst.active || !rightInst.active) {
                throw new Error("Failed to open on one of the instances");
            }
            leftInst.moveToAlbumEntry(album[0], "prev");
            dispatchEvent(Event, "animationend", {}, getImgWrapper(leftInst.active.$lightbox));
            const $leftWrapper = getImgWrapper(leftInst.active.$lightbox);
            expect($leftWrapper).toHaveClass(`${Classes.IMG_WRAPPER}--in-left`);

            rightInst.moveToAlbumEntry(album[2], "next");
            dispatchEvent(Event, "animationend", {}, getImgWrapper(rightInst.active.$lightbox));
            const $rightWrapper = getImgWrapper(rightInst.active.$lightbox);
            expect($rightWrapper).toHaveClass(`${Classes.IMG_WRAPPER}--in-right`);
        });
    });

    describe("onKeyDown()", () => {
        it("goes backwards/forwards when left/right are pressed", () => {
            const album = createAlbum();
            const inst = createInstance();
            inst.moveToAlbumEntry = jest.fn();
            inst.open(album[1].img, { album });
            dispatchEvent(KeyboardEvent, "keydown", { key: "ArrowLeft" });
            dispatchEvent(KeyboardEvent, "keydown", { key: "ArrowRight" });
            expect(inst.moveToAlbumEntry).toHaveBeenCalledWith(album[0], "prev");
            expect(inst.moveToAlbumEntry).toHaveBeenCalledWith(album[2], "next");
        });

        it("exits early if not open or opened without album", () => {
            const album = createAlbum();
            const inst = createInstance();
            inst.moveToAlbumEntry = jest.fn();
            const ev = new KeyboardEvent("keydown", { key: "ArrowLeft" });
            inst.onKeyDown(ev);
            expect(inst.moveToAlbumEntry).not.toHaveBeenCalled();
            inst.open(album[1].img);
            inst.onKeyDown(ev);
            expect(inst.moveToAlbumEntry).not.toHaveBeenCalled();
        });
    });
});
