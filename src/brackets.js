/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, brackets: true, $: false, JSLINT: false, PathUtils: false */

// TODO: break out the definition of brackets into a separate module from the application controller logic
define(function (require, exports, module) {
    'use strict';
    
    // Load dependent non-module scripts
    require("widgets/bootstrap-dropdown");
    require("widgets/bootstrap-modal");
    require("thirdparty/path-utils/path-utils.min");
    require("thirdparty/jslint/jslint");
    
    // Load dependent modules
    var PreferencesManager      = require("PreferencesManager"),
        ProjectManager          = require("ProjectManager"),
        DocumentManager         = require("DocumentManager"),
        EditorManager           = require("EditorManager"),
        WorkingSetView          = require("WorkingSetView"),
        FileCommandHandlers     = require("FileCommandHandlers"),
        FileViewController      = require("FileViewController"),
        KeyBindingManager       = require("KeyBindingManager").KeyBindingManager,
        KeyMap                  = require("KeyBindingManager").KeyMap,
        Commands                = require("Commands"),
        CommandManager          = require("CommandManager");

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
    
    // TODO: Make sure the "test" object is not included in final builds
    // All modules that need to be tested from the context of the application
    // must to be added to this object. The unit tests cannot just pull
    // in the modules since they would run in context of the unit test window,
    // and would not have access to the app html/css.
    brackets.test = {
        PreferencesManager      : PreferencesManager,
        ProjectManager          : ProjectManager,
        FileCommandHandlers     : FileCommandHandlers,
        FileViewController      : FileViewController,
        DocumentManager         : DocumentManager,
        Commands                : Commands,
        WorkingSetView          : WorkingSetView,
        CommandManager          : require("CommandManager")
    };

    brackets.inBrowser = !brackets.hasOwnProperty("fs");

    brackets.DIALOG_BTN_CANCEL = "cancel";
    brackets.DIALOG_BTN_OK = "ok";
    brackets.DIALOG_BTN_DONTSAVE = "dontsave";

    brackets.DIALOG_ID_ERROR = "error-dialog";
    brackets.DIALOG_ID_SAVE_CLOSE = "save-close-dialog";

    /**
     * General purpose modal dialog. Assumes that the HTML for the dialog contains elements with "title"
     * and "message" classes, as well as a number of elements with "dialog-button" class, each of which has
     * a "data-button-id".
     *
     * @param {string} id The ID of the dialog node in the HTML.
     * @param {string} title The title of the error dialog. Can contain HTML markup.
     * @param {string} message The message to display in the error dialog. Can contain HTML markup.
     * @return {Deferred} a $.Deferred() that will be resolved with the ID of the clicked button when the dialog
     *     is dismissed. Never rejected.
     */
    brackets.showModalDialog = function (id, title, message, callback) {
        var result = $.Deferred();
        var dlg = $("#" + id);

        // Set title and message
        $(".dialog-title", dlg).html(title);
        $(".dialog-message", dlg).html(message);

        function dismissDialog(buttonId) {
            dlg.one("hidden", function () {
                // Let call stack return before notifying that dialog has closed; this avoids issue #191
                // if the handler we're triggering might show another dialog (as long as there's no
                // fade-out animation)
                setTimeout(function () {
                    result.resolve(buttonId);
                }, 0);
            });
            
            dlg.modal(true).hide();
        }
        
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
                    dismissDialog(primaryBtn.attr("data-button-id"));
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
            dismissDialog($(this).attr("data-button-id"));
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

    $(document).ready(function () {

        var _enableJSLint = true; // TODO: Decide if this should be opt-in or opt-out.
        
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

                if (testWindow === null) {
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
        }

        function initCommandHandlers() {
            FileCommandHandlers.init($("#main-toolbar .title"));
        }

        function initKeyBindings() {
            // Register keymaps and install the keyboard handler
            // TODO: show keyboard equivalents in the menus
            var _globalKeymap = new KeyMap({
                "Ctrl-O": Commands.FILE_OPEN,
                "Ctrl-S": Commands.FILE_SAVE,
                "Ctrl-W": Commands.FILE_CLOSE
            });
            KeyBindingManager.installKeymap(_globalKeymap);

            $(document.body).keydown(function (event) {
                var keyDescriptor = [];
                if (event.metaKey || event.ctrlKey) {
                    keyDescriptor.push("Ctrl");
                }
                if (event.altKey) {
                    keyDescriptor.push("Alt");
                }
                if (event.shiftKey) {
                    keyDescriptor.push("Shift");
                }
                keyDescriptor.push(String.fromCharCode(event.keyCode).toUpperCase());
                if (KeyBindingManager.handleKey(keyDescriptor.join("-"))) {
                    event.preventDefault();
                }
            });
        }

        EditorManager.setEditorHolder($('#editorHolder'));
    
        initListeners();
        initProject();
        initMenus();
        initCommandHandlers();
        initKeyBindings();
        
        $(DocumentManager).on("currentDocumentChange", function () {
            runJSLint();
        });
        
        $(DocumentManager).on("documentSaved", function (event, document) {
            if (document === DocumentManager.getCurrentDocument()) {
                runJSLint();
            }
        });
    });
    

    $(window).unload(function () {
        PreferencesManager.savePreferences();
    });
});
