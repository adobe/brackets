/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define */

define(function (require, exports, module) {
    "use strict";

    var FileSystemError = require("filesystem/FileSystemError"),
        FileSystemStats = require("filesystem/FileSystemStats"),
        BracketsFiler   = require("filesystem/impls/filer/BracketsFiler"),
        BlobUtils       = require("filesystem/impls/filer/BlobUtils"),
        decodePath      = require("filesystem/impls/filer/FilerUtils").decodePath,
        Handlers        = require("filesystem/impls/filer/lib/handlers"),
        Content         = require("filesystem/impls/filer/lib/content"),
        Async           = require("utils/Async"),
        BrambleEvents   = require("bramble/BrambleEvents");

    var fs              = BracketsFiler.fs(),
        Path            = BracketsFiler.Path,
        watchers        = {};

    // We currently do *not* do write consistency checks, since only a single instance
    // of the app tends to use a mounted path at a time in Bramble.  If you need to
    // change this (e.g., multiple editor instances in different tabs sharing a project root),
    // enable this.
    var _doConsistencyCheck = false;

    var _changeCallback;            // Callback to notify FileSystem of watcher changes

    function showOpenDialog(allowMultipleSelection, chooseDirectories, title, initialPath, fileTypes, callback) {
        throw new Error("Filer dialogs not supported. See: https://github.com/humphd/brackets/pull/309");
    }

    function showSaveDialog(title, initialPath, defaultName, callback) {
        throw new Error("Filer dialogs not supported. See: https://github.com/humphd/brackets/pull/309");
    }

    /**
     * Convert Filer error codes to FileSystemError values.
     *
     * @param {?Object} err A Filer error code or Brackets error string
     * @return {?string} A FileSystemError string, or null if there was no error code.
     * @private
     **/
    function _mapError(err) {
        if (!err) {
            return null;
        }

        // If we get a raw Brackets error string passed through,
        // we don't need to map anything, and can just use it directly.
        if (typeof err === "string") {
            return err;
        }

        // Otherwise it's a Filer error, try and use err.code
        switch (err.code) {
        case 'EINVAL':
            return FileSystemError.INVALID_PARAMS;
        case 'ENOENT':
            return FileSystemError.NOT_FOUND;
        case 'EROFS':
            return FileSystemError.NOT_WRITABLE;
        case 'ENOSPC':
            return FileSystemError.OUT_OF_SPACE;
        case 'ENOTEMPTY':
            // There's no good case for this in Brackets (trying to rmdir non-empty dir)
            return "Directory Not Empty";
        case 'EEXIST':
            return FileSystemError.ALREADY_EXISTS;
        case 'ENOTDIR':
            return FileSystemError.INVALID_PARAMS;
        case 'EBADF':
            return FileSystemError.NOT_READABLE;
        }

        // We don't know what this is, log it. We likely need a new case above.
        console.log('[Brackets Filesystem] Unknown I/O error', err);
        return FileSystemError.UNKNOWN;
    }

    /**
     * Convert a callback to one that transforms its first parameter from a
     * Filer error code to a FileSystemError string.
     *
     * @param {function(?number)} cb A callback that expects an Filer error code
     * @return {function(?string)} A callback that expects a FileSystemError string
     * @private
     **/
    function _wrap(cb) {
        return function (err) {
            var args = Array.prototype.slice.call(arguments);
            args[0] = _mapError(args[0]);
            cb.apply(null, args);
        };
    }

    function stat(path, callback) {
        path = decodePath(path);

        fs.stat(path, function(err, stats) {
            if (err){
                callback(_mapError(err));
                return;
            }

            var mtime = new Date(stats.mtime);

            var options = {
                isFile: stats.type === "FILE",
                mtime: mtime,
                size: stats.size,
                // TODO: figure out how to deal with realPath
                realPath: path,
                hash: mtime.getTime()
            };

            var fsStats = new FileSystemStats(options);

            callback(null, fsStats);
        });
    }


    function exists(path, callback) {
        path = decodePath(path);

        fs.exists(path, function(exists) {
            callback(null, exists);
        });
    }

    function readdir(path, callback) {
        path = decodePath(path);
        path = Path.normalize(path);

        fs.readdir(path, function (err, contents) {
            if (err) {
                callback(_mapError(err));
                return;
            }

            var count = contents.length;
            if (!count) {
                callback(null, [], []);
                return;
            }

            var stats = [];
            contents.forEach(function (val, idx) {
                stat(Path.join(path, val), function (err, stat) {
                    stats[idx] = err || stat;
                    count--;
                    if (count <= 0) {
                        callback(null, contents, stats);
                    }
                });
            });
        });
    }

    function mkdir(path, mode, callback) {
        path = decodePath(path);

        if(typeof mode === 'function') {
            callback = mode;
        }

        fs.mkdir(path, mode, function (err) {
            if (err) {
                callback(_mapError(err));
                return;
            }
            stat(path, callback);
        });
    }

    function rename(oldPath, newPath, callback) {
        oldPath = decodePath(oldPath);
        newPath = decodePath(newPath);

        function updateBlobURL(err) {
            if(err) {
                return callback(_mapError(err));
            }

            // If this was a rename on a file path, update the Blob cache too
            stat(newPath, function(err, stat) {
                if(err) {
                    return callback(_mapError(err));
                }

                if(stat.isFile) {
                    BlobUtils.rename(oldPath, newPath);
                    BrambleEvents.triggerFileRenamed(oldPath, newPath);
                }

                callback();
            });
        }

        fs.rename(oldPath, newPath, _wrap(updateBlobURL));
    }

    function readFile(path, options, callback) {
        path = decodePath(path);

        if(typeof options === 'function') {
            callback = options;
        }
        options = options || {};
        options.encoding = options.encoding === null ? null : "utf8";

        // Execute the read and stat calls in parallel. Callback early if the
        // read call completes first with an error; otherwise wait for both
        // to finish.
        var done = false, data, stat, err;

        if (options.stat) {
            done = true;
            stat = options.stat;
        } else {
            exports.stat(path, function (_err, _stat) {
                if (done) {
                    callback(_err, _err ? null : data, _stat);
                } else {
                    done = true;
                    stat = _stat;
                    err = _err;
                }
            });
        }

        fs.readFile(path, options.encoding, function (_err, _data) {
            if (_err) {
                callback(_mapError(_err));
                return;
            }

            if (done) {
                callback(err, err ? null : _data, stat);
            } else {
                done = true;
                data = _data;
            }
        });
    }

    function writeFile(path, data, options, callback) {
        path = decodePath(path);

        if(typeof options === 'function') {
            callback = options;
            options = null;
        }
        options = options || {};
        options.encoding = options.encoding === null ? null : "utf8";

        // We rewrite and create a BLOB URL in Bramble, then run the
        // remote FS operation, such that resources are ready when needed later.
        function _finishWrite(created) {
            var result = {};

            function runStep(fn) {
                var result = new $.Deferred();

                fn(function(err) {
                    if(err) {
                        result.reject(err);
                        return;
                    }
                    result.resolve();
                });

                return result.promise();
            }

            Async.doSequentially([
                // We need to rewrite and cache first, before we transfer ownership of the data
                function step1RewriteAndCache(callback) {
                    // Add a BLOB cache record for this filename
                    // only if it's not an HTML file
                    if(Content.isHTML(Path.extname(path))) {
                        callback();
                    } else {
                        Handlers.handleFile(path, data, callback);
                    }
                },
                // Once this runs, data is no longer owned by this window
                function step2RemoteWriteFile(callback) {
                    fs.writeFile(path, data, options.encoding, function (err) {
                        if (err) {
                            callback(err);
                            return;
                        }

                        stat(path, function (err, stat) {
                            result.stat = stat;
                            result.created = created;
                            callback(err);
                        });
                    });
                }
            ], runStep, true).then(function(err) {
                if(err) {
                    callback(_mapError(err));
                    return;
                }

                callback(null, result.stat, result.created);
            });
        }

        stat(path, function (err, stats) {
            if (err) {
                switch (err) {
                case FileSystemError.NOT_FOUND:
                    _finishWrite(true);
                    break;
                default:
                    callback(err);
                }
                return;
            }

            if (_doConsistencyCheck                    &&
                options.hasOwnProperty("expectedHash") &&
                options.expectedHash !== stats._hash) {
                console.error("Blind write attempted: ", path, stats._hash, options.expectedHash);

                if (options.hasOwnProperty("expectedContents")) {
                    fs.readFile(path, options.encoding, function (_err, _data) {
                        if (_err || _data !== options.expectedContents) {
                            callback(FileSystemError.CONTENTS_MODIFIED);
                            return;
                        }

                        _finishWrite(false);
                    });
                    return;
                } else {
                    callback(FileSystemError.CONTENTS_MODIFIED);
                    return;
                }
            }

            _finishWrite(false);
        });
    }

    function _rmfr(path, callback) {
        // Regardless of whether we're passed a file or dir path, recursively delete it all.
        fs.rm(path, {recursive: true}, function(err) {
            if (err) {
                callback(_mapError(err));
                return;
            }

            // TODO: deal with the symlink case (i.e., only remove cache
            // item if file is really going away).
            BlobUtils.remove(path).forEach(function(filename) {
                BrambleEvents.triggerFileRemoved(filename);
            });

            callback();
        });
    }

    function unlink(path, callback) {
        path = decodePath(path);
        _rmfr(path, callback);
    }

    function moveToTrash(path, callback) {
        path = decodePath(path);
        // TODO: do we want to support a .trash/ dir or the like?
        _rmfr(path, callback);
    }

    function initWatchers(changeCallback, offlineCallback) {
        _changeCallback = changeCallback;
    }

    function watchPath(path, filterGlobs, callback) {
        path = decodePath(path);
        path = Path.normalize(path);

        // Brackets now allows passing globs for filtering watch paths.  We ignore.
        if(typeof filterGlobs === 'function') {
            callback = filterGlobs;
        }

        if(watchers[path]) {
            return;
        }
        watchers[path] = fs.watch(path, {recursive: true}, function(event, filename) {
            stat(filename, function(err, stats) {
                if(err) {
                    return;
                }
                _changeCallback(filename, stats);
            });
        });
        callback();
    }

    function unwatchPath(path, callback) {
        path = decodePath(path);
        path = Path.normalize(path);

        if(watchers[path]) {
            watchers[path].close();
            delete watchers[path];
        }
        callback();
    }

    function unwatchAll(callback) {
        Object.keys(watchers).forEach(function(path) {
            unwatchPath(path, function(){});
        });
        callback();
    }

    // Export public API
    exports.showOpenDialog  = showOpenDialog;
    exports.showSaveDialog  = showSaveDialog;
    exports.exists          = exists;
    exports.readdir         = readdir;
    exports.mkdir           = mkdir;
    exports.rename          = rename;
    exports.stat            = stat;
    exports.readFile        = readFile;
    exports.writeFile       = writeFile;
    exports.unlink          = unlink;
    exports.moveToTrash     = moveToTrash;
    exports.initWatchers    = initWatchers;
    exports.watchPath       = watchPath;
    exports.unwatchPath     = unwatchPath;
    exports.unwatchAll      = unwatchAll;

    exports.recursiveWatch    = true;
    exports.normalizeUNCPaths = false;
});
