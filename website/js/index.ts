import yamz from "../../src/index";
import { ImageOptions } from "../../src/types";
import { CaptionOptions } from "../../src/caption/caption";

/**
 * Our custom lightbox generator, which is given to YAMZ as the lightboxGenerator option
 * It is often useful to generate the normal lightbox first, and then customizing it
 * For this reason the normal lightbox generator is exposed as .defaultLightboxGenerator
 * @param $img The image element that we should insert into the lightbox. The returned HTMLElement from this function *must* include this element
 * @param opts The options for this image
 * @param $original A reference to the <img> or <picture> that the lightbox represents
 * @returns {HTMLElement} The generated lightbox DOM element
 */
function customLightboxGenerator($img: HTMLImageElement, opts: ImageOptions, $original: HTMLElement) {
    const $lightbox = yamz.defaultLightboxGenerator($img, opts, $original);
    if (!$original.dataset.customLayout) { return $lightbox; }
    $lightbox.classList.add("custom");

    // our custom layout has a left/right seperation; generate the two containers
    const $left = document.createElement("div");
    $left.classList.add("custom__left");
    // and move the displayed image into the left side
    $left.appendChild($lightbox.querySelector(".yamz__img-wrapper"));

    const $right = document.createElement("div");
    $right.classList.add("custom__right");
    // also insert a custom description into the lightbox
    const $description = document.createElement("p");
    $description.appendChild(document.createTextNode("This lightbox has a custom DOM structure."));
    $description.appendChild(document.createElement("br"));
    $description.appendChild(document.createTextNode("The animation automatically adapts so it matches the new location of the image."));
    // and make sure we move the caption into the right side
    const $caption = $lightbox.querySelector(".yamz__caption");
    if ($caption) {
        $caption.insertBefore($description, $caption.firstChild);
        $right.appendChild($caption);
    }

    $lightbox.appendChild($left);
    $lightbox.appendChild($right);

    return $lightbox;
}
yamz.setOptions({
    lightboxGenerator: customLightboxGenerator,
    wrapAlbum: true,
});

const $imgs = Array.from(document.querySelectorAll("*:not(picture) > img, picture")) as HTMLElement[];
$imgs.forEach($img => {
    const opts: CaptionOptions = {};

    // if we want to insert a link in our caption, we need to give YAMZ an HTMLElement instead of a string
    if ($img.dataset.unsplashLink && $img.dataset.unsplashAuthor) {
        const $caption = document.createElement("div");
        if ($img.dataset.caption) {
            $caption.appendChild(document.createTextNode(`${$img.dataset.caption}. `));
        }
        $caption.appendChild(document.createTextNode("Photograph by "));
        const $link = document.createElement("a");
        $link.href = $img.dataset.unsplashLink;
        $link.target = "_blank";
        $link.rel = "noreferrer noopener";
        $link.textContent = `${$img.dataset.unsplashAuthor} at Unsplash`;
        $link.addEventListener("click", e => { // stop lightbox from closing when pressing the link
            e.stopPropagation();
        });
        $caption.appendChild($link);

        opts.caption = $caption;
        delete $img.dataset.caption;
    }

    yamz.bind($img, opts);
});
