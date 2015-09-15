/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define */
define(function (require, exports, module) {
    "use strict";

    var Content = require("filesystem/impls/filer/lib/content");
    var HTMLRewriter = require("filesystem/impls/filer/lib/HTMLRewriter");
    var CSSRewriter = require("filesystem/impls/filer/lib/CSSRewriter");
    var BlobUtils = require("filesystem/impls/filer/BlobUtils");
    var Transforms = require("filesystem/impls/filer/lib/transforms");
    var Path = require("filesystem/impls/filer/BracketsFiler").Path;

    /**
     * Process known files into Blob URLs, processing known types first
     * so they are rendered and rewritten (e.g., paths->blob urls) properly.
     */
    function handleFile(path, data, callback) {
        var ext = Path.extname(path);
        var mimeType = Content.mimeFromExt(ext);

        // NOTE: we call toString() on `data` so that only utf8 data is used if a
        // buffer was passed in as a parameter and should be read as utf8.
        if(Content.isUTF8Encoded(ext)) {
            data = data.toString();
        }

        function rewriteUrl() {
            if(Content.isHTML(ext)) {
                HTMLRewriter.rewrite(path, data, callback);
            } else if(Content.isCSS(ext)) {
                CSSRewriter.rewrite(path, data, function(err, css) {
                    if(err) {
                        console.error("[Handler.handleFile() Error", path, err);
                        callback(err);
                        return;
                    }
                    BlobUtils.createURL(path, css, mimeType);
                    callback();
                });
            } else {
                BlobUtils.createURL(path, data, mimeType);
                callback();
            }
        }

        // If there's a transform needed for this file, do it first
        Transforms.applyTransform(path, data, function(err) {
            if(err) {
                return callback(err);
            }

            rewriteUrl();
        });
    }

    exports.handleFile = handleFile;
});
