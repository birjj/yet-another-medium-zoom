# Yet Another Medium Zoom

Extensible and configurable Medium-inspired lightbox.

## Expected API

### Options

Global options (`GlobalOptions`):

| Key                 | Type                                                    |   Default value | Description                                                                                             |
| ------------------- | ------------------------------------------------------- | --------------: | ------------------------------------------------------------------------------------------------------- |
| `scrollAllowance`   | `number`                                                |            `40` | How much the user can scroll before the lightbox is closed. `-1` to disable.                            |
| `wrapAlbums`        | `boolean`                                               |         `false` | Whether the album should wrap. If `false`, the user will be unable to go right at the end of the album. |
| `duration`          | `number`                                                |           `400` | How long the animation should take, measured in milliseconds                                            |
| `container`         | `HTMLElement`                                           | `document.body` | The element to render the lightbox inside.                                                              |
| `lightboxGenerator` | `(img: HTMLElement, opts: ImageOptions) => HTMLElement` |          `null` | Function which generates the ligthbox, if you want to use a custom one.                                 |

Individual image options (`ImageOptions`) is every global option plus the following:

| Key       | Type                                          | Default value | Description                                                                                                           |
| --------- | --------------------------------------------- | ------------: | --------------------------------------------------------------------------------------------------------------------- |
| `album`   | `{ img: HTMLElement, opts?: ImageOptions }[]` |        `null` | The images the user can move through by pressing left/right. Left/right is disabled if this is `null` or empty array. |
| `highRes` | `string | HTMLElement`                        |        `null` | URL of the high-res version to display when zoomed in, or an element if you already have one.                         |
| `caption` | `string | HTMLElement`                        |        `null` | The element to render the lightbox inside. Caption is disabled if this is `null` or empty string.                     |

### API

#### `setOptions(options: GlobalOptions)`

Sets the options to be used globally.

#### `open(img: HTMLElement, options?: ImageOptions): Promise<HTMLElement>`

Opens the specified image in the lightbox.  
The returned promise will resolve once the lightbox has finished opening, resolving to the lightbox element.

#### `close(img?: HTMLElement): Promise<void>` (core)

Closes the currently active lightbox. If `img` is given, only closes if the currently open image is equal to `img`.  
The returned promise will resolve once the lightbox has finished closing.

#### `update(img: HTMLElement, options?: ImageOptions): HTMLElement` (core)

Updates the lightbox to show the given image instead, without animating a close/open.  
The returned element is the lightbox.

### Styling

If you want to change some part of the styling, you can do so through simple CSS. The animations will adapt to your changed style automatically.
