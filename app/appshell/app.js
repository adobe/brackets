/*jshint globalstrict:true, node:true*/

"use strict";

var _ = require("lodash");
var path = require("path");
var remote = require("remote");

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

function addMenu(title, id, position, relativeId, callback) {
    if (position) {
        throw new Error("position not implemented in addMenu");
    }
    if (relativeId) {
        throw new Error("relativeId not implemented in addMenu");
    }

    menuTemplate.push({
        id: id,
        label: title
    });

    refreshMenu(callback.bind(null, 0));
}

function addMenuItem(parentId, title, id, key, displayStr, position, relativeId, callback) {
    if (position) {
        throw new Error("position not implemented in addMenuItem");
    }
    if (relativeId) {
        throw new Error("relativeId not implemented in addMenuItem");
    }

    var newObj = {
        id: id,
        label: title,
        click: function () {
            if (key) {
                throw new Error("key not implemented in addMenuItem");
            }
            throw new Error("click not implemented in addMenuItem");
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
    parentObj.submenu.push(newObj);

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

module.exports = {
    addMenu: addMenu,
    addMenuItem: addMenuItem,
    getApplicationSupportDirectory: getApplicationSupportDirectory,
    getNodeState: getNodeState,
    setMenuItemState: setMenuItemState,
    setMenuTitle: setMenuTitle
};
