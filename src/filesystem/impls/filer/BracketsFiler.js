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
            // Always do binary reads, and decode in callback if necessary
            proxyCall("readFile", {args: [path, {encoding: null}]}, function(err, data) {
                if(err) {
                    callback(err);
                    return;
                }

                data = new FilerBuffer(data);
                if(options === "utf8" || options.encoding === "utf8") {
                    data = data.toString("utf8");
                }

                callback(null, data);
            });
        },
        writeFile: function(path, data, encoding, callback) {
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
