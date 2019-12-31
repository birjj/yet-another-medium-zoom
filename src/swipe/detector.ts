type coordinates = {
    x: number,
    y: number,
};
type listeners = {
    "start"?: (position: coordinates, metadata?: any) => void,
    "update"?: (offset: coordinates, metadata?: any) => void,
    "end"?: (direction: "left"|"right", metadata?: any) => void,
    "cancel"?: (metadata?: any) => void,
};

export default class SwipeDetector {
    listeners: listeners;
    state?: {
        startTouch: coordinates & { time: number },
        lastTouch: coordinates & { time: number },
        identifier?: number,
        velocity: number,
        isSwipe: boolean,
        metadata?: any
    };
    threshold: number;

    constructor(listeners: listeners, threshold: number = 0) {
        this.listeners = listeners;
        this.threshold = threshold;

        // make sure we can be attached as event listeners easily
        this.start = this.start.bind(this);
        this.move = this.move.bind(this);
        this.end = this.end.bind(this);
        this.cancel = this.cancel.bind(this);
    }
    setThreshold(threshold: number) { this.threshold = threshold; }

    start(e: MouseEvent|TouchEvent, metadata?: any) {
        if (!(e instanceof MouseEvent)) {
            // we ignore any start touches if another finger is currently down (and cancel any active ones if a new finger is touched)
            if (e.touches.length > 1) {
                this.cancel();
                return false;
            }
        }
        const touch = e instanceof MouseEvent ? e : e.touches[0];

        const initialTouch = {
            x: touch.clientX,
            y: touch.clientY,
            time: Date.now(),
        };
        this.state = {
            startTouch: { ...initialTouch },
            lastTouch: { ...initialTouch },
            isSwipe: false,
            velocity: 0,
            identifier: touch instanceof MouseEvent ? undefined : touch.identifier,
            metadata: metadata,
        };

        this.emit("start", initialTouch, metadata);
    }

    move(e: MouseEvent|TouchEvent) {
        if (!this.state) { return; } // ignore if we aren't currently dragging
        let touch: MouseEvent|Touch|undefined = e instanceof MouseEvent ? e : undefined;
        if (!(e instanceof MouseEvent)) {
            for (let i = 0; i < e.changedTouches.length; ++i) {
                const t = e.changedTouches[i];
                if (t.identifier === this.state.identifier) {
                    touch = t;
                    break;
                }
            }
        }
        if (!touch) { return; } // ignore if none of the touches are the one we're tracking

        const timeDelta = Date.now() - this.state.lastTouch.time;
        if (timeDelta < 16) { return; } // debounce
        // we compare the direction relative to the starting point; if it's more down than up, we cancel the drag ('cause it's probably a scroll)
        const xDelta = touch.clientX - this.state.startTouch.x;
        const yDelta = touch.clientY - this.state.startTouch.y;
        const absXDelta = Math.abs(xDelta);
        const absYDelta = Math.abs(yDelta);

        // ignore ones where the mouse hasn't moved
        if (absXDelta === 0 && absYDelta === 0) { return; }

        // update our state
        this.state.lastTouch.x = touch.clientX;
        this.state.lastTouch.y = touch.clientY;
        this.state.lastTouch.time = Date.now();
        this.state.velocity = timeDelta
            ? (touch.clientX - this.state.lastTouch.x) / timeDelta
            : 0;

        const IGNORE_THRESHOLD = 32; // ignore test if we have moved barely anything. Possibly consider if this is better as an option?
        if (!this.state.isSwipe) {
            // don't start tracking as a swipe until after we've exceeding our threshold
            if (Math.max(absXDelta, absYDelta) < IGNORE_THRESHOLD) {
                return;
            } else {
                // if we've just now gone past our threshold, check if this looks more like a scroll than a swipe
                if (absYDelta > absXDelta) {
                    this.cancel();
                    return;
                }
                this.state.isSwipe = true;
            }
        }

        e.preventDefault(); // stop any scrolling if we are currently swiping
        this.emit("update", { x: xDelta, y: yDelta }, this.state.metadata);
    }

    end(e: MouseEvent|TouchEvent) {
        if (!this.state) { return false; } // ignore if we aren't currently dragging
        let touch: MouseEvent|Touch|undefined = e instanceof MouseEvent ? e : undefined;
        if (!(e instanceof MouseEvent)) {
            for (let i = 0; i < e.changedTouches.length; ++i) {
                const t = e.changedTouches[i];
                if (t.identifier === this.state.identifier) {
                    touch = t;
                    break;
                }
            }
        }
        if (!touch) { return false; } // ignore if none of the touches are the one we're tracking

        // then calculate the projected point we want to check
        const velocity = this.state.velocity;
        const totalDelta = touch.clientX - this.state.startTouch.x;
        const recentDelta = touch.clientX - this.state.lastTouch.x;
        let finalDelta = totalDelta;
        // we only project a point out if the flick is in the direction of the swipe, otherwise we just use the touch position
        if ((totalDelta >= 0 && recentDelta >= 0 || totalDelta <= 0 && recentDelta <= 0)) {
            finalDelta += velocity * 50; // project it 50ms out
        }

        // finally check if it's a swipe
        if (this.threshold && this.threshold > 0 && Math.abs(finalDelta) > this.threshold) {
            this.emit("end", finalDelta < 0 ? "left" : "right", this.state.metadata);
            this.after();
            return true;
        }
        this.cancel();
        return false;
    }

    cancel() {
        if (!this.state) { return; }
        this.emit("cancel", this.state.metadata);
        this.after();
    }

    after() {
        delete this.state;
    }

    emit(event: keyof listeners, ...args: any[]) {
        const listener = this.listeners[event] as ((...args: any[]) => void)|undefined;
        if (listener) {
            listener(...args);
        }
    }
}
