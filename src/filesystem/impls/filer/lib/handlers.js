/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define */
define(function (require, exports, module) {
    "use strict";

    var Content = require("filesystem/impls/filer/lib/content");
    var HTMLRewriter = require("filesystem/impls/filer/lib/HTMLRewriter");
    var MarkdownRewriter = require("filesystem/impls/filer/lib/MarkdownRewriter");
    var CSSRewriter = require("filesystem/impls/filer/lib/CSSRewriter");
    var Path  = require("filesystem/impls/filer/BracketsFiler").Path;
    var BlobUtils = require("filesystem/impls/filer/BlobUtils");

    /**
     * Process known files into Blob URLs, processing known types first
     * so they are rendered and rewritten (e.g., paths->blob urls) properly.
     */
    function handleFile(path, data) {
        var ext = Path.extname(path);
        var mimeType = Content.mimeFromExt(ext);

        // NOTE: we call toString() on `data` so that only utf8 data is used if a
        // buffer was passed in as a parameter
        data = data.toString();

        if(Content.isHTML(ext)) {
            data = HTMLRewriter.rewrite(path, data);
        } else if(Content.isMarkdown(ext)) {
            // Convert Markdown to HTML, then rewrite the resulting HTML
            data = HTMLRewriter.rewrite(path, MarkdownRewriter.rewrite(path, data));
        } else if(Content.isCSS(ext)) {
            data = CSSRewriter.rewrite(path, data);
        }

        return BlobUtils.createURL(path, data, mimeType);
    }

    exports.handleFile = handleFile;
});
