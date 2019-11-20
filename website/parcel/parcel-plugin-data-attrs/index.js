module.exports = function(bundler) {
    console.log("Adding asset type to bundler");
    bundler.addAssetType("html", require.resolve("./asset.js"));
};
