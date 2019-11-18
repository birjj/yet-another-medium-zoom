/* global document */
import { MediumLightboxCore, DEFAULT_OPTS } from "../src/core";

const createInstance = () => new MediumLightboxCore();
describe("MediumLightboxCore", () => {
  describe("getOptions", () => {
    it("gets the default options initially", () => {
      expect(createInstance().getOptions()).toEqual(DEFAULT_OPTS);
    });
  });

  describe("setOptions", () => {
    it("sets options when given full settings", () => {
      const inst = createInstance();
      const opts = {
        scrollAllowance: 10,
        zoomOptimistically: false,
        wrapAlbums: false,
        container: undefined,
        lightboxGenerator: undefined,
      };
      inst.setOptions(opts);
      expect(inst.getOptions()).toEqual(opts);
    });

    it("sets options when given partial settings", () => {
      const inst = createInstance();
      inst.setOptions({ scrollAllowance: 10 });
      expect(inst.getOptions()).toEqual({ ...DEFAULT_OPTS, scrollAllowance: 10 });
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
})
