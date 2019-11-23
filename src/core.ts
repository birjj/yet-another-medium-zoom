import { AlbumEntry, ImageOptions, GlobalOptions, Classes } from "./types";
import { defaultLightboxGenerator, isValidImage, getSrcFromImage, cloneImage } from "./dom";
import FLIPElement from "./flip";
import "./style.css";

export const DEFAULT_OPTS: GlobalOptions = {
    scrollAllowance: 40,
    zoomOptimistically: true,
    wrapAlbums: false,
    duration: 400,
    container: undefined,
    lightboxGenerator: defaultLightboxGenerator,
};

export class MediumLightboxCore {
    options: GlobalOptions = {
        ...DEFAULT_OPTS,
    };
    active?: { $lightbox: HTMLElement, $img: HTMLElement, $copiedImg: HTMLElement, origSrc?: string, options: ImageOptions } = undefined;

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

        let $copiedImg: HTMLPictureElement|HTMLImageElement;
        let origSrc: string|undefined;
        // lots of the type checks below here aren't really needed, but are safeguards to make TypeScript happy
        if (options.highRes) {
            origSrc = getSrcFromImage($img);
            $copiedImg = cloneImage($img, origSrc);
            const loader = new Image();
            loader.addEventListener("load", () => {
                if ($copiedImg instanceof HTMLImageElement && options.highRes) {
                    $copiedImg.src = options.highRes;
                }
            });
            loader.src = options.highRes;
        } else {
            $copiedImg = cloneImage($img);
        }
        $copiedImg.classList.add(Classes.IMG);
        $copiedImg.classList.remove(Classes.ORIGINAL);
        $img.classList.add(Classes.ORIGINAL_OPEN);

        const $lightbox = this.options.lightboxGenerator($copiedImg, options);
        $lightbox.addEventListener("click", () => this.close());
        this.active = { $lightbox, $img, $copiedImg, origSrc, options };

        document.body.appendChild($lightbox);
        if (options.duration > 0) {
            const $animElm = this.active.$copiedImg instanceof HTMLPictureElement
                ? this.active.$copiedImg.querySelector("img") || this.active.$copiedImg
                : this.active.$copiedImg;
            const flip = new FLIPElement($img);
            await flip.first($img)
                .last($animElm)
                .invert($animElm)
                .play(options.duration);
        }

        return $lightbox;
    }

    /** Close the currently active image. If img is given, only closes if that's the currently active img */
    async close($img?: HTMLElement): Promise<void> {
        if (!this.active) { return; }
        if ($img && this.active.$img !== $img) { return; }
        if (!$img) { $img = this.active.$img; }

        const active = this.active; // we store this for later in case .active is updated while we're animating the close
        const options = active.options;
        this.active.$lightbox.classList.add(Classes.WRAPPER_CLOSING);
        if (options.duration) {
            if (this.active.origSrc && this.active.$copiedImg instanceof HTMLImageElement) {
                this.active.$copiedImg.src = this.active.origSrc;
            }
            const $animElm = this.active.$copiedImg instanceof HTMLPictureElement
                ? this.active.$copiedImg.querySelector("img") || this.active.$copiedImg
                : this.active.$copiedImg;
            const flip = new FLIPElement($img);
            await flip.first($animElm)
                .last(this.active.$img)
                .invert($animElm)
                .play(options.duration);
        }
        active.$img.classList.remove(Classes.ORIGINAL_OPEN);
        const $parent = active.$lightbox.parentNode;
        if ($parent) {
            $parent.removeChild(active.$lightbox);
        }

        if (this.active === active) {
            this.active = undefined;
        }
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
            const imgOpts = Object.assign({}, opts || {});
            if (!imgOpts.highRes && $img.dataset.highres) {
                imgOpts.highRes = $img.dataset.highres;
            }
            $img.addEventListener("click", () => this.open($img, imgOpts));
            $img.classList.add(Classes.ORIGINAL);
        });
    }
}

export default new MediumLightboxCore();
