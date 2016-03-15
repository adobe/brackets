/*
 * Copyright (c) 2012 - present Adobe Systems Incorporated. All rights reserved.
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
/*global define, brackets: true, $, window, navigator, Mustache, jQuery */

// TODO: (issue #264) break out the definition of brackets into a separate module from the application controller logic

/**
 * brackets is the root of the Brackets codebase. This file pulls in all other modules as
 * dependencies (or dependencies thereof), initializes the UI, and binds global menus & keyboard
 * shortcuts to their Commands.
 *
 * Unlike other modules, this one can be accessed without an explicit require() because it exposes
 * a global object, window.brackets.
 */
define(function (require, exports, module) {
    "use strict";

    // Load dependent non-module scripts
    require("thirdparty/path-utils/path-utils.min");
    require("widgets/bootstrap-dropdown");
    require("widgets/bootstrap-modal");
    require("widgets/bootstrap-twipsy-mod");

    // Load CodeMirror add-ons--these attach themselves to the CodeMirror module
    require("thirdparty/CodeMirror/addon/edit/closebrackets");
    require("thirdparty/CodeMirror/addon/edit/closetag");
    require("thirdparty/CodeMirror/addon/edit/matchbrackets");
    require("thirdparty/CodeMirror/addon/edit/matchtags");
    require("thirdparty/CodeMirror/addon/fold/xml-fold");
    require("thirdparty/CodeMirror/addon/mode/multiplex");
    require("thirdparty/CodeMirror/addon/mode/overlay");
    require("thirdparty/CodeMirror/addon/mode/simple");
    require("thirdparty/CodeMirror/addon/scroll/scrollpastend");
    require("thirdparty/CodeMirror/addon/search/match-highlighter");
    require("thirdparty/CodeMirror/addon/search/searchcursor");
    require("thirdparty/CodeMirror/addon/selection/active-line");
    require("thirdparty/CodeMirror/addon/selection/mark-selection");
    require("thirdparty/CodeMirror/keymap/sublime");

    // Load dependent modules
    var AppInit             = require("utils/AppInit"),
        LanguageManager     = require("language/LanguageManager"),
        ProjectManager      = require("project/ProjectManager"),
        FileViewController  = require("project/FileViewController"),
        FileSyncManager     = require("project/FileSyncManager"),
        Commands            = require("command/Commands"),
        CommandManager      = require("command/CommandManager"),
        PerfUtils           = require("utils/PerfUtils"),
        FileSystem          = require("filesystem/FileSystem"),
        Strings             = require("strings"),
        Dialogs             = require("widgets/Dialogs"),
        DefaultDialogs      = require("widgets/DefaultDialogs"),
        ExtensionLoader     = require("utils/ExtensionLoader"),
        Async               = require("utils/Async"),
        UpdateNotification  = require("utils/UpdateNotification"),
        UrlParams           = require("utils/UrlParams").UrlParams,
        PreferencesManager  = require("preferences/PreferencesManager"),
        DragAndDrop         = require("utils/DragAndDrop"),
        NativeApp           = require("utils/NativeApp"),
        DeprecationWarning  = require("utils/DeprecationWarning"),
        ViewCommandHandlers = require("view/ViewCommandHandlers"),
        MainViewManager     = require("view/MainViewManager");

    var MainViewHTML        = require("text!htmlContent/main-view.html");

    // load modules for later use
    require("utils/Global");
    require("editor/CSSInlineEditor");
    require("project/WorkingSetSort");
    require("search/QuickOpen");
    require("file/FileUtils");
    require("project/SidebarView");
    require("utils/Resizer");
    require("LiveDevelopment/main");
    require("utils/NodeConnection");
    require("utils/NodeDomain");
    require("utils/ColorUtils");
    require("view/ThemeManager");
    require("thirdparty/lodash");
    require("language/XMLUtils");
    require("language/JSONUtils");

    // DEPRECATED: In future we want to remove the global CodeMirror, but for now we
    // expose our required CodeMirror globally so as to avoid breaking extensions in the
    // interim.
    var CodeMirror = require("thirdparty/CodeMirror/lib/codemirror");

    Object.defineProperty(window, "CodeMirror", {
        get: function () {
            DeprecationWarning.deprecationWarning('Use brackets.getModule("thirdparty/CodeMirror/lib/codemirror") instead of global CodeMirror.', true);
            return CodeMirror;
        }
    });

    // Load modules that self-register and just need to get included in the main project
    require("command/DefaultMenus");
    require("document/ChangedDocumentTracker");
    require("editor/EditorCommandHandlers");
    require("editor/EditorOptionHandlers");
    require("editor/EditorStatusBar");
    require("editor/ImageViewer");
    require("extensibility/InstallExtensionDialog");
    require("extensibility/ExtensionManagerDialog");
    require("help/HelpCommandHandlers");
    require("search/FindInFilesUI");
    require("search/FindReplace");

    // Compatibility shim for PanelManager to WorkspaceManager migration
    require("view/PanelManager");

    PerfUtils.addMeasurement("brackets module dependencies resolved");

    // Local variables
    var params = new UrlParams();

    // read URL params
    params.parse();


    /**
     * Setup test object
     */
    function _initTest() {
        // TODO: (issue #265) Make sure the "test" object is not included in final builds
        // All modules that need to be tested from the context of the application
        // must to be added to this object. The unit tests cannot just pull
        // in the modules since they would run in context of the unit test window,
        // and would not have access to the app html/css.
        brackets.test = {
            CodeHintManager         : require("editor/CodeHintManager"),
            CodeInspection          : require("language/CodeInspection"),
            CommandManager          : require("command/CommandManager"),
            Commands                : require("command/Commands"),
            CSSUtils                : require("language/CSSUtils"),
            DefaultDialogs          : require("widgets/DefaultDialogs"),
            Dialogs                 : require("widgets/Dialogs"),
            DocumentCommandHandlers : require("document/DocumentCommandHandlers"),
            DocumentManager         : require("document/DocumentManager"),
            DocumentModule          : require("document/Document"),
            DOMAgent                : require("LiveDevelopment/Agents/DOMAgent"),
            DragAndDrop             : require("utils/DragAndDrop"),
            EditorManager           : require("editor/EditorManager"),
            ExtensionLoader         : require("utils/ExtensionLoader"),
            ExtensionUtils          : require("utils/ExtensionUtils"),
            File                    : require("filesystem/File"),
            FileFilters             : require("search/FileFilters"),
            FileSyncManager         : require("project/FileSyncManager"),
            FileSystem              : require("filesystem/FileSystem"),
            FileUtils               : require("file/FileUtils"),
            FileViewController      : require("project/FileViewController"),
            FindInFiles             : require("search/FindInFiles"),
            FindInFilesUI           : require("search/FindInFilesUI"),
            HTMLInstrumentation     : require("language/HTMLInstrumentation"),
            Inspector               : require("LiveDevelopment/Inspector/Inspector"),
            InstallExtensionDialog  : require("extensibility/InstallExtensionDialog"),
            JSUtils                 : require("language/JSUtils"),
            KeyBindingManager       : require("command/KeyBindingManager"),
            LanguageManager         : require("language/LanguageManager"),
            LiveDevelopment         : require("LiveDevelopment/LiveDevelopment"),
            LiveDevMultiBrowser     : require("LiveDevelopment/LiveDevMultiBrowser"),
            LiveDevServerManager    : require("LiveDevelopment/LiveDevServerManager"),
            MainViewFactory         : require("view/MainViewFactory"),
            MainViewManager         : require("view/MainViewManager"),
            Menus                   : require("command/Menus"),
            MultiRangeInlineEditor  : require("editor/MultiRangeInlineEditor").MultiRangeInlineEditor,
            NativeApp               : require("utils/NativeApp"),
            PerfUtils               : require("utils/PerfUtils"),
            PreferencesManager      : require("preferences/PreferencesManager"),
            ProjectManager          : require("project/ProjectManager"),
            RemoteAgent             : require("LiveDevelopment/Agents/RemoteAgent"),
            ScrollTrackMarkers      : require("search/ScrollTrackMarkers"),
            UpdateNotification      : require("utils/UpdateNotification"),
            WorkingSetView          : require("project/WorkingSetView"),
            doneLoading             : false
        };

        AppInit.appReady(function () {
            brackets.test.doneLoading = true;
        });
    }

    /**
     * Setup Brackets
     */
    function _onReady() {
        PerfUtils.addMeasurement("window.document Ready");

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
               // Signal that extensions are loaded
                AppInit._dispatchReady(AppInit.EXTENSIONS_LOADED);

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
                                    var promise = CommandManager.execute(Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN, { fullPath: file.fullPath });
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
                            var userPrefFullPath = PreferencesManager.getUserPrefFile();
                            // user scope can get corrupt only if the file exists, is readable,
                            // but malformed. no need to check for its existance.
                            var info = MainViewManager.findInAllWorkingSets(userPrefFullPath);
                            var paneId;
                            if (info.length) {
                                paneId = info[0].paneId;
                            }
                            FileViewController.openFileAndAddToWorkingSet(userPrefFullPath, paneId)
                                .done(function () {
                                    Dialogs.showModalDialog(
                                        DefaultDialogs.DIALOG_ID_ERROR,
                                        Strings.ERROR_PREFS_CORRUPT_TITLE,
                                        Strings.ERROR_PREFS_CORRUPT
                                    ).done(function () {
                                        // give the focus back to the editor with the pref file
                                        MainViewManager.focusActivePane();
                                    });
                                });
                        }

                    });

                    // See if any startup files were passed to the application
                    if (brackets.app.getPendingFilesToOpen) {
                        brackets.app.getPendingFilesToOpen(function (err, paths) {
                            DragAndDrop.openDroppedFiles(paths);
                        });
                    }
                });
            });
        });

        // Check for updates
        if (!brackets.inBrowser && !params.get("skipUpdateCheck")) {
            AppInit.appReady(function () {
                // launches periodic checks for updates cca every 24 hours
                UpdateNotification.launchAutomaticUpdate();
            });
        }
    }

    /**
     * Setup event handlers prior to dispatching AppInit.HTML_READY
     */
    function _beforeHTMLReady() {
        // Add the platform (mac, win or linux) to the body tag so we can have platform-specific CSS rules
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
        $("body").html(Mustache.render(MainViewHTML, { shouldAddAA: (brackets.platform === "mac"), Strings: Strings }));

        // Update title
        $("title").text(brackets.config.app_title);

        // Respond to dragging & dropping files/folders onto the window by opening them. If we don't respond
        // to these events, the file would load in place of the Brackets UI
        DragAndDrop.attachHandlers();

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
                isFormElement =
                    $target.is("input") ||
                    $target.is("textarea") ||
                    $target.is("select");

            if (!isFormElement) {
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

        // on Windows, cancel every other scroll event (#10214)
        // TODO: remove this hack when we upgrade CEF to a build with this bug fixed:
        // https://bitbucket.org/chromiumembedded/cef/issue/1481
        var winCancelWheelEvent = true;
        function windowsScrollFix(e) {
            winCancelWheelEvent = !winCancelWheelEvent;
            if (winCancelWheelEvent) {
                e.preventDefault();
                e.stopImmediatePropagation();
            }
        }

        function enableOrDisableWinScrollFix() {
            window.document.body.removeEventListener("wheel", windowsScrollFix, true);
            if (PreferencesManager.get("_windowsScrollFix")) {
                window.document.body.addEventListener("wheel", windowsScrollFix, true);
            }
        }

        if (brackets.platform === "win" && !brackets.inBrowser) {
            PreferencesManager.definePreference("_windowsScrollFix", "boolean", true, {
                excludeFromHints: true
            }).on("change", enableOrDisableWinScrollFix);
            enableOrDisableWinScrollFix();
        }

        // Prevent extensions from using window.open() to insecurely load untrusted web content
        var real_windowOpen = window.open;
        window.open = function (url) {
            // Allow file:// URLs, relative URLs (implicitly file: also), and about:blank
            if (!url.match(/^file:\/\//) && !url.match(/^about:blank/) && url.indexOf(":") !== -1) {
                throw new Error("Brackets-shell is not a secure general purpose web browser. Use NativeApp.openURLInDefaultBrowser() to open URLs in the user's main browser");
            }
            return real_windowOpen.apply(window, arguments);
        };

        // jQuery patch to shim deprecated usage of $() on EventDispatchers
        var DefaultCtor = jQuery.fn.init;
        jQuery.fn.init = function (firstArg, secondArg) {
            var jQObject = new DefaultCtor(firstArg, secondArg);

            // Is this a Brackets EventDispatcher object? (not a DOM node or other object)
            if (firstArg && firstArg._EventDispatcher) {
                // Patch the jQ wrapper object so it calls EventDispatcher's APIs instead of jQuery's
                jQObject.on  = firstArg.on.bind(firstArg);
                jQObject.one = firstArg.one.bind(firstArg);
                jQObject.off = firstArg.off.bind(firstArg);
                // Don't offer legacy support for trigger()/triggerHandler() on core model objects; extensions
                // shouldn't be doing that anyway since it's basically poking at private API

                // Console warning, since $() is deprecated for EventDispatcher objects
                // (pass true to only print once per caller, and index 4 since the extension caller is deeper in the stack than usual)
                DeprecationWarning.deprecationWarning("Deprecated: Do not use $().on/off() on Brackets modules and model objects. Call on()/off() directly on the object without a $() wrapper.", true, 4);
            }
            return jQObject;
        };
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
