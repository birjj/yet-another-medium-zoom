import { ImageOptions, Classes } from "./types";

export function cloneImage($img: HTMLImageElement, newSrc?: string): HTMLImageElement;
export function cloneImage($img: HTMLPictureElement): HTMLPictureElement;
export function cloneImage($img: HTMLPictureElement, newSrc: string): HTMLImageElement;
export function cloneImage($img: SVGSVGElement, newSrc?: string): SVGSVGElement;
export function cloneImage($img: any, newSrc?: string) {
    if ($img instanceof HTMLImageElement) {
        const $newImg = $img.cloneNode() as HTMLImageElement;
        if (newSrc) {
            $newImg.src = newSrc;
            if ($newImg.srcset) {
                $newImg.srcset = "";
            }
        }
        return $newImg;
    } else if ($img instanceof HTMLPictureElement) {
        if (newSrc) {
            const $newImg = document.createElement("img");
            $newImg.src = newSrc;
            return $newImg;
        } else {
            return $img.cloneNode(true) as HTMLPictureElement;
        }
    }
    return $img.cloneNode(true) as SVGSVGElement;
}

export function isValidImage($elm: HTMLElement): boolean {
    const types = [HTMLPictureElement, HTMLImageElement, SVGSVGElement];
    return types.some(type => $elm instanceof type);
}

export function defaultLightboxGenerator($img: HTMLElement, opts: ImageOptions) {
    const $wrapper = document.createElement("aside");
    $wrapper.classList.add(Classes.WRAPPER);

    const $imgWrapper = document.createElement("div");
    $imgWrapper.classList.add(Classes.IMG_WRAPPER);
    $imgWrapper.appendChild($img);
    // add high-res image if given
    if (opts.highRes) {
        const $highRes = opts.highRes instanceof HTMLElement
            ? opts.highRes
            : cloneImage($img, opts.highRes);
        $highRes.classList.add(Classes.HIGHRES);
        $imgWrapper.appendChild($highRes);
    }
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