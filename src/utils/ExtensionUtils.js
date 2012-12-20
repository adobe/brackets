/*
 * Copyright (c) 2012 Adobe Systems Incorporated. All rights reserved.
 *  
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"), 
 * to deal in the Software without restriction, including without limitation 
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, 
 * and/or sell copies of the Software, and to permit persons to whom the 
 * Software is furnished to do so, subject to the following conditions:
 *  
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *  
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
 * DEALINGS IN THE SOFTWARE.
 * 
 */


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true */
/*global define, $, brackets, less, window */

/**
 * ExtensionUtils defines utility methods for implementing extensions.
 */
define(function (require, exports, module) {
    "use strict";
    
    var Async = require("utils/Async");
    
    // naïve match for import statements in CSS
    var RE_IMPORT = /@import\s+(?:url\()?\s*('|")([^'"]+)\1\s*(?:\))?;/g;
    
    /**
     * Appends a <style> tag to the document's head.
     *
     * @param {!string} css CSS code to use as the tag's content
     * @return {!HTMLStyleElement} The generated HTML node
     **/
    function addEmbeddedStyleSheet(css) {
        return $("<style>").text(css).appendTo("head")[0];
    }
    
    /**
     * Appends a <link> tag to the document's head.
     *
     * @param {!string} url URL to a style sheet
     * @return {!HTMLLinkElement} The generated HTML node
     **/
    function addLinkedStyleSheet(url) {
        var attributes = {
            type: "text/css",
            rel:  "stylesheet",
            href: url
        };
        return $("<link/>").attr(attributes).appendTo("head")[0];
    }

    /**
     * Parses LESS code and returns a promise that resolves with plain CSS code.
     *
     * Pass the {@link url} argument to resolve relative URLs contained in the code.
     * Make sure URLs in the code are wrapped in quotes, like so:
     *     background-image: url("image.png");
     *
     * @param {!string} code LESS code to parse
     * @param {?string} url URL to the file containing the code
     * @return {!$.Promise} A promise object that is resolved with CSS code if the LESS code can be parsed.
     */
    function parseLessCode(code, url) {
        var result = new $.Deferred(),
            options;
        
        if (url) {
            var dir  = url.slice(0, url.lastIndexOf("/") + 1),
                file = url.slice(dir.length);
            
            options = {
                filename: file,
                paths:    [dir]
            };
        }
        
        var parser = new less.Parser(options);
        parser.parse(code, function onParse(err, tree) {
            if (err) {
                result.reject(err);
            } else {
                result.resolve(tree.toCSS());
            }
        });
        
        return result.promise();
    }
    
    /**
     * Returns a path to an extension module.
     *
     * @param {!module} module Module provided by RequireJS
     * @param {?string} path Relative path from the extension folder to a file
     * @return {!string} The path to the module's folder
     **/
    function getModulePath(module, path) {
        var modulePath = module.uri.substr(0, module.uri.lastIndexOf("/") + 1);
        if (path) {
            modulePath += path;
        }
        
        return modulePath;
    }
    
    /**
     * Returns a URL to an extension module.
     *
     * @param {!module} module Module provided by RequireJS
     * @param {?string} path Relative path from the extension folder to a file
     * @return {!string} The URL to the module's folder
     **/
    function getModuleUrl(module, path) {
        var url = encodeURI(getModulePath(module, path));
        
        // On Windows, $.get() fails if the url is a full pathname. To work around this,
        // prepend "file:///". On the Mac, $.get() works fine if the url is a full pathname,
        // but *doesn't* work if it is prepended with "file://". Go figure.
        // However, the prefix "file://localhost" does work.
        if (brackets.platform === "win" && url.indexOf(":") !== -1) {
            url = "file:///" + url;
        }
        
        return url;
    }
    
    /**
     * Performs a GET request using a path relative to an extension module.
     *
     * The resulting URL can be retrieved in the resolve callback by accessing
     * 
     * @param {!module} module Module provided by RequireJS
     * @param {!string} path Relative path from the extension folder to a file
     * @return {!$.Promise} A promise object that is resolved with the contents of the requested file
     **/
    function loadFile(module, path) {
        var url     = getModuleUrl(module, path),
            promise = $.get(url);

        return promise;
    }
    
    /**
     * Loads a CSS style sheet and all nested import directives.
     *
     * @param {!module} module Module provided by RequireJS
     * @param {!string} path Relative path from the extension folder to a CSS file
     * @param {!boolean} link When true, the stylesheet is added to the document
     * @return {!$.Promise} A promise object that is resolved if when all
     *     stylesheet dependencies are loaded
     */
    function _loadCSSImports(module, path, link) {
        var deferred = new $.Deferred();
        
        loadFile(module, path)
            .done(function (content) {
                // scan for @import statements
                var url = this.url,
                    imports = [],
                    exec,
                    importsPromise,
                    linkElem;
                
                // optionally add the stylesheet to the document
                if (link) {
                    linkElem = addLinkedStyleSheet(url);
                }
                
                while ((exec = RE_IMPORT.exec(content)) !== null) {
                    imports.push(exec[2]);
                }

                if (imports.length > 0) {
                    // load all dependencies before resolving this import
                    var rootPath = path.substr(0, path.lastIndexOf("/") + 1);
                    importsPromise = Async.doInParallel(
                        imports,
                        function (oneImport) {
                            return _loadCSSImports(module, rootPath + oneImport, false);
                        },
                        true
                    );
                }
                
                // HACK: use img.src to detect a load event for the stylesheet
                // http://www.backalleycoder.com/2011/03/20/link-tag-css-stylesheet-load-event/
                var img = window.document.createElement("img");
                
                img.onerror = function () {
                    if (importsPromise) {
                        importsPromise.done(function () {
                            deferred.resolve(linkElem);
                        });
                    } else {
                        deferred.resolve(linkElem);
                    }
                };
                img.src = url;
            })
            .fail(deferred.reject);
        
        return deferred.promise();
    }
    
    /**
     * Loads a style sheet (CSS or LESS) relative to the extension module.
     *
     * @param {!module} module Module provided by RequireJS
     * @param {!string} path Relative path from the extension folder to a CSS or LESS file
     * @return {!$.Promise} A promise object that is resolved with an HTML node if the file can be loaded.
     */
    function loadStyleSheet(module, path) {
        var result = new $.Deferred();
        
        if (path.slice(-5) === ".less") {
            loadFile(module, path)
                .done(function (content) {
                    parseLessCode(content, this.url)
                        .done(function (css) {
                            result.resolve(addEmbeddedStyleSheet(css));
                        })
                        .fail(result.reject);
                })
                .fail(result.reject);
        } else {
            _loadCSSImports(module, path, true).pipe(result.resolve, result.reject);
        }
        
        return result.promise();
    }
    
    exports.addEmbeddedStyleSheet = addEmbeddedStyleSheet;
    exports.addLinkedStyleSheet   = addLinkedStyleSheet;
    exports.parseLessCode         = parseLessCode;
    exports.getModulePath         = getModulePath;
    exports.getModuleUrl          = getModuleUrl;
    exports.loadFile              = loadFile;
    exports.loadStyleSheet        = loadStyleSheet;
});
