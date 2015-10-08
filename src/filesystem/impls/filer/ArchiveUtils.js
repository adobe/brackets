
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, Blob, Worker */

define(function (require, exports, module) {
    "use strict";

    var CommandManager  = require("command/CommandManager");
    var Commands        = require("command/Commands");
    var async           = require("filesystem/impls/filer/lib/async");
    var StartupState    = require("bramble/StartupState");
    var JSZip           = require("thirdparty/jszip/dist/jszip.min");
    var FileSystemCache = require("filesystem/impls/filer/FileSystemCache");
    var Filer           = require("filesystem/impls/filer/BracketsFiler");
    var saveAs          = require("thirdparty/FileSaver");
    var Buffer          = Filer.Buffer;
    var Path            = Filer.Path;
    var fs              = Filer.fs();

    // Mac and Windows clutter zip files with extra files/folders we don't need
    function _skipFile(filename) {
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

        // Skip Windows additions we don't care about in the browser fs
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

    function _refreshFilesystem(callback) {
        // Update the file tree to show the new files
        CommandManager.execute(Commands.FILE_REFRESH).always(function() {
            // Generate Blob URLs for all the files we imported
            FileSystemCache.refresh(callback);
        });
    }

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

        function _unzip(data){
            // TODO: it would be great to move this bit to a worker.
            var archive = new JSZip(data);
            var filenames = [];

            archive.filter(function(relPath, file) {
                if(_skipFile(file.name)) {
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

                _refreshFilesystem(callback);
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

    // Zip the entire project, starting at the project root.
    function archive(callback) {
        var root = StartupState.project("root");
        var rootRegex = new RegExp("^" + root + "\/?");

        // TODO: we should try to move this to a worker
        var jszip = new JSZip();

        function toRelProjectPath(path) {
            // Make path relative within the zip, rooted in a `project/` dir
            return path.replace(rootRegex, "project/");
        }

        function addFile(path, callback) {
            fs.readFile(path, {encoding: null}, function(err, data) {
                if(err) {
                    return callback(err);
                }

                jszip.file(toRelProjectPath(path), data.buffer, {binary: true});
                callback();
            });
        }

        function addDir(path, callback) {
            fs.readdir(path, function(err, list) {
                // Add the directory itself
                jszip.folder(toRelProjectPath(path));

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

        add(root, function(err) {
            if(err) {
                return callback(err);
            }

            var compressed = jszip.generate({type: 'arraybuffer'});
            var blob = new Blob([compressed], {type: "application/zip"});
            saveAs(blob, "project.zip");
            callback();
        });
    }

    function untar(tarArchive, callback) {
        var untarWorker = new Worker("thirdparty/bitjs/bitjs-untar.min.js");
        var root = StartupState.project("root");
        var pending = null;

        function extract(path, data, callback) {
            path = Path.resolve(root, path);
            var basedir = Path.dirname(path);

            if(_skipFile(path)) {
                return callback();
            }

            fs.mkdirp(basedir, function(err) {
                if(err && err.code !== "EEXIST") {
                    return callback(err);
                }

                fs.writeFile(path, new Buffer(data), {encoding: null}, callback);
            });
        }

        function finish(err) {
            untarWorker.terminate();
            untarWorker = null;

            callback(err); 
        }

        function writeCallback(err) {
            if(err) {
                console.error("[Bramble untar] couldn't extract file", err);
            }

            pending--;
            if(pending === 0) {
                _refreshFilesystem(finish);
            }
        }

        untarWorker.addEventListener("message", function(e) {
            var data = e.data;

            if(data.type === "progress" && pending === null) {
                // Set the total number of files we need to deal with so we know when we're done
                pending = data.totalFilesInArchive;
            } else if(data.type === "extract") {
                extract(data.unarchivedFile.filename, data.unarchivedFile.fileData, writeCallback);
            } else if(data.type === "error") {
                finish(new Error("[Bramble untar]: " + data.msg));
            }
        });

        untarWorker.postMessage({file: tarArchive.buffer});
    }

    exports.archive = archive;
    exports.unzip = unzip;
    exports.untar = untar;
});
