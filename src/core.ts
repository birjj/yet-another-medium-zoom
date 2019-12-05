import { AlbumEntry, ImageOptions, GlobalOptions, Classes, STATES } from "./types";
import {
    defaultLightboxGenerator,
    isValidImage,
    getSrcFromImage,
    getHighResFromImage,
    generateLightboxImg,
    getScrollPosition
} from "./dom";
import FLIPElement from "./flip";
import "./style.css";

export const DEFAULT_OPTS: GlobalOptions = {
    scrollAllowance: 128,
    wrapAlbums: false,
    duration: 300,
    container: undefined,
    lightboxGenerator: defaultLightboxGenerator,
};

export class MediumLightboxCore {
    options: GlobalOptions = {
        ...DEFAULT_OPTS,
    };
    state: STATES = STATES.Closed;
    active?: { $lightbox: HTMLElement, $img: HTMLElement, $copiedImg: HTMLImageElement, $highRes?: HTMLImageElement, scrollPos: number, origSrc?: string, options: ImageOptions } = undefined;
    _flip?: FLIPElement;
    _openTime?: number;

    _raf: boolean = false;

    constructor() {
        this._onScroll = this._onScroll.bind(this);
    }

    /** Set options used by every lightbox */
    setOptions(newOpts: Partial<GlobalOptions>) {
        this.options = {
            ...this.options,
            ...newOpts,
        };
    }
    /** Get the currently set global options */
    getOptions() { return this.options; }

    /** Open a specific image in the lightbox */
    async open($img: HTMLElement, opts?: ImageOptions): Promise<HTMLElement> {
        if (!isValidImage($img)) { throw new TypeError(`${$img} cannot be used as an image`); }
        if (this.active) { await this.close(); }

        const options = Object.assign({}, this.options, opts || {});
        const hasSrcSet = ($img instanceof HTMLPictureElement) || $img.srcset;

        // if we weren't explicitly given a highres, try to extract one from the image
        if (!options.highres && hasSrcSet) {
            const highRes = getHighResFromImage($img);
            options.highres = highRes;
        }

        // generate our lightbox
        this.state = STATES.Opening;
        const origSrc = getSrcFromImage($img);
        const $copiedImg = generateLightboxImg($img);
        $copiedImg.classList.add(Classes.IMG);
        $copiedImg.classList.remove(Classes.ORIGINAL);
        $img.classList.add(Classes.ORIGINAL_OPEN);
        const $lightbox = this.options.lightboxGenerator($copiedImg, options);
        $lightbox.addEventListener("click", () => this.close());
        this.active = {
            $lightbox,
            $img,
            $copiedImg,
            origSrc,
            options,
            scrollPos: getScrollPosition()
        };
        this._openTime = Date.now();

        // start loading the highres version if we have one
        if (options.highres) {
            const active = this.active;
            const $highRes = new Image();
            $highRes.decoding = "async";
            $highRes.addEventListener("load", () => {
                if (this.active === active) {
                    this._highResLoaded($highRes);
                }
            });
            $highRes.addEventListener("error", e => {
                console.error(`High-res image failed to load`, e);
                $lightbox.classList.remove(Classes.HAS_HIGHRES);
                const $loader = $lightbox.querySelector(`.${Classes.LOADER}`);
                if ($loader && $loader.parentNode) {
                    $loader.parentNode.removeChild($loader);
                }
            });
            $highRes.src = options.highres;
            $highRes.classList.add(Classes.HIGHRES);
        }

        // then insert and animate it
        (options.container || document.body).appendChild($lightbox);
        $lightbox.style.top = `${this.active.scrollPos}px`;
        const $animElm = $copiedImg.parentElement || $copiedImg;
        if (options.duration > 0) {
            this._flip = new FLIPElement($img);
            await this._flip.first($img)
                .last(this.active.$copiedImg)
                .invert($animElm)
                .play(options.duration);
        }
        this.state = STATES.Open;

        window.addEventListener("scroll", this._onScroll);

        return $lightbox;
    }

