/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define */
define(function (require, exports, module) {
    "use strict";

    var Content = require("filesystem/impls/filer/lib/content");
    var HTMLRewriter = require("filesystem/impls/filer/lib/HTMLRewriter");
    var CSSRewriter = require("filesystem/impls/filer/lib/CSSRewriter");
    var Path  = require("filesystem/impls/filer/BracketsFiler").Path;

    /**
     * Send the raw file, making it somewhat more readable
     */
    function handleFile(path, data) {
        var ext = Path.extname(path);
        var mimeType = Content.mimeFromExt(ext);

        if(Content.isHTML(ext)) {
            // We call toString on the data so that only utf8 data is used if a
            // buffer was passed in as a parameter
            data = HTMLRewriter.rewrite(path, data.toString());
        } else if(Content.isCSS(ext)) {
            data = CSSRewriter.rewrite(path, data.toString());
        }

        return Content.toURL(data, mimeType);
    }

    exports.handleFile = handleFile;
});
