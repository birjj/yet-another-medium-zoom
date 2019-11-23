import { ImageOptions, Classes } from "./types";

/**
 * Clones an image for use in the lightbox, optionally with a new source.
 * Note that some things might change (e.g. srcset might be removed, sizes might be updated)
 */
export function cloneImage($img: HTMLImageElement, newSrc?: string): HTMLImageElement;
export function cloneImage($img: HTMLPictureElement): HTMLPictureElement;
export function cloneImage($img: HTMLPictureElement, newSrc: string): HTMLImageElement;
export function cloneImage($img: any, newSrc?: string) {
    if ($img instanceof HTMLImageElement) {
        const $newImg = $img.cloneNode() as HTMLImageElement;
        if (newSrc) {
            $newImg.src = newSrc;
            if ($newImg.srcset) {
                $newImg.srcset = "";
            }
        }
        if ($newImg.sizes) {
            $newImg.sizes = "100vw";
        }
        return $newImg;
    } else if ($img instanceof HTMLPictureElement) {
        if (newSrc) {
            const $newImg = document.createElement("img");
            $newImg.src = newSrc;
            return $newImg;
        } else {
            const $newImg = $img.cloneNode(true) as HTMLPictureElement;
            const $sources = Array.from($newImg.querySelectorAll("source"));
            $sources.forEach($source => {
                if ($source.sizes) {
                    $source.sizes = "100vw";
                }
            });
            return $newImg;
        }
    }
}

export function isValidImage($elm: HTMLElement): $elm is HTMLImageElement|HTMLPictureElement {
    const types = [HTMLPictureElement, HTMLImageElement];
    return types.some(type => $elm instanceof type);
}

export function getSrcFromImage($elm: HTMLImageElement | HTMLPictureElement): string {
    if ($elm instanceof HTMLImageElement) {
        return $elm.currentSrc;
    }
    if ($elm instanceof HTMLPictureElement) {
        const $img = $elm.querySelector("img");
        if ($img) {
            return $img.currentSrc;
        }
    }
    return "";
}

export function defaultLightboxGenerator($img: HTMLElement, opts: ImageOptions) {
    const $wrapper = document.createElement("aside");
    $wrapper.classList.add(Classes.WRAPPER);

    const $imgWrapper = document.createElement("div");
    $imgWrapper.classList.add(Classes.IMG_WRAPPER);
    $imgWrapper.appendChild($img);
    $wrapper.appendChild($imgWrapper);

    // add caption if given
    if (opts.caption) {
        const $caption = document.createElement("div");
        $caption.classList.add(Classes.CAPTION);
        if (opts.caption instanceof HTMLElement) {
            $caption.appendChild(opts.caption);
        } else {
            $caption.textContent = opts.caption;
        }
        $wrapper.classList.add(Classes.WRAPPER + "--has-caption");
        $wrapper.appendChild($caption);
    }

    return $wrapper;
}
