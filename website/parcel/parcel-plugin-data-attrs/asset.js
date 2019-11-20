// https://github.com/kwasniew/parcel-plugin-lazy
const HTMLAsset = require("parcel-bundler/src/assets/HTMLAsset");
console.log("Loaded");
class HTMLAssetWithDataAttrs extends HTMLAsset {
    collectDependencies() {
        console.log("Collecting dependencies");
        super.collectDependencies();
        this.ast.walk(node => {
            if (node.attrs) {
                for (let attr in node.attrs) {
                    if (/^data\-/.test(attr)) {
                        console.log("Checking ", attr, node.attrs[attr]);
                        const depHandler = this.getAttrDepHandler(attr);
                        node.attrs[attr] = depHandler.call(this, node.attrs[attr], undefined);
                        this.isAstDirty = true;
                    }
                }
            }
            return node;
        });
    }
}
module.exports = HTMLAssetWithDataAttrs;
