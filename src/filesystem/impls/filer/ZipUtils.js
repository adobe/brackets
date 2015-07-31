
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define */

define(function (require, exports, module) {
    "use strict";

    var CommandManager = require("command/CommandManager");
    var Commands       = require("command/Commands");
    var async          = require("filesystem/impls/filer/lib/async");
    var StartupState   = require("bramble/StartupState");
    var JSZip          = require("thirdparty/jszip/dist/jszip.min");
    var BlobUtils      = require("filesystem/impls/filer/BlobUtils");
    var Filer          = require("filesystem/impls/filer/BracketsFiler");
    var Buffer         = Filer.Buffer;
    var Path           = Filer.Path;
    var fs             = Filer.fs();

    // zipfile can be a path (string) to a zipfile, or raw binary data.
    function unzip(zipfile, options, callback) {
        if(typeof options === 'function') {
            callback = options;
            options = {};
        }
        options = options || {};
        callback = callback || function(){};

        if(!zipfile) {
            callback(new Error("missing zipfile argument"));
            return;
        }

        var root = StartupState.project("root");
        var destination = Path.resolve(options.destination || root);

        // Mac and Windows clutter zip files with extra files/folders we don't need
        function skipFile(filename) {
            var basename = Path.basename(filename);

            // Skip OS X additions we don't care about in the browser fs
            if(/^__MACOSX\//.test(filename)) {
                // http://superuser.com/questions/104500/what-is-macosx-folder
                return true;
            }
            if(basename === ".DS_Store") {
                // https://en.wikipedia.org/wiki/.DS_Store
                return true;
            }
            if(/^\._/.test(basename)) {
                // http://apple.stackexchange.com/questions/14980/why-are-dot-underscore-files-created-and-how-can-i-avoid-them
                return true;
            }

            // Skip Windows additiosn we don't care about in the browser fs
            if(/(Tt)humbs\.db/.test(basename)) {
                // https://en.wikipedia.org/wiki/Windows_thumbnail_cache
                return true;
            }
            if(basename === "desktop.ini") {
                // http://www.computerhope.com/issues/ch001060.htm
                return true;
            }

            // Include this file, don't skip.
            return false;
        }

        function _unzip(data){
            // TODO: it would be great to move this bit to a worker.
            var archive = new JSZip(data);
            var filenames = [];

            archive.filter(function(relPath, file) {
                if(skipFile(file.name)) {
                    return;
                }

                var isDir = file.options.dir;
                filenames.push({
                    absPath: Path.join(destination, file.name),
                    isDirectory: isDir,
                    data: isDir ? null : new Buffer(file.asArrayBuffer())
                });
            });

            function decompress(path, callback) {
                var basedir = Path.dirname(path.absPath);

                if(path.isDirectory) {
                    fs.mkdirp(path.absPath, callback);
                } else {
                    // XXX: some zip files don't seem to be structured such that dirs
                    // get created before files. Create base dir if not there yet.
                    fs.stat(basedir, function(err, stats) {
                        if(err) {
                            if(err.code !== "ENOENT") {
                                return callback(err);
                            }

                            fs.mkdirp(basedir, function(err) {
                                if(err) {
                                    return callback(err);
                                }
                                fs.writeFile(path.absPath, path.data, callback);
                            });
                        } else {
                            fs.writeFile(path.absPath, path.data, callback);
                        }
                    });
                }
            }

            async.eachSeries(filenames, decompress, function(err) {
                if(err) {
                    return callback(err);
                }

                // Generate Blob URLs for all the files we imported so they work
                // in the preview. 
                BlobUtils.preload(root, function(err) {
                    if(err) {
                        return callback(err);
                    }

                    // Update the file tree to show the new files
                    CommandManager.execute(Commands.FILE_REFRESH).always(callback);
                });
            });
        }

        if(typeof zipfile === "string") {
            fs.readFile(Path.resolve(root, zipfile), function(err, data) {
                if(err) {
                    return callback(err);
                }

                _unzip(data);
            });
        } else {
            // zipfile is raw zip data, process it directly
            _unzip(zipfile);
        }
    }

    function zip(zipfile, paths, options, callback) {
        if(typeof options === 'function') {
            callback = options;
            options = {};
        }
        options = options || {};
        callback = callback || function(){};

        if(!zipfile) {
            return callback(new Error("missing zipfile argument"));
        }
        if(!paths) {
            return callback(new Error("missing paths argument"));
        }
        if(typeof paths === "string") {
            paths = [paths];
        }

        var root = StartupState.project("root");
        zipfile = Path.resolve(root, zipfile);

        function toRelPath(path) {
            // Make path relative within the zip
            return path.replace(/^\//, '');
        }

        function addFile(path, callback) {
            fs.readFile(path, function(err, data) {
                if(err) {
                    return callback(err);
                }

                archive.file(toRelPath(path), data.buffer, {binary: true});
                callback();
            });
        }

        function addDir(path, callback) {
            fs.readdir(path, function(err, list) {
                // Add the directory itself
                archive.folder(toRelPath(path));

                if(!options.recursive) {
                    return callback();
                }

                // Add all children of this dir, too
                async.eachSeries(list, function(entry, callback) {
                    add(Path.join(path, entry), callback);
                }, callback);
            });
        }

        function add(path, callback) {
            path = Path.resolve(root, path);

            fs.stat(path, function(err, stats) {
                if(err) {
                    return callback(err);
                }

                if(stats.type === "DIRECTORY") {
                    addDir(path, callback);
                } else {
                    addFile(path, callback);
                }
            });
        }

        var archive = new JSZip();

        // Make sure the zipfile doesn't already exist.
        fs.exists(zipfile, function(exists) {
            if(exists) {
                return callback(new Error('zipfile already exists', zipfile));
            }

            async.eachSeries(paths, add, function(err) {
                if(err) {
                    return callback(err);
                }

                var compressed = archive.generate({type: 'arraybuffer'});
                fs.writeFile(zipfile, compressed, callback);
            });
        });
    }

    exports.zip = zip;
    exports.unzip = unzip;
});
