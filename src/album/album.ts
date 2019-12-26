import { MediumLightboxCore } from "../core";
import { Classes, YamzPlugin } from "../types";
import "./album.css";

export interface Albumed<Yamz extends MediumLightboxCore> {
    moveToAlbumEntry: (entry: AlbumEntry<Yamz>, direction: "next"|"prev") => void,
};

export interface AlbumOptions<Yamz extends MediumLightboxCore> {
    album?: AlbumEntry<Yamz>[],
    wrapAlbum?: boolean,
};

export interface AlbumEntry<Yamz extends MediumLightboxCore> {
    img: HTMLElement,
    opts?: ReturnType<Yamz["optsFromElm"]> & AlbumOptions<Yamz>,
};

/** Augments the YAMZ instance to support albums */
export default function withAlbum<YamzType extends MediumLightboxCore>(_yamz: YamzType) {
    const { defaultLightboxGenerator, optsFromElm, onKeyDown } = _yamz;
    const yamz = _yamz as YamzPlugin<YamzType, Albumed<YamzType>, AlbumOptions<YamzType>, AlbumOptions<YamzType>>;

    yamz.options = {
        wrapAlbum: false,
        ...yamz.options,
    };

    function augmentLightbox(yamz: Albumed<YamzType>, $lightbox: HTMLElement, opts: AlbumOptions<YamzType>, index: number) {
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

    // insert album stuff into the lightbox if we're given one
    yamz.defaultLightboxGenerator = function($copiedImg, opts, $original) {
        const $lightbox = defaultLightboxGenerator($copiedImg, opts, $original);

        if (opts.album) {
            const index = opts.album.findIndex(entry => entry.img === $original);
            augmentLightbox(this, $lightbox, opts, index);
        }

        return $lightbox;
    };

    // also allow specifying the album in HTML
    yamz.optsFromElm = function($elm: HTMLElement) {
        type outpType = ReturnType<YamzType["optsFromElm"]> & AlbumOptions<YamzType>;
        const outp: outpType = optsFromElm($elm) as outpType;
        if ($elm.dataset.album) {
            const $siblings = Array.from(document.querySelectorAll(`[data-album="${$elm.dataset.album}"]`)) as HTMLElement[];
            outp.album = $siblings.map($sibling => {
                return {
                    img: $sibling,
                    opts: optsFromElm($sibling)
                };
            }) as AlbumEntry<YamzType>[];
            // make sure each entry knows about which album it's in
            outp.album.forEach(entry => {
                entry.opts = {
                    ...(entry.opts || {}),
                    album: outp.album,
                } as outpType;
            });
        }
        return outp;
    };

    // add new method for moving to an album entry
    yamz.moveToAlbumEntry = function(entry: AlbumEntry<YamzType>, direction: "next"|"prev") {
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

    // finally extend the keyboard interactivity
    yamz.onKeyDown = function(e: KeyboardEvent) {
        onKeyDown.call(this, e);
        if (!this.active) { return; }
        const opts = this.active.options as AlbumOptions<YamzType>;
        if (!opts.album) { return; }

        // move back/forward in album when pressing arrow keys
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
            const $curImg = this.active.$img;
            const index = opts.album.findIndex(entry => entry.img === $curImg);
            const prevIndex = opts.wrapAlbum
                ? (opts.album.length + index - 1) % opts.album.length
                : index - 1;
            const nextIndex = opts.wrapAlbum
                ? (opts.album.length + index + 1) % opts.album.length
                : index + 1;
            const targetIndex = e.key === "ArrowLeft"
                ? prevIndex
                : nextIndex;

            if (targetIndex >= 0 && targetIndex < opts.album.length) {
                (this as Albumed<YamzType>).moveToAlbumEntry(
                    opts.album[targetIndex],
                    e.key === "ArrowLeft" ? "prev" : "next"
                );
            }
        }
    };

    return yamz;
};
