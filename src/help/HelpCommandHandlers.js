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


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, window */

define(function (require, exports, module) {
    "use strict";
    
    var Global                  = require("utils/Global"),
        BuildInfoUtils          = require("utils/BuildInfoUtils"),
        Commands                = require("command/Commands"),
        CommandManager          = require("command/CommandManager"),
        Dialogs                 = require("widgets/Dialogs"),
        Strings                 = require("strings"),
        UpdateNotification      = require("utils/UpdateNotification"),
        FileUtils               = require("file/FileUtils"),
        NativeApp               = require("utils/NativeApp"),
        StringUtils             = require("utils/StringUtils");
    
    var buildInfo;
    
    function _handleShowExtensionsFolder() {
        brackets.app.showExtensionsFolder(
            FileUtils.convertToNativePath(decodeURI(window.location.href)),
            function (err) {
                // Ignore errors
            }
        );
    }
    
    function _handleCheckForUpdates() {
        UpdateNotification.checkForUpdate(true);
    }

    function _handleAboutDialog() {
        if (buildInfo) {
            $("#about-build-number").text(" (" + buildInfo + ")");
        }
        
        Dialogs.showModalDialog(Dialogs.DIALOG_ID_ABOUT);
    }

    function _handleForum() {
        if (!brackets.config.forum_url) {
            return;
        }

        NativeApp.openURLInDefaultBrowser(brackets.config.forum_url);
    }
    
    // Read "build number" SHAs off disk immediately at load time, instead
    // of later, when they may have been updated to a different version
    BuildInfoUtils.getBracketsSHA().done(function (branch, sha, isRepo) {
        // If we've successfully determined a "build number" via .git metadata, add it to dialog
        sha = sha ? sha.substr(0, 9) : "";
        buildInfo = StringUtils.format("{0} {1}", branch, sha).trim();
    });
    
    CommandManager.register(Strings.CMD_SHOW_EXTENSIONS_FOLDER, Commands.HELP_SHOW_EXT_FOLDER,      _handleShowExtensionsFolder);
    CommandManager.register(Strings.CMD_CHECK_FOR_UPDATE,       Commands.HELP_CHECK_FOR_UPDATE,     _handleCheckForUpdates);
    CommandManager.register(Strings.CMD_FORUM,                  Commands.HELP_FORUM,                _handleForum);
    CommandManager.register(Strings.CMD_ABOUT,                  Commands.HELP_ABOUT,                _handleAboutDialog);
});
