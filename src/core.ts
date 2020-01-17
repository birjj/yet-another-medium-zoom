import { ImageOptions, GlobalOptions, Classes, STATES, YamzElement } from "./types";
import {
    defaultLightboxGenerator,
    isValidImage,
    getSrcFromImage,
    getHighResFromImage,
    generateLightboxImg,
    getScrollPosition,
} from "./dom";
import FLIPElement from "./flip";
import "./style.css";

export const DEFAULT_OPTS: GlobalOptions = {
    scrollAllowance: 128,
    duration: 300,
    container: undefined,
    lightboxGenerator: undefined,
};

export class MediumLightboxCore {
    options: GlobalOptions = {
        ...DEFAULT_OPTS,
    };
    state: STATES = STATES.Closed;
    active?: {
        $lightbox: HTMLElement;
        $img: HTMLElement;
        $copiedImg: HTMLImageElement;
        $highRes?: HTMLImageElement;
        scrollPos: number;
        origSrc?: string;
        options: ImageOptions;
    } = undefined;
    _flip?: FLIPElement;

    _raf: boolean = false;

    constructor() {
        this._onScroll = this._onScroll.bind(this);
        this._onKeyDown = this._onKeyDown.bind(this);
    }

    /** Set options used by every lightbox */
    setOptions(newOpts: Partial<GlobalOptions>) {
        this.options = {
            ...this.options,
            ...newOpts,
        };
    }
    /** Get the currently set global options */
    getOptions() {
        return this.options;
    }

    /** Open a specific image in the lightbox */
    async open($img: YamzElement, opts?: ImageOptions): Promise<HTMLElement> {
        if (!isValidImage($img)) {
            throw new TypeError(`${$img} cannot be used as an image`);
        }
        if (this.active) {
            await this.close();
        }

        const options = {
            ...this.options,
            ...($img.yamzOpts || {}),
            ...(opts || {}),
        };

        // generate our lightbox
        this.state = STATES.Opening;
        this.active = {
            ...this.generateLightbox($img, options),
            options,
            scrollPos: getScrollPosition(),
        };

        // then insert and animate it
        (options.container || document.body).appendChild(this.active.$lightbox);
        this.active.$lightbox.style.top = `${this.active.scrollPos}px`;
        const $animElm = this.active.$copiedImg.parentElement || this.active.$copiedImg;
        let $positionElm = $img.nodeName === "PICTURE" ? $img.querySelector("img") : $img;
        if (!$positionElm) {
            $positionElm = $img;
        }
        if (options.duration > 0) {
            this._flip = new FLIPElement($img);
            await this._flip
                .first($positionElm)
                .last(this.active.$copiedImg)
                .invert($animElm)
                .play(options.duration);
        }
        this.state = STATES.Open;

        this.attachListeners();

        return this.active.$lightbox;
    }

