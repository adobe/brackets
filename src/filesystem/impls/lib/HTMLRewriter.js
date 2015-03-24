/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, appshell, DOMParser */
define(function (require, exports, module) {
    "use strict";

    var Content = require("filesystem/impls/lib/content");
    var Log = require("filesystem/impls/lib/log");
    var Async = require("filesystem/impls/lib/async");
    var CSSRewriter = require("filesystem/impls/lib/CSSRewriter");

    var Filer = appshell.Filer;
    var Path = Filer.Path;

    /**
     * Rewrite all external resources (links, scripts, img sources, ...) to
     * blob URL Objects from the fs.
     */
    function HTMLRewriter(path, html) {
        this.fs = Filer.fs();
        this.path = path;
        this.dir = Path.dirname(path);

        // Turn this html into a DOM, process it
        var parser = new DOMParser();
        this.doc = parser.parseFromString(html, 'text/html');
    }

    HTMLRewriter.prototype.elements = function(type, urlType, mime, callback) {
        var elems = this.doc.querySelectorAll(type);
        var fs = this.fs;
        var dir = this.dir;

        Async.eachSeries(elems, function(elem, callback) {
            // Skip any links for protocols (we only want relative paths)
            var url = elem.getAttribute(urlType);
            if(!Content.isRelativeURL(url)) {
                return callback();
            }

            var path = Path.resolve(dir, url);
            fs.exists(path, function(found) {
                if(!found) {
                    return callback();
                }

                fs.readFile(path, null, function(err, data) {
                    if(err) {
                        return callback(err);
                    }

                    mime = mime || Content.mimeFromExt(Path.extname(path));
                    elem[urlType] = Content.toURL(data, mime);
                    callback();
                });
            });
        }, function eachSeriesfinished(err) {
            if(err) {
                Log.error(err);
            }
            callback();
        });
    };

    HTMLRewriter.prototype.links = function(callback) {
        var dir = this.dir;
        var fs = this.fs;
        var elems = this.doc.querySelectorAll('link');

        Async.eachSeries(elems, function(elem, callback) {
            var url = elem.getAttribute('href');
            if(!Content.isRelativeURL(url)) {
                return callback();
            }

            var path = Path.resolve(dir, url);
            var ext = Path.extname(path);

            fs.exists(path, function(found) {
                if(!found) {
                    return callback();
                }

                fs.readFile(path, 'utf8', function(err, data) {
                    if(err) {
                        return callback(err);
                    }

                    if(Content.isHTML(ext)) {
                        rewrite(path, data, function(err, html) {
                            elem.href = Content.toURL(html, 'text/html');
                            callback();
                        });
                    } else if(Content.isCSS(ext)) {
                        CSSRewriter.rewrite(path, data, function(err, css) {
                            elem.href = Content.toURL(css, 'text/css');
                            callback();
                        });
                    }
                    callback();
                });
            });
        }, function eachSeriesFinished(err) {
            if(err) {
                Log.error(err);
            }
            callback();
        });
    };

    HTMLRewriter.prototype.styles = function(callback) {
        var path = this.path;
        var elems = this.doc.querySelectorAll('style');

        Async.eachSeries(elems, function(elem, callback) {
            var content = elem.innerHTML;
            if(!content) {
                return callback();
            }

            CSSRewriter.rewrite(path, content, function(err, css) {
                if(err) {
                    Log.error(err);
                    return callback(err);
                }
                elem.innerHTML = css;
                callback();
            });
        }, function(err) {
            if(err) {
                Log.error(err);
            }
            callback();
        });
    };

    HTMLRewriter.prototype.styleAttributes = function(callback) {
        var path = this.path;
        var elems = this.doc.querySelectorAll('[style]');

        Async.eachSeries(elems, function(elem, callback) {
            var content = elem.getAttribute('style');
            if(!content) {
                return callback();
            }

            CSSRewriter.rewrite(path, content, function(err, css) {
                if(err) {
                    Log.error(err);
                    return callback(err);
                }
                elem.setAttribute('style', css);
                callback();
            });
        }, function(err) {
            if(err) {
                Log.error(err);
            }
            callback();
        });
    };

    function rewrite(path, html, callback) {
        var rewriter = new HTMLRewriter(path, html);

        function iterator(functionName) {
            var args = Array.prototype.slice.call(arguments, 1);

            return function (callback) {
                rewriter[functionName].apply(rewriter, args.concat([callback]));
            };
        }

        Async.series([
            iterator("links"),
            iterator("styles"),
            iterator("styleAttributes"),
            iterator("elements", 'iframe', 'src', null),
            iterator("elements", 'img', 'src', null),
            iterator("elements", 'script', 'src', 'text/javascript'),
            iterator("elements", 'source', 'src', null),
            iterator("elements", 'video', 'src', null),
            iterator("elements", 'audio', 'src', null),
        ], function finishedRewriteSeries(err, result) {
            // Return the processed HTML
            var html = rewriter.doc.documentElement.outerHTML;
            callback(err, html);
        });
    }

    exports.rewrite = rewrite;
});
