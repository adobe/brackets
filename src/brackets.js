/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, brackets: true, $: false, PathUtils: false */

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
        KeyMap                  = require("command/KeyMap"),
        Commands                = require("command/Commands"),
        CommandManager          = require("command/CommandManager"),
        CodeHintManager         = require("editor/CodeHintManager"),
        PerfUtils               = require("utils/PerfUtils"),
        FileIndexManager        = require("project/FileIndexManager"),
        QuickFileOpen           = require("search/QuickFileOpen"),
        Menus                   = require("command/Menus"),
        FileUtils               = require("file/FileUtils"),
        ExtensionLoader         = require("utils/ExtensionLoader");
        
    //Load modules the self-register and just need to get included in the main project
    require("language/JSLintUtils");
    require("editor/CodeHintManager");
    require("debug/DebugCommandHandlers");
    require("search/FindInFiles");

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
        CommandManager          : require("command/CommandManager"),
        FileSyncManager         : FileSyncManager,
        FileIndexManager        : FileIndexManager,
        CSSUtils                : require("language/CSSUtils"),
        LiveDevelopment         : require("LiveDevelopment/LiveDevelopment"),
        Inspector               : require("LiveDevelopment/Inspector/Inspector"),
        NativeApp               : require("utils/NativeApp")
    };
    
    // Uncomment the following line to force all low level file i/o routines to complete
    // asynchronously. This should only be done for testing/debugging.
    // NOTE: Make sure this line is commented out again before committing!
    //brackets.forceAsyncCallbacks = true;

    // Load native shell when brackets is run in a native shell rather than the browser
    // TODO: (issue #266) load conditionally
    brackets.shellAPI = require("utils/ShellAPI");
    
    brackets.inBrowser = !brackets.hasOwnProperty("fs");
    
    brackets.platform = (global.navigator.platform === "MacIntel" || global.navigator.platform === "MacPPC") ? "mac" : "win";

    // Main Brackets initialization
    $(document).ready(function () {
        
        function initListeners() {
            // Prevent unhandled drag and drop of files into the browser from replacing 
            // the entire Brackets app. This doesn't prevent children from choosing to
            // handle drops.
            $(document.body)
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
        
        function initProject() {
            ProjectManager.loadProject();

            // Open project button
            $("#btn-open-project").click(function () {
                CommandManager.execute(Commands.FILE_OPEN_FOLDER);
            });


            // Handle toggling top level disclosure arrows of file list area
            $("#open-files-header").click(function () {
                $("#open-files-disclosure-arrow").toggleClass("disclosure-arrow-closed");
                $("#open-files-container").toggle();
            });
            $("#project-files-header").click(function () {
                $("#project-files-disclosure-arrow").toggleClass("disclosure-arrow-closed");
                $("#project-files-container").toggle();
            });
        }
        
        
        function initCommandHandlers() {
            DocumentCommandHandlers.init($("#main-toolbar"));
        }

        function initKeyBindings() {
            // Register keymaps and install the keyboard handler
            // TODO: (issue #268) show keyboard equivalents in the menus
            var _globalKeymap = KeyMap.create({
                "bindings": [
                    // FILE
                    {"Ctrl-N": Commands.FILE_NEW},
                    {"Ctrl-O": Commands.FILE_OPEN},
                    {"Ctrl-S": Commands.FILE_SAVE},
                    {"Ctrl-W": Commands.FILE_CLOSE},
                    {"Ctrl-Q": Commands.FILE_QUIT},

                    // EDIT
                    //{"Ctrl-Z": Commands.EDIT_UNDO},
                    //{"Ctrl-Y": Commands.EDIT_REDO},
                    //{"Ctrl-X": Commands.EDIT_CUT},
                    //{"Ctrl-C": Commands.EDIT_COPY}, 
                    //{"Ctrl-V": Commands.EDIT_PASTE},

                    {"Ctrl-A": Commands.EDIT_SELECT_ALL},
                    {"Ctrl-F": Commands.EDIT_FIND},
                    {"Ctrl-Shift-F": Commands.EDIT_FIND_IN_FILES},
                    {"Ctrl-G": Commands.EDIT_FIND_NEXT, "platform": "mac"},
                    {"F3": Commands.EDIT_FIND_NEXT, "platform": "win"},
                    {"Ctrl-Shift-G": Commands.EDIT_FIND_PREVIOUS, "platform": "mac"},
                    {"Shift-F3": Commands.EDIT_FIND_PREVIOUS, "platform": "win"},
                    {"Ctrl-Alt-F": Commands.EDIT_REPLACE, "platform": "mac"},
                    {"Ctrl-H": Commands.EDIT_REPLACE, "platform": "win"},
                    {"Ctrl-Tab": Commands.EDIT_INDENT},
                    {"Ctrl-Shift-Tab": Commands.EDIT_UNINDENT},

                    // Navigate
                    {"Ctrl-Shift-O": Commands.NAVIGATE_QUICK_OPEN},
                    //{"Ctrl-E", Commands.TODO}

                    // DEBUG
                    {"F5": Commands.VIEW_REFRESH_WINDOW, "platform": "win"},
                    {"Ctrl-R": Commands.VIEW_REFRESH_WINDOW, "platform": "mac"},

                    {"Ctrl-Shift-H": Commands.DEBUG_HIDE_SIDEBAR}


                ],
                "platform": brackets.platform
            });
            KeyBindingManager.installKeymap(_globalKeymap);

            $(document.body).keydown(function (event) {
                if (KeyBindingManager.handleKey(KeyMap.translateKeyboardEvent(event))) {
                    event.preventDefault();
                }
            });
        }
        
        function initWindowListeners() {
            // TODO: (issue 269) to support IE, need to listen to document instead (and even then it may not work when focus is in an input field?)
            $(window).focus(function () {
                FileSyncManager.syncOpenDocuments();
                FileIndexManager.markDirty();
            });
            
            $(window).unload(function () {
                CommandManager.execute(Commands.FILE_CLOSE_WINDOW);
            });
            
            $(window).contextmenu(function (e) {
                e.preventDefault();
            });
        }

        // Add the platform (mac or win) to the body tag so we can have platform-specific CSS rules
        $("body").addClass("platform-" + brackets.platform);


        EditorManager.setEditorHolder($('#editorHolder'));
    
        initListeners();
        initProject();
        initCommandHandlers();
        initKeyBindings();
        Menus.init(); // key bindings should be initialized first
        initWindowListeners();

        // Load extensions

        // FUTURE (JRB): As we get more fine-grained performance measurement, move this out of core application startup

        // Loading extensions requires creating new require.js contexts, which requires access to the global 'require' object
        // that always gets hidden by the 'require' in the AMD wrapper. We store this in the brackets object here so that 
        // the ExtensionLoader doesn't have to have access to the global object.
        brackets.libRequire = global.require;

        // Also store our current require.js context (the one that loads brackets core modules) so that extensions can use it
        // Note: we change the name to "getModule" because this won't do exactly the same thing as 'require' in AMD-wrapped
        // modules. The extension will only be able to load modules that have already been loaded once.
        brackets.getModule = require;

        ExtensionLoader.loadAllExtensionsInNativeDirectory(
            FileUtils.getNativeBracketsDirectoryPath() + "/extensions/default",
            "extensions/default"
        );
        ExtensionLoader.loadAllExtensionsInNativeDirectory(
            FileUtils.getNativeBracketsDirectoryPath() + "/extensions/user",
            "extensions/user"
        );

        PerfUtils.addMeasurement("Application Startup");
    });
    
});
