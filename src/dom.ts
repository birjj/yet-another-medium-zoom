import { ImageOptions, Classes } from "./types";

/**
 * Creates an image for use in the lightbox based on an input element.
 * Always returns an <img>, regardless of the input element.
 */
export function generateLightboxImg($img: HTMLPictureElement|HTMLImageElement, newSrc?: string): HTMLImageElement {
    const $newImg = document.createElement("img");
    const src = newSrc
        ? newSrc
        : getSrcFromImage($img);
    $newImg.src = src;

    return $newImg;
}

export function isValidImage($elm: HTMLElement): $elm is HTMLImageElement|HTMLPictureElement {
    const types = [HTMLPictureElement, HTMLImageElement];
    return types.some(type => $elm instanceof type);
}

export function getHighResFromImage($image: HTMLImageElement|HTMLPictureElement, targetWidth=document.body.clientWidth): string {
    let cur = { width: $image.offsetWidth, src: getSrcFromImage($image) };
    const $targets = $image instanceof HTMLImageElement
        ? [$image]
        : Array.from($image.querySelectorAll("source"));
    $targets.forEach(($target: HTMLImageElement|HTMLSourceElement) => {
        // ignore sources that don't match
        if ($target instanceof HTMLSourceElement && $target.media && !matchMedia($target.media).matches) {
            return;
        }
        // extract size and URL from srcset
        if (!$target.srcset) { return; }
        const srcset = $target.srcset;
        const parsed = getHighestFromSrcSet(srcset, targetWidth);
        if (parsed && parsed.width > cur.width) {
            cur = parsed;
        }
    });
    return cur.src;
}

export function getHighestFromSrcSet(srcset: string, targetWidth=document.body.clientWidth) {
    const parsed = srcset.split(",").map(entry => {
        const widthMatch = /([^ ]+) (\d+)w$/.exec(entry);
        if (!widthMatch) { return null; }
        return {
            src: widthMatch[1],
            width: +widthMatch[2],
        };
    });

    return parsed.reduce((prev, entry) => {
        if (!entry) { return prev; }
        // if we've already found a smaller image that is bigger than the screen, use that image instead
        if (prev && entry.width > prev.width && prev.width >= targetWidth) {
            return prev;
        }
        return entry;
    }, null);
};

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

export function getScrollPosition(horizontal: boolean = false): number {
    return horizontal
        ? window.scrollX || document.body.scrollLeft || document.documentElement.scrollLeft || 0
        : window.scrollY || document.body.scrollTop || document.documentElement.scrollTop || 0;
}

export function defaultLightboxGenerator($img: HTMLElement, opts: ImageOptions) {
    const $wrapper = document.createElement("aside");
    $wrapper.classList.add(Classes.WRAPPER);
    if (opts.class) {
        $wrapper.classList.add(opts.class);
    }

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
        $wrapper.classList.add(Classes.HAS_CAPTION);
        $wrapper.appendChild($caption);
    }

    // add loading UI if we're going to load a highres
    if (opts.highres) {
        $wrapper.classList.add(Classes.HAS_HIGHRES);
        const $loader = document.createElement("div");
        $loader.classList.add(Classes.LOADER);
        $imgWrapper.insertBefore($loader, $img);
    }

    return $wrapper;
}
