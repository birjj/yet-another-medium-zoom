import { MediumLightboxCore } from "../core";
import { ImageOptions, Classes, GlobalOptions } from "../types";
import "./album.css";

type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export interface AlbumOptions extends ImageOptions {
    album?: AlbumEntry[],
    wrapAlbum?: boolean,
};

export interface AlbumEntry {
    img: HTMLElement,
    opts?: AlbumOptions,
};

export interface MediumLightboxAlbumed extends MediumLightboxCore {
    moveToAlbumEntry: (entry: AlbumEntry, direction: "next"|"prev") => void
};

/** Augments the YAMZ instance to support captions */
export default function withAlbum(yamz: PartialBy<MediumLightboxAlbumed, "moveToAlbumEntry">): MediumLightboxAlbumed {
    const { defaultLightboxGenerator, optsFromElm } = yamz;

    yamz.options = {
        wrapAlbum: false,
        ...yamz.options,
    } as GlobalOptions & AlbumOptions;

    function augmentLightbox(yamz: MediumLightboxAlbumed, $lightbox: HTMLElement, opts: AlbumOptions, index: number) {
        if (!opts.album) { return $lightbox; }
        const prevIndex = opts.wrapAlbum
            ? (opts.album.length + index - 1) % opts.album.length
            : index - 1;
        const nextIndex = opts.wrapAlbum
            ? (opts.album.length + index + 1) % opts.album.length
            : index + 1;

        if (prevIndex >= 0) {
            const $prev = document.createElement("button");
            $prev.classList.add(Classes.ALBUM_PREV);
            $prev.addEventListener("click", e => {
                if (!opts.album) { return; }
                e.stopPropagation();
                yamz.moveToAlbumEntry(opts.album[prevIndex], "prev");
            });
            $lightbox.appendChild($prev);
        }
        if (nextIndex < opts.album.length) {
            const $next = document.createElement("button");
            $next.classList.add(Classes.ALBUM_NEXT);
            $next.addEventListener("click", e => {
                if (!opts.album) { return; }
                e.stopPropagation();
                yamz.moveToAlbumEntry(opts.album[nextIndex], "next");
            });
            $lightbox.appendChild($next);
        }
    }

    // insert caption into the lightbox if we're given one
    yamz.defaultLightboxGenerator = function($copiedImg: HTMLElement, opts: AlbumOptions, $original: HTMLElement) {
        const $lightbox = defaultLightboxGenerator($copiedImg, opts, $original);

        if (opts.album) {
            const index = opts.album.findIndex(entry => entry.img === $original);
            augmentLightbox(this as MediumLightboxAlbumed, $lightbox, opts, index);
        }

        return $lightbox;
    };

    // also allow specifying the album in HTML
    yamz.optsFromElm = function($elm: HTMLElement) {
        const outp: AlbumOptions = optsFromElm($elm);
        if ($elm.dataset.album) {
            const $siblings = Array.from(document.querySelectorAll(`[data-album="${$elm.dataset.album}"]`)) as HTMLElement[];
            outp.album = $siblings.map($sibling => {
                return {
                    img: $sibling,
                    opts: optsFromElm($sibling)
                };
            });
            // make sure each entry knows about which album it's in
            outp.album.forEach(entry => {
                entry.opts = {
                    ...(entry.opts || {}),
                    album: outp.album,
                };
            });
        }
        return outp;
    };

    // add new method for moving to an album entry
    yamz.moveToAlbumEntry = function(entry: AlbumEntry, direction: "next"|"prev") {
        if (!this.active) { return; }
        const $target = this.active.$lightbox.querySelector(`.${Classes.IMG_WRAPPER}`) as HTMLElement;
        if (!$target) {
            throw new ReferenceError("Could not find image wrapper in lightbox");
        }
        const directions = {
            out: direction === "next" ? "left" : "right",
            in: direction === "next" ? "right" : "left"
        };
        let replaced = false;
        const _onAnimEnd = () => {
            if (replaced || !this.active) { return; }
            replaced = true;
            this.replace(entry.img, entry.opts);
            const $newTarget = this.active.$lightbox.querySelector(`.${Classes.IMG_WRAPPER}`) as HTMLElement;
            if (!$newTarget) { return; }
            $newTarget.classList.add(`${Classes.IMG_WRAPPER}--in-${directions.in}`);

        };

        setTimeout(_onAnimEnd, 1000); // fail safe if for whatever reason animation doesn't play
        $target.addEventListener("animationend", _onAnimEnd);
        $target.addEventListener("animationcancel", _onAnimEnd);
        $target.classList.add(`${Classes.IMG_WRAPPER}--out-${directions.out}`);
    };

    return yamz as MediumLightboxAlbumed;
};
