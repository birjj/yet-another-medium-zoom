///<reference path="../node_modules/@testing-library/jest-dom/extend-expect.d.ts"/>
import FLIPElement, { getSnapshot } from "../src/flip";
import { mocked } from "ts-jest/utils";

function applyProperties(target: object, values: { [k: string]: any }) {
    const props = Object.keys(values).reduce((outp: { [k: string]: any }, key) => {
        outp[key] = { value: values[key], configurable: true };
        return outp;
    }, {});
    Object.defineProperties(target, props);
}
function getInverted(
    widthScale: number,
    heightScale: number,
    leftChange: number,
    topChange: number
) {
    const $elm = document.createElement("div");
    const flip = new FLIPElement($elm);
    const pos = {
        offsetLeft: 0,
        offsetTop: 0,
        offsetWidth: 100,
        offsetHeight: 100,
    };
    applyProperties($elm, pos);
    flip.first($elm);
    applyProperties($elm, {
        offsetLeft: pos.offsetLeft + leftChange,
        offsetTop: pos.offsetTop + topChange,
        offsetWidth: pos.offsetWidth * widthScale,
        offsetHeight: pos.offsetHeight * heightScale,
    });
    flip.last().invert();

    return { $elm, flip };
}

describe("FLIPElement", () => {
    it("only creates one FLIPElement per HTMLElement", () => {
        const $elm = document.createElement("div");
        const flip = new FLIPElement($elm);
        const flip2 = new FLIPElement($elm);
        expect(flip).toBe(flip2);
    });

    describe("invert()", () => {
        it("correctly inverts translations", () => {
            const { $elm } = getInverted(1, 1, 50, -50);
            expect($elm).toHaveStyle(
                `transform: translate(${(-50).toFixed(5)}px, ${(50).toFixed(
                    5
                )}px) scale(${(1).toFixed(5)}, ${(1).toFixed(5)})`
            );
        });

        it("correctly inverts scales", () => {
            const { $elm } = getInverted(0.5, 2, 0, 0);
            // it is assumed that transform-origin is center, so scaling moves the corners - that's why translation also happens
            expect($elm).toHaveStyle(
                `transform: translate(${(25).toFixed(5)}px, ${(-50).toFixed(
                    5
                )}px) scale(${(2).toFixed(5)}, ${(0.5).toFixed(5)})`
            );
        });

        it("correctly inverts combined translation and scale", () => {
            const { $elm, flip } = getInverted(0.5, 2, 50, -50);
            // it is assumed that transform-origin is center, so scaling moves the corners - that's why translation also happens
            expect($elm).toHaveStyle(
                `transform: translate(${(-25).toFixed(5)}px, ${(0).toFixed(
                    5
                )}px) scale(${(2).toFixed(5)}, ${(0.5).toFixed(5)})`
            );
        });

        it("cannot be called before first() and last()", () => {
            const $elm = document.createElement("div");
            const flip = new FLIPElement($elm);
            expect(() => flip.invert()).toThrow();
            flip.first();
            expect(() => flip.invert()).toThrow();
            flip.last();
            expect(() => flip.invert()).not.toThrow();
        });
    });

    describe("play()", () => {
        it("correctly sets transition duration", () => {
            const { $elm, flip } = getInverted(0.5, 2, 50, -50);

            jest.useFakeTimers();
            const duration = Math.floor(Math.random() * 1000);
            flip.play(duration);
            expect($elm).toHaveStyle(`transition-duration: ${duration}ms`);
            jest.useRealTimers();
        });

        it("resolves after animation is done", () => {
            expect.assertions(1);
            const { $elm, flip } = getInverted(0.5, 2, 50, -50);
            jest.useFakeTimers();
            const duration = 500;
            const promise = flip.play(duration);
            jest.advanceTimersByTime(duration + 100);
            expect(promise).resolves.toBeUndefined();
            jest.useRealTimers();
        });

        it("cannot be called before invert()", () => {
            const $elm = document.createElement("div");
            const flip = new FLIPElement($elm);
            expect(() => flip.play()).toThrow();
            flip.first();
            expect(() => flip.play()).toThrow();
            flip.last();
            expect(() => flip.play()).toThrow();
            flip.invert();
            expect(() => flip.play()).not.toThrow();
        });
    });

    describe("stop()", () => {
        it("resolves the play() promise", () => {
            expect.assertions(1);
            const { $elm, flip } = getInverted(0.5, 2, 50, -50);
            jest.useFakeTimers();
            const promise = flip.play(500);
            flip.stop();
            expect(promise).resolves.toBeUndefined();
            jest.useRealTimers();
        });
    });

    describe("update()", () => {
        it("calls the updater", () => {
            const { $elm, flip } = getInverted(0.5, 2, 50, -50);
            jest.useFakeTimers();
            flip.play(500);
            const updater = jest.fn();
            flip.update($elm, updater);
            jest.useRealTimers();
            expect(updater).toHaveBeenCalled();
        });
    });

    describe("_onTransitionEnd()", () => {
        it("calls stop() if correct transition", () => {
            const { $elm, flip } = getInverted(0.5, 2, 50, -50);
            jest.useFakeTimers();
            flip.stop = jest.fn();
            const promise = flip.play(500);
            flip._onTransitionEnd(({
                propertyName: "transform",
                target: $elm,
            } as unknown) as TransitionEvent);
            expect(flip.stop).toHaveBeenCalled();
            jest.useRealTimers();
        });
    });
});

describe("getSnapshot()", () => {
    it("gets the snapshot of a single element", () => {
        const $elm = document.createElement("div");
        const props = {
            offsetLeft: 50,
            offsetTop: -50,
            offsetWidth: 50,
            offsetHeight: 200,
        };
        applyProperties($elm, props);

        const snapshot = getSnapshot($elm);
        expect(snapshot).toEqual({
            left: props.offsetLeft + props.offsetWidth / 2,
            top: props.offsetTop + props.offsetHeight / 2,
            width: props.offsetWidth,
            height: props.offsetHeight,
        });
    });

    it("calculates offsets of each offset parent too", () => {
        const $elm = document.createElement("div");
        const $parent = document.createElement("div");
        applyProperties($parent, { offsetLeft: 10, offsetTop: -10 });
        const props = {
            offsetLeft: 50,
            offsetTop: -50,
            offsetWidth: 50,
            offsetHeight: 200,
            offsetParent: $parent,
        };
        applyProperties($elm, props);

        const snapshot = getSnapshot($elm);
        expect(snapshot).toEqual({
            left: props.offsetLeft + 10 + props.offsetWidth / 2,
            top: props.offsetTop - 10 + props.offsetHeight / 2,
            width: props.offsetWidth,
            height: props.offsetHeight,
        });
    });

    it("calculates scroll as offset for fixed elements", () => {
        const $elm = document.createElement("div");
        $elm.style.position = "fixed";
        const props = {
            offsetLeft: 0,
            offsetTop: 0,
            offsetWidth: 50,
            offsetHeight: 200,
        };
        applyProperties(window, {
            scrollX: 250,
            scrollY: 500,
        });
        applyProperties($elm, props);

        const snapshot = getSnapshot($elm);
        expect(snapshot).toEqual({
            left: props.offsetLeft + 250 + props.offsetWidth / 2,
            top: props.offsetTop + 500 + props.offsetHeight / 2,
            width: props.offsetWidth,
            height: props.offsetHeight,
        });
    });
});
