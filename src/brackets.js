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
/*global define, brackets: true, $, PathUtils, window, navigator */

/**
 * brackets is the root of the Brackets codebase. This file pulls in all other modules as
 * dependencies (or dependencies thereof), initializes the UI, and binds global menus & keyboard
 * shortcuts to their Commands.
 *
 * TODO: (issue #264) break out the definition of brackets into a separate module from the application controller logic
 *
 * Unlike other modules, this one can be accessed without an explicit require() because it exposes
 * a global object, window.brackets.
 */
define(function (require, exports, module) {
    'use strict';
    
    // Load dependent non-module scripts
    require("widgets/bootstrap-dropdown");
    require("widgets/bootstrap-modal");
    require("thirdparty/path-utils/path-utils.min");
    require("thirdparty/smart-auto-complete/jquery.smart_autocomplete");

    // Load LiveDeveopment
    require("LiveDevelopment/main");
    
    // Load dependent modules
    var ProjectManager          = require("project/ProjectManager"),
        DocumentManager         = require("document/DocumentManager"),
        EditorManager           = require("editor/EditorManager"),
        CSSInlineEditor         = require("editor/CSSInlineEditor"),
        WorkingSetView          = require("project/WorkingSetView"),
        DocumentCommandHandlers = require("document/DocumentCommandHandlers"),
        FileViewController      = require("project/FileViewController"),
        FileSyncManager         = require("project/FileSyncManager"),
        KeyBindingManager       = require("command/KeyBindingManager"),
        Commands                = require("command/Commands"),
        CommandManager          = require("command/CommandManager"),
        BuildInfoUtils          = require("utils/BuildInfoUtils"),
        CodeHintManager         = require("editor/CodeHintManager"),
        JSLintUtils             = require("language/JSLintUtils"),
        PerfUtils               = require("utils/PerfUtils"),
        FileIndexManager        = require("project/FileIndexManager"),
        QuickOpen               = require("search/QuickOpen"),
        Menus                   = require("command/Menus"),
        FileUtils               = require("file/FileUtils"),
        Strings                 = require("strings"),
        Dialogs                 = require("widgets/Dialogs"),
        ExtensionLoader         = require("utils/ExtensionLoader"),
        SidebarView             = require("project/SidebarView"),
        Async                   = require("utils/Async");

    // Local variables
    var bracketsReady         = false,
        bracketsReadyHandlers = [];
        
    //Load modules that self-register and just need to get included in the main project
    require("editor/CodeHintManager");
    require("editor/EditorCommandHandlers");
    require("debug/DebugCommandHandlers");
    require("view/ViewCommandHandlers");
    require("search/FindInFiles");

    function _callBracketsReadyHandler(handler) {
        try {
            handler();
        } catch (e) {
            console.log("Exception when calling a 'brackets done loading' handler");
            console.log(e);
        }
    }

    function _onBracketsReady() {
        var i;
        bracketsReady = true;
        for (i = 0; i < bracketsReadyHandlers.length; i++) {
            _callBracketsReadyHandler(bracketsReadyHandlers[i]);
        }
        bracketsReadyHandlers = [];
    }

    // WARNING: This event won't fire if ANY extension fails to load or throws an error during init.
    // To fix this, we need to make a change to _initExtensions (filed as issue 1029)
    function _registerBracketsReadyHandler(handler) {
        if (bracketsReady) {
            _callBracketsReadyHandler(handler);
        } else {
            bracketsReadyHandlers.push(handler);
        }
    }
    
    // TODO: Issue 949 - the following code should be shared
    
    function _initGlobalBrackets() {
        // Define core brackets namespace if it isn't already defined
        //
        // We can't simply do 'brackets = {}' to define it in the global namespace because
        // we're in "use strict" mode. Most likely, 'window' will always point to the global
        // object when this code is running. However, in case it isn't (e.g. if we're running 
        // inside Node for CI testing) we use this trick to get the global object.
        //
        // Taken from:
        //   http://stackoverflow.com/questions/3277182/how-to-get-the-global-object-in-javascript
        var Fn = Function, global = (new Fn('return this'))();
        if (!global.brackets) {
            global.brackets = {};
        }
        
        // Uncomment the following line to force all low level file i/o routines to complete
        // asynchronously. This should only be done for testing/debugging.
        // NOTE: Make sure this line is commented out again before committing!
        //brackets.forceAsyncCallbacks = true;
    
        // Load native shell when brackets is run in a native shell rather than the browser
        // TODO: (issue #266) load conditionally
        brackets.shellAPI = require("utils/ShellAPI");
        
        brackets.inBrowser = !brackets.hasOwnProperty("fs");
        
        brackets.platform = (global.navigator.platform === "MacIntel" || global.navigator.platform === "MacPPC") ? "mac" : "win";
        
        // Loading extensions requires creating new require.js contexts, which requires access to the global 'require' object
        // that always gets hidden by the 'require' in the AMD wrapper. We store this in the brackets object here so that 
        // the ExtensionLoader doesn't have to have access to the global object.
        brackets.libRequire = global.require;

        // Also store our current require.js context (the one that loads brackets core modules) so that extensions can use it
        // Note: we change the name to "getModule" because this won't do exactly the same thing as 'require' in AMD-wrapped
        // modules. The extension will only be able to load modules that have already been loaded once.
        brackets.getModule = require;

        // Provide a way for anyone (including code not using require) to register a handler for the brackets 'ready' event
        // This event is like $(document).ready in that it will call the handler immediately if brackets is already done loading
        //
        // WARNING: This event won't fire if ANY extension fails to load or throws an error during init.
        // To fix this, we need to make a change to _initExtensions (filed as issue 1029)
        //
        // TODO (issue 1034): We *could* use a $.Deferred for this, except deferred objects enter a broken
        // state if any resolution callback throws an exception. Since third parties (e.g. extensions) may
        // add callbacks to this, we need to be robust to exceptions
        brackets.ready = _registerBracketsReadyHandler;
    }
    
    // TODO: (issue 1029) Add timeout to main extension loading promise, so that we always call this function
    // Making this fix will fix a warning (search for issue 1029) related to the brackets 'ready' event.
    function _initExtensions() {
        return Async.doInParallel(["default", "user"], function (item) {
            return ExtensionLoader.loadAllExtensionsInNativeDirectory(
                FileUtils.getNativeBracketsDirectoryPath() + "/extensions/" + item,
                "extensions/" + item
            );
        });
    }
    
    function _initTest() {
        // TODO: (issue #265) Make sure the "test" object is not included in final builds
        // All modules that need to be tested from the context of the application
        // must to be added to this object. The unit tests cannot just pull
        // in the modules since they would run in context of the unit test window,
        // and would not have access to the app html/css.
        brackets.test = {
            PreferencesManager      : require("preferences/PreferencesManager"),
            ProjectManager          : ProjectManager,
            DocumentCommandHandlers : DocumentCommandHandlers,
            FileViewController      : FileViewController,
            DocumentManager         : DocumentManager,
            EditorManager           : EditorManager,
            Commands                : Commands,
            WorkingSetView          : WorkingSetView,
            JSLintUtils             : JSLintUtils,
            PerfUtils               : PerfUtils,
            CommandManager          : require("command/CommandManager"),
            FileSyncManager         : FileSyncManager,
            FileIndexManager        : FileIndexManager,
            Menus                   : Menus,
            KeyBindingManager       : KeyBindingManager,
            CSSUtils                : require("language/CSSUtils"),
            LiveDevelopment         : require("LiveDevelopment/LiveDevelopment"),
            Inspector               : require("LiveDevelopment/Inspector/Inspector"),
            NativeApp               : require("utils/NativeApp"),
            doneLoading             : false
        };

        brackets.ready(function () {
            brackets.test.doneLoading = true;
        });
    }
    
    function _initDragAndDropListeners() {
        // Prevent unhandled drag and drop of files into the browser from replacing 
        // the entire Brackets app. This doesn't prevent children from choosing to
        // handle drops.
        $(window.document.body)
            .on("dragover", function (event) {
                if (event.originalEvent.dataTransfer.files) {
                    event.stopPropagation();
                    event.preventDefault();
                    event.originalEvent.dataTransfer.dropEffect = "none";
                }
            })
            .on("drop", function (event) {
                if (event.originalEvent.dataTransfer.files) {
                    event.stopPropagation();
                    event.preventDefault();
                }
            });
    }
    
    function _initCommandHandlers() {
        // Most command handlers are automatically registered when their module is loaded (see "modules
        // that self-register" above for some). A few commands need an extra kick here though:
        
        DocumentCommandHandlers.init($("#main-toolbar"));
        
        // About dialog
        CommandManager.register(Strings.CMD_ABOUT,  Commands.HELP_ABOUT, function () {
            // If we've successfully determined a "build number" via .git metadata, add it to dialog
            var bracketsSHA = BuildInfoUtils.getBracketsSHA(),
                bracketsAppSHA = BuildInfoUtils.getBracketsAppSHA(),
                versionLabel = "";
            if (bracketsSHA) {
                versionLabel += " (" + bracketsSHA.substr(0, 7) + ")";
            }
            if (bracketsAppSHA) {
                versionLabel += " (shell " + bracketsAppSHA.substr(0, 7) + ")";
            }
            $("#about-build-number").text(versionLabel);
            
            Dialogs.showModalDialog(Dialogs.DIALOG_ID_ABOUT);
        });
    }
    
    function _initWindowListeners() {
        // TODO: (issue 269) to support IE, need to listen to document instead (and even then it may not work when focus is in an input field?)
        $(window).focus(function () {
            FileSyncManager.syncOpenDocuments();
            FileIndexManager.markDirty();
        });
        
        $(window).contextmenu(function (e) {
            e.preventDefault();
        });
    }
            
    function _onReady() {
        // Add the platform (mac or win) to the body tag so we can have platform-specific CSS rules
        $("body").addClass("platform-" + brackets.platform);
        
        EditorManager.setEditorHolder($('#editor-holder'));

        // Let the user know Brackets doesn't run in a web browser yet
        if (brackets.inBrowser) {
            Dialogs.showModalDialog(
                Dialogs.DIALOG_ID_ERROR,
                Strings.ERROR_BRACKETS_IN_BROWSER_TITLE,
                Strings.ERROR_BRACKETS_IN_BROWSER
            );
        }

        _initDragAndDropListeners();
        _initCommandHandlers();
        KeyBindingManager.init();
        Menus.init(); // key bindings should be initialized first
        _initWindowListeners();
        
        // Read "build number" SHAs off disk at the time the matching Brackets JS code is being loaded, instead
        // of later, when they may have been updated to a different version
        BuildInfoUtils.init();

        // Use quiet scrollbars if we aren't on Lion. If we're on Lion, only
        // use native scroll bars when the mouse is not plugged in or when
        // using the "Always" scroll bar setting. 
        var osxMatch = /Mac OS X 10\D([\d+])\D/.exec(navigator.userAgent);
        if (osxMatch && osxMatch[1] && Number(osxMatch[1]) >= 7) {
            // test a scrolling div for scrollbars
            var $testDiv = $("<div style='position:fixed;left:-50px;width:50px;height:50px;overflow:auto;'><div style='width:100px;height:100px;'/></div>").appendTo(window.document.body);
            
            if ($testDiv.outerWidth() === $testDiv.get(0).clientWidth) {
                $(".sidebar").removeClass("quiet-scrollbars");
            }
            
            $testDiv.remove();
        }
        
        PerfUtils.addMeasurement("Application Startup");
        
        // finish UI initialization before loading extensions
        ProjectManager.loadProject().done(function () {
            _initTest();
            _initExtensions().always(_onBracketsReady);
        });
    }
            
    // Main Brackets initialization
    _initGlobalBrackets();
    $(window.document).ready(_onReady);
    
});
