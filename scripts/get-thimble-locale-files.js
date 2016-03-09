/*global process */

var request = require("request");
var gunzip = require("gunzip-maybe");
var tar = require("tar-fs");
var path = require("path");

var dest = path.join(process.cwd());
var extractor = tar.extract(dest, {
    strip: 1,
    ignore: function(name) {
        "use strict";

        return path.basename(name) !== "editor.properties";
    }
});

console.log("Extracting to: ", process.cwd());

request({
    uri: "https://api.github.com/repos/mozilla/thimble.mozilla.org/tarball/master",
    method: "GET",
    gzip: true,
    headers: {
        "User-Agent": "gideonthomas"
    }
})
.on("error", function(err) {
    "use strict";

    console.error("Failed to get data from https://api.github.com/repos/mozilla/thimble.mozilla.org/tarball/master with: ", err);
    process.exit(1);
})
.pipe(gunzip())
.pipe(extractor);
