/* jslint newcap:true */

define(function (require, exports, module) {
    "use strict";

    var Map = require("thirdparty/immutable").Map;
    var _ui;
    var _project;
    var _url;

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


    /**
     * Depending on where Bramble is hosted, this helps you get a useful
     * url prefix.  Most callers will want url("base") to get http://bramble.com/dist/
     * for constructing URLs to things in src/* or dist/*
     */
    exports.url = function(property) {
        return _url ? _url.get(property) : null;
    };

    _url = Map({
        origin: window.location.origin,
        host: window.location.host,
        base: window.location.origin + window.location.pathname.replace(/\/index.html*$/, "/")
    });

});
