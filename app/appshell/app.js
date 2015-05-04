/*jshint globalstrict:true, node:true*/

"use strict";

var _ = require("lodash");
var path = require("path");
var utils = require("../utils");

var remote = require("remote");
var Menu = remote.require("menu");

var menuTemplate = [];

var REMOTE_DEBUGGING_PORT = 9234; // this is hardcoded in brackets-shell

var app = module.exports = {
    ERR_CL_TOOLS_CANCELLED: 12,
    ERR_CL_TOOLS_MKDIRFAILED: 14,
    ERR_CL_TOOLS_NOTSUPPORTED: 17,
    ERR_CL_TOOLS_RMFAILED: 13,
    ERR_CL_TOOLS_SERVFAILED: 16,
    ERR_CL_TOOLS_SYMLINKFAILED: 15,
    ERR_NODE_FAILED: -3,
    ERR_NODE_NOT_YET_STARTED: -1,
    ERR_NODE_PORT_NOT_YET_SET: -2,
    NO_ERROR: 0,
    // TODO: this should be changeable
    language: "en",
    // underscore electron custom props
    _startup: process.hrtime()
};

var __refreshMenu = _.debounce(function () {
    Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));
}, 100);

function _refreshMenu(callback) {
    __refreshMenu();
    process.nextTick(callback);
}

function _findMenuItemById(id, where) {
    where = where || menuTemplate;
    var result = _.find(where, {id: id});
    if (!result) {
        var results = _.compact(where.map(function (menuItem) {
            return menuItem.submenu ? _findMenuItemById(id, menuItem.submenu) : null;
        }));
        return results.length > 0 ? results[0] : null;
    }
    return result;
}

function _addBeforeOrAfter(obj, target, position, relativeId) {
    var idx = _.findIndex(target, {id: relativeId});
    if (idx === -1) {
        throw new Error("can't find item with id: " + relativeId);
    }
    if (position === "after") {
        idx++;
    }
    target.splice(idx, 0, obj);
}

function _fixBracketsKeyboardShortcut(shortcut) {
    if (typeof shortcut !== "string" || shortcut.trim() === "") {
        return null;
    }

    shortcut = shortcut.replace(/-/g, "+");
    shortcut = shortcut.replace(/\u2190/g, "Left");
    shortcut = shortcut.replace(/\u2191/g, "Up");
    shortcut = shortcut.replace(/\u2192/g, "Right");
    shortcut = shortcut.replace(/\u2193/g, "Down");
    shortcut = shortcut.replace(/\u2212/g, "-");

    if (!shortcut.match(/^[\x00-\x7F]+$/)) {
        console.error("Non ASCII keyboard shortcut used: " + shortcut);
        shortcut = null;
    }

    return shortcut;
}

app.abortQuit = function () {
    // TODO: implement
    throw new Error("app.abortQuit not implemented");
};

app.addMenu = function (title, id, position, relativeId, callback) {
    if (position && ["before", "after"].indexOf(position) === -1) {
        throw new Error("position not implemented in addMenu");
    }

    var newObj = {
        id: id,
        label: title
    };

    if (position === "before" || position === "after") {
        _addBeforeOrAfter(newObj, menuTemplate, position, relativeId);
    } else {
        menuTemplate.push(newObj);
    }

    _refreshMenu(callback.bind(null, app.NO_ERROR));
};

app.addMenuItem = function (parentId, title, id, key, displayStr, position, relativeId, callback) {
    key = _fixBracketsKeyboardShortcut(key);

    if (position && ["before", "after"].indexOf(position) === -1) {
        throw new Error("position not implemented in addMenuItem: " + position);
    }

    var isSeparator = title === "---",
        newObj = {
        type: isSeparator ? "separator" : "normal",
        id: id,
        label: title,
        click: function () {
            window.brackets.shellAPI.executeCommand(id, true);
        }
    };

    if (key) {
        newObj.accelerator = key;
    }

    var parentObj = _findMenuItemById(parentId);
    if (!parentObj.submenu) {
        parentObj.submenu = [];
    }

    if (position === "before" || position === "after") {
        _addBeforeOrAfter(newObj, parentObj.submenu, position, relativeId);
    } else {
        parentObj.submenu.push(newObj);
    }

    _refreshMenu(callback.bind(null, app.NO_ERROR));
};

app.closeLiveBrowser = function (callback) {
    // TODO: implement
    callback(new Error("app.closeLiveBrowser not implemented"));
};

