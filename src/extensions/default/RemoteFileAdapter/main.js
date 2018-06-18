/*
 * Copyright (c) 2018 - present Adobe Systems Incorporated. All rights reserved.
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

define(function (require, exports, module) {
    "use strict";

    var AppInit         = brackets.getModule("utils/AppInit"),
        FileSystem      = brackets.getModule("filesystem/FileSystem"),
        QuickOpen       = brackets.getModule("search/QuickOpen"),
        PathUtils       = brackets.getModule("thirdparty/path-utils/path-utils"),
        CommandManager  = brackets.getModule("command/CommandManager"),
        Commands        = brackets.getModule("command/Commands"),
        ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
        WorkingSetView = brackets.getModule("project/WorkingSetView"),
        MainViewManager = brackets.getModule("view/MainViewManager"),
        Menus           = brackets.getModule("command/Menus"),
        RemoteFile      = require("RemoteFile");

    var HTTP_PROTOCOL = "http:",
        HTTPS_PROTOCOL = "https:";
    
    ExtensionUtils.loadStyleSheet(module, "styles.css");
    
    function protocolClassProvider(data) {
        if (data.fullPath.startsWith("http://")) {
            return "http";
        }

        if (data.fullPath.startsWith("https://")) {
            return "https";
        }
        
        return "";
    }
    
    /**
     * Disable context menus which are not useful for remote file
     */
    function _setMenuItemsVisible() {
        var file = MainViewManager.getCurrentlyViewedFile(MainViewManager.ACTIVE_PANE),
            cMenuItems = [Commands.FILE_SAVE, Commands.FILE_RENAME, Commands.NAVIGATE_SHOW_IN_FILE_TREE, Commands.NAVIGATE_SHOW_IN_OS],
            // Enable menu options when no file is present in active pane
            enable = !file || (file.constructor.name !== "RemoteFile");
        
            // Enable or disable commands based on whether the file is a remoteFile or not.
            cMenuItems.forEach(function (item) {
                CommandManager.get(item).setEnabled(enable);
            });
    }

    AppInit.htmlReady(function () {
        
        Menus.getContextMenu(Menus.ContextMenuIds.WORKING_SET_CONTEXT_MENU).on("beforeContextMenuOpen", _setMenuItemsVisible);
        MainViewManager.on("currentFileChange", _setMenuItemsVisible);
        
        var protocolAdapter = {
            priority: 0, // Default priority
            fileImpl: RemoteFile,
            canRead: function (filePath) {
                return true; // Always claim true, we are the default adpaters
            }
        };

        // Register the custom object as HTTP and HTTPS protocol adapter
        FileSystem.registerProtocolAdapter(HTTP_PROTOCOL, protocolAdapter);
        FileSystem.registerProtocolAdapter(HTTPS_PROTOCOL, protocolAdapter);

        // Register as quick open plugin for file URI's having HTTP:|HTTPS: protocol
        QuickOpen.addQuickOpenPlugin(
            {
                name: "Remote file URI input",
                languageIds: [], // for all language modes
                search: function () {
                    return $.Deferred().resolve([arguments[0]]);
                },
                match: function (query) {
                    var protocol = PathUtils.parseUrl(query).protocol;
                    return [HTTP_PROTOCOL, HTTPS_PROTOCOL].indexOf(protocol) !== -1;
                },
                itemFocus: function (query) {
                }, // no op
                itemSelect: function () {
                    CommandManager.execute(Commands.FILE_OPEN, {fullPath: arguments[0]});
                }
            }
        );
        
        WorkingSetView.addClassProvider(protocolClassProvider);
    });

});
