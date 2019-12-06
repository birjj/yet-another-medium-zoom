import { MediumLightboxCore } from "../core";
import { ImageOptions, Classes } from "../types";
import "./caption.css";

export interface CaptionOptions extends ImageOptions {
    caption?: string | HTMLElement,
};

/** Augments the YAMZ instance to support captions */
export default function withCaption(yamz: MediumLightboxCore) {
    const { defaultLightboxGenerator, optsFromElm } = yamz;

    // insert caption into the lightbox if we're given one
    yamz.defaultLightboxGenerator = function($copiedImg: HTMLElement, opts: CaptionOptions) {
        const $lightbox = defaultLightboxGenerator($copiedImg, opts);

        // add caption if given
        if (opts.caption) {
            const $caption = document.createElement("div");
            $caption.classList.add(Classes.CAPTION);
            if (opts.caption instanceof HTMLElement) {
                $caption.appendChild(opts.caption);
            } else {
                $caption.textContent = opts.caption;
            }
            $lightbox.classList.add(Classes.HAS_CAPTION);
            $lightbox.appendChild($caption);
        }

        return $lightbox;
    };

    // also allow specifying the caption in HTML
    yamz.optsFromElm = function($elm: HTMLElement) {
        const outp: CaptionOptions = optsFromElm($elm);
        if ($elm.dataset.caption) { outp.caption = $elm.dataset.caption; }
        return outp;
    };

    return yamz;
};
