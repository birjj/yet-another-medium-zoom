import { MediumLightboxCore } from "../core";
import { YamzPlugin, Classes } from "../types";
import withAlbum from "../album/album";

export interface Swipeable {
    startSwipe: (e: Touch|MouseEvent, opts: SwipeOptions) => void,
    updateSwipe: (e: Touch|MouseEvent, opts: SwipeOptions) => void,
    endSwipe: (e: Touch|MouseEvent, opts: SwipeOptions) => boolean,
    cancelSwipe: () => void,
    applySwipeTransform: (deltaX: number, opts: SwipeOptions) => void,
    _startTouch?: {
        clientX: number,
        clientY: number,
        identifier?: number
    },
    _lastTouch?: {
        clientX: number,
        clientY: number,
        velocityX: number,
        time: number
    }
};

export interface SwipeOptions {
    /** Describes how far users have to drag before it's recognized as a drag */
    swipeThreshold?: number,
    /** Describes how far the image can move visually in response to being dragged */
    swipeResponseLimit?: number,
    /** If true, desktop users can drag images using their mouse */
    swipeOnDesktop?: boolean,
};

/** Augments the YAMZ instance to support swiping through albums on mobile */
export default function withSwipe<YamzType extends ReturnType<typeof withAlbum>>(_yamz: YamzType) {
    const { defaultLightboxGenerator, optsFromElm } = _yamz;
    const yamz = _yamz as YamzPlugin<YamzType, Swipeable, SwipeOptions, SwipeOptions>;

    yamz.options = {
        swipeThreshold: window.innerWidth * 0.25,
        swipeResponseLimit: window.innerWidth * 0.05,
        swipeOnDesktop: true,
        ...yamz.options
    };

    // attach listeners to lightbox if we're displaying an album
    yamz.defaultLightboxGenerator = function($copiedImg, opts, $original) {
        const $lightbox = defaultLightboxGenerator.call(this, $copiedImg, opts, $original);

        if (!opts.album) { return $lightbox; }

        // normally we don't let mouse users swipe, but developers can enable it if they want
        if (opts.swipeOnDesktop) {
            $lightbox.addEventListener("mousedown", e => {
                e.preventDefault();
                this.startSwipe(e, opts);
            });
            $lightbox.addEventListener("mousemove", e => {
                e.preventDefault();
                this.updateSwipe(e, opts);
            });
            let justSwiped = 0;
            $lightbox.addEventListener("mouseup", e => {
                e.preventDefault();
                justSwiped = this.endSwipe(e, opts)
                    ? Date.now()
                    : 0;
            });
            $lightbox.addEventListener("click", e => {
                // we stop propagation here so that the lightbox doesn't close if we just swiped
                if (Date.now() - justSwiped < 16) {
                    e.stopImmediatePropagation();
                }
            });
        }

        // we always attach listeners for touch
        $lightbox.addEventListener("touchstart", e => handleTouchStart.call(this, e, opts));
        $lightbox.addEventListener("touchmove", e => handleTouchMove.call(this, e, opts));
        $lightbox.addEventListener("touchend", e => handleTouchEnd.call(this, e, opts));
        $lightbox.addEventListener("touchcancel", e => handleTouchEnd.call(this, e, opts));

        return $lightbox;
    };

    // and allow specifying options on the element
    yamz.optsFromElm = function($elm: HTMLElement) {
        type outpType = ReturnType<YamzType["optsFromElm"]> & SwipeOptions;
        const outp: outpType = optsFromElm.call(this, $elm) as outpType;
        return outp;
    };

    yamz.applySwipeTransform = function(deltaX: number, opts: SwipeOptions) {
        if (!this.active) { return; }
        let offset = deltaX;
        let scale = 1;
        if (opts.swipeResponseLimit) {
            // use a sine function to slowly scale down
            // sine wave is 3 long, because that gives a 45 degree angle at the start, so 1px touch movement = 1px image movement
            const limit = opts.swipeResponseLimit * 1.5; // this is where we want the image to stop moving entirely
            const progress = Math.abs(deltaX) / opts.swipeResponseLimit;
            const clampedProgress = Math.min(progress, 1.5);
            const offsetScale = Math.sin(clampedProgress * Math.PI / 3);
            offset = opts.swipeResponseLimit * offsetScale;

            // update the opacity if we're nearing the end
            if (progress > 1) {
                scale = Math.min(Math.max(1 - (progress - 1)*0.01, 0.8), 1);
            }

            // maintain a very slight response to dragging further
            const linearOffset = Math.abs(deltaX) - Math.min(Math.abs(deltaX), limit);
            offset += linearOffset * 0.05;

            if (deltaX < 0) { offset = -offset; }
        }

        const $target = this.active.$lightbox.querySelector(`.${Classes.IMG_WRAPPER}`) as HTMLElement|null;
        if ($target) {
            $target.style.transform = `translateX(${offset.toFixed(5)}px) scale(${scale})`;
            $target.style.opacity = `${1 - (1 - scale)*4}`;
        }
    };

    /**
     * When a touch is started, we simply set it as the active touch
     * In the case where an touch starts while we have an active touch, we cancel everything (this is used for e.g. zoom)
     */
    function handleTouchStart(this: typeof yamz, e: TouchEvent, opts: SwipeOptions) {
        const touches = e.changedTouches;
        // only let through if we aren't currently swiping
        if (e.touches.length > 1) {
            // we also ignore any start touches if another finger is currently down (and cancel any active ones if a new finger is touched)
            return this.cancelSwipe();
        }
        if (!this._lastTouch && e.touches.length == 1) {
            return this.startSwipe(touches[0], opts);
        }
    }
    yamz.startSwipe = function(e: Touch|MouseEvent, opts: SwipeOptions) {
        this._startTouch = {
            clientX: e.clientX,
            clientY: e.clientY,
            identifier: "identifier" in e
                        ? e.identifier
                        : undefined
        };
        this._lastTouch = {
            clientX: e.clientX,
            clientY: e.clientY,
            time: Date.now(),
            velocityX: 0
        };
    };

    /**
     * Handles updating the DOM to match the swipe. If the user moves too far up/down, the swipe is cancelled
     */
    function handleTouchMove(this: typeof yamz, e: TouchEvent, opts: SwipeOptions) {
        const touches = e.changedTouches;
        // only let through if this is our currently active touch
        if (!this._startTouch) { return; }
        for (let i = 0; i < touches.length; ++i) {
            const touch = touches[i];
            if (touch.identifier === this._startTouch.identifier) {
                return this.updateSwipe(touch, opts);
            }
        }
    }
    yamz.updateSwipe = function(e: Touch|MouseEvent, opts: SwipeOptions) {
        if (!this._startTouch || !this._lastTouch) { return; }
        const timeDelta = Date.now() - this._lastTouch.time;
        if (timeDelta < 16) { return; } // debounce
        // we compare the direction relative to the starting point; if it's more down than up, we cancel the drag ('cause it's probably a scroll)
        const xDelta = Math.abs(e.clientX - this._startTouch.clientX);
        const yDelta = Math.abs(e.clientY - this._startTouch.clientY);

        this._lastTouch.clientX = e.clientX;
        this._lastTouch.clientY = e.clientY;
        this._lastTouch.time = Date.now();
        this._lastTouch.velocityX = timeDelta ? (e.clientX - this._startTouch.clientX) / timeDelta : 0;

        const IGNORE_THRESHOLD = 8; // ignore test if we have moved barely anything. Possibly consider if this is better as an option?
        if (Math.max(xDelta, yDelta) < IGNORE_THRESHOLD) {
            return;
        }

        if (yDelta > xDelta) {
            return this.cancelSwipe();
        }

        // ignore ones where the mouse hasn't moved
        if (xDelta === 0 && yDelta === 0) { return; }

        this.applySwipeTransform(e.clientX - this._startTouch.clientX, opts);
    };

    /**
     * Handles detecting the swipe once the touch ends
     * The velocity of the movement is used to project a point 0.5s out in the future
     * This lets quick movements that "throw" the entry out of the way be detected, along with slower drags
     */
    function handleTouchEnd(this: typeof yamz, e: TouchEvent, opts: SwipeOptions) {
        const touches = e.changedTouches;
        // only let through if this is our currently active touch
        if (!this._startTouch) { return; }
        for (let i = 0; i < touches.length; ++i) {
            const touch = touches[i];
            if (touch.identifier === this._startTouch.identifier) {
                if (this.endSwipe(touch, opts)) {
                    e.preventDefault();
                    return;
                }
            }
        }
    }
    /** Returns true/false depending on whether movement was a swipe */
    yamz.endSwipe = function(e: Touch|MouseEvent, opts: SwipeOptions) {
        if (!this._startTouch || !this._lastTouch) { return false; }

        // make sure we have an up to date velocity measurement
        let velocity = this._lastTouch.velocityX;
        const timeDelta = Date.now() - this._lastTouch.time;
        if (timeDelta > 16) {
            velocity = (e.clientX - this._lastTouch.clientX) / timeDelta;
        }

        // then calculate the projected point we want to check
        const totalDelta = e.clientX - this._startTouch.clientX;
        const recentDelta = e.clientX - this._lastTouch.clientX;
        let finalDelta = totalDelta;
        // we only project a point out if the flick is in the direction of the swipe, otherwise we just use the touch position
        if ((totalDelta >= 0 && recentDelta >= 0 || totalDelta <= 0 && recentDelta <= 0)) {
            finalDelta += velocity * 50;
        }

        delete this._startTouch;
        delete this._lastTouch;

        // finally check it
        if (opts.swipeThreshold && opts.swipeThreshold > 0 && Math.abs(finalDelta) > opts.swipeThreshold) {
            if (this.active) {
                const $btn = finalDelta < 0
                    ? this.active.$lightbox.querySelector(".yamz__album__next")
                    : this.active.$lightbox.querySelector(".yamz__album__prev");
                if ($btn) { ($btn as HTMLElement).click(); }
            }
            this.cancelSwipe();
            return true;
        }
        return false;
    };

    yamz.cancelSwipe = function() {
        this.applySwipeTransform(0, {});
        delete this._startTouch;
        delete this._lastTouch;
    };

    return yamz;
};
