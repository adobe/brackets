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
/*global require, define, brackets: true, $, PathUtils, window, navigator, Mustache */

require.config({
    paths: {
        "text" : "thirdparty/text",
        "i18n" : "thirdparty/i18n"
    },
    // Use custom brackets property until CEF sets the correct navigator.language
    // NOTE: When we change to navigator.language here, we also should change to
    // navigator.language in ExtensionLoader (when making require contexts for each
    // extension).
    locale: window.localStorage.getItem("locale") || brackets.app.language
});

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
    "use strict";
    
    // Load dependent non-module scripts
    require("widgets/bootstrap-dropdown");
    require("widgets/bootstrap-modal");
    require("thirdparty/path-utils/path-utils.min");
    require("thirdparty/smart-auto-complete/jquery.smart_autocomplete");

    // Load LiveDeveopment
    require("LiveDevelopment/main");
    
    // Load dependent modules
    var Global                  = require("utils/Global"),
        AppInit                 = require("utils/AppInit"),
        ProjectManager          = require("project/ProjectManager"),
        DocumentManager         = require("document/DocumentManager"),
        EditorManager           = require("editor/EditorManager"),
        CSSInlineEditor         = require("editor/CSSInlineEditor"),
        JSUtils                 = require("language/JSUtils"),
        WorkingSetView          = require("project/WorkingSetView"),
        DocumentCommandHandlers = require("document/DocumentCommandHandlers"),
        FileViewController      = require("project/FileViewController"),
        FileSyncManager         = require("project/FileSyncManager"),
        KeyBindingManager       = require("command/KeyBindingManager"),
        Commands                = require("command/Commands"),
        CommandManager          = require("command/CommandManager"),
        CodeHintManager         = require("editor/CodeHintManager"),
        JSLintUtils             = require("language/JSLintUtils"),
        PerfUtils               = require("utils/PerfUtils"),
        FileIndexManager        = require("project/FileIndexManager"),
        QuickOpen               = require("search/QuickOpen"),
        Menus                   = require("command/Menus"),
        FileUtils               = require("file/FileUtils"),
        MainViewHTML            = require("text!htmlContent/main-view.html"),
        Strings                 = require("strings"),
        Dialogs                 = require("widgets/Dialogs"),
        ExtensionLoader         = require("utils/ExtensionLoader"),
        SidebarView             = require("project/SidebarView"),
        Async                   = require("utils/Async"),
        UpdateNotification      = require("utils/UpdateNotification"),
        UrlParams               = require("utils/UrlParams").UrlParams,
        NativeFileSystem        = require("file/NativeFileSystem").NativeFileSystem,
        PreferencesManager      = require("preferences/PreferencesManager");

    // Local variables
    var params                  = new UrlParams(),
        PREFERENCES_CLIENT_ID   = "com.adobe.brackets.startup";
    
    // read URL params
    params.parse();
            
    //Load modules that self-register and just need to get included in the main project
    require("document/ChangedDocumentTracker");
    require("editor/EditorCommandHandlers");
    require("view/ViewCommandHandlers");
    require("debug/DebugCommandHandlers");
    require("help/HelpCommandHandlers");
    require("search/FindInFiles");
    require("search/FindReplace");
    require("utils/ExtensionUtils");
    
    // TODO: (issue 1029) Add timeout to main extension loading promise, so that we always call this function
    // Making this fix will fix a warning (search for issue 1029) related to the global brackets 'ready' event.
    function _initExtensions() {
        // allow unit tests to override which plugin folder(s) to load
        var paths = params.get("extensions") || "default,user";
        
        return Async.doInParallel(paths.split(","), function (item) {
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
            JSUtils                 : JSUtils,
            CommandManager          : require("command/CommandManager"),
            FileSyncManager         : FileSyncManager,
            FileIndexManager        : FileIndexManager,
            Menus                   : Menus,
            KeyBindingManager       : KeyBindingManager,
            CodeHintManager         : CodeHintManager,
            CSSUtils                : require("language/CSSUtils"),
            LiveDevelopment         : require("LiveDevelopment/LiveDevelopment"),
            Inspector               : require("LiveDevelopment/Inspector/Inspector"),
            NativeApp               : require("utils/NativeApp"),
            ExtensionUtils          : require("utils/ExtensionUtils"),
            UpdateNotification      : require("utils/UpdateNotification"),
            doneLoading             : false
        };

        AppInit.appReady(function () {
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
    }
    
    function _initWindowListeners() {
        // TODO: (issue 269) to support IE, need to listen to document instead (and even then it may not work when focus is in an input field?)
        $(window).focus(function () {
            FileSyncManager.syncOpenDocuments();
            FileIndexManager.markDirty();
        });
        
    }
            
    function _onReady() {
        // Add the platform (mac or win) to the body tag so we can have platform-specific CSS rules
        $("body").addClass("platform-" + brackets.platform);
        
        EditorManager.setEditorHolder($("#editor-holder"));

        // Let the user know Brackets doesn't run in a web browser yet
        if (brackets.inBrowser) {
            Dialogs.showModalDialog(
                Dialogs.DIALOG_ID_ERROR,
                Strings.ERROR_IN_BROWSER_TITLE,
                Strings.ERROR_IN_BROWSER
            );
        }

        _initDragAndDropListeners();
        _initCommandHandlers();
        KeyBindingManager.init();
        Menus.init(); // key bindings should be initialized first
        _initWindowListeners();

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
        var initialProjectPath = ProjectManager.getInitialProjectPath();
        ProjectManager.openProject(initialProjectPath).always(function () {
            _initTest();

            // WARNING: AppInit.appReady won't fire if ANY extension fails to
            // load or throws an error during init. To fix this, we need to
            // make a change to _initExtensions (filed as issue 1029)
            _initExtensions().always(AppInit._dispatchReady(AppInit.APP_READY));
            
            // If this is the first launch, and we have an index.html file in the project folder (which should be
            // the samples folder on first launch), open it automatically. (We explicitly check for the
            // samples folder in case this is the first time we're launching Brackets after upgrading from
            // an old version that might not have set the "afterFirstLaunch" pref.)
            var prefs = PreferencesManager.getPreferenceStorage(PREFERENCES_CLIENT_ID);
            if (!params.get("skipSampleProjectLoad") && !prefs.getValue("afterFirstLaunch")) {
                prefs.setValue("afterFirstLaunch", "true");
                if (ProjectManager.isWelcomeProjectPath(initialProjectPath)) {
                    var dirEntry = new NativeFileSystem.DirectoryEntry(initialProjectPath);
                    dirEntry.getFile("index.html", {}, function (fileEntry) {
                        CommandManager.execute(Commands.FILE_ADD_TO_WORKING_SET, { fullPath: fileEntry.fullPath });
                    });
                }
            }
        });
        
        // Check for updates
        if (!params.get("skipUpdateCheck")) {
            UpdateNotification.checkForUpdate();
        }
    }
    
    // Localize MainViewHTML and inject into <BODY> tag
    var templateVars    = $.extend({
        ABOUT_ICON          : brackets.config.about_icon,
        APP_NAME_ABOUT_BOX  : brackets.config.app_name_about,
        VERSION             : brackets.metadata.version
    }, Strings);
    
    $("body").html(Mustache.render(MainViewHTML, templateVars));
    
    // Update title
    $("title").text(brackets.config.app_title);

    // Dispatch htmlReady callbacks
    AppInit._dispatchReady(AppInit.HTML_READY);

    $(window.document).ready(_onReady);
    
});
