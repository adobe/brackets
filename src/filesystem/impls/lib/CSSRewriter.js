/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define */
define(function (require, exports) {
    "use strict";

    var Content = require("filesystem/impls/lib/content");
    var Filer = require("filesystem/impls/filer/BracketsFiler");
    var Path = Filer.Path;

    /**
     * Rewrite all url(...) references to blob URL Objects from the fs.
     */
    function CSSRewriter(path, css) {
        this.fs = Filer.fs();
        this.path = path;
        this.dir = Path.dirname(path);
        this.css = css;
    }

    CSSRewriter.prototype.urls = function(callback) {
        var fs = this.fs;
        var path = this.path;
        var dir = this.dir;
        var css = this.css;

        // Do a two stage pass of the css content, replacing all interesting url(...)
        // uses with the contents of files in the server root.
        // Thanks to Pomax for helping with this
        function aggregate(content, callback) {
            var urls = [];

            function fetch(input, replacements, next) {
                if(input.length === 0) {
                    return next(false, replacements);
                }

                var filename = input.splice(0,1)[0];
                fs.readFile(Path.resolve(dir, filename), null, function(err, data) {
                    if(err) {
                        return next("failed on " + path, replacements);
                    }

                    // Queue a function to do the replacement in the second pass
                    replacements.push(function(content) {
                        // Swap the filename with the contents of the file
                        var filenameCleaned = filename.replace(/\./g, '\\.').replace(/\//g, '\\/');
                        var regex = new RegExp(filenameCleaned, 'gm');
                        var mime = Content.mimeFromExt(Path.extname(filename));
                        return content.replace(regex, Content.toURL(data, mime));
                    });
                    fetch(input, replacements, next);
                });
            }

            function fetchFiles(list, next) {
                fetch(list, [], next);
            }

            content.replace(/url\(['"]?([^'"\)]+)['"]?\)/g, function(_, url) {
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
