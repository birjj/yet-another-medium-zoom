export interface GlobalOptions {
    scrollAllowance: number,
    zoomOptimistically: boolean,
    wrapAlbums: boolean,
    container?: HTMLElement,
    lightboxGenerator: ($img: HTMLElement, opts: ImageOptions) => HTMLElement,
};

export interface ImageOptions extends Partial<GlobalOptions> {
    album?: AlbumEntry[],
    highRes?: string | HTMLElement,
    caption?: string | HTMLElement,
}

export interface AlbumEntry {
    img: HTMLElement,
    opts?: ImageOptions,
};

export enum Classes {
    WRAPPER = "yamz__wrapper",
    IMG_WRAPPER = "yamz__img-wrapper",
    CAPTION = "yamz__caption",
    HIGHRES = "yamz__highres",
    ORIGINAL = "yamz__original"
}
