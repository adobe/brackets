/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, brackets: true, $: false, JSLINT: false, PathUtils: false */

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
    require("thirdparty/jslint/jslint");
    
    // Load dependent modules
    var ProjectManager          = require("ProjectManager"),
        DocumentManager         = require("DocumentManager"),
        EditorManager           = require("EditorManager"),
        WorkingSetView          = require("WorkingSetView"),
        FileCommandHandlers     = require("FileCommandHandlers"),
        FileViewController      = require("FileViewController"),
        FileSyncManager         = require("FileSyncManager"),
        KeyBindingManager       = require("KeyBindingManager"),
        KeyMap                  = require("KeyMap"),
        Commands                = require("Commands"),
        CommandManager          = require("CommandManager"),
        CodeHintManager         = require("CodeHintManager"),
        PerfUtils               = require("PerfUtils"),
        CSSManager              = require("CSSManager");

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
        PreferencesManager      : require("PreferencesManager"),
        ProjectManager          : ProjectManager,
        FileCommandHandlers     : FileCommandHandlers,
        FileViewController      : FileViewController,
        DocumentManager         : DocumentManager,
        Commands                : Commands,
        WorkingSetView          : WorkingSetView,
        CommandManager          : require("CommandManager"),
        CSSManager              : CSSManager
    };
    
    // Uncomment the following line to force all low level file i/o routines to complete
    // asynchronously. This should only be done for testing/debugging.
    // NOTE: Make sure this line is commented out again before committing!
    // brackets.forceAsyncCallbacks = true;

    // Load native shell when brackets is run in a native shell rather than the browser
    // TODO: (issue #266) load conditionally
    brackets.shellAPI = require("ShellAPI");
    
    brackets.inBrowser = !brackets.hasOwnProperty("fs");
    
    brackets.platform = (global.navigator.platform === "MacIntel" || global.navigator.platform === "MacPPC") ? "mac" : "win";

    brackets.DIALOG_BTN_CANCEL = "cancel";
    brackets.DIALOG_BTN_OK = "ok";
    brackets.DIALOG_BTN_DONTSAVE = "dontsave";
    brackets.DIALOG_CANCELED = "_canceled";

    brackets.DIALOG_ID_ERROR = "error-dialog";
    brackets.DIALOG_ID_SAVE_CLOSE = "save-close-dialog";
    brackets.DIALOG_ID_EXT_CHANGED = "ext-changed-dialog";
    brackets.DIALOG_ID_EXT_DELETED = "ext-deleted-dialog";

    /**
     * General purpose modal dialog. Assumes that:
     * -- the root tag of the dialog is marked with a unique class name (passed as dlgClass), as well as the
     *    classes "template modal hide".
     * -- the HTML for the dialog contains elements with "title" and "message" classes, as well as a number 
     *    of elements with "dialog-button" class, each of which has a "data-button-id".
     *
     * @param {string} dlgClass The class of the dialog node in the HTML.
     * @param {string} title The title of the error dialog. Can contain HTML markup.
     * @param {string} message The message to display in the error dialog. Can contain HTML markup.
     * @return {Deferred} a $.Deferred() that will be resolved with the ID of the clicked button when the dialog
     *     is dismissed. Never rejected.
     */
    brackets.showModalDialog = function (dlgClass, title, message, callback) {
        var result = $.Deferred();
        
        // We clone the HTML rather than using it directly so that if two dialogs of the same
        // type happen to show up, they can appear at the same time. (This is an edge case that
        // shouldn't happen often, but we can't prevent it from happening since everything is
        // asynchronous.)
        // TODO: (issue #258) In future, we should templatize the HTML for the dialogs rather than having 
        // it live directly in the HTML.
        var dlg = $("." + dlgClass + ".template")
            .clone()
            .removeClass("template")
            .addClass("instance")
            .appendTo(document.body);

        // Set title and message
        $(".dialog-title", dlg).html(title);
        $(".dialog-message", dlg).html(message);

        // Pipe dialog-closing notification back to client code
        dlg.one("hidden", function () {
            var buttonId = dlg.data("buttonId");
            if (!buttonId) {    // buttonId will be undefined if closed via Bootstrap's "x" button
                buttonId = brackets.DIALOG_BTN_CANCEL;
            }
            
            // Let call stack return before notifying that dialog has closed; this avoids issue #191
            // if the handler we're triggering might show another dialog (as long as there's no
            // fade-out animation)
            setTimeout(function () {
                result.resolve(buttonId);
            }, 0);
            
            // Remove the dialog instance from the DOM.
            dlg.remove();
        });

        function stopEvent(e) {
            // Stop the event if the target is not inside the dialog
            if (!($.contains(dlg.get(0), e.target))) {
                e.stopPropagation();
                e.preventDefault();
            }
        }
        
        // Enter/Return handler for the primary button. Need to
        // add both keydown and keyup handlers here to make sure
        // the enter key was pressed while the dialog was showing.
        // Otherwise, if a keydown or keypress from somewhere else
        // triggered an alert, the keyup could immediately dismiss it.
        var enterKeyPressed = false;
        
        function keydownHandler(e) {
            if (e.keyCode === 13) {
                enterKeyPressed = true;
            }
            stopEvent(e);
        }
        
        function keyupHandler(e) {
            if (e.keyCode === 13 && enterKeyPressed) {
                var primaryBtn = dlg.find(".primary");
                if (primaryBtn) {
                    brackets._dismissDialog(dlg, primaryBtn.attr("data-button-id"));
                }
            }
            enterKeyPressed = false;
            stopEvent(e);
        }
        
        // These handlers are added at the capture phase to make sure we
        // get first crack at the events. 
        document.body.addEventListener("keydown", keydownHandler, true);
        document.body.addEventListener("keyup", keyupHandler, true);
        
        // Click handler for buttons
        dlg.one("click", ".dialog-button", function (e) {
            brackets._dismissDialog(dlg, $(this).attr("data-button-id"));
        });

        // Run the dialog
        dlg.modal({
            backdrop: "static",
            show: true
        }).on("hide", function (e) {
            // Remove key event handlers
            document.body.removeEventListener("keydown", keydownHandler, true);
            document.body.removeEventListener("keyup", keyupHandler, true);
        });
        return result;
    };
    
    /**
     * Immediately closes any dialog instances with the given class. The dialog callback for each instance will 
     * be called with the special buttonId brackets.DIALOG_CANCELED (note: callback is run asynchronously).
     */
    brackets.cancelModalDialogIfOpen = function (dlgClass) {
        $("." + dlgClass + ".instance").each(function (dlg) {
            if (dlg.is(":visible")) {   // Bootstrap breaks if try to hide dialog that's already hidden
                brackets._dismissDialog(dlg, brackets.DIALOG_CANCELED);
            }
        });
    };
    
    brackets._dismissDialog = function (dlg, buttonId) {
        dlg.data("buttonId", buttonId);
        dlg.modal(true).hide();
    };


    // Main Brackets initialization
    $(document).ready(function () {
        var _enableJSLint = true;
        
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
                ProjectManager.openProject();
            });

            // Handle toggling top level disclosure arrows of file list area
            $("#open-files-disclosure-arrow").click(function () {
                $(this).toggleClass("disclosure-arrow-closed");
                $("#open-files-container").toggle();
            });
            $("#project-files-disclosure-arrow").click(function () {
                $(this).toggleClass("disclosure-arrow-closed");
                $("#project-files-container").toggle();
            });
       
        }
        
        function runJSLint() {
            var currentDoc = DocumentManager.getCurrentDocument();
            var ext = currentDoc ? PathUtils.filenameExtension(currentDoc.file.fullPath) : "";
            var lintResults = $("#jslint-results");
            var goldStar = $("#gold-star");
            
            if (_enableJSLint && /^(\.js|\.htm|\.html)$/i.test(ext)) {
                var text = currentDoc.getText();
                
                // If a line contains only whitespace, remove the whitespace
                // This should be doable with a regexp: text.replace(/\r[\x20|\t]+\r/g, "\r\r");,
                // but that doesn't work.
                var i, arr = text.split("\n");
                for (i = 0; i < arr.length; i++) {
                    if (!arr[i].match(/\S/)) {
                        arr[i] = "";
                    }
                }
                text = arr.join("\n");
                
                var result = JSLINT(text, null);
                
                if (!result) {
                    var errorTable = $("<table class='zebra-striped condensed-table'>")
                                       .append("<tbody>");
                    var selectedRow;
                    
                    JSLINT.errors.forEach(function (item, i) {
                        if (item) {
                            var makeCell = function (content) {
                                return $("<td/>").text(content);
                            };
                            
                            // Add row to error table
                            var row = $("<tr/>")
                                .append(makeCell(item.line))
                                .append(makeCell(item.reason))
                                .append(makeCell(item.evidence || ""))
                                .appendTo(errorTable);
                            
                            row.click(function () {
                                if (selectedRow) {
                                    selectedRow.removeClass("selected");
                                }
                                row.addClass("selected");
                                selectedRow = row;
                                currentDoc.setCursor(item.line - 1, item.character - 1);
                                EditorManager.focusEditor();
                            });
                        }
                    });

                    $("#jslint-results .table-container")
                        .empty()
                        .append(errorTable);
                    lintResults.show();
                    goldStar.hide();
                } else {
                    lintResults.hide();
                    goldStar.show();
                }
            } else {
                // JSLint is disabled or does not apply to the current file, hide
                // both the results and the gold star
                lintResults.hide();
                goldStar.hide();
            }
            
            EditorManager.resizeEditor();
        }
        
        function initMenus() {
            // Implements the File menu items
            $("#menu-file-new").click(function () {
                CommandManager.execute(Commands.FILE_NEW);
            });
            $("#menu-file-open").click(function () {
                CommandManager.execute(Commands.FILE_OPEN);
            });
            $("#menu-file-close").click(function () {
                CommandManager.execute(Commands.FILE_CLOSE);
            });
            $("#menu-file-save").click(function () {
                CommandManager.execute(Commands.FILE_SAVE);
            });
            $("#menu-file-quit").click(function () {
                CommandManager.execute(Commands.FILE_QUIT);
            });

            // Implements the 'Run Tests' menu to bring up the Jasmine unit test window
            var testWindow = null;
            $("#menu-debug-runtests").click(function () {
                if (testWindow) {
                    try {
                        testWindow.location.reload();
                    } catch (e) {
                        testWindow = null;  // the window was probably closed
                    }
                }

                if (!testWindow) {
                    testWindow = window.open("../test/SpecRunner.html");
                    testWindow.location.reload(); // if it was opened before, we need to reload because it will be cached
                }
            });
            
            // Other debug menu items
//            $("#menu-debug-wordwrap").click(function() {
//                editor.setOption("lineWrapping", !(editor.getOption("lineWrapping")));
//            });     
            
            $("#menu-debug-jslint").click(function () {
                _enableJSLint = !_enableJSLint;
                runJSLint();
                $("#jslint-enabled-checkbox").css("display", _enableJSLint ? "" : "none");
            });
            
            $("#menu-debug-show-perf").click(function () {
                var perfHeader = $("<div class='modal-header' />")
                    .append("<a href='#' class='close'>&times;</a>")
                    .append("<h3 class='dialog-title'>Performance Data</h3>");
                
                var perfBody = $("<div class='modal-body' style='padding: 0' />");

                var data = $("<table class='zebra-striped condensed-table' style='max-height: 600px; overflow: auto;'>")
                    .append("<thead><th>Operation</th><th>Time (ms)</th></thead>")
                    .append("<tbody />")
                    .appendTo(perfBody);
                
                var makeCell = function (content) {
                    return $("<td/>").text(content);
                };
                
                var getValue = function (entry) {
                    // entry is either an Array or a number
                    // If it is an Array, return the average value
                    if (Array.isArray(entry)) {
                        var i, sum = 0;
                        
                        for (i = 0; i < entry.length; i++) {
                            sum += entry[i];
                        }
                        return String(Math.floor(sum / entry.length)) + " (avg)";
                    } else {
                        return entry;
                    }
                };
                    
                var testName;
                var perfData = PerfUtils.perfData;
                for (testName in perfData) {
                    if (perfData.hasOwnProperty(testName)) {
                        // Add row to error table
                        var row = $("<tr/>")
                            .append(makeCell(testName))
                            .append(makeCell(getValue(perfData[testName])))
                            .appendTo(data);
                    }
                }
                                                             
                var perfDlog = $("<div class='modal hide' />")
                    .append(perfHeader)
                    .append(perfBody)
                    .appendTo(document.body)
                    .modal({
                        backdrop: "static",
                        show: true
                    });
            });
        }

        function initCommandHandlers() {
            FileCommandHandlers.init($("#main-toolbar .title"));
        }

        function initKeyBindings() {
            // Register keymaps and install the keyboard handler
            // TODO: (issue #268) show keyboard equivalents in the menus
            var _globalKeymap = KeyMap.create({
                "bindings": [
                    {"Ctrl-O": Commands.FILE_OPEN},
                    {"Ctrl-S": Commands.FILE_SAVE},
                    {"Ctrl-W": Commands.FILE_CLOSE},
                    {"Ctrl-R": Commands.FILE_RELOAD, "platform": "mac"},
                    {"F5"    : Commands.FILE_RELOAD, "platform": "win"}
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
            });
            
            $(window).unload(function () {
                CommandManager.execute(Commands.FILE_CLOSE_WINDOW);
            });
            
            $(window).contextmenu(function (e) {
                e.preventDefault();
            });
        }


        EditorManager.setEditorHolder($('#editorHolder'));
    
        initListeners();
        initProject();
        initMenus();
        initCommandHandlers();
        initKeyBindings();
        initWindowListeners();
        
        $(DocumentManager).on("currentDocumentChange", function () {
            runJSLint();
        });
        
        $(DocumentManager).on("documentSaved", function (event, document) {
            if (document === DocumentManager.getCurrentDocument()) {
                runJSLint();
            }
        });
        
        PerfUtils.addMeasurement("Application Startup");
    });
    
});
