/* global document */
import { MediumLightboxCore, DEFAULT_OPTS } from "../src/core";
const DEFAULTS = {
    ...DEFAULT_OPTS,
    duration: 0,
};

const createInstance = () => {
    const inst = new MediumLightboxCore();
    inst.setOptions({ duration: 0 }); // so we don't have to use FLIP, which requires DOM simulation
    return inst;
};
describe("MediumLightboxCore", () => {
  describe("getOptions", () => {
    it("gets the default options initially", () => {
      expect(createInstance().getOptions()).toEqual(DEFAULTS);
    });
  });

  describe("setOptions", () => {
    it("sets options when given full settings", () => {
      const inst = createInstance();
      const opts = {
        scrollAllowance: 10,
        zoomOptimistically: false,
        wrapAlbums: false,
        duration: 400,
        container: undefined,
        lightboxGenerator: undefined,
      };
      inst.setOptions(opts);
      expect(inst.getOptions()).toEqual(opts);
    });

    it("sets options when given partial settings", () => {
      const inst = createInstance();
      inst.setOptions({ scrollAllowance: 10 });
      expect(inst.getOptions()).toEqual({ ...DEFAULTS, scrollAllowance: 10 });
    });
  });

  describe("open()", () => {
    it("errors when given invalid element", () => {
      const $div = document.createElement("div");
      return expect(createInstance().open($div)).rejects.toBeInstanceOf(TypeError);
    });

    it("returns an HTMLElement", () => {
      const $img = document.createElement("img");
      return expect(createInstance().open($img)).resolves.toBeInstanceOf(HTMLElement);
    });
  });

  describe("close()", () => {
    it("closes the active lightbox", async () => {
        const $img = document.createElement("img");
        const inst = createInstance();
        await inst.open($img);
        await inst.close();
        expect(inst.active).toBe(undefined);
    });

    it("closes when given active $img", async () => {
        const $img = document.createElement("img");
        const inst = createInstance();
        await inst.open($img);
        await inst.close($img);
        expect(inst.active).toBe(undefined);
    });

    it("doesn't close when given inactive $img", async () => {
        const $img = document.createElement("img");
        const $img2 = document.createElement("img");
        const inst = createInstance();
        await inst.open($img, { duration: 0 });
        await inst.close($img2);
        expect(inst.active).not.toBe(undefined);
    });
  });
})