app.dragWindow = function () {
    // TODO: implement
    throw new Error("app.dragWindow not implemented");
};

app.getApplicationSupportDirectory = function () {
    // TODO: once stable, rename folderName to Brackets
    var folderName = "Brackets-electron-dev";
    if (process.platform === "win32") {
        return utils.convertWindowsPathToUnixPath(path.resolve(process.env.APPDATA, folderName));
    } else if (process.platform === "linux") {
        return path.resolve("/home/", process.env.USER, ".config", folderName);
    } else if (process.platform === "darwin") {
        return path.resolve("/Users/", process.env.USER, "Library", "Application Support", folderName);
    } else {
        throw new Error("getApplicationSupportDirectory() not implemented for platform " + process.platform);
    }
};

app.getDroppedFiles = function (callback) {
    // TODO: implement
    callback(new Error("app.getDroppedFiles not implemented"));
};

// return the number of milliseconds that have elapsed since the application was launched
app.getElapsedMilliseconds = function () {
    var diff = process.hrtime(app._startup);
    // diff = [ seconds, nanoseconds ]
    return diff[0] * 1000 + diff[1] / 1000000;
};

app.getMenuItemState = function (commandId, callback) {
    // TODO: implement
    callback(new Error("app.getDroppedFiles not implemented: " + commandId));
};

app.getMenuPosition = function (commandId, callback) {
    // TODO: implement
    callback(new Error("app.getMenuPosition not implemented: " + commandId));
};

app.getMenuTitle = function (commandId, callback) {
    // TODO: implement
    callback(new Error("app.getMenuTitle not implemented: " + commandId));
};

app.getNodeState = function (callback) {
    callback(null, app.NO_ERROR);
};

app.getPendingFilesToOpen = function (callback) {
    // TODO: implement
    callback(new Error("app.getPendingFilesToOpen not implemented"));
};

app.getRemoteDebuggingPort = function () {
    return REMOTE_DEBUGGING_PORT;
};

app.getUserDocumentsDirectory = function () {
    // TODO: implement
    throw new Error("app.getUserDocumentsDirectory not implemented");
};

app.getZoomLevel = function (callback) {
    // TODO: implement
    callback(new Error("app.getZoomLevel not implemented"));
};

app.installCommandLine = function (callback) {
    // TODO: implement
    callback(new Error("app.installCommandLine not implemented"));
};

app.openLiveBrowser = function (url, enableRemoteDebugging, callback) {
    // TODO: implement
    callback(new Error("app.openLiveBrowser not implemented" + url));
};

app.openURLInDefaultBrowser = function (url, callback) {
    // TODO: implement
    callback(new Error("app.openURLInDefaultBrowser not implemented" + url));
};

app.quit = function () {
    // TODO: implement
    throw new Error("app.quit not implemented");
};

app.removeMenu = function (commandId, callback) {
    // TODO: implement
    callback(new Error("app.removeMenu not implemented" + commandId));
};

app.removeMenuItem = function (commandId, callback) {
    // TODO: implement
    callback(new Error("app.removeMenuItem not implemented" + commandId));
};

app.setMenuItemShortcut = function (commandId, shortcut, displayStr, callback) {
    shortcut = _fixBracketsKeyboardShortcut(shortcut);
    var obj = _findMenuItemById(commandId);
    if (shortcut) {
        obj.accelerator = shortcut;
    } else {
        delete obj.accelerator;
    }
    _refreshMenu(callback.bind(null, app.NO_ERROR));
};

app.setMenuItemState = function (commandId, enabled, checked, callback) {
    var obj = _findMenuItemById(commandId);
    obj.enabled = enabled;
    obj.checked = checked;
    _refreshMenu(callback);
};

app.setMenuTitle = function (commandId, title, callback) {
    var obj = _findMenuItemById(commandId);
    obj.label = title;
    _refreshMenu(callback);
};

app.setZoomLevel = function (zoomLevel, callback) {
    // TODO: implement
    callback(new Error("app.setZoomLevel not implemented" + zoomLevel));
};

app.showDeveloperTools = function () {
    var win = remote.getCurrentWindow();
    win.openDevTools({detach: true});
};

app.showExtensionsFolder = function (appURL, callback) {
    // TODO: implement
    callback(new Error("app.showExtensionsFolder not implemented" + appURL));
};

app.showOSFolder = function (path, callback) {
    // TODO: implement
    callback(new Error("app.showOSFolder not implemented" + path));
};
