/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define */
define(function (require, exports, module) {
    "use strict";

    var Content = require("filesystem/impls/filer/lib/content");
    var Path = require("filesystem/impls/filer/FilerUtils").Path;
    var BlobUtils = require("filesystem/impls/filer/BlobUtils");

    /**
     * Rewrite all url(...) references to blob URL Objects from the fs.
     */
    function CSSRewriter(path, css) {
        this.path = path;
        this.dir = Path.dirname(path);
        this.css = css;
    }

    CSSRewriter.prototype.urls = function(callback) {
        var path = this.path;
        var dir = this.dir;
        var css = this.css;

        // Do a two stage pass of the css content, replacing all interesting url(...)
        // uses with the contents of files in the server root.
        // Thanks to Pomax for helping with this
        function aggregate(content, callback) {
            var urls = [];
            var urlRegex = new RegExp('url\\([\\\'\\"]?([^\\\'\\"\\)]+)[\\\'\\"]?\\)', 'g');
            var periodRegex = new RegExp('\\.', 'g');
            var forwardSlashRegex = new RegExp('\\/', 'g');

            function fetch(input, replacements, next) {
                if(input.length === 0) {
                    return next(false, replacements);
                }

                var filename = input.splice(0,1)[0];
                filename = Path.resolve(dir, filename);

                BlobUtils.getUrl(filename, function(err, cachedUrl) {
                    if(err) {
                        return next("failed on " + path, replacements);
                    }

                    // Swap the filename with the blob url
                    var filenameCleaned = filename.replace(periodRegex, '\\.')
                                                  .replace(forwardSlashRegex, '\\/');
                    var regex = new RegExp(filenameCleaned, 'gm');

                    // Queue a function to do the replacement in the second pass
                    replacements.push(function(content) {
                        return content.replace(regex, cachedUrl);
                    });

                    fetch(input, replacements, next);              
                });
            }

            function fetchFiles(list, next) {
                fetch(list, [], next);
            }

            content.replace(urlRegex, function(_, url) {
                if(!Content.isRelativeURL(url)) {
                    return;
                }
                urls.push(url);
            });

            fetchFiles(urls, callback);
        }

        aggregate(css, function(err, replacements) {
            if(err) {
                callback(err);
                return;
            }
            replacements.forEach(function(replacement) {
                css = replacement(css);
            });

            callback(null, css);
        });
    };

    function rewrite(path, css, callback) {
        var rewriter = new CSSRewriter(path, css);
        rewriter.urls(callback);
    }

    exports.rewrite = rewrite;
});
