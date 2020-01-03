///<reference path="../node_modules/@testing-library/jest-dom/extend-expect.d.ts"/>
import { MediumLightboxCore, DEFAULT_OPTS } from "../src/core";
import FLIP from "../src/flip";
jest.mock("../src/flip", () => {
    const flipModule = jest.genMockFromModule("../src/flip") as any;
    for (let method of ["first", "last", "invert", "play"]) {
        flipModule.default.prototype[method as "first"|"last"|"invert"|"play"] = jest.fn(function(this: any){ return this; });
    }
    return flipModule;
});

import { mocked } from "ts-jest/utils";
import { ImageOptions, Classes } from "../src/types";
const DEFAULTS = {
    ...DEFAULT_OPTS,
    duration: 0,
};

beforeEach(() => {
    mocked(FLIP).mockClear();
});
function dispatchEvent<EventConstructor extends new (a:string,b?:object) => Event>(E: EventConstructor, type: string, opts?: ConstructorParameters<EventConstructor>[1], target: HTMLElement|Document|Window = document) {
    const ev = new E(type, {
        bubbles: true,
        ...opts
    });
    target.dispatchEvent(ev);
}

const createInstance = () => {
    const inst = new MediumLightboxCore();
    inst.setOptions({ duration: 0 }); // so we don't have to use FLIP, which requires DOM simulation
    return inst;
};
describe("MediumLightboxCore", () => {
    describe("getOptions()", () => {
        it("gets the default options initially", () => {
            expect(createInstance().getOptions()).toEqual(DEFAULTS);
        });
    });

    describe("setOptions()", () => {
        it("sets options when given full settings", () => {
            const inst = createInstance();
            const opts = {
                scrollAllowance: 10,
                zoomOptimistically: false,
                wrapAlbums: false,
                duration: 400,
                container: undefined,
                lightboxGenerator: undefined,
            };
            inst.setOptions(opts);
            expect(inst.getOptions()).toEqual(opts);
        });

        it("sets options when given partial settings", () => {
            const inst = createInstance();
            inst.setOptions({ scrollAllowance: 10 });
            expect(inst.getOptions()).toEqual({ ...DEFAULTS, scrollAllowance: 10 });
        });
    });

    describe("open()", () => {
        it("errors when given invalid element", () => {
            const $div = document.createElement("div");
            return expect(createInstance().open($div)).rejects.toBeInstanceOf(TypeError);
        });

        it("returns an HTMLElement", () => {
            const $img = document.createElement("img");
            return expect(createInstance().open($img)).resolves.toBeInstanceOf(HTMLElement);
        });

        it("plays a FLIP animation", async () => {
            const $img = document.createElement("img");
            $img.src = "https://google.com/";
            const inst = createInstance();
            const opts = { duration: 500 };
            await inst.open($img, opts);
            if (!inst._flip || !inst.active) { // make TS happy
                throw new Error("._flip or .active weren't found on instance");
            }
            expect(mocked(inst._flip.first)).toHaveBeenCalledWith($img);
            expect(mocked(inst._flip.last)).toHaveBeenCalledWith(inst.active.$copiedImg);
            expect(mocked(inst._flip.invert)).toHaveBeenCalledWith(inst.active.$copiedImg.parentElement);
            expect(mocked(inst._flip.play)).toHaveBeenCalledWith(opts.duration);
        });
    });

    describe("close()", () => {
        it("closes the active lightbox", async () => {
            const $img = document.createElement("img");
            const inst = createInstance();
            await inst.open($img);
            await inst.close();
            expect(inst.active).toBe(undefined);
        });

        it("closes when given active $img", async () => {
            const $img = document.createElement("img");
            const inst = createInstance();
            await inst.open($img);
            await inst.close($img);
            expect(inst.active).toBe(undefined);
        });

        it("doesn't close when given inactive $img", async () => {
            const $img = document.createElement("img");
            const $img2 = document.createElement("img");
            const inst = createInstance();
            await inst.open($img, { duration: 0 });
            await inst.close($img2);
            expect(inst.active).not.toBe(undefined);
        });

        it("plays a FLIP animation", async () => {
            const $img = document.createElement("img");
            $img.src = "https://google.com/";
            const inst = createInstance();
            const opts = { duration: 500 };
            await inst.open($img, opts);
            if (!inst._flip || !inst.active) { // make TS happy
                throw new Error("._flip or .active weren't found on instance");
            }
            expect(mocked(inst._flip.first)).toHaveBeenCalledWith($img);
            expect(mocked(inst._flip.last)).toHaveBeenCalledWith(inst.active.$copiedImg);
            expect(mocked(inst._flip.invert)).toHaveBeenCalledWith(inst.active.$copiedImg.parentElement);
            expect(mocked(inst._flip.play)).toHaveBeenCalledWith(opts.duration);
        });
    });

    describe("replace()", () => {
        it("swaps which originals are hidden", () => {
            const inst = createInstance();
            const $preImg = document.createElement("img");
            inst.open($preImg);
            expect($preImg).toHaveClass(Classes.ORIGINAL_OPEN);
            const $postImg = document.createElement("img");
            inst.replace($postImg);
            expect($preImg).not.toHaveClass(Classes.ORIGINAL_OPEN);
            expect($postImg).toHaveClass(Classes.ORIGINAL_OPEN);
        });
    });

    describe("replaceLightboxDOM()", () => {
        it("semantically replaces the lightbox", () => {
            const inst = createInstance();
            const $preImg = document.createElement("img");
            $preImg.src = "https://google.com";
            const $preBox = inst.defaultLightboxGenerator($preImg, {}, $preImg);
            const $postImg = document.createElement("img");
            $postImg.src = "https://google.dk";
            const $postBox = inst.defaultLightboxGenerator($postImg, {}, $postImg);
            const $clonedPost = $postBox.cloneNode(true);

            inst.replaceLightboxDOM($postBox, $preBox);
            expect($preBox).toEqual($clonedPost);
            expect($preBox).not.toBe($clonedPost);
        });
    });

    describe("generateLightbox()", () => {
        it("calls _highResLoaded() when high-res loads", () => {
            const $img = document.createElement("img");
            $img.src = "https://google.com";
            const opts = {
                highres: "invalid",
                scrollAllowance: 150,
                duration: 500
            };
            const inst = createInstance();
            inst.open($img);

            inst._highResLoaded = jest.fn();
            const lightbox = inst.generateLightbox($img, opts);
            dispatchEvent(Event, "load", {}, lightbox.$highRes);
            expect(inst._highResLoaded).toHaveBeenCalledWith(lightbox.$highRes);
        });

        it("removes the loading indicator when high-res fails to load", () => {
            const $img = document.createElement("img");
            $img.src = "https://google.com";
            const opts = {
                highres: "invalid",
                scrollAllowance: 150,
                duration: 500
            };
            const inst = createInstance();

            console.error = jest.fn(); // suppress console.error logs
            const lightbox = inst.generateLightbox($img, opts);
            let $loader = lightbox.$lightbox.querySelector(`.${Classes.LOADER}`);
            expect($loader).not.toBeNull();
            dispatchEvent(Event, "error", {}, lightbox.$highRes);
            $loader = lightbox.$lightbox.querySelector(`.${Classes.LOADER}`);
            expect($loader).toBeNull();
        });
    });

    describe("_highResLoaded()", () => {
        it("updates FLIP if it is currently playing", () => {
            const $img = document.createElement("img");
            $img.src = "https://google.com";
            const inst = createInstance();
            const opts = { duration: 500 };
            inst.open($img, opts);
            if (!inst._flip || !inst.active) { // make TS happy
                throw new Error("._flip or .active weren't found on instance");
            }
            const $lowresCopy = inst.active.$copiedImg;

            const $highres = document.createElement("img");
            $highres.src = "https://google.dk";
            inst._highResLoaded($highres);
            expect(mocked(inst._flip.update)).toHaveBeenCalledWith($lowresCopy.parentElement, expect.any(Function), opts.duration);
        });

        it("plays a new FLIP animation if it is open", async () => {
            const $img = document.createElement("img");
            $img.src = "https://google.com";
            const inst = createInstance();
            const opts = { duration: 500 };
            await inst.open($img, opts);
            if (!inst._flip || !inst.active) { // make TS happy
                throw new Error("._flip or .active weren't found on instance");
            }
            const $lowresCopy = inst.active.$copiedImg;

            const $highres = document.createElement("img");
            $highres.src = "https://google.dk";
            inst._highResLoaded($highres);

            expect(mocked(inst._flip.first)).toHaveBeenCalledWith($lowresCopy);
            expect(mocked(inst._flip.last)).toHaveBeenCalledWith(inst.active.$copiedImg);
            expect(mocked(inst._flip.invert)).toHaveBeenCalledWith(inst.active.$copiedImg.parentElement);
            expect(mocked(inst._flip.play)).toHaveBeenCalledWith(opts.duration);
        });
    });

    describe("optsFromElm()", () => {
        it("parses all supported options correctly", () => {
            const $img = document.createElement("img");
            const opts = {
                class: `class-${Math.floor(Math.random()*1000)}`,
                duration: 1234,
                highres: "https://google.com",
                scrollAllowance: 4321
            };
            for(let k in opts) {
                const key = k as keyof (typeof opts);
                $img.dataset[key] = opts[key].toString();
            }
            const inst = createInstance();
            expect(inst.optsFromElm($img)).toEqual(opts);
        });
    });

    describe("bind()", () => {
        it("opens the lightbox with given options when image is clicked", () => {
            const $img = document.createElement("img");
            $img.dataset.scrollAllowance = "128";
            const opts: ImageOptions = { duration: 500 };
            const inst = createInstance();
            inst.bind($img, opts);
            inst.open = jest.fn();
            $img.click();
            expect(inst.open).toHaveBeenCalledWith($img, { scrollAllowance: 128, ...opts });
        });

        it("supports arrays", () => {
            const $img = document.createElement("img");
            const $img2 = document.createElement("img");
            const spy = jest.spyOn($img, "addEventListener");
            const spy2 = jest.spyOn($img2, "addEventListener");
            const inst = createInstance();
            inst.bind([$img, $img2]);
            expect(spy).toHaveBeenCalledWith("click", expect.any(Function));
            expect(spy2).toHaveBeenCalledWith("click", expect.any(Function));
        });

        it("supports CSS selectors", () => {
            const $img = document.createElement("img");
            const className = `class-${Math.floor(Math.random()*1000)}`;
            $img.classList.add(className);
            document.body.appendChild($img);
            const spy = jest.spyOn($img, "addEventListener");
            const inst = createInstance();
            inst.bind(`.${className}`);
            expect(spy).toHaveBeenCalledWith("click", expect.any(Function));
        });
    });

    describe("interactivity", () => {
        it("closes when scrolled too far", async () => {
            const $img = document.createElement("img");
            const inst = createInstance();

            Object.defineProperty(window, "scrollY", { get: () => 0 });
            const originalY = window.scrollY;
            await inst.open($img, { scrollAllowance: 500 });
            inst.close = jest.fn();

            Object.defineProperty(window, "scrollY", { get: () => 1000 });
            jest.useFakeTimers();
            dispatchEvent(Event, "scroll");
            jest.runOnlyPendingTimers();
            jest.useRealTimers();

            expect(inst.close).toHaveBeenCalled();
        });
        it("doesn't close when scrolled slightly", async () => {
            const $img = document.createElement("img");
            const inst = createInstance();

            Object.defineProperty(window, "scrollY", { get: () => 0 });
            const originalY = window.scrollY;
            await inst.open($img, { scrollAllowance: 500 });
            inst.close = jest.fn();

            Object.defineProperty(window, "scrollY", { get: () => 250 });
            jest.useFakeTimers();
            dispatchEvent(Event, "scroll");
            jest.runOnlyPendingTimers();
            jest.useRealTimers();

            expect(inst.close).not.toHaveBeenCalled();
        });
        it("doesn't close when scrollAllowance is -1", async () => {
            const $img = document.createElement("img");
            const inst = createInstance();

            Object.defineProperty(window, "scrollY", { get: () => 0 });
            const originalY = window.scrollY;
            await inst.open($img, { scrollAllowance: -1 });
            inst.close = jest.fn();

            Object.defineProperty(window, "scrollY", { get: () => 1000 });
            jest.useFakeTimers();
            dispatchEvent(Event, "scroll");
            jest.runOnlyPendingTimers();
            jest.useRealTimers();

            expect(inst.close).not.toHaveBeenCalled();
        });

        it("closes when [Esc] is pressed", async () => {
            const $img = document.createElement("img");
            const inst = createInstance();
            await inst.open($img);
            inst.close = jest.fn();
            dispatchEvent(
                KeyboardEvent,
                "keydown",
                {
                    key: "Escape"
                }
            );

            expect(inst.close).toHaveBeenCalled();
        });
    });
})
