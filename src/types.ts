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
    WRAPPER = "m-lightbox__wrapper",
    IMG_WRAPPER = "m-lightbox__img-wrapper",
    CAPTION = "m-lightbox__caption",
    HIGHRES = "m-lightbox__highres",
}