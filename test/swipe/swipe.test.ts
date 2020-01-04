///<reference path="../../node_modules/@testing-library/jest-dom/extend-expect.d.ts"/>
import { MediumLightboxCore } from "../../src/core";
import withSwipe from "../../src/swipe/swipe";
import { Classes } from "../../src/types";
import withAlbum, { AlbumEntry } from "../../src/album/album";
import Detector from "../../src/swipe/detector";
jest.mock("../../src/swipe/detector");

import { mocked } from "ts-jest/utils";

beforeEach(() => {
    mocked(Detector).mockClear();
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
    const inst = withSwipe(withAlbum(new MediumLightboxCore()));
    inst.setOptions({ duration: 0 }); // so we don't have to use FLIP, which requires DOM simulation
    return inst;
};
const createAlbum = (albumLen = 3) => {
    const album: AlbumEntry<MediumLightboxCore>[] = [];
    for (let i = 0; i < albumLen; ++i) {
        const $img = document.createElement("img");
        $img.classList.add(`class-${i}`);
        album.push({ img: $img });
    }
    return album;
};

describe("withSwipe", () => {
    it("adds swipe-specific default options", () => {
        const inst = createInstance();
        expect(typeof inst.options.swipeThreshold).toBe("number");
        expect(typeof inst.options.swipeResponseLimit).toBe("number");
        expect(inst.options.swipeOnDesktop).toStrictEqual(false);
    });

    describe("defaultLightboxGenerator()", () => {
        it("attaches touch listeners", () => {
            const inst = createInstance();
            const album = createAlbum();
            const $img = album[1].img;
            const $lightbox = inst.defaultLightboxGenerator($img, { album }, $img);

            dispatchEvent(TouchEvent, "touchstart", {}, $lightbox);
            dispatchEvent(TouchEvent, "touchmove", {}, $lightbox);
            dispatchEvent(TouchEvent, "touchend", {}, $lightbox);
            dispatchEvent(TouchEvent, "touchcancel", {}, $lightbox);

            expect(inst.swipeDetector.start).toHaveBeenCalledTimes(1);
            expect(inst.swipeDetector.move).toHaveBeenCalledTimes(1);
            expect(inst.swipeDetector.end).toHaveBeenCalledTimes(1);
            expect(inst.swipeDetector.cancel).toHaveBeenCalledTimes(1);
        });

        it("attaches mouse listeners if desktop is enabled", () => {
            const inst = createInstance();
            const album = createAlbum();
            const $img = album[1].img;
            const $lightbox = inst.defaultLightboxGenerator(
                $img,
                { album, swipeOnDesktop: true },
                $img
            );

            dispatchEvent(MouseEvent, "mousedown", {}, $lightbox);
            dispatchEvent(MouseEvent, "mousemove", {}, $lightbox);
            dispatchEvent(MouseEvent, "mouseup", {}, $lightbox);

            expect(inst.swipeDetector.start).toHaveBeenCalledTimes(1);
            expect(inst.swipeDetector.move).toHaveBeenCalledTimes(1);
            expect(inst.swipeDetector.end).toHaveBeenCalledTimes(1);
        });
    });

    describe("applySwipeTransform()", () => {
        it("applies a 0px transform if offset is 0", () => {
            const inst = createInstance();
            const $img = document.createElement("img");
            inst.open($img);
            if (!inst.active) {
                throw new Error("Failed to open");
            }

            const $wrapper = inst.active.$lightbox.querySelector(`.${Classes.IMG_WRAPPER}`);
            inst.applySwipeTransform({ x: 0, y: 0 }, inst.options);
            expect($wrapper).toHaveStyle(
                `transform: translateX(${(0).toFixed(5)}px) scale(${(1).toFixed(5)})`
            );
        });

        it("applies a transform in the correct direction", () => {
            const inst = createInstance();
            const $img = document.createElement("img");
            inst.open($img);
            if (!inst.active) {
                throw new Error("Failed to open");
            }

            const $wrapper = inst.active.$lightbox.querySelector(
                `.${Classes.IMG_WRAPPER}`
            ) as HTMLElement;
            inst.applySwipeTransform({ x: -100, y: 0 }, inst.options);
            expect($wrapper.style.transform).toMatch(/^translateX\(\-\d/);
            inst.applySwipeTransform({ x: 100, y: 0 }, inst.options);
            expect($wrapper.style.transform).toMatch(/^translateX\(\d/);
        });
    });

    describe("onSwipeStart()", () => {
        it("applies the swiping class", () => {
            const inst = createInstance();
            const $img = document.createElement("img");
            inst.open($img);
            if (!inst.active) {
                throw new Error("Failed to open");
            }

            const $wrapper = inst.active.$lightbox.querySelector(
                `.${Classes.IMG_WRAPPER}`
            ) as HTMLElement;
            inst.onSwipeStart({ x: 0, y: 0 }, {});
            expect($wrapper).toHaveClass(`${Classes.IMG_WRAPPER}--swiping`);
        });
    });

    describe("onSwipeEnd()", () => {
        it("calls .afterSwipe()", () => {
            const inst = createInstance();
            const $img = document.createElement("img");
            inst.open($img);
            if (!inst.active) {
                throw new Error("Failed to open");
            }

            inst.afterSwipe = jest.fn();
            inst.onSwipeEnd("left", {});
            expect(inst.afterSwipe).toHaveBeenCalled();
        });

        it("clicks the correct button", () => {
            const inst = createInstance();
            const album = createAlbum();
            const $img = album[1].img;
            inst.open($img, { album });
            if (!inst.active) {
                throw new Error("Failed to open");
            }

            const $left = inst.active.$lightbox.querySelector(
                `.${Classes.ALBUM_NEXT}`
            ) as HTMLElement;
            const $right = inst.active.$lightbox.querySelector(
                `.${Classes.ALBUM_PREV}`
            ) as HTMLElement;
            inst.afterSwipe = jest.fn();
            $left.click = jest.fn();
            inst.onSwipeEnd("left", {});
            expect($left.click).toHaveBeenCalled();

            $right.click = jest.fn();
            inst.onSwipeEnd("right", {});
            expect($right.click).toHaveBeenCalled();
        });
    });

    describe("onSwipeCancel()", () => {
        it("calls .afterSwipe()", () => {
            const inst = createInstance();
            const $img = document.createElement("img");
            inst.open($img);
            if (!inst.active) {
                throw new Error("Failed to open");
            }

            inst.afterSwipe = jest.fn();
            inst.onSwipeCancel({});
            expect(inst.afterSwipe).toHaveBeenCalled();
        });

        it("resets the transform", () => {
            const inst = createInstance();
            const $img = document.createElement("img");
            inst.open($img);
            if (!inst.active) {
                throw new Error("Failed to open");
            }

            inst.applySwipeTransform = jest.fn();
            inst.onSwipeCancel({});
            expect(inst.applySwipeTransform).toHaveBeenCalledWith({ x: 0, y: 0 }, {});
        });
    });

    describe("afterSwipe()", () => {
        it("removes the swiping class", () => {
            const inst = createInstance();
            const $img = document.createElement("img");
            inst.open($img);
            if (!inst.active) {
                throw new Error("Failed to open");
            }

            const $wrapper = inst.active.$lightbox.querySelector(
                `.${Classes.IMG_WRAPPER}`
            ) as HTMLElement;
            const swipeClass = `${Classes.IMG_WRAPPER}--swiping`;
            $wrapper.classList.add(swipeClass);
            inst.afterSwipe();
            expect($wrapper).not.toHaveClass(swipeClass);
        });
    });
});
