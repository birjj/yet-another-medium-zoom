import { MediumLightboxCore } from "../core";
import { YamzPlugin, Classes } from "../types";
import withAlbum from "../album/album";
import "./swipe.css";
import SwipeDetector from "./detector";

export interface Swipeable {
    swipeDetector: SwipeDetector;
    applySwipeTransform: (offset: { x: number; y: number }, opts: SwipeOptions) => void;
    onSwipeStart: (point: { x: number; y: number }, opts: SwipeOptions) => void;
    onSwipeEnd: (direction: "left" | "right", opts: SwipeOptions) => void;
    onSwipeCancel: (opts: SwipeOptions) => void;
    afterSwipe: () => void;
}

export interface SwipeOptions {
    /** Describes how far users have to drag before it's recognized as a drag */
    swipeThreshold?: number;
    /** Describes how far the image can move visually in response to being dragged */
    swipeResponseLimit?: number;
    /** If true, desktop users can drag images using their mouse */
    swipeOnDesktop?: boolean;
}

/** Augments the YAMZ instance to support swiping through albums on mobile */
export default function withSwipe<YamzType extends ReturnType<typeof withAlbum>>(_yamz: YamzType) {
    const { defaultLightboxGenerator } = _yamz;
    const yamz = _yamz as YamzPlugin<YamzType, Swipeable, SwipeOptions, SwipeOptions>;
    if (typeof window === "undefined") {
        return yamz;
    }

    yamz.options = {
        swipeThreshold: window.innerWidth * 0.25,
        swipeResponseLimit: window.innerWidth * 0.05,
        swipeOnDesktop: false,
        ...yamz.options,
    };

    // attach listeners to lightbox if we're displaying an album
    yamz.defaultLightboxGenerator = function($copiedImg, opts, $original) {
        const $lightbox = defaultLightboxGenerator.call(this, $copiedImg, opts, $original);

        if (!opts.album) {
            return $lightbox;
        }

        if (opts.swipeThreshold) {
            yamz.swipeDetector.setThreshold(opts.swipeThreshold);
        }

        // normally we don't let mouse users swipe, but developers can enable it if they want
        if (opts.swipeOnDesktop) {
            $lightbox.addEventListener("mousedown", e => {
                e.preventDefault();
                yamz.swipeDetector.start(e, opts);
            });
            $lightbox.addEventListener("mousemove", e => {
                e.preventDefault();
                yamz.swipeDetector.move(e);
            });
            let justSwiped = 0;
            $lightbox.addEventListener("mouseup", e => {
                e.preventDefault();
                if (yamz.swipeDetector.state) {
                    justSwiped = yamz.swipeDetector.state.isSwipe ? Date.now() : 0;
                }
                if (!yamz.swipeDetector.end(e)) {
                    this.onSwipeCancel(opts);
                }
            });
            $lightbox.addEventListener("click", e => {
                // we stop propagation here so that the lightbox doesn't close if we just swiped
                if (Date.now() - justSwiped < 16) {
                    e.stopImmediatePropagation();
                }
            });
        }

        // we always attach listeners for touch
        $lightbox.addEventListener("touchstart", e => {
            yamz.swipeDetector.start(e, opts);
        });
        $lightbox.addEventListener("touchmove", yamz.swipeDetector.move);
        $lightbox.addEventListener("touchend", yamz.swipeDetector.end);
        $lightbox.addEventListener("touchcancel", yamz.swipeDetector.cancel);

        return $lightbox;
    };

    yamz.applySwipeTransform = function(touchOffset: { x: number; y: number }, opts: SwipeOptions) {
        if (!this.active) {
            return;
        }
        let offset = Math.abs(touchOffset.x);
        let scale = 1;
        if (opts.swipeResponseLimit) {
            // use a sine function to slowly scale down
            // sine wave is 3 long, because that gives a 45 degree angle at the start, so 1px touch movement = 1px image movement
            const limit = opts.swipeResponseLimit * 1.5; // this is where we want the image to stop moving entirely
            const progress = Math.abs(touchOffset.x) / opts.swipeResponseLimit;
            const clampedProgress = Math.min(progress, 1.5);
            const offsetScale = Math.sin((clampedProgress * Math.PI) / 3);
            offset = opts.swipeResponseLimit * offsetScale;

            // update the opacity if we're nearing the end
            if (progress > 1) {
                scale = Math.min(Math.max(1 - (progress - 1) * 0.01, 0.8), 1);
            }

            // maintain a very slight response to dragging further
            const linearOffset = Math.abs(touchOffset.x) - Math.min(Math.abs(touchOffset.x), limit);
            offset += linearOffset * 0.05;

            if (touchOffset.x < 0) {
                offset = -offset;
            }
        }

        const $target = this.active.$lightbox.querySelector(
            `.${Classes.IMG_WRAPPER}`
        ) as HTMLElement | null;
        if ($target) {
            $target.style.transform = `translateX(${offset.toFixed(5)}px) scale(${scale.toFixed(
                5
            )})`;
            $target.style.opacity = `${1 - (1 - scale) * 4}`;
        }
    };

    yamz.onSwipeStart = function(point: { x: number; y: number }, opts: SwipeOptions) {
        if (this.active) {
            const $target = this.active.$lightbox.querySelector(`.${Classes.IMG_WRAPPER}`);
            if ($target) {
                $target.classList.add(`${Classes.IMG_WRAPPER}--swiping`);
            }
        }
    };
    yamz.onSwipeEnd = function(direction: "left" | "right", opts: SwipeOptions) {
        if (this.active) {
            const $btn =
                direction === "left"
                    ? this.active.$lightbox.querySelector(`.${Classes.ALBUM_NEXT}`)
                    : this.active.$lightbox.querySelector(`.${Classes.ALBUM_PREV}`);
            if ($btn) {
                ($btn as HTMLElement).click();
            }
        }
        this.afterSwipe();
    };

    yamz.onSwipeCancel = function(opts: SwipeOptions) {
        this.applySwipeTransform({ x: 0, y: 0 }, opts);
        this.afterSwipe();
    };

    yamz.afterSwipe = function() {
        if (this.active) {
            const $target = this.active.$lightbox.querySelector(`.${Classes.IMG_WRAPPER}`);
            if ($target) {
                $target.classList.remove(`${Classes.IMG_WRAPPER}--swiping`);
            }
        }
    };

    yamz.swipeDetector = new SwipeDetector({
        start: yamz.onSwipeStart.bind(yamz),
        update: yamz.applySwipeTransform.bind(yamz),
        end: yamz.onSwipeEnd.bind(yamz),
        cancel: yamz.onSwipeCancel.bind(yamz),
    });

    return yamz;
}
