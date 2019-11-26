export interface GlobalOptions {
    scrollAllowance: number,
    wrapAlbums: boolean,
    duration: number,
    container?: HTMLElement,
    lightboxGenerator: ($img: HTMLElement, opts: ImageOptions) => HTMLElement,
};

export interface ImageOptions extends Partial<GlobalOptions> {
    album?: AlbumEntry[],
    highRes?: string,
    caption?: string | HTMLElement,
}

export interface AlbumEntry {
    img: HTMLElement,
    opts?: ImageOptions,
};

export enum Classes {
    WRAPPER = "yamz__wrapper",
    WRAPPER_CLOSING = "yamz__wrapper--closing",
    IMG_WRAPPER = "yamz__img-wrapper",
    IMG = "yamz__img",
    CAPTION = "yamz__caption",
    HIGHRES = "yamz__highres",
    ORIGINAL = "yamz__original",
    ORIGINAL_OPEN = "yamz__original--open"
};

export enum STATES {
    Closed,
    Opening,
    Open,
    Closing
};
