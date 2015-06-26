/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define */
define(function (require, exports, module) {
    "use strict";

    var proxyCall = require("filesystem/impls/filer/RemoteFiler").proxyCall;
    var FilerUtils = require("filesystem/impls/filer/FilerUtils");
    var Path = FilerUtils.Path;
    var FilerBuffer = FilerUtils.Buffer;

    var proxyFS = {
        stat: function(path, callback) {
            proxyCall("stat", {args: [path]}, callback);
        },
        exists: function(path, callback) {
            proxyCall("exists", {args: [path]}, callback);
        },
        readdir: function(path, callback) {
            proxyCall("readdir", {args: [path]}, callback);
        },
        mkdir: function(path, callback) {
            proxyCall("mkdir", {args: [path]}, callback);
        },
        /**
         * Recursively creates the directory at `path`. If the parent
         * of `path` does not exist, it will be created. From:
         * https://github.com/filerjs/filer/blob/develop/src/shell/shell.js
         */
        mkdirp: function(path, callback) {
            callback = callback || function(){};

            // We don't have direct access to Filer.Errors, fake it.
            function filerError(code, msg) {
                var err = new Error(msg);
                err.code = code;
                return err;
            }

            if(!path) {
                return callback(filerError("EINVAL", "missing path argument"));
            } else if (path === "/") {
                return callback();
            }

            function _mkdirp(path, callback) {
                var parent;

                proxyFS.stat(path, function(err, stat) {
                    if(stat) {
                        if(stat.type === "DIRECTORY") {
                            callback();
                        } else if (stat.type === "FILE") {
                            callback(filerError("ENOTDIR", path));
                        }
                    } else if (err && err.code !== "ENOENT") {
                        callback(err);
                    } else {
                        parent = Path.dirname(path);
                        if(parent === "/") {
                            proxyFS.mkdir(path, function (err) {
                                if (err && err.code !== "EEXIST") {
                                    return callback(err);
                                }

                                callback();
                            });
                        } else {
                            _mkdirp(parent, function (err) {
                                if (err) {
                                    return callback(err);
                                }

                                proxyFS.mkdir(path, function (err) {
                                    if (err && err.code !== "EEXIST") {
                                        return callback(err);
                                    }

                                    callback();
                                });
                            });
                        }
                    }
                });
            }

            _mkdirp(path, callback);
        },
        rmdir: function(path, callback) {
            proxyCall("rmdir", {args: [path]}, callback);
        },
        unlink: function(path, callback) {
            proxyCall("unlink", {args: [path]}, callback);
        },
        rename: function(oldPath, newPath, callback) {
            proxyCall("rename", {args: [oldPath, newPath]}, callback);
        },
        readFile: function(path, options, callback) {
            if(typeof options === "function") {
                callback = options;
                options = {};
            }

            // Always do binary reads, and decode in callback if necessary
            proxyCall("readFile", {args: [path, {encoding: null}]}, function(err, data) {
                if(err) {
                    callback(err);
                    return;
                }

                data = new FilerBuffer(data);
                if(options && (options === "utf8" || options.encoding === "utf8")) {
                    data = data.toString("utf8");
                }

                callback(null, data);
            });
        },
        writeFile: function(path, data, encoding, callback) {
            if(typeof encoding === "function") {
                callback = encoding;
                encoding = null;
            }

            // Always do binary write, and send ArrayBuffer over transport
            if (typeof(data) === "string") {
                data = new FilerBuffer(data, "utf8");
            }

            var buffer = data.buffer;
            var options = {
                args: [
                    path,
                    buffer,
                    {encoding: null}
                ],
                transfer: buffer
            };

            proxyCall("writeFile", options, callback);
        },
        watch: function(path, options, callback) {
            proxyCall("watch", {args: [path, options], persist: true}, callback);
        }
    };

    module.exports = {
        Path: Path,
        Buffer: FilerBuffer,
        fs: function() {
            return proxyFS;
        }
    };
});
