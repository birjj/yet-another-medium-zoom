import { ImageOptions, Classes } from "./types";

/**
 * Clones an image for use in the lightbox, optionally with a new source.
 * Always returns an <img>, regardless of the input element.
 */
export function cloneImage($img: HTMLPictureElement|HTMLImageElement, newSrc?: string): HTMLImageElement {
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
    } else {
        const src = newSrc
            ? newSrc
            : getSrcFromImage($img);

        const $newImg = document.createElement("img");
        $newImg.src = src;
        return $newImg;
    }
}

export function isValidImage($elm: HTMLElement): $elm is HTMLImageElement|HTMLPictureElement {
    const types = [HTMLPictureElement, HTMLImageElement];
    return types.some(type => $elm instanceof type);
}

export function getHighResFromPicture($picture: HTMLPictureElement): string {
    const cur = { width: $picture.offsetWidth, src: getSrcFromImage($picture) };
    const $sources = Array.from($picture.querySelectorAll("source"));
    $sources.forEach(
        $source => {
            // ignore images that don't match
            if ($source.media && !matchMedia($source.media).matches) {
                return;
            }
            // extract size and URL from srcset
            if (!$source.srcset) { return; }
            const srcset = $source.srcset;
            srcset.split(",").forEach(entry => {
                const widthMatch = /([^ ]+) (\d+)w$/.exec(entry);
                if (!widthMatch) { return; }
                if (+widthMatch[2] > cur.width) {
                    cur.src = widthMatch[1];
                    cur.width = +widthMatch[2];
                }
            });
        }
    );
    return cur.src;
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
