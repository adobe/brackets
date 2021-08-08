/**
 * @license Copyright (c) 2010-2011, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */

/*jslint plusplus: false, octal:false, strict: false */
/*global require: false, exports: false */

var fs = require('fs'),
    path = require('path'),
    file, prop;

function mkDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, 0777);
    }
}

function mkFullDir(dir) {
    var parts = dir.split('/'),
        currDir = '',
        first = true;
    parts.forEach(function (part) {
        //First part may be empty string if path starts with a slash.
        currDir += part + '/';
        first = false;

        if (part) {
            mkDir(currDir);
        }
    });
}

file = {
    backSlashRegExp: /\\/g,
    getLineSeparator: function () {
        return '/';
    },

    exists: function (fileName) {
        return fs.existsSync(fileName);
    },

    parent: function (fileName) {
        var parts = fileName.split('/');
        parts.pop();
        return parts.join('/');
    },

    /**
     * Gets the absolute file path as a string, normalized
     * to using front slashes for path separators.
     * @param {String} fileName
     */
    absPath: function (fileName) {
        return path.normalize(fs.realpathSync(fileName).replace(/\\/g, '/'));
    },

    normalize: function (fileName) {
        return path.normalize(fileName);
    },

    isFile: function (path) {
        return fs.statSync(path).isFile();
    },

    isDirectory: function (path) {
        return fs.statSync(path).isDirectory();
    },

    getFilteredFileList: function (/*String*/startDir, /*RegExp*/regExpFilters, /*boolean?*/makeUnixPaths) {
        //summary: Recurses startDir and finds matches to the files that match regExpFilters.include
        //and do not match regExpFilters.exclude. Or just one regexp can be passed in for regExpFilters,
        //and it will be treated as the "include" case.
        //Ignores files/directories that start with a period (.).
        var files = [], topDir, regExpInclude, regExpExclude, dirFileArray,
            i, stat, filePath, ok, dirFiles, fileName;

        topDir = startDir;

        regExpInclude = regExpFilters.include || regExpFilters;
        regExpExclude = regExpFilters.exclude || null;

        if (fs.existsSync(topDir)) {
            dirFileArray = fs.readdirSync(topDir);
            for (i = 0; i < dirFileArray.length; i++) {
                fileName = dirFileArray[i];
                filePath = path.join(topDir, fileName);
                stat = fs.statSync(filePath);
                if (stat.isFile()) {
                    if (makeUnixPaths) {
                        //Make sure we have a JS string.
                        if (filePath.indexOf("/") === -1) {
                            filePath = filePath.replace(/\\/g, "/");
                        }
                    }

                    ok = true;
                    if (regExpInclude) {
                        ok = filePath.match(regExpInclude);
                    }
                    if (ok && regExpExclude) {
                        ok = !filePath.match(regExpExclude);
                    }

                    if (ok && !fileName.match(/^\./)) {
                        files.push(filePath);
                    }
                } else if (stat.isDirectory() && !fileName.match(/^\./)) {
                    dirFiles = this.getFilteredFileList(filePath, regExpFilters, makeUnixPaths);
                    files.push.apply(files, dirFiles);
                }
            }
        }

        return files; //Array
    },

    copyDir: function (/*String*/srcDir, /*String*/destDir, /*RegExp?*/regExpFilter, /*boolean?*/onlyCopyNew) {
        //summary: copies files from srcDir to destDir using the regExpFilter to determine if the
        //file should be copied. Returns a list file name strings of the destinations that were copied.
        regExpFilter = regExpFilter || /\w/;

        var fileNames = file.getFilteredFileList(srcDir, regExpFilter, true),
        copiedFiles = [], i, srcFileName, destFileName;

        for (i = 0; i < fileNames.length; i++) {
            srcFileName = fileNames[i];
            destFileName = srcFileName.replace(srcDir, destDir);

            if (file.copyFile(srcFileName, destFileName, onlyCopyNew)) {
                copiedFiles.push(destFileName);
            }
        }

        return copiedFiles.length ? copiedFiles : null; //Array or null
    },

    copyFile: function (/*String*/srcFileName, /*String*/destFileName, /*boolean?*/onlyCopyNew) {
        //summary: copies srcFileName to destFileName. If onlyCopyNew is set, it only copies the file if
        //srcFileName is newer than destFileName. Returns a boolean indicating if the copy occurred.
        var parentDir;

        //logger.trace("Src filename: " + srcFileName);
        //logger.trace("Dest filename: " + destFileName);

        //If onlyCopyNew is true, then compare dates and only copy if the src is newer
        //than dest.
        if (onlyCopyNew) {
            if (fs.existsSync(destFileName) && fs.statSync(destFileName).mtime.getTime() >= fs.statSync(srcFileName).mtime.getTime()) {
                return false; //Boolean
            }
        }

        //Make sure destination dir exists.
        parentDir = path.dirname(destFileName);
        if (!fs.existsSync(parentDir)) {
            mkFullDir(parentDir);
        }

        fs.writeFileSync(destFileName, fs.readFileSync(srcFileName, 'binary'), 'binary');
        return true; //Boolean
    },

    /**
     * Reads a *text* file.
     */
    readFile: function (/*String*/path, /*String?*/encoding) {
        if (encoding === 'utf-8') {
            encoding = 'utf8';
        }
        if (!encoding) {
            encoding = 'utf8';
        }

        return fs.readFileSync(path, encoding);
    },

    saveUtf8File: function (/*String*/fileName, /*String*/fileContents) {
        //summary: saves a *text* file using UTF-8 encoding.
        file.saveFile(fileName, fileContents, "utf8");
    },

    saveFile: function (/*String*/fileName, /*String*/fileContents, /*String?*/encoding) {
        //summary: saves a *text* file.
        var parentDir;

        if (encoding === 'utf-8') {
            encoding = 'utf8';
        }
        if (!encoding) {
            encoding = 'utf8';
        }

        //Make sure destination directories exist.
        parentDir = path.dirname(fileName);
        if (!fs.existsSync(parentDir)) {
            mkFullDir(parentDir);
        }

        fs.writeFileSync(fileName, fileContents, encoding);
    },

    deleteFile: function (/*String*/fileName) {
        //summary: deletes a file or directory if it exists.
        var files, i, stat;
        if (fs.existsSync(fileName)) {
            stat = fs.statSync(fileName);
            if (stat.isDirectory()) {
                files = fs.readdirSync(fileName);
                for (i = 0; i < files.length; i++) {
                    this.deleteFile(path.join(fileName, files[i]));
                }
                fs.rmdirSync(fileName);
            } else {
                fs.unlinkSync(fileName);
            }
        }
    }
};

for (prop in file) {
    if (file.hasOwnProperty(prop)) {
        exports[prop] = file[prop];
    }
}
