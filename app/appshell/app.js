/*jshint globalstrict:true, node:true*/

"use strict";

var _ = require("lodash");
var path = require("path");
var remote = require("remote");

var BrowserWindow = remote.require("browser-window");
var Menu = remote.require("menu");
var menuTemplate = [];

var _refreshMenu = _.debounce(function () {
    Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));
}, 100);

function refreshMenu(callback) {
    _refreshMenu();
    process.nextTick(callback);
}

function findMenuItemById(id, where) {
    where = where || menuTemplate;
    var result = _.find(where, {id: id});
    if (!result) {
        var results = _.compact(where.map(function (menuItem) {
            return menuItem.submenu ? findMenuItemById(id, menuItem.submenu) : null;
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

function addMenu(title, id, position, relativeId, callback) {
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

    refreshMenu(callback.bind(null, 0));
}

function addMenuItem(parentId, title, id, key, displayStr, position, relativeId, callback) {
    if (position && ["before", "after"].indexOf(position) === -1) {
        throw new Error("position not implemented in addMenuItem: " + position);
    }

    var newObj = {
        id: id,
        label: title,
        click: function () {
            window.brackets.shellAPI.executeCommand(id, true);
        }
    };

    if (key) {
        key = key.replace(/-/g, "+");

        if (!key.match(/^[\x00-\x7F]+$/)) {
            console.error("Non ASCII key " + key + " for " + title);
            key = null;
        }

        if (key) {
            newObj.accelerator = key;
        }
    }

    var parentObj = findMenuItemById(parentId);
    if (!parentObj.submenu) {
        parentObj.submenu = [];
    }

    if (position === "before" || position === "after") {
        _addBeforeOrAfter(newObj, parentObj.submenu, position, relativeId);
    } else {
        parentObj.submenu.push(newObj);
    }

    refreshMenu(callback.bind(null, 0));
}

function setMenuItemState(commandid, enabled, checked, callback) {
    var obj = findMenuItemById(commandid);
    obj.enabled = enabled;
    obj.checked = checked;
    refreshMenu(callback);
}

function setMenuTitle(commandid, title, callback) {
    var obj = findMenuItemById(commandid);
    obj.label = title;
    refreshMenu(callback);
}

function fixPath(str) {
    return str.replace(/\\/g, "/");
}

function getApplicationSupportDirectory() {
    if (process.platform === "win32") {
        return fixPath(path.resolve(process.env.APPDATA, "Brackets"));
    } else {
        throw new Error("getApplicationSupportDirectory() not implemented for platform " + process.platform);
    }
}

function getNodeState(callback) {
    callback(null, -1);
}

function showDeveloperTools() {
    var windows = BrowserWindow.getAllWindows();
    var win = windows[0];
    win.openDevTools({detach: true});
}

module.exports = {
    addMenu: addMenu,
    addMenuItem: addMenuItem,
    getApplicationSupportDirectory: getApplicationSupportDirectory,
    getNodeState: getNodeState,
    setMenuItemState: setMenuItemState,
    setMenuTitle: setMenuTitle,
    showDeveloperTools: showDeveloperTools
};
