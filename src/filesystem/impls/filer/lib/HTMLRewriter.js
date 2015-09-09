/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, DOMParser */
define(function (require, exports, module) {
    "use strict";

    var Async = require("filesystem/impls/filer/lib/async");
    var Content = require("filesystem/impls/filer/lib/content");
    var CSSRewriter = require("filesystem/impls/filer/lib/CSSRewriter");
    var BlobUtils = require("filesystem/impls/filer/BlobUtils");
    var Path = require("filesystem/impls/filer/FilerUtils").Path;
    var decodePath = require("filesystem/impls/filer/FilerUtils").decodePath;

    /**
     * This variable controls whether or not we want scripts to be run in the preview window or not
     * We do this by altering the mime type from text/javascript to text/x-scripts-disabled below.
     */
    var jsEnabled = true;

    /**
     * Rewrite all external resources (links, scripts, img sources, ...) to
     * blob URL Objects from the fs.
     */
    function HTMLRewriter(path, html, server) {
        this.path = path;
        this.dir = Path.dirname(path);
        this.server = server;

        // Turn this html into a DOM, process it
        var parser = new DOMParser();
        this.doc = parser.parseFromString(html, "text/html");
    }

    HTMLRewriter.prototype.elements = function(type, urlType, callback) {
        var elements = this.doc.querySelectorAll(type);
        var dir = this.dir;

        Async.eachSeries(elements, function(element, callback) {
            // Skip any links for protocols (we only want relative paths)
            var path = decodePath(element.getAttribute(urlType));
            var fullPath = Path.resolve(dir, path);

            if(!Content.isRelativeURL(path)) {
                callback();
                return;
            }

            BlobUtils.getUrl(fullPath, function(err, url) {
                if(err) {
                    console.log("[HTMLRewriter warning] couldn't get URL for `" + fullPath + "`", err);
                } else {
                    element[urlType] = url;
                }
                callback();
            });
        }, callback);
    };

    HTMLRewriter.prototype.styles = function(callback) {
        var path = this.path;
        var elements = this.doc.querySelectorAll("style");

        Async.eachSeries(elements, function(element, callback) {
            var content = element.innerHTML;
            if(!content) {
                return callback();
            }

            CSSRewriter.rewrite(path, content, function(err, css) {
                if(err) {
                    console.log("[HTMLRewriter warning] couldn't rewrite CSS `" + path + "`", err);
                } else {
                    element.innerHTML = css;
                }
                callback();
            });
        }, callback);
    };

    HTMLRewriter.prototype.styleAttributes = function(callback) {
        var path = this.path;
        var elements = this.doc.querySelectorAll("[style]");

        Async.eachSeries(elements, function(element, callback) {
            var content = element.getAttribute("style");
            if(!content) {
                return callback();
            }

            CSSRewriter.rewrite(path, content, function(err, css) {
                if(err) {
                    console.log("[HTMLRewriter warning] couldn't rewrite CSS `" + path + "`", err);
                } else {
                    element.setAttribute("style", css);
                }
                callback();
            });
        }, callback);
    };

    HTMLRewriter.prototype.styleSheetLinks = function(callback) {
        var dir = this.dir;
        var server = this.server;
        // TODO: https://developer.mozilla.org/en-US/docs/Web/CSS/Alternative_style_sheets
        var elements = this.doc.querySelectorAll("link[rel='stylesheet']");

        Async.eachSeries(elements, function(element, callback) {
            var path = decodePath(element.getAttribute("href"));
            var fullPath = Path.resolve(dir, path);

            if(!Content.isRelativeURL(path)) {
                callback();
                return;
            }

            // If the user has the given CSS file open in an editor,
            // use that; otherwise, get it from disk.
            server.serveLiveDocForPath(fullPath, function(err, url) {
                if(err) {
                    console.log("[HTMLRewriter warning] couldn't get URL for `" + fullPath + "`", err);
                } else {
                    element.href = url;
                }
                callback();
            });
        }, callback);
    };

    HTMLRewriter.prototype.scripts = function(callback) {
        var elements = this.doc.querySelectorAll("script");

        function maybeDisable(element) {
            // Skip any scripts we've injected for live dev.
            if(!element.getAttribute("data-brackets-id")) {
                return;
            }

            if(jsEnabled) {
                if(element.getAttribute("type") === "text/x-scripts-disabled") {
                    element.removeAttribute("type");
                }
            } else {
                element.setAttribute("type", "text/x-scripts-disabled");
            }
        }

        if(elements) {
            Array.prototype.forEach.call(elements, maybeDisable);
        }
        callback();
    };

    function rewrite(path, html, server, callback) {
        if(typeof server === "function") {
            callback = server;
            server = null;
        }
        // We may or may not have a server for rewriting live CSS docs in <link>s (e.g.,
        // when we `fs.writeFile()` and generate cached Blob URLs in `handleFile()`).
        // If we don't, use `BlobUtils.getUrl()` instead to read from the fs.
        if(!server) {
            server = { serveLiveDocForPath: BlobUtils.getUrl };
        }

        var rewriter = new HTMLRewriter(path, html, server);

        function iterator(functionName) {
            var args = Array.prototype.slice.call(arguments, 1);
            return function(callback) {
                rewriter[functionName].apply(rewriter, args.concat([callback]));
            };
        }

        Async.series([
            iterator("styles"),
            iterator("styleAttributes"),
            iterator("elements", "iframe", "src"),
            iterator("elements", "img", "src"),
            iterator("elements", "script", "src"),
            iterator("elements", "source", "src"),
            iterator("elements", "video", "src"),
            iterator("elements", "audio", "src"),
            // NOTE: we don't rewrite <a href=...> in order to avoid circular rewrite loops
            // with pages that link to themselves, or pages that link to pages that link back.
            iterator("styleSheetLinks"),
            iterator("scripts")
        ], function finishedRewriteSeries(err) {
            // Return the processed HTML
            var html = rewriter.doc.documentElement.outerHTML;
            callback(err, html);
        });
    }

    exports.rewrite = rewrite;
    exports.enableScripts = function() {
        jsEnabled = true;
    };
    exports.disableScripts = function() {
        jsEnabled = false;
    };
});
