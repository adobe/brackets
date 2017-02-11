/*global define*/
/*jslint bitwise: true */
define(function() {
    "use strict";

    var memoryStorage = {
        _items: {},
        getItem: function(key) {
            return memoryStorage._items[key];
        },
        setItem: function(key, value) {
            // Mimic localStorage string storage
            value = "" + value;
            memoryStorage._items[key] = value;
        },
        clear: function() {
            memoryStorage._items = {};
        }
    };

    var localStorage = (function(window) {
        if(typeof window.localStorage === 'undefined') {
            return memoryStorage;
        }
        return window.localStorage;
    }(window));

    function prefix(name) {
        return "bramble-property::" + name;
    }

    function getString(storage, property) {
        var val = storage.getItem(prefix(property));
        return val || null;
    }

    function getBool(storage, property) {
        var str = getString(storage, property);
        if(str === "true") {
            return true;
        } else if(str === "false") {
            return false;
        } else {
            // not set
            return null;
        }
    }

    function getInt(storage, property) {
        var str = getString(storage, property);
        return str|0;
    }

    function StateManager(disableStorage) {
        var storage;
        if(disableStorage) {
            // Wipe any data we have in storage now and use memory
            localStorage.clear();
            storage = memoryStorage;
        } else {
            storage = localStorage;
        }

        Object.defineProperties(this, {
            fontSize: {
                get: function()  { return getString(storage, "fontSize"); },
                set: function(v) { storage.setItem(prefix("fontSize"), v); }
            },
            theme: {
                get: function()  { return getString(storage, "theme"); } ,
                set: function(v) { storage.setItem(prefix("theme"), v); }
            },
            sidebarVisible: {
                get: function()  { return getBool(storage, "sidebarVisible");  },
                set: function(v) { storage.setItem(prefix("sidebarVisible"), v); }
            },
            sidebarWidth: {
                get: function()  { return getInt(storage, "sidebarWidth"); },
                set: function(v) { storage.setItem(prefix("sidebarWidth"), v); }
            },
            firstPaneWidth: {
                get: function()  { return getInt(storage, "firstPaneWidth");  },
                set: function(v) { storage.setItem(prefix("firstPaneWidth"), v); }
            },
            secondPaneWidth: {
                get: function()  { return getInt(storage, "secondPaneWidth"); },
                set: function(v) { storage.setItem(prefix("secondPaneWidth"), v); }
            },
            previewMode: {
                get: function()  { return getString(storage, "previewMode"); },
                set: function(v) { storage.setItem(prefix("previewMode"), v); }
            },
            filename: {
                get: function()  { return getString(storage, "filename"); },
                set: function(v) { storage.setItem(prefix("filename"), v); }
            },
            fullPath: {
                get: function()  { return getString(storage, "fullPath"); },
                set: function(v) { storage.setItem(prefix("fullPath"), v); }
            },
            wordWrap: {
                get: function()  { return getBool(storage, "wordWrap"); },
                set: function(v) { storage.setItem(prefix("wordWrap"), v); }
            },
            allowJavaScript: {
                get: function()  { return getBool(storage, "allowJavaScript"); },
                set: function(v) { storage.setItem(prefix("allowJavaScript"), v); }
            }
        });
    }

    return StateManager;
});
