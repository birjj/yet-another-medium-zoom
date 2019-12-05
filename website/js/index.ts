import lightbox from "../../src/core";
import { ImageOptions } from "../../src/types";

const $imgs = Array.from(document.querySelectorAll("*:not(picture) > img, picture")) as HTMLElement[];
$imgs.forEach($img => {
    const opts: ImageOptions = {};
    // if we want to insert a link in our caption, we need to give YAMZ an HTMLElement instead of a string
    if ($img.dataset.unsplashLink && $img.dataset.unsplashAuthor) {
        const $caption = document.createElement("div");
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

        if ($img.dataset.caption) {
            $caption.appendChild(document.createTextNode(`. ${$img.dataset.caption}`));
        }

        opts.caption = $caption;
    }
    lightbox.bind($img, opts);
});
