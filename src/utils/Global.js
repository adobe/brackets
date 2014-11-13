/*
 * Copyright (c) 2012 Adobe Systems Incorporated. All rights reserved.
 *  
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"), 
 * to deal in the Software without restriction, including without limitation 
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, 
 * and/or sell copies of the Software, and to permit persons to whom the 
 * Software is furnished to do so, subject to the following conditions:
 *  
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *  
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
 * DEALINGS IN THE SOFTWARE.
 * 
 */


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true */
/*global define, brackets */

/**
 * Initializes the global "brackets" variable and it's properties.
 * Modules should not access the global.brackets object until either
 * (a) the module requires this module, i.e. require("utils/Global") or
 * (b) the module receives a "appReady" callback from the utils/AppReady module.
 */
define(function (require, exports, module) {
    "use strict";
    
    var configJSON      = require("text!config.json"),
        CommandManager  = require("command/CommandManager"),
        UrlParams       = require("utils/UrlParams").UrlParams;
    
    // Define core brackets namespace if it isn't already defined
    //
    // We can't simply do 'brackets = {}' to define it in the global namespace because
    // we're in "use strict" mode. Most likely, 'window' will always point to the global
    // object when this code is running. However, in case it isn't (e.g. if we're running 
    // inside Node for CI testing) we use this trick to get the global object.
    var Fn = Function, global = (new Fn("return this"))();
    if (!global.brackets) {
        global.appshell = global.brackets = {};
    }
        
    function execCallback(callback) {
        if (callback) {
            callback.call(global, 0); // NO_ERROR
        }
    }
    
    function parseShortcut(key) {
        var keyMatch = key && key.match(/(.+)-(.)$/),
            singleKey = (keyMatch && keyMatch[2]) || key,
            modifiers = (keyMatch && keyMatch[1]);
        
        return {
            key: singleKey,
            modifiers: modifiers && modifiers.toLowerCase()
        };
    }
    
    // Determine OS/platform
    if (global.navigator.platform === "MacIntel" || global.navigator.platform === "MacPPC") {
        global.brackets.platform = "mac";
    } else if (global.navigator.platform.indexOf("Linux") >= 0) {
        global.brackets.platform = "linux";
    } else {
        global.brackets.platform = "win";
    }
    
    // Import node's fs module
    if (window.nodeRequire) {
        var nodeFs = window.nodeRequire('fs'),
            gui = window.nodeRequire('nw.gui'),
            win = gui.Window.get();

        // Adapt to brackets's API
        global.brackets.fs = {
            NO_ERROR: 0,
            ERR_UNKNOWN: 1,
            ERR_INVALID_PARAMS: 2,
            ERR_NOT_FOUND: 3,
            ERR_CANT_READ: 4,
            ERR_UNSUPPORTED_ENCODING: 5,
            ERR_CANT_WRITE: 6,
            ERR_OUT_OF_SPACE: 7,
            ERR_NOT_FILE: 8,
            ERR_NOT_DIRECTORY: 9,

            readFile: function (path, encoding, callback) {
                nodeFs.readFile(path, encoding, function (err, content) {
                    err = err ? err.code : global.brackets.fs.NO_ERROR;
                    if (callback) {
                        callback(err, content);
                    }
                });
            },

            writeFile: function (path, data, encoding, callback) {
                nodeFs.writeFile(path, data, encoding, function (err) {
                    err = err ? err.code : global.brackets.fs.NO_ERROR;
                    if (callback) {
                        callback(err);
                    }
                });
            },

            chmod: function (path, mode, callback) {
                nodeFs.chmod(path, mode, function (err) {
                    err = err ? err.code : global.brackets.fs.NO_ERROR;
                    
                    if (callback) {
                        callback(err);
                    }
                });
            },

            unlink: function (path, callback) {
                nodeFs.unlink(path, function (err) {
                    err = err ? err.code : global.brackets.fs.NO_ERROR;
                    
                    if (callback) {
                        callback(err);
                    }
                });
            },

            stat: function (path, callback) {
                nodeFs.stat(path, function (err, stats) {
                    err = err ? err.code : global.brackets.fs.NO_ERROR;
                    
                    if (callback) {
                        callback(err, stats);
                    }
                });
            },

            readdir: function (path, callback) {
                nodeFs.readdir(path, function (err, files) {
                    err = err ? err.code : global.brackets.fs.NO_ERROR;
                    
                    if (callback) {
                        callback(err, files);
                    }
                });
            },

            makedir: function (path, mode, callback) {
                // TODO
                nodeFs.mkdir(path, mode, function (err, files) {
                    err = err ? err.code : global.brackets.fs.NO_ERROR;
                    
                    if (callback) {
                        callback(err, files);
                    }
                });
            },

            isNetworkDrive: function (path, callback) {
                // TODO
                callback(global.brackets.fs.ERR_UNKNOWN);
            }
        };

        // Other symbols
        var i;
        for (i in nodeFs) {
            var func = nodeFs[i];
            if (!func in global.brackets.fs) {
                global.brackets.fs[func] = func;
            }
        }

        var app = {};
        global.brackets.app = app;

        // Stub functions        
        app.getElapsedMilliseconds = function () {
            return process.uptime();
        };
        
        app.getApplicationSupportDirectory = function () {
            return "/Users/jasonsj/Library/Application Support/Brackets";
        };
        
        // Menu
        var menubar = new gui.Menu({ "type": "menubar" }),
            windowMenuMap = {},
            commandToMenuItemMap = {},
            windowMenuOrder = [];
        
        if (global.brackets.platform === "mac") {
            menubar.createMacBuiltin("Brackets", {
                hideEdit: true,
                hideWindow: true
            });
            windowMenuMap["window-menu"] = { menuitem: menubar.items[1], order: [], map: {} };
        }
        
        win.menu = menubar;
        
        brackets.nativeMenus = true;
        
        brackets.app.addMenu = function (title, id, position, relativeId, callback) {
            var sub = new gui.Menu(),
                item = new gui.MenuItem({ label: title, type: "normal", submenu: sub });
            
            windowMenuMap[id] = { id: id, menuitem: item, order: [], map: {} };
            
            var index = -1;
            
            if (position === "before") {
                index = windowMenuOrder.indexOf(relativeId);
            } else if (position === "after") {
                index = windowMenuOrder.indexOf(relativeId) + 1;
            } else if (position === "first") {
                index = 0;
            }
            
            if (index >= 0) {
                menubar.insert(item, index);
                windowMenuOrder.splice(index, 0, id);
            } else {
                menubar.append(item);
                windowMenuOrder.push(id);
            }
            
            execCallback(callback);
        };
        
        brackets.app.addMenuItem = function (parentId, title, id, key, displayStr, position, relativeId, callback) {
            var shortcut = parseShortcut(key);
            
            // TODO initialize checkbox only on creation
            var item = new gui.MenuItem({
                label: title,
                type: (title !== "---") ? "normal" : "separator",
                key: shortcut.key,
                modifiers: shortcut.modifiers,
                click: function () {
                    CommandManager.execute(id);
                }
            });
            
            item._id = id;
            
            var parent = windowMenuMap[parentId],
                menuMap = parent.map,
                menuOrder = parent.order;
            
            menuMap[id] = item;
            commandToMenuItemMap[id] = { menuitem: item, parent: parent };
            
            var index = -1;
            
            if (typeof position === "number") {
                index = position;
            } else if (position === "before") {
                index = menuOrder.indexOf(relativeId);
            } else if (position === "after") {
                index = menuOrder.indexOf(relativeId) + 1;
            } else if (position === "first") {
                index = 0;
            }
            
            if (index >= 0) {
                parent.menuitem.submenu.insert(item, index);
                menuOrder.splice(index, 0, item);
            } else {
                parent.menuitem.submenu.append(item);
                menuOrder.push(item);
            }
            
            execCallback(callback);
        };
        
        brackets.app.setMenuTitle = function (commandid, title, callback) {
            
            execCallback(callback);
        };
        
        brackets.app.getMenuTitle = function (commandid, callback) {
            
            execCallback(callback);
        };
        
        brackets.app.setMenuItemShortcut = function (commandId, key, displayStr, callback) {
            // TODO can't change modifiers after MenuItem created
            var item = commandToMenuItemMap[commandId],
                id = item.menuitem._id,
                parent = item.parent,
                oldIndex = parent.order.indexOf(item.menuitem);
            
            // Remove old item
            parent.order.splice(oldIndex, 1);
            parent.menuitem.submenu.remove(item.menuitem);
            delete parent.map[id];
            delete commandToMenuItemMap[id];
            
            brackets.app.addMenuItem(parent.id, item.menuitem.label, id, key, displayStr, oldIndex);
            
            execCallback(callback);
        };
        
        brackets.app.removeMenu = function (commandId, callback) {
            
            execCallback(callback);
        };
        
        brackets.app.removeMenuItem = function (commandId, callback) {
            
            execCallback(callback);
        };
        
        brackets.app.getMenuPosition = function (commandId, callback) {
            
            execCallback(callback);
        };
        
        brackets.app.setMenuItemState = function (commandid, enabled, checked, callback) {
            
            execCallback(callback);
        };

        brackets.app.getMenuItemState = function (commandid, callback) {
            
            execCallback(callback);
        };
        
        brackets.app.quit = function () {
            win.close();
        };
    }
    
    // Parse URL params
    var params = new UrlParams();
    params.parse();
    
    // Parse src/config.json
    try {
        global.brackets.metadata = JSON.parse(configJSON);
        global.brackets.config = global.brackets.metadata.config;
    } catch (err) {
        console.log(err);
    }
        
    // Uncomment the following line to force all low level file i/o routines to complete
    // asynchronously. This should only be done for testing/debugging.
    // NOTE: Make sure this line is commented out again before committing!
    //brackets.forceAsyncCallbacks = true;

    // Load native shell when brackets is run in a native shell rather than the browser
    // TODO: (issue #266) load conditionally
    global.brackets.shellAPI = require("utils/ShellAPI");
    
    global.brackets.inBrowser = !global.brackets.hasOwnProperty("fs");
    
    // Are we in a desktop shell with a native menu bar?
    var hasNativeMenus = params.get("hasNativeMenus");
    if (hasNativeMenus) {
        global.brackets.nativeMenus = (hasNativeMenus === "true");
    } else {
        global.brackets.nativeMenus = (!global.brackets.inBrowser && (global.brackets.platform !== "linux"));
    }
    
    // Locale-related APIs
    global.brackets.isLocaleDefault = function () {
        return !global.localStorage.getItem("locale");
    };
    
    global.brackets.getLocale = function () {
        // By default use the locale that was determined in brackets.js
        return params.get("testEnvironment") ? "en" : (global.localStorage.getItem("locale") || global.require.s.contexts._.config.locale);
    };

    global.brackets.setLocale = function (locale) {
        if (locale) {
            global.localStorage.setItem("locale", locale);
        } else {
            global.localStorage.removeItem("locale");
        }
    };
    
    // Create empty app namespace if running in-browser
    if (!global.brackets.app) {
        global.brackets.app = {};
    }
    
    // Loading extensions requires creating new require.js contexts, which
    // requires access to the global 'require' object that always gets hidden
    // by the 'require' in the AMD wrapper. We store this in the brackets
    // object here so that the ExtensionLoader doesn't have to have access to
    // the global object.
    global.brackets.libRequire = global.require;

    // Also store our current require.js context (the one that loads brackets
    // core modules) so that extensions can use it.
    // Note: we change the name to "getModule" because this won't do exactly
    // the same thing as 'require' in AMD-wrapped modules. The extension will
    // only be able to load modules that have already been loaded once.
    global.brackets.getModule = require;

    exports.global = global;
});
