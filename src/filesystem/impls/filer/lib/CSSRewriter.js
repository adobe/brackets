/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define */
define(function (require, exports) {
    "use strict";

    var Content = require("filesystem/impls/filer/lib/content");
    var Path = require("filesystem/impls/filer/BracketsFiler").Path;
    var BlobUtils = require("filesystem/impls/filer/BlobUtils");

    /**
     * Rewrite all url(...) references to blob URL Objects from the fs.
     */
    function CSSRewriter(path, css) {
        this.path = path;
        this.dir = Path.dirname(path);
        this.css = css;
    }

    CSSRewriter.prototype.urls = function() {
        var dir = this.dir;
        var css = this.css;
        var replacements = [];

        // Do a two stage pass of the css content, replacing all interesting url(...)
        // uses with the contents of files in the server root.
        // Thanks to Pomax for helping with this
        function aggregate(content) {
            var urls = [];
            var urlRegex = new RegExp('url\\([\\\'\\"]\\?([^\\\'\\"\\)]+)[\\\'\\"]\\?\\)', 'g');

            function fetch(input) {
                if(input.length === 0) {
                    return;
                }

                var filename = input.splice(0,1)[0];
                var path = Path.resolve(dir, filename);

                replacements.push(function(content) {
                    // Swap the filename with the blob url
                    var period = new RegExp('\\.', 'g');
                    var forwardSlash = new RegExp('\\/', 'g');
                    var filenameCleaned = filename.replace(period, '\\.').replace(forwardSlash, '\\/');
                    var regex = new RegExp(filenameCleaned, 'gm');
                    return content.replace(regex, BlobUtils.getUrl(path));
                });

                fetch(input);
            }

            function fetchFiles(list) {
                fetch(list);
            }

            content.replace(urlRegex, function(_, url) {
                if(!Content.isRelativeURL(url)) {
                    return;
                }
                urls.push(url);
            });

            fetchFiles(urls);
        }

        aggregate(css);

        replacements.forEach(function(replacement) {
            css = replacement(css);
        });

        return css;
    };

    function rewrite(path, css) {
        var rewriter = new CSSRewriter(path, css);
        return rewriter.urls();
    }

    exports.rewrite = rewrite;
});
