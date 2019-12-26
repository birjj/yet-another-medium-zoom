import { MediumLightboxCore } from "../core";
import { Classes, YamzPlugin } from "../types";
import "./caption.css";

export interface Captioned {};

export interface CaptionOptions {
    caption?: string | HTMLElement,
};

/** Augments the YAMZ instance to support captions */
export default function withCaption<YamzType extends MediumLightboxCore>(_yamz: YamzType) {
    const { defaultLightboxGenerator, optsFromElm } = _yamz;
    const yamz = _yamz as YamzPlugin<YamzType, Captioned, CaptionOptions, CaptionOptions>;

    // insert caption into the lightbox if we're given one
    yamz.defaultLightboxGenerator = function($copiedImg, opts, $original) {
        const $lightbox = defaultLightboxGenerator.call(this, $copiedImg, opts, $original);

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
        type outpType = ReturnType<YamzType["optsFromElm"]> & CaptionOptions;
        const outp: outpType = optsFromElm.call(this, $elm) as outpType;
        if ($elm.dataset.caption) { outp.caption = $elm.dataset.caption; }
        return outp;
    };

    return yamz;
};