    /** Close the currently active image. If img is given, only closes if that's the currently active img */
    async close($img?: YamzElement): Promise<void> {
        if (!this.active) {
            return;
        }
        if ($img && this.active.$img !== $img) {
            return;
        }
        if (!$img) {
            $img = this.active.$img;
        }

        this.detachListeners();

        this.state = STATES.Closing;
        const active = this.active; // we store this for later in case .active is updated while we're animating the close
        const options = active.options;
        this.active.$lightbox.classList.add(Classes.WRAPPER_CLOSING);
        const $animElm = this.active.$copiedImg.parentElement || this.active.$copiedImg;
        let $positionElm =
            this.active.$img.nodeName === "PICTURE" ? this.active.$img.querySelector("img") : $img;
        if (!$positionElm) {
            $positionElm = this.active.$img;
        }
        if (options.duration) {
            const flip = new FLIPElement($img);
            flip.first(this.active.$copiedImg).last($positionElm);

            await flip.invert($animElm).play(options.duration);
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

    /**
     * Replaces the currently open lightbox with that of another image, without animating a close/open
     */
    replace($img: YamzElement, opts?: ImageOptions) {
        if (!isValidImage($img)) {
            throw new TypeError(`${$img} cannot be used as an image`);
        }
        if (!this.active) {
            return;
        }

        // unhide the original image
        this.active.$img.classList.remove(Classes.ORIGINAL_OPEN);

        // then generate the new lightbox and set it as active
        const $oldLightbox = this.active.$lightbox;
        const nextOpts = {
            ...this.options,
            ...($img.yamzOpts || {}),
            ...(opts || {}),
        };
        const nextActive = this.generateLightbox($img, nextOpts);
        this.active = {
            ...this.active,
            ...nextActive,
            $lightbox: $oldLightbox,
            options: nextOpts,
        };

        // then update the DOM
        this.replaceLightboxDOM(nextActive.$lightbox, $oldLightbox);
    }

    /**
     * Replaces the currently active lightbox DOM with the given one
     * Mostly its own method so plugins can overwrite it
     */
    replaceLightboxDOM($newLightbox: HTMLElement, $oldLightbox?: HTMLElement) {
        if (!$oldLightbox) {
            $oldLightbox = this.active && this.active.$lightbox;
        }
        if (!$oldLightbox) {
            return;
        }

        /**
         * We replace the content of the lightbox instead of just replacing the element itself because the open
         * animations (e.g. fade-in of background) are CSS animations, that would replay if a new lightbox was inserted
         * TODO: consider whether this approach is better than having a CSS class that disables open animation
         */

        // replace the content of the current lightbox with that of the target lightbox
        while ($oldLightbox.firstChild) {
            $oldLightbox.removeChild($oldLightbox.firstChild);
        }
        const $children = Array.from($newLightbox.children);
        for (let i = 0; i < $children.length; ++i) {
            $oldLightbox.appendChild($children[i]);
        }

        // update the lightbox's attributes to match the new one
        $oldLightbox.setAttribute("class", $newLightbox.className);
    }

    /**
     * Function for generating lightbox for a given image.
     * This also handles loading the highres and stuff.
     * If you're only looking for generating the DOM (e.g. if you're creating a custom lightbox generator), use .defaultLightboxGenerator
     */
    generateLightbox(
        $img: HTMLPictureElement | HTMLImageElement,
        opts: GlobalOptions & ImageOptions
    ): {
        $img: HTMLPictureElement | HTMLImageElement;
        $copiedImg: HTMLImageElement;
        $lightbox: HTMLElement;
        origSrc: string;
        $highRes?: HTMLImageElement;
    } {
        const generator = opts.lightboxGenerator || this.defaultLightboxGenerator;
        const origSrc = getSrcFromImage($img);
        const hasSrcSet = $img instanceof HTMLPictureElement || $img.srcset;

        // if we weren't explicitly given a highres, try to extract one from the image
        if (!opts.highres && hasSrcSet) {
            const highRes = getHighResFromImage($img);
            opts.highres = highRes;
        }

        // generate the DOM
        const $copiedImg = generateLightboxImg($img);
        $copiedImg.classList.add(Classes.IMG);
        $copiedImg.classList.remove(Classes.ORIGINAL);
        $img.classList.add(Classes.ORIGINAL_OPEN);
        const $lightbox = generator.call(this, $copiedImg, opts, $img);

        // add event listeners
        $lightbox.addEventListener("click", () => this.close());

        // and start loading high-res if we need to
        // start loading the highres version if we have one
        let $highRes: HTMLImageElement | undefined;
        if (opts.highres) {
            $highRes = new Image();
            $highRes.decoding = "async";
            $highRes.addEventListener("load", () => {
                if (this.active && this.active.$img === $img) {
                    this._highResLoaded($highRes as HTMLImageElement);
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
            $highRes.src = opts.highres;
            $highRes.classList.add(Classes.HIGHRES);
        }

        return {
            $img,
            $copiedImg,
            $lightbox,
            origSrc,
            $highRes,
        };
    }

    /** Called when a high-res version of an image has loaded */
    _highResLoaded($highRes: HTMLImageElement) {
        if (!this.active) {
            return;
        }
        const $copiedImg = this.active.$copiedImg;
        const $animElm = $copiedImg.parentElement || $copiedImg;

        // function that inserts the highres, resizing the img wrapper to the size of the highres
        const updater = () => {
            if (!this.active) {
                return;
            }
            if ($copiedImg.parentElement) {
                this.active.$highRes = $highRes;
                this.active.$lightbox.classList.add(Classes.HIGHRES_LOADED);
                $copiedImg.parentElement.insertBefore(
                    $highRes,
                    $copiedImg.parentElement.firstChild
                );
            }
        };

        if (this.state === STATES.Opening && this._flip) {
            this._flip.update($animElm, updater, this.active.options.duration);
        } else if (this.state === STATES.Open && this.active) {
            this._flip = new FLIPElement(this.active.$img);
            this._flip.first(this.active.$copiedImg);
            updater();
            this._flip
                .last(this.active.$copiedImg)
                .invert($animElm)
                .play(this.active.options.duration);
        } else {
            updater();
        }
    }

    /** Parses options from a DOM element */
    optsFromElm($elm: HTMLElement): ImageOptions {
        const outp: ImageOptions = {};

        if ($elm.dataset.class) {
            outp.class = $elm.dataset.class;
        }
        if ($elm.dataset.highres) {
            outp.highres = $elm.dataset.highres;
        }
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
                const imgOpts = {
                    ...this.optsFromElm($img),
                    ...(opts || {}),
                };
                this.open($img, imgOpts);
            });
            $img.classList.add(Classes.ORIGINAL);

            // we store the custom opts given to us so we can later recreate the lightbox just from the element
            if (opts) {
                ($img as YamzElement).yamzOpts = opts;
            }
        });
    }

    /** Attaches listeners we need globally */
    attachListeners() {
        window.addEventListener("scroll", this._onScroll);
        document.addEventListener("keydown", this._onKeyDown);
    }

    /** Detaches global listeners */
    detachListeners() {
        window.removeEventListener("scroll", this._onScroll);
        document.removeEventListener("keydown", this._onKeyDown);
    }

    /** Helper function used as scroll listener. Debounces calls to .onScroll */
    _onScroll(): void {
        if (this._raf) {
            return;
        }
        this._raf = true;
        setTimeout(() => {
            this._raf = false;
            this.onScroll();
        }, 60);
    }
    onScroll(): void {
        if (!this.active) {
            return;
        }
        if (
            this.active.options.scrollAllowance === undefined ||
            this.active.options.scrollAllowance < 0
        ) {
            return;
        }
        const scrollAllowance = this.active.options.scrollAllowance;
        const scrollPos = getScrollPosition();
        const delta = Math.abs(this.active.scrollPos - scrollPos);

        if (delta > scrollAllowance) {
            this.close();
        }
    }

    /** Helper function used to ensure that .onKeyDown is called with proper `this` value, even if overwritten by plugins */
    _onKeyDown(e: KeyboardEvent) {
        this.onKeyDown(e);
    }
    onKeyDown(e: KeyboardEvent) {
        if (!this.active) {
            return;
        }
        if (e.key === "Escape") {
            this.close();
        }
    }

    // re-export some stuff so it's easily available to plugins
    defaultLightboxGenerator = defaultLightboxGenerator;
}

export default new MediumLightboxCore();
