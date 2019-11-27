/** Used to make sure a single element never has two animations at a time */
const elmMap: Map<HTMLElement, FLIPElement> = new Map();

/** https://aerotwist.com/blog/flip-your-animations/ */
export default class FLIPElement {
    $elm: HTMLElement;
    playing: boolean = false;
    _first?: Snapshot;
    _last?: Snapshot;
    _elmPos?: Snapshot;
    _target$Elm?: HTMLElement;
    _playResolver?: (val?: unknown) => void;

    constructor($elm: HTMLElement) {
        this.$elm = $elm;

        if (elmMap.has($elm)) {
            const self = elmMap.get($elm);
            if (self) {
                return self;
            }
        }

        elmMap.set($elm, this);
        this._onTransitionEnd = this._onTransitionEnd.bind(this);
    }

    first($elm: HTMLElement = this.$elm) {
        if (this.playing) {
            this.stop();
        }

        this._first = getSnapshot($elm);
        return this;
    }

    last($elm: HTMLElement = this.$elm) {
        if (this.playing) {
            this.stop();
        }

        this._last = getSnapshot($elm);
        return this;
    }

    invert($elm: HTMLElement = this.$elm) {
        if (!this._first || !this._last) {
            throw new Error(".first() and .last() must be called before .invert()");
        }

        this._elmPos = getSnapshot($elm);
        $elm.style.transitionDuration = "0s";
        $elm.style.transformOrigin = "50% 50%";
        $elm.style.transform = getTransform(this._elmPos, this._first);

        this._target$Elm = $elm;
        return this;
    }

    play(duration = 300) {
        if (!this._target$Elm || !this._elmPos || !this._first || !this._last) {
            throw new Error(".invert() must be called before .play()");
        }
        if (this.playing) { this.stop(); }
        this.playing = true;

        const $elm = this._target$Elm;
        +$elm.offsetHeight; // force reflow
        $elm.style.transitionDuration = `${duration}ms`;
        $elm.style.transform = getTransform(this._elmPos, this._last);

        $elm.addEventListener("transitioncancel", this._onTransitionEnd);
        $elm.addEventListener("transitionend", this._onTransitionEnd);

        return new Promise((res, rej) => {
            this._playResolver = res;
        });
    }

    stop() {
        if (this._target$Elm) {
            this._target$Elm.removeEventListener("transitioncancel", this._onTransitionEnd);
            this._target$Elm.removeEventListener("transitionend", this._onTransitionEnd);
        }
        if (this._playResolver) {
            this._playResolver();
            this._playResolver = undefined;
        }
        this.playing = false;
        this._target$Elm = undefined;
    }

    /** Updates an animation while it's playing */
    update($target: HTMLElement, updater?: () => void, duration?: number) {
        const $elm = this._target$Elm;
        if (!this.playing || !$elm || !this._first) { return; }

        const currentPos = getTransformedSnapshot($elm);
        if (updater) {
            updater();
        }
        this._elmPos = getSnapshot($elm);
        this._last = getSnapshot($target);
        const prevDuration = duration
            ? `${duration}ms`
            : $elm.style.transitionDuration;
        $elm.style.transitionDuration = `0ms`;
        $elm.style.transform = getTransform(this._elmPos, currentPos);
        +$elm.offsetHeight; // force reflow
        $elm.style.transitionDuration = prevDuration;
        $elm.style.transform = getTransform(this._elmPos, this._last);
    }

    _onTransitionEnd(e: TransitionEvent) {
        console.log("Transition ended");
        if (e.target === this._target$Elm && e.propertyName === "transform") {
            this.stop();
        }
    }
}

interface Snapshot {
    left: number,
    top: number,
    width: number,
    height: number,
};

window.getSnapshot = getSnapshot;
function getSnapshot($elm: HTMLElement): Snapshot {
    const outp = {
        width: $elm.offsetWidth,
        height: $elm.offsetHeight,
        left: $elm.offsetLeft,
        top: $elm.offsetTop
    };

    // make sure left/top is measured from center
    // this allows us to combine scaling and translating
    outp.left += outp.width / 2;
    outp.top += outp.height / 2;

    // offsetLeft/Top relates to offsetParent. Walk up the tree to get it relative to the window
    while ($elm.offsetParent instanceof HTMLElement && $elm.offsetParent && $elm.offsetParent !== document.body && $elm.offsetParent !== document.documentElement) {
        $elm = $elm.offsetParent;
        outp.left += $elm.offsetLeft;
        outp.top += $elm.offsetTop;
    }

    // if the element is fixed, offsetLeft/Top will be 0 when we want it to be the scroll position
    if ($elm.offsetTop === 0 && $elm.offsetLeft === 0 && window.getComputedStyle($elm).position === "fixed") {
        const $doc = document.documentElement;
        outp.left += (window.pageXOffset || $doc.scrollLeft) - ($doc.clientLeft || 0);
        outp.top += (window.pageYOffset || $doc.scrollTop) - ($doc.clientTop || 0);
    }

    return outp;
}

window.getTransformedSnapshot = getTransformedSnapshot;
/** Gets the snapshot of an element, but doesn't ignore transforms (unlike getSnapshot) */
function getTransformedSnapshot($elm: HTMLElement): Snapshot {
    const boundingRect = $elm.getBoundingClientRect();
    const $doc = document.documentElement;
    const outp = {
        left: Math.round(boundingRect.left) + (window.pageXOffset || $doc.scrollLeft) - ($doc.clientLeft || 0),
        top: Math.round(boundingRect.top) + (window.pageYOffset || $doc.scrollTop) - ($doc.clientTop || 0),
        width: Math.round(boundingRect.width),
        height: Math.round(boundingRect.height)
    };
    outp.left += outp.width / 2;
    outp.top += outp.height / 2;
    return outp;
}

function getTransform(from: Snapshot, to: Snapshot) {
    const delta = {
        left: to.left - from.left,
        top: to.top - from.top,
        width: to.width / from.width,
        height: to.height / from.height
    };

    const translation = `translate(${(delta.left).toFixed(5)}px, ${(delta.top).toFixed(5)}px)`;
    const scaling = `scale(${delta.width.toFixed(5)}, ${delta.height.toFixed(5)})`;
    return `${translation} ${scaling}`;
}