    /** Called when a high-res version of an image has loaded */
    _highResLoaded($highRes: HTMLImageElement) {
        if (!this.active) { return; }
        const $copiedImg = this.active.$copiedImg;
        const $animElm = $copiedImg.parentElement || $copiedImg;

        // function that inserts the highres, resizing the img wrapper to the size of the highres
        const updater = () => {
            if (!this.active) { return; }
            if ($copiedImg.parentElement) {
                this.active.$highRes = $highRes;
                this.active.$lightbox.classList.add(Classes.HIGHRES_LOADED);
                $copiedImg.parentElement.insertBefore($highRes, $copiedImg.parentElement.firstChild);
            }
        };

        if (this.state === STATES.Opening && this._flip) {
            this._flip.update($animElm, updater, this.active.options.duration);
        } else if (this.state === STATES.Open && this.active) {
            this._flip = new FLIPElement(this.active.$img);
            this._flip.first(this.active.$copiedImg);
            updater();
            this._flip.last(this.active.$copiedImg)
                .invert($animElm)
                .play(this.active.options.duration);
        } else {
            updater();
        }
    }

    /** Close the currently active image. If img is given, only closes if that's the currently active img */
    async close($img?: HTMLElement): Promise<void> {
        if (!this.active) { return; }
        if ($img && this.active.$img !== $img) { return; }
        if (!$img) { $img = this.active.$img; }

        window.removeEventListener("scroll", this._onScroll);

        this.state = STATES.Closing;
        const active = this.active; // we store this for later in case .active is updated while we're animating the close
        const options = active.options;
        this.active.$lightbox.classList.add(Classes.WRAPPER_CLOSING);
        const $animElm = this.active.$copiedImg.parentElement || this.active.$copiedImg;
        if (options.duration) {
            const flip = new FLIPElement($img);
            flip.first(this.active.$copiedImg)
                .last(this.active.$img);

            await flip.invert($animElm)
                .play(options.duration);
        }
        active.$img.classList.remove(Classes.ORIGINAL_OPEN);
        const $parent = active.$lightbox.parentNode;
        if ($parent) {
            $parent.removeChild(active.$lightbox);
        }
        this.state = STATES.Closed;

        if (this.active === active) {
            this.active = undefined;
        }
    }

    /** Parses options from a DOM element */
    optsFromElm($elm: HTMLElement) {
        const outp: ImageOptions = {};

        if ($elm.dataset.highres) { outp.highres = $elm.dataset.highres; }
        if ($elm.dataset.caption) { outp.caption = $elm.dataset.caption; }
        if ($elm.dataset.duration && !Number.isNaN(+$elm.dataset.duration)) {
            outp.duration = +$elm.dataset.duration;
        }
        if ($elm.dataset.scrollAllowance && !Number.isNaN(+$elm.dataset.scrollAllowance)) {
            outp.scrollAllowance = +$elm.dataset.scrollAllowance;
        }

        return outp;
    }

    /** Binds an image (or multiple), such that clicking it will open it
     * @param $imgs The image(s) to bind. If this is a string, it's used as a selector. */
    bind($imgs: HTMLElement | HTMLElement[] | string, opts?: ImageOptions): void {
        if (typeof $imgs === "string") {
            $imgs = Array.from(document.querySelectorAll($imgs));
        }
        if (!($imgs instanceof Array)) {
            $imgs = [$imgs];
        }

        $imgs.forEach($img => {
            $img.addEventListener("click", () => {
                // we extract options from the DOM here so that developers can change the data attributes and have it reflected
                const imgOpts = Object.assign({}, opts || {}, this.optsFromElm($img));
                this.open($img, imgOpts);
            });
            $img.classList.add(Classes.ORIGINAL);
        });
    }

    /** Helper function used as scroll listener. Debounces calls to .onScroll */
    _onScroll(): void {
        if (this._raf) { return; }
        this._raf = true;
        setTimeout(() => {
            this._raf = false;
            this.onScroll();
        }, 60);
    }
    onScroll(): void {
        if (!this.active) { return; }
        if (this.active.options.scrollAllowance === undefined || this.active.options.scrollAllowance < 0) { return; }
        const scrollAllowance = this.active.options.scrollAllowance;
        const scrollPos = getScrollPosition();
        const delta = Math.abs(this.active.scrollPos - scrollPos);

        if (delta > scrollAllowance) {
            this.close();
        }
    }
}

export default new MediumLightboxCore();
