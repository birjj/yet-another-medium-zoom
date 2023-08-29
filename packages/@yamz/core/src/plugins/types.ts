export type ImageCandidate = {
  width: number;
  url: string;
};

/** Record of all the available hooks a plugin can provide */
export type YamzHooks = {
  /** Given a DOM element (usually an HTMLImageElement or an HTMLPictureElement), returns a list of image candidates to be displayed when the lightbox is opened */
  parseImageCandidates: (p: { $elm: Element }) => ImageCandidate[];

  /** Given a list of image candidates, pick the most appropriate one (e.g. based on screen size) */
  pickImageCandidate: (p: {
    $elm: Element;
    candidates: ImageCandidate[];
  }) => ImageCandidate;

  /** Generates the HTMLImageElement that should be used in our lightbox (or otherwise modifies it by e.g. adding attributes) */
  generateImage: (p: {
    /** The original element that we've parsed image candidates from */
    $original: Element;
    /** The candidate we want to use to generate the high-res image */
    candidate: ImageCandidate;
  }) => HTMLImageElement | undefined;

  /** Generates the DOM that we want to use for our lightbox (or otherwise modifies it by e.g. attaching listeners) */
  generateLightbox: (p: {
    /** The original element that we've parsed image candidates from */
    $original: Element;
    /** The image element that should be inserted into the lightbox */
    $img: HTMLImageElement;
    /** The candidate that represents the high-res image */
    candidate: ImageCandidate;
  }) => HTMLElement;
};

/** These parameters are shared by all hooks; they are always present in the first argument */
export type YamzSharedHookParameters<ReturnType> = {
  previous?: ReturnType;
};

/** Helper type to decorate a hook function type with the shared parameters */
export type YamzDecoratedHook<F extends (p: any) => any> = F extends (
  parameters: infer P extends Record<string, unknown>
) => infer R
  ? (parameters: P & YamzSharedHookParameters<R>) => R
  : never;

export type YamzDecoratedHooks = {
  [K in keyof YamzHooks]: YamzDecoratedHook<YamzHooks[K]>;
};

/** Represents a single plugin, hooking into various aspects of the lightbox experience */
export type YamzPlugin = {
  name: string;
  hooks?: Partial<YamzDecoratedHooks>;
};
