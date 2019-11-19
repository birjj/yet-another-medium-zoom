import { AlbumEntry, ImageOptions, GlobalOptions } from "./types";
import { defaultLightboxGenerator, isValidImage, cloneImage } from "./dom";

export const DEFAULT_OPTS: GlobalOptions = {
    scrollAllowance: 40,
    zoomOptimistically: true,
    wrapAlbums: false,
    container: undefined,
    lightboxGenerator: defaultLightboxGenerator,
};

export class MediumLightboxCore {
    options: GlobalOptions = {
        ...DEFAULT_OPTS,
    };
    active?: { $lightbox: HTMLElement, $img: HTMLElement } = undefined;

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

        const $copiedImg = cloneImage($img);
        const $lightbox = this.options.lightboxGenerator($copiedImg, opts || {});
        this.active = { $lightbox, $img };

        // TODO: animate
        document.body.appendChild($lightbox);
        return $lightbox;
    }

    /** Close the currently active image. If img is given, only closes if that's the currently active img */
    async close($img?: HTMLElement): Promise<void> {
        if (!this.active) { return; }
        if ($img && this.active.$img !== $img) {
            return;
        }

        // TODO: await animation
        const $parent = this.active.$lightbox.parentNode;
        if ($parent) {
            $parent.removeChild(this.active.$lightbox);
        }

        this.active = undefined;
    }
}

export default new MediumLightboxCore();
