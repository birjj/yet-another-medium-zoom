import { AlbumEntry, ImageOptions, GlobalOptions, Classes } from "./types";
import { defaultLightboxGenerator, isValidImage, cloneImage } from "./dom";
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
    active?: { $lightbox: HTMLElement, $img: HTMLElement, $copiedImg: HTMLElement } = undefined;

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

        const options = Object.assign({}, DEFAULT_OPTS, opts || {});

        const $copiedImg = cloneImage($img);
        $copiedImg.classList.add(Classes.IMG);
        $copiedImg.classList.remove(Classes.ORIGINAL);
        $img.classList.add(Classes.ORIGINAL_OPEN);
        const $lightbox = this.options.lightboxGenerator($copiedImg, options);
        $lightbox.addEventListener("click", () => this.close());
        this.active = { $lightbox, $img, $copiedImg };

        document.body.appendChild($lightbox);
        if (options.duration > 0) {
            const flip = new FLIPElement($img);
            await flip.first($img)
                .last($copiedImg)
                .invert($copiedImg)
                .play();
        }

        return $lightbox;
    }

    /** Close the currently active image. If img is given, only closes if that's the currently active img */
    async close($img?: HTMLElement): Promise<void> {
        if (!this.active) { return; }
        if ($img && this.active.$img !== $img) { return; }
        if (!$img) { $img = this.active.$img; }

        this.active.$lightbox.classList.add(Classes.WRAPPER_CLOSING);
        if (this.options.duration) {
            const flip = new FLIPElement($img);
            await flip.first(this.active.$copiedImg)
                .last(this.active.$img)
                .invert(this.active.$copiedImg)
                .play();
        }
        this.active.$img.classList.remove(Classes.ORIGINAL_OPEN);
        const $parent = this.active.$lightbox.parentNode;
        if ($parent) {
            $parent.removeChild(this.active.$lightbox);
        }

        this.active = undefined;
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
            $img.addEventListener("click", () => this.open($img, opts));
            $img.classList.add(Classes.ORIGINAL);
        });
    }
}

export default new MediumLightboxCore();
