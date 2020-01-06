import SwipeDetector from "../../src/swipe/detector";
import { InstalledClock, Clock } from "lolex";

// polyfill JSDOM since it doesn't have a Touch implementation as of the writing of this code
if (typeof Touch === "undefined") {
    interface TouchInit {
        identifier: number;
        target: EventTarget;
        clientX?: number;
        clientY?: number;
    }

    class Touch {
        identifier: number;
        target: EventTarget;
        clientX: number;
        clientY: number;

        constructor(touchInit: TouchInit) {
            this.identifier = touchInit.identifier;
            this.target = touchInit.target;
            this.clientX = touchInit.clientX || 0;
            this.clientY = touchInit.clientY || 0;
        }
    }
    (global as any).Touch = Touch;
}

interface performSwipeArguments {
    clock: InstalledClock<Clock>;
    detector: SwipeDetector;
    offset: [number, number];
    duration: number;
    metadata?: any;
    withEvents?: { start: boolean; end: boolean };
    start?: [number, number];
}
export function performSwipe({
    clock,
    detector,
    offset: offset,
    duration,
    metadata,
    withEvents = { start: true, end: true },
    start = [100, 100],
}: performSwipeArguments) {
    const TICK_LEN = 1000 / 20; // send 20 events per second
    const numTicks = duration / TICK_LEN;
    const [xOffset, yOffset] = offset;
    const xPerTick = xOffset / numTicks;
    const yPerTick = yOffset / numTicks;
    let tick = 0;

    let identifier: number | undefined;
    if (withEvents.start) {
        const startEv = createTouchEvent("touchstart", start);
        identifier = startEv.touches[0].identifier;
        detector.start(startEv, metadata);
    }

    while (tick < numTicks) {
        tick++;
        clock.tick(TICK_LEN);
        const pos: [number, number, number?] = [
            start[0] + xPerTick * tick,
            start[1] + yPerTick * tick,
            identifier,
        ];
        const ev = createTouchEvent("touchmove", pos);
        detector.move(ev);
    }

    if (withEvents.end) {
        const endEv = createTouchEvent("touchend", [
            start[0] + xOffset,
            start[1] + yOffset,
            identifier,
        ]);
        detector.end(endEv);
    }
}

export function createDetector(listeners = {}, threshold = 100) {
    const listnrs = {
        start: jest.fn(),
        update: jest.fn(),
        end: jest.fn(),
        cancel: jest.fn(),
        ...listeners,
    };
    return {
        detector: new SwipeDetector(listnrs, threshold),
        listeners: listnrs,
    };
}

export function createTouchEvent(type: string, ...points: [number, number, number?][]) {
    const touches = points.map(
        point =>
            new Touch({
                clientX: point[0],
                clientY: point[0],
                identifier: point[2] ? point[2] : Math.floor(Math.random() * 1000),
                target: document.body,
            })
    );
    return new TouchEvent(type, {
        bubbles: true,
        touches,
        changedTouches: touches,
    });
}
