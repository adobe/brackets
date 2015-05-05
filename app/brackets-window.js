#!/usr/bin/env electron

/*jshint globalstrict:true, node:true*/

"use strict";

// this is meant to replace default window.open
// see https://github.com/atom/electron/blob/master/docs/api/window-open.md

var assert = require("assert");
var BrowserWindow = require("browser-window");
var path = require("path");
var windows = {};

function resolveUrl(url) {
    if (Array.isArray(url)) {
        url = path.resolve.apply(path, url);
    }
    if (!url.match(/^[a-zA-Z]+:\/\//)) {
        url = "file://" + url;
    }
    return url;
}

function open(url, id, options) {
    assert(id, "id is required parameter");
    // close if exists, do not call .open for refresh
    if (windows[id]) {
        windows[id].close();
        windows[id] = null;
    }
    var win = new BrowserWindow({
        width: options.width || 800,
        height: options.height || 600,
        preload: require.resolve("./preload")
    });
    win.on("closed", function() {
        windows[id] = null;
    });
    win.loadUrl(resolveUrl(url));
    windows[id] = win;
    // do not send complex objects across remote when not required
    return id;
}

function isOpen(id) {
    return windows[id] != null;
}

function loadUrl(url, id) {
    assert(id, "id is required parameter");
    assert(windows[id], "window " + id + " is not open");
    windows[id].loadUrl(resolveUrl(url));
}

module.exports = {
    open: open,
    isOpen: isOpen,
    loadUrl: loadUrl
};
