var fspath = require("path");
var chokidar = require('chokidar');

/**
 * Transform Node's native fs.stats to a format that can be sent through domain
 * @param {stats} nodeFsStats Node's fs.stats result
 * @return {object} Can be consumed by new FileSystemStats(object); in Brackets
 */
function normalizeStats(nodeFsStats) {
    // from shell: If "filename" is a symlink,
    // realPath should be the actual path to the linked object
    // not implemented in shell yet
    return {
        isFile: nodeFsStats.isFile(),
        isDirectory: nodeFsStats.isDirectory(),
        mtime: nodeFsStats.mtime,
        size: nodeFsStats.size,
        realPath: null,
        hash: nodeFsStats.mtime.getTime()
    };
}

function watchPath(path, ignored, _watcherMap) {
    if (_watcherMap.hasOwnProperty(path)) {
        return;
    }

    try {
        var watcher = chokidar.watch(path, {
            persistent: true,
            ignoreInitial: true,
            ignorePermissionErrors: true,
            followSymlinks: true,
            ignored: ignored,
            interval: 1000, // while not used in normal cases, if any error causes chokidar to fallback to polling, increase its intervals
            binaryInterval: 1000
        });

        watcher.on("all", function (type, filename, nodeFsStats) {
            var event;
            switch (type) {
            case "change":
                event = "changed";
                break;
            case "add":
            case "addDir":
                event = "created";
                break;
            case "unlink":
            case "unlinkDir":
                event = "deleted";
                break;
            default:
                event = null;
            }
            if (!event || !filename) {
                return;
            }
            // make sure stats are normalized for domain transfer
            var statsObj = nodeFsStats ? normalizeStats(nodeFsStats) : null;
            // make sure it's normalized
            filename = filename.replace(/\\/g, "/");
            var parentDirPath = fspath.dirname(filename) + "/";
            var entryName = fspath.basename(filename);
            _domainManager.emitEvent("fileWatcher", "change", [event, parentDirPath, entryName, statsObj]);
        });

        _watcherMap[path] = watcher;

        watcher.on("error", function (err) {
            console.error("Error watching file " + path + ": " + (err && err.message));
            unwatchPath(path);
        });
    } catch (err) {
        console.warn("Failed to watch file " + path + ": " + (err && err.message));
    }
}

exports.watchPath = watchPath;
