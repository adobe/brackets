/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define */
define(function (require, exports, module) {
    "use strict";

    var CommandManager = require("command/CommandManager");
    var Commands = require("command/Commands");
    var BracketsFiler = require("filesystem/impls/filer/BracketsFiler");
    var Handlers = require("filesystem/impls/filer/lib/handlers");
    var LanguageManager = require("language/LanguageManager");
    var ExtensionUtils = require("utils/ExtensionUtils");
    var marked = require("thirdparty/marked/marked.min");
    var StartupState = require("bramble/StartupState");
    var Path = BracketsFiler.Path;

    var _transforms = {};
    var _fs = BracketsFiler.fs();

    function _processExt(path) {
        return path.replace(/^\.?/, ".").toLowerCase();
    }

    function _register(transform) {
        _transforms[transform.srcExt] = transform;
    }

    function getTransform(path) {
        var ext = _processExt(Path.extname(path));
        return _transforms[ext];
    }

    // Can be called with or without data, and if data is missing, the file will be read.
    function applyTransform(path, data, callback) {
        if(typeof data === "function") {
            callback = data;
            data = null;
        }

        var transform = getTransform(path);
        if(!transform) {
            return callback(null);
        }

        function _applyTransform(path, data) {
            transform.transform(path, data, function(err, transformed) {
                if(err) {
                    console.error("[Bramble Error] unable to transform file", path, err);
                    return callback(err);
                }

                var transformedPath = transform.rewritePath(path);

                _fs.writeFile(transformedPath, transformed, function(err) {
                    if(err) {
                        console.error("[Bramble Error] unable to write transformed file", transformedPath, err);
                        return callback(err);
                    }

                    Handlers.handleFile(transformedPath, data, function(err) {
                        if(err) {
                            console.error("[Bramble Error] unable to rewrite URL for transformed file", transformedPath, err);
                            return callback(err);
                        }

                        // Refresh the file tree so this new file shows up.
                        CommandManager.execute(Commands.FILE_REFRESH).always(callback);
                    });
                });
            });
        }

        if(!data) {
            _fs.readFile(path, "utf8", function(err, data) {
                if(err) {
                    if(err.code === "ENOENT") {
                        // File is being created (not written yet) use empty string
                        data = "";
                    } else {
                        // Some other error, send it back
                        return callback(err);
                    }
                }

                _applyTransform(path, data);
            });
        } else {
            _applyTransform(path, data);
        }
    }


    function Transform(options, transformFn) {
        this.srcExt = _processExt(options.srcExt);
        this.destExt = _processExt(options.destExt);

        this.startComment = options.startComment || "<!--";
        this.endComment = options.endComment || "-->";

        this.transformFn = transformFn;
    }
    Transform.prototype.generateComment = function(path) {
        var original = Path.basename(path);
        var now = new Date();

        return this.startComment + "\n" +
            "This file was automatically generated from " + original + " on " + now +  ". " +
            "If you need to make changes, edit " + original + " directly instead of this file.\n" +
            this.endComment + "\n\n";
    };
    Transform.prototype.rewritePath = function(path) {
        return path.replace(this.srcExt, this.destExt);
    };
    Transform.prototype.transform = function(path, data, callback) {
        var self = this;

        // If the file is empty, nothing to do (some parsers die on empty files)
        if(!data) {
            return callback(null, self.generateComment(path));
        }

        self.transformFn(path, data, function(err, transformed) {
            if(err) {
                return callback(err);
            }

            // add a comment to the transformed content indicating that it was generated
            transformed = self.generateComment(path) + transformed;

            callback(null, transformed);
        });
    };


    function _setupMarkdownTransform() {
        function markdownToHTML(path, markdown, callback) {
            // Run the markdown through https://github.com/chjj/marked to get HTML
            // and style with https://github.com/sindresorhus/github-markdown-css
            var cssUrl = StartupState.url("base") + "thirdparty/github-markdown.css";
            var html = '<!DOCTYPE html><html>\n' +
                       '<head><link rel="stylesheet" href="' + cssUrl + '">\n' +
                       '<style>\n' +
                       '  .markdown-body {\n' +
                       '    min-width: 200px;\n' +
                       '    max-width: 790px;\n' +
                       '    margin: 0 auto;\n' +
                       '    padding: 20px;\n' +
                       '  }\n' +
                       '</style></head>\n' +
                       '<body><article class="markdown-body">\n' +
                       marked(markdown) + "\n" +
                       '</article></body></html>';

            callback(null, html);
        }

        var markdownExts = LanguageManager.getLanguage("markdown").getFileExtensions();
        markdownExts.forEach(function(ext) {
            _register(new Transform({srcExt: ext, destExt: "html"}, markdownToHTML));
        });
    }

    function _setupLessTransform() {
        function lessToCSS(path, less, callback) {
            ExtensionUtils.parseLessCode(less, path)
                .done(function(css) {
                    callback(null, css);
                })
                .fail(function() {
                    callback(new Error("[Bramble transform] unable to parse less file " + path));
                });
        }

        _register(new Transform({
            srcExt: "less",
            destExt: "css",
            startComment: "/**",
            endComment: "**/"
        }, lessToCSS));
    }

    function init() {
        LanguageManager.ready.always(function() {
            _setupMarkdownTransform();
            _setupLessTransform();
        });
    }

    init();

    exports.getTransform = getTransform;
    exports.applyTransform = applyTransform;
});
