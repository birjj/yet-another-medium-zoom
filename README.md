# Yet Another Medium Zoom

[![codecov](https://codecov.io/gh/birjolaxew/yet-another-medium-zoom/branch/master/graph/badge.svg)](https://codecov.io/gh/birjolaxew/yet-another-medium-zoom)
[![david](https://david-dm.org/birjolaxew/yet-another-medium-zoom.svg)](https://david-dm.org/birjolaxew/yet-another-medium-zoom)
[![license](https://img.shields.io/npm/l/yet-another-medium-zoom.svg)](./LICENSE)

YAMZ is a lightbox library heavily inspired by [Medium](https://medium.com/).

It provides an easy way to add smooth, minimalistic, and highly customizable Medium-like zooming to your images.

## Usage

To use the library, you simply tell it which images to bind to:

```js
import yamz from "yet-another-medium-zoom";

const $images = [...document.querySelectorAll("img, picture")];
yamz.bind($images);
```

That's it. The library will automatically extract the appropriate high-res source from your images if you are using `srcset`, and will otherwise just use the image's own source (or a high-res source [you specify](#configuration)).

## Configuration

If you want to have more control over what's displayed, you may want to change some of the options. You can set an option globally, or you can specify the options on a per-image basis. This can be done in JavaScript when you open the lightbox, or in HTML by specifying the options on the image you bind to as data attributes.

```html
<!-- set the options as data attributes -->
<img src="example.png" data-scroll-allowance="-1" data-duration="600" />
```

```js
/* or specify them when you open the lightbox programmatically */
import yamz from "yet-another-medium-zoom";

yamz.setOptions({
    // set options globally
    /* ... */
});
const $img = document.querySelector("img");
yamz.open($img, {
    // set options on a per-image basis
    /* ... */
});
```

The following options are available:

| Name                | Data attribute          | Type                                                    |   Default value | Description                                                                                                                                                                                     |
| ------------------- | ----------------------- | ------------------------------------------------------- | --------------: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scrollAllowance`   | `data-scroll-allowance` | `number`                                                |           `128` | How much the user can scroll before the lightbox is closed. `-1` to disable                                                                                                                     |
| `duration`          | `data-duration`         | `number`                                                |           `300` | How long the animation should take, measured in milliseconds                                                                                                                                    |
| `container`         | None                    | `HTMLElement`                                           | `document.body` | The element to render the lightbox inside                                                                                                                                                       |
| `class`             | `data-class`            | `string`                                                |          `null` | Class to give to the lightbox element. Mostly useful for styling                                                                                                                                |
| `highres`           | `data-highres`          | `string`                                                |          `null` | URL of the high-res image to load. Can't be set globally                                                                                                                                        |
| `caption`           | `data-caption`          | `string \| HTMLElement`                                 |          `null` | String or element to insert as a caption below the image. Can't be set globally                                                                                                                 |
| `album`             | `data-album`            | `{ img: HTMLElement, opts?: {} }[]`                     |          `null` | If set, the album that an image belongs to. Can be specified in HTML by using a string - all images with the same album string will then be considered part of the album. Can't be set globally |
| `wrapAlbum`         | None                    | `boolean`                                               |         `false` | Whether to wrap albums, so you can press left on the first image to go to the last one, and vice versa                                                                                          |
| `lightboxGenerator` | None                    | `(img: HTMLElement, opts: ImageOptions) => HTMLElement` |          `null` | Function which generates the lightbox, if you want to use a custom one. See [below](#advanced-customization) for more information                                                               |

### Advanced Customization

There are two main ways to perform more in-depth customization of the lightbox:

#### CSS / DOM customization

You can style the lightbox however you want by simply using CSS to overwrite the built-in styles. You can also change the DOM structure of the lightbox by using the `lightboxGenerator` option, which lets you completely change what the lightbox contains. You can see an example of this on the [project website](website/js/index.ts). The animation will automatically adapt to your new styles.

#### Plugins

Plugins can be created if you need more advanced control. These are implemented as functions that augment a given YAMZ instance with whatever features the plugin implements. These plugins can then be composited if you want to use more than one at a time. An example of this can be seen in [our main export](src/index.ts).

Both the caption and album support are actually implemented as plugins (that are enabled by default), so if you want to create your own plugin it might be useful to reference the implementation of the [caption](src/caption/caption.ts) or [album](src/album/album.ts) plugins.
