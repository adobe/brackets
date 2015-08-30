define(function (require, exports, module) {
    "use strict";

    var ScrollManagerRemote = require("text!lib/ScrollManagerRemote.js");

    function getRemoteScript(filename) {
        filename = filename || "unknown";

        // Track scroll position per filename, so you can be at different points in each doc
        return "<script>window.___brambleFilename = '" + filename + "';</script>\n" +
               "<script>\n" + ScrollManagerRemote + "</script>\n";
    }

    exports.getRemoteScript = getRemoteScript;
});
