/* jslint newcap:true */

define(function (require, exports, module) {
    "use strict";

    var Map = require("thirdparty/immutable").Map;
    var _ui;
    var _project;

    /**
     * UI state (fontSize, theme) that comes in from the hosting
     * app on startup.
     */
    exports.ui = function(property) {
        return _ui ? _ui.get(property) : null;
    };

    exports.ui.init = function(state) {
        _ui = Map(state);
    };

    /**
     * Project state (e.g., root, file to open first) that comes in
     * from the hosting app on startup.
     */
    exports.project = function(property) {
        return _project ? _project.get(property) : null;
    };

    exports.project.init = function(state) {
        _project = Map(state);
    };
});
