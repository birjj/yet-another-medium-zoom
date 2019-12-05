# Yet Another Medium Zoom

YAMZ is a lightbox library heavily inspired by [Medium](https://medium.com/).

It provides an easy way to add smooth, minimalistic, and highly customizable Medium-like zooming to your images.

## Usage

To use the library, you have to tell it which images to bind to:

```js
import yamz from "yet-another-medium-zoom";

const $images = [...document.querySelectorAll("img, picture")];
yamz.bind($images);
```

That's it. The library will automatically extract the appropriate high-res source from your images if you are using `srcset`, and will otherwise just use the image's own source.

### Configuration

If you want to have more control over the lightbox, you may want to change some of the options. You can set an option globally, or you can specify the options on a per-image basis. This can be done using either a JS API, or through data attributes in your HTML.

```js
import yamz from "yet-another-medium-zoom";

yamz.setOptions({ // set options globally
    /* ... */
});
const $img = document.querySelector("img");
yamz.open($img, { // set options on a per-image basis
    /* ... */
});
```

```html
<!-- or set the options as data attributes -->
<img src="example.png" data-scroll-allowance="-1" data-duration="600" />
```

The following options are available:

| Key                 | Type                                                    |   Default value | Description                                                                                                                       |
| ------------------- | ------------------------------------------------------- | --------------: | --------------------------------------------------------------------------------------------------------------------------------- |
| `scrollAllowance`   | `number`                                                |           `128` | How much the user can scroll before the lightbox is closed. `-1` to disable                                                       |
| `duration`          | `number`                                                |           `300` | How long the animation should take, measured in milliseconds                                                                      |
| `container`         | `HTMLElement`                                           | `document.body` | The element to render the lightbox inside                                                                                         |
| `lightboxGenerator` | `(img: HTMLElement, opts: ImageOptions) => HTMLElement` |          `null` | Function which generates the lightbox, if you want to use a custom one. See [below](#advanced-customization) for more information |
| `class`             | `string`                                                |          `null` | Class to give to the lightbox element. Mostly useful for styling                                                                  |
| `highres`           | `string`                                                |          `null` | URL of the high-res image to load. Can't be set globally                                                                          |
| `caption`           | `string \| HTMLElement`                                  |          `null` | String or element to insert as a caption below the image. Can't be set globally                                                   |

### Customization

If you wish to customize the look and feel of the lightbox, you're free to do so using CSS and the `lightboxGenerator` option - the former is for changing the look of the lightbox, while the latter allows you to completely change the structure of the lightbox, adding features and modifying the layout as you see fit. The animation will automatically adapt to your new styles.

If you want an example of how this looks, have a look at [the example website](website/).
