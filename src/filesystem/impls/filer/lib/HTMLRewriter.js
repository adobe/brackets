/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, DOMParser */
define(function (require, exports, module) {
    "use strict";

    var Content = require("filesystem/impls/filer/lib/content");
    var CSSRewriter = require("filesystem/impls/filer/lib/CSSRewriter");
    var BlobUtils = require("filesystem/impls/filer/BlobUtils");
    var Path = require("filesystem/impls/filer/BracketsFiler").Path;
    var jsEnabled = true;

    /**
     * Rewrite all external resources (links, scripts, img sources, ...) to
     * blob URL Objects from the fs.
     */
    function HTMLRewriter(path, html) {
        this.path = path;
        this.dir = Path.dirname(path);

        // Turn this html into a DOM, process it
        var parser = new DOMParser();
        this.doc = parser.parseFromString(html, 'text/html');
    }

    HTMLRewriter.prototype.elements = function(type, urlType) {
        var elements = this.doc.querySelectorAll(type);
        var dir = this.dir;

        function rewritePath(element) {
            // Skip any links for protocols (we only want relative paths)
            var path = element.getAttribute(urlType);
            if(!Content.isRelativeURL(path)) {
                return;
            }

            // Get the Blob Url from cache
            element[urlType] = BlobUtils.getUrl(Path.resolve(dir, path));
        }

        if(!elements) {
            return;
        }

        Array.prototype.forEach.call(elements, rewritePath);
    };

    HTMLRewriter.prototype.links = function() {
        var dir = this.dir;
        var elements = this.doc.querySelectorAll('link');

        function rewritePath(element) {
            var path = element.getAttribute('href');
            if(!Content.isRelativeURL(path)) {
                return;
            }

            element.href = BlobUtils.getUrl(Path.resolve(dir, path));
        }

        if(!elements) {
            return;
        }

        Array.prototype.forEach.call(elements, rewritePath);
    };

    HTMLRewriter.prototype.styles = function() {
        var path = this.path;
        var elements = this.doc.querySelectorAll('style');

        function rewritePath(element) {
            var content = element.innerHTML;
            if(!content) {
                return;
            }

            element.innerHTML = CSSRewriter.rewrite(path, content);
        }

        if(!elements) {
            return;
        }

        Array.prototype.forEach.call(elements, rewritePath);
    };

    HTMLRewriter.prototype.styleAttributes = function() {
        var path = this.path;
        var elements = this.doc.querySelectorAll('[style]');

        function rewritePath(element) {
            var content = element.getAttribute('style');
            if(!content) {
                return;
            }

            element.setAttribute('style', CSSRewriter.rewrite(path, content));
        }

        if(!elements) {
            return;
        }

        Array.prototype.forEach.call(elements, rewritePath);
    };

    HTMLRewriter.prototype.parseScripts = function() {
         var elements = this.doc.querySelectorAll('script');
        var dir = this.dir;

        function rewritePath(element) {
            // Skip any links for protocols (we only want relative paths)
            var path = element.getAttribute('src');
            if(!Content.isRelativeURL(path)) {
                if(element.getAttribute('data-brackets-id') && !jsEnabled) {
                    element.type = "text/-scripts-disabled";
                }
                else if (element.getAttribute('data-brackets-id') && jsEnabled) {
                    if(element.getAttribute('type') === "text/x-scripts-disabled") {
                        element.removeAttribute("type");
                    }
                }

                return;
            }
        }

        if(!elements) {
            return;
        }

        Array.prototype.forEach.call(elements, rewritePath);

    };

    function rewrite(path, html) {
        var rewriter = new HTMLRewriter(path, html);

        rewriter.links();
        rewriter.styles();
        rewriter.styleAttributes();
        rewriter.elements('iframe', 'src');
        rewriter.elements('img', 'src');
        rewriter.elements('script', 'src');
        rewriter.elements('source', 'src');
        rewriter.elements('video', 'src');
        rewriter.elements('audio', 'src');

        rewriter.parseScripts('script','src');

        // Return the processed HTML
        return rewriter.doc.documentElement.outerHTML;
    }

    exports.rewrite = rewrite;
    exports.enableScripts = function() {
      jsEnabled = true;
    };
    exports.disableScripts = function() {
      jsEnabled = false;
    };
});
