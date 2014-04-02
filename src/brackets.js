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
/*global require, define, brackets: true, $, window, navigator, Mustache */

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
    require("widgets/bootstrap-twipsy-mod");
    require("thirdparty/path-utils/path-utils.min");
    require("thirdparty/smart-auto-complete-local/jquery.smart_autocomplete");

    // Load CodeMirror add-ons--these attach themselves to the CodeMirror module    
    require("thirdparty/CodeMirror2/addon/fold/xml-fold");
    require("thirdparty/CodeMirror2/addon/edit/matchtags");
    require("thirdparty/CodeMirror2/addon/edit/matchbrackets");
    require("thirdparty/CodeMirror2/addon/edit/closebrackets");
    require("thirdparty/CodeMirror2/addon/edit/closetag");
    require("thirdparty/CodeMirror2/addon/scroll/scrollpastend");
    require("thirdparty/CodeMirror2/addon/selection/active-line");
    require("thirdparty/CodeMirror2/addon/mode/multiplex");
    require("thirdparty/CodeMirror2/addon/mode/overlay");
    require("thirdparty/CodeMirror2/addon/search/searchcursor");
    require("thirdparty/CodeMirror2/keymap/sublime");
    
    // Load dependent modules
    var Global                  = require("utils/Global"),
        AppInit                 = require("utils/AppInit"),
        LanguageManager         = require("language/LanguageManager"),
        ProjectManager          = require("project/ProjectManager"),
        DocumentManager         = require("document/DocumentManager"),
        EditorManager           = require("editor/EditorManager"),
        CSSInlineEditor         = require("editor/CSSInlineEditor"),
        JSUtils                 = require("language/JSUtils"),
        WorkingSetView          = require("project/WorkingSetView"),
        WorkingSetSort          = require("project/WorkingSetSort"),
        DocumentCommandHandlers = require("document/DocumentCommandHandlers"),
        FileViewController      = require("project/FileViewController"),
        FileSyncManager         = require("project/FileSyncManager"),
        KeyBindingManager       = require("command/KeyBindingManager"),
        Commands                = require("command/Commands"),
        CommandManager          = require("command/CommandManager"),
        CodeHintManager         = require("editor/CodeHintManager"),
        PerfUtils               = require("utils/PerfUtils"),
        FileSystem              = require("filesystem/FileSystem"),
        QuickOpen               = require("search/QuickOpen"),
        Menus                   = require("command/Menus"),
        FileUtils               = require("file/FileUtils"),
        MainViewHTML            = require("text!htmlContent/main-view.html"),
        Strings                 = require("strings"),
        Dialogs                 = require("widgets/Dialogs"),
        DefaultDialogs          = require("widgets/DefaultDialogs"),
        ExtensionLoader         = require("utils/ExtensionLoader"),
        SidebarView             = require("project/SidebarView"),
        Async                   = require("utils/Async"),
        UpdateNotification      = require("utils/UpdateNotification"),
        UrlParams               = require("utils/UrlParams").UrlParams,
        PreferencesManager      = require("preferences/PreferencesManager"),
        Resizer                 = require("utils/Resizer"),
        LiveDevelopmentMain     = require("LiveDevelopment/main"),
        NodeConnection          = require("utils/NodeConnection"),
        NodeDomain              = require("utils/NodeDomain"),
        ExtensionUtils          = require("utils/ExtensionUtils"),
        DragAndDrop             = require("utils/DragAndDrop"),
        ColorUtils              = require("utils/ColorUtils"),
        CodeInspection          = require("language/CodeInspection"),
        NativeApp               = require("utils/NativeApp"),
        DeprecationWarning      = require("utils/DeprecationWarning"),
        ViewCommandHandlers     = require("view/ViewCommandHandlers"),
        _                       = require("thirdparty/lodash");
    
    // DEPRECATED: In future we want to remove the global CodeMirror, but for now we
    // expose our required CodeMirror globally so as to avoid breaking extensions in the
    // interim.
    var CodeMirror = require("thirdparty/CodeMirror2/lib/codemirror");

    Object.defineProperty(window, "CodeMirror", {
        get: function () {
            DeprecationWarning.deprecationWarning('Use brackets.getModule("thirdparty/CodeMirror2/lib/codemirror") instead of global CodeMirror.', true);
            return CodeMirror;
        }
    });
    
    // Load modules that self-register and just need to get included in the main project
    require("command/DefaultMenus");
    require("document/ChangedDocumentTracker");
    require("editor/EditorStatusBar");
    require("editor/EditorCommandHandlers");
    require("editor/EditorOptionHandlers");
    require("help/HelpCommandHandlers");
    require("search/FindInFiles");
    require("search/FindReplace");
    require("extensibility/InstallExtensionDialog");
    require("extensibility/ExtensionManagerDialog");
    require("editor/ImageViewer");
    require("preferences/PreferencesViewer");
    
    // Deprecated modules loaded just so extensions can still use them for now
    require("utils/CollectionUtils");
    // Compatibility shims for filesystem API migration
    require("project/FileIndexManager");
    require("file/NativeFileSystem");
    require("file/NativeFileError");
    
    PerfUtils.addMeasurement("brackets module dependencies resolved");
    
    // Local variables
    var params = new UrlParams();
    
    // read URL params
    params.parse();
    
    function _initTest() {
        // TODO: (issue #265) Make sure the "test" object is not included in final builds
        // All modules that need to be tested from the context of the application
        // must to be added to this object. The unit tests cannot just pull
        // in the modules since they would run in context of the unit test window,
        // and would not have access to the app html/css.
        brackets.test = {
            PreferencesManager      : PreferencesManager,
            ProjectManager          : ProjectManager,
            DocumentCommandHandlers : DocumentCommandHandlers,
            FileViewController      : FileViewController,
            DocumentManager         : DocumentManager,
            EditorManager           : EditorManager,
            Commands                : Commands,
            WorkingSetView          : WorkingSetView,
            PerfUtils               : PerfUtils,
            JSUtils                 : JSUtils,
            CommandManager          : CommandManager,
            FileSyncManager         : FileSyncManager,
            FileSystem              : FileSystem,
            Menus                   : Menus,
            KeyBindingManager       : KeyBindingManager,
            CodeHintManager         : CodeHintManager,
            Dialogs                 : Dialogs,
            DefaultDialogs          : DefaultDialogs,
            DragAndDrop             : DragAndDrop,
            CodeInspection          : CodeInspection,
            CSSUtils                : require("language/CSSUtils"),
            LiveDevelopment         : require("LiveDevelopment/LiveDevelopment"),
            LiveDevServerManager    : require("LiveDevelopment/LiveDevServerManager"),
            DOMAgent                : require("LiveDevelopment/Agents/DOMAgent"),
            Inspector               : require("LiveDevelopment/Inspector/Inspector"),
            NativeApp               : NativeApp,
            ExtensionLoader         : ExtensionLoader,
            ExtensionUtils          : ExtensionUtils,
            UpdateNotification      : require("utils/UpdateNotification"),
            InstallExtensionDialog  : require("extensibility/InstallExtensionDialog"),
            RemoteAgent             : require("LiveDevelopment/Agents/RemoteAgent"),
            HTMLInstrumentation     : require("language/HTMLInstrumentation"),
            MultiRangeInlineEditor  : require("editor/MultiRangeInlineEditor").MultiRangeInlineEditor,
            LanguageManager         : LanguageManager,
            FindInFiles             : require("search/FindInFiles"),
            FileFilters             : require("search/FileFilters"),
            doneLoading             : false
        };

        AppInit.appReady(function () {
            brackets.test.doneLoading = true;
        });
    }
            
    function _onReady() {
        PerfUtils.addMeasurement("window.document Ready");

        EditorManager.setEditorHolder($("#editor-holder"));

        // Let the user know Brackets doesn't run in a web browser yet
        if (brackets.inBrowser) {
            Dialogs.showModalDialog(
                DefaultDialogs.DIALOG_ID_ERROR,
                Strings.ERROR_IN_BROWSER_TITLE,
                Strings.ERROR_IN_BROWSER
            );
        }

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

        // Load default languages and preferences
        Async.waitForAll([LanguageManager.ready, PreferencesManager.ready]).always(function () {
            // Load all extensions. This promise will complete even if one or more
            // extensions fail to load.
            var extensionPathOverride = params.get("extensions");  // used by unit tests
            var extensionLoaderPromise = ExtensionLoader.init(extensionPathOverride ? extensionPathOverride.split(",") : null);
            
            // Load the initial project after extensions have loaded
            extensionLoaderPromise.always(function () {
                // Finish UI initialization
                ViewCommandHandlers.restoreFontSize();
                var initialProjectPath = ProjectManager.getInitialProjectPath();
                ProjectManager.openProject(initialProjectPath).always(function () {
                    _initTest();
                    
                    // If this is the first launch, and we have an index.html file in the project folder (which should be
                    // the samples folder on first launch), open it automatically. (We explicitly check for the
                    // samples folder in case this is the first time we're launching Brackets after upgrading from
                    // an old version that might not have set the "afterFirstLaunch" pref.)
                    var deferred = new $.Deferred();
                    
                    if (!params.get("skipSampleProjectLoad") && !PreferencesManager.getViewState("afterFirstLaunch")) {
                        PreferencesManager.setViewState("afterFirstLaunch", "true");
                        if (ProjectManager.isWelcomeProjectPath(initialProjectPath)) {
                            FileSystem.resolve(initialProjectPath + "index.html", function (err, file) {
                                if (!err) {
                                    var promise = CommandManager.execute(Commands.FILE_ADD_TO_WORKING_SET, { fullPath: file.fullPath });
                                    promise.then(deferred.resolve, deferred.reject);
                                } else {
                                    deferred.reject();
                                }
                            });
                        } else {
                            deferred.resolve();
                        }
                    } else {
                        deferred.resolve();
                    }
                    
                    deferred.always(function () {
                        // Signal that Brackets is loaded
                        AppInit._dispatchReady(AppInit.APP_READY);
                        
                        PerfUtils.addMeasurement("Application Startup");
                        
                        if (PreferencesManager._isUserScopeCorrupt()) {
                            Dialogs.showModalDialog(
                                DefaultDialogs.DIALOG_ID_ERROR,
                                Strings.ERROR_PREFS_CORRUPT_TITLE,
                                Strings.ERROR_PREFS_CORRUPT
                            )
                                .done(function () {
                                    CommandManager.execute(Commands.FILE_OPEN_PREFERENCES);
                                });
                        }
                        
                    });
                    
                    // See if any startup files were passed to the application
                    if (brackets.app.getPendingFilesToOpen) {
                        brackets.app.getPendingFilesToOpen(function (err, files) {
                            DragAndDrop.openDroppedFiles(files);
                        });
                    }
                });
            });
        });
        
        // Check for updates
        if (!params.get("skipUpdateCheck") && !brackets.inBrowser) {
            // check once a day, plus 2 minutes, 
            // as the check will skip if the last check was not -24h ago
            window.setInterval(UpdateNotification.checkForUpdate, 86520000);
            
            // Check for updates on App Ready
            AppInit.appReady(function () {
                UpdateNotification.checkForUpdate();
            });
        }
    }
    
    /**
     * Setup event handlers prior to dispatching AppInit.HTML_READY
     */
    function _beforeHTMLReady() {
        // Add the platform (mac or win) to the body tag so we can have platform-specific CSS rules
        $("body").addClass("platform-" + brackets.platform);
        
        // Browser-hosted version may also have different CSS (e.g. since '#titlebar' is shown)
        if (brackets.inBrowser) {
            $("body").addClass("in-browser");
        } else {
            $("body").addClass("in-appshell");
        }

        // Enable/Disable HTML Menus
        if (brackets.nativeMenus) {
            $("body").addClass("has-appshell-menus");
        } else {
            // (issue #5310) workaround for bootstrap dropdown: prevent the menu item to grab
            // the focus -- override jquery focus implementation for top-level menu items
            (function () {
                var defaultFocus = $.fn.focus;
                $.fn.focus = function () {
                    if (!this.hasClass("dropdown-toggle")) {
                        return defaultFocus.apply(this, arguments);
                    }
                };
            }());
        }
        
        // Localize MainViewHTML and inject into <BODY> tag
        $("body").html(Mustache.render(MainViewHTML, Strings));
        
        // Update title
        $("title").text(brackets.config.app_title);
            
        // Prevent unhandled drag and drop of files into the browser from replacing 
        // the entire Brackets app. This doesn't prevent children from choosing to
        // handle drops.
        $(window.document.body)
            .on("dragover", function (event) {
                var dropEffect = "none";
                if (event.originalEvent.dataTransfer.files) {
                    event.stopPropagation();
                    event.preventDefault();
                    // Don't allow drag-and-drop of files/folders when a modal dialog is showing.
                    if ($(".modal.instance").length === 0 &&
                            DragAndDrop.isValidDrop(event.originalEvent.dataTransfer.items)) {
                        dropEffect = "copy";
                    }
                    event.originalEvent.dataTransfer.dropEffect = dropEffect;
                }
            })
            .on("drop", function (event) {
                if (event.originalEvent.dataTransfer.files) {
                    event.stopPropagation();
                    event.preventDefault();
                    brackets.app.getDroppedFiles(function (err, files) {
                        if (!err) {
                            DragAndDrop.openDroppedFiles(files);
                        }
                    });
                }
            });
        
        // TODO: (issue 269) to support IE, need to listen to document instead (and even then it may not work when focus is in an input field?)
        $(window).focus(function () {
            // This call to syncOpenDocuments() *should* be a no-op now that we have
            // file watchers, but is still here as a safety net.
            FileSyncManager.syncOpenDocuments();
        });
        
        // Prevent unhandled middle button clicks from triggering native behavior
        // Example: activating AutoScroll (see #510)
        $("html").on("mousedown", ".inline-widget", function (e) {
            if (e.button === 1) {
                e.preventDefault();
            }
        });
        
        // The .no-focus style is added to clickable elements that should
        // not steal focus. Calling preventDefault() on mousedown prevents
        // focus from going to the click target.
        $("html").on("mousedown", ".no-focus", function (e) {
            // Text fields should always be focusable.
            var $target = $(e.target),
                isTextField =
                    $target.is("input[type=text]") ||
                    $target.is("input[type=number]") ||
                    $target.is("input[type=password]") ||
                    $target.is("input:not([type])") || // input with no type attribute defaults to text
                    $target.is("textarea");
    
            if (!isTextField) {
                e.preventDefault();
            }
        });
        
        // Prevent clicks on any link from navigating to a different page (which could lose unsaved
        // changes). We can't use a simple .on("click", "a") because of http://bugs.jquery.com/ticket/3861:
        // jQuery hides non-left clicks from such event handlers, yet middle-clicks still cause CEF to
        // navigate. Also, a capture handler is more reliable than bubble.
        window.document.body.addEventListener("click", function (e) {
            // Check parents too, in case link has inline formatting tags
            var node = e.target, url;
            while (node) {
                if (node.tagName === "A") {
                    url = node.getAttribute("href");
                    if (url && !url.match(/^#/)) {
                        NativeApp.openURLInDefaultBrowser(url);
                    }
                    e.preventDefault();
                    break;
                }
                node = node.parentElement;
            }
        }, true);
    }
    
    // Wait for view state to load.
    var viewStateTimer = PerfUtils.markStart("User viewstate loading");
    PreferencesManager._smUserScopeLoading.always(function () {
        PerfUtils.addMeasurement(viewStateTimer);
        // Dispatch htmlReady event
        _beforeHTMLReady();
        AppInit._dispatchReady(AppInit.HTML_READY);
        $(window.document).ready(_onReady);
    });
});
