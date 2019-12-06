import lightbox from "../../src/index";
import { ImageOptions } from "../../src/types";
import { CaptionOptions } from "../../src/caption/caption";

function customLightboxGenerator($img: HTMLImageElement, opts: ImageOptions, $original: HTMLElement) {
    const $lightbox = lightbox.defaultLightboxGenerator($img, opts);
    $lightbox.classList.add("custom");

    const $left = document.createElement("div");
    $left.classList.add("custom__left");
    $left.appendChild($lightbox.querySelector(".yamz__img-wrapper"));

    const $right = document.createElement("div");
    $right.classList.add("custom__right");
    const $description = document.createElement("p");
    $description.appendChild(document.createTextNode("This lightbox has a custom DOM structure."));
    $description.appendChild(document.createElement("br"));
    $description.appendChild(document.createTextNode("The animation automatically adapts so it matches the new location of the image."));
    const $caption = $lightbox.querySelector(".yamz__caption");
    if ($caption) {
        $caption.insertBefore($description, $caption.firstChild);
        $right.appendChild($caption);
    }

    $lightbox.appendChild($left);
    $lightbox.appendChild($right);

    return $lightbox;
}

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
    }

    // we might want to use a custom layout
    if ($img.dataset.customLayout) {
        opts.lightboxGenerator = customLightboxGenerator;
    }

    lightbox.bind($img, opts);
});
