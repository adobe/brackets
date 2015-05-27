define(function (require, exports, module) {
    "use strict";

    var Path = require("filesystem/impls/filer/FilerUtils").Path;

    var _root;
    var _filename;
    var _fullPath;

    // Used to set and get the root path and filename for the startup project.
    // This info comes to us via postMessage from the hosting app. Brackets
    // wants dir paths to include a trailing /, so we add one.
    exports.setInfo = function(root, filename) {
        _root = Path.normalize(root) + '/';
        _filename = filename;
        _fullPath = Path.join(_root, _filename);
    };

    exports.getInfo = function(path) {
        return {
            root: _root,
            filename: _filename,
            fullPath: _fullPath
        };
    };
});
