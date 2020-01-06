import SwipeDetector from "../../src/swipe/detector";
import * as lolex from "lolex";
import { createDetector, performSwipe, createTouchEvent } from "./utils";

let clock: lolex.InstalledClock;
beforeEach(() => {
    clock = lolex.install({ now: 1234 });
});
afterEach(() => {
    clock.uninstall();
});

describe("SwipeDetector", () => {
    describe("setThreshold()", () => {
        it("updates the threshold", () => {
            const { detector } = createDetector({}, 50);
            expect(detector.threshold).toBe(50);
            detector.setThreshold(150);
            expect(detector.threshold).toBe(150);
        });
    });

    describe("start()", () => {
        it("calls the start listener with meta", () => {
            const { detector, listeners } = createDetector();
            const meta = { test: Math.random() };
            detector.start(createTouchEvent("touchstart", [100, 100]), meta);
            expect(listeners.start).toHaveBeenCalledWith(
                { x: 100, y: 100, time: expect.any(Number) },
                meta
            );
        });

        it("cancels if a second touch happens", () => {
            const { detector } = createDetector();
            detector.cancel = jest.fn();
            detector.start(createTouchEvent("touchstart", [100, 100], [150, 150]));
            expect(detector.cancel).toHaveBeenCalled();
        });
    });

    describe("move()", () => {
        it("calls the update listeners with metadata", () => {
            const { detector, listeners } = createDetector();
            const meta = { test: Math.random() };
            performSwipe({ clock, detector, offset: [100, 0], duration: 1000, metadata: meta });
            expect(listeners.update).toHaveBeenCalledWith(
                { x: expect.any(Number), y: expect.any(Number) },
                meta
            );
        });

        it("doesn't call update for small swipes", () => {
            const { detector, listeners } = createDetector();
            performSwipe({ clock, detector, offset: [10, 0], duration: 1000 });
            expect(listeners.update).not.toHaveBeenCalled();
        });

        it("cancels if it's a vertical swipe", () => {
            const { detector } = createDetector();
            detector.cancel = jest.fn();
            performSwipe({ clock, detector, offset: [50, 100], duration: 1000 });
            expect(detector.cancel).toHaveBeenCalled();
        });

        it("exits early if not dragging", () => {
            const { detector } = createDetector({}, 250);
            const ev = createTouchEvent("touchmove", [350, 100]);
            const clientX = jest.spyOn(ev, "changedTouches", "get");
            detector.move(ev);
            expect(clientX).not.toHaveBeenCalled();
        });
    });

    describe("end()", () => {
        it("calls end with metadata if swipe is longer than threshold", () => {
            const { detector, listeners } = createDetector({}, 250);

            const leftMeta = { test: Math.random() };
            performSwipe({ clock, detector, offset: [-260, 0], duration: 100, metadata: leftMeta });
            expect(listeners.end).toHaveBeenCalledWith("left", leftMeta);

            const rightMeta = { test: Math.random() };
            performSwipe({ clock, detector, offset: [260, 0], duration: 100, metadata: rightMeta });
            expect(listeners.end).toHaveBeenCalledWith("right", rightMeta);
        });

        it("doesn't call end if swipe is shorter than threshold", () => {
            const { detector, listeners } = createDetector({}, 250);
            performSwipe({ clock, detector, offset: [240, 0], duration: 100 });
            expect(listeners.end).not.toHaveBeenCalled();
        });

        it("exits early if not dragging", () => {
            const { detector } = createDetector({}, 250);
            const ev = createTouchEvent("touchend", [350, 100]);
            const clientX = jest.spyOn(ev, "changedTouches", "get");
            detector.end(ev);
            expect(clientX).not.toHaveBeenCalled();
        });
    });

    describe("cancel()", () => {
        it("calls the cancel listeners with metadata", () => {
            const { detector, listeners } = createDetector();
            const meta = { test: Math.random() };
            detector.start(createTouchEvent("start", [100, 100]), meta);
            detector.cancel();
            expect(listeners.cancel).toHaveBeenCalledWith(meta);
        });

        it("exits early if not dragging", () => {
            const { detector, listeners } = createDetector({}, 250);
            detector.cancel();
            expect(listeners.cancel).not.toHaveBeenCalled();
        });
    });
});
