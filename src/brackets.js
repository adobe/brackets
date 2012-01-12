/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */

// TODO: break out the definition of brackets into a separate module from the application controller logic
define(function(require, exports, module) {
    // Load dependent non-module scripts
    require("widgets/bootstrap-dropdown");
    require("widgets/bootstrap-modal");

    // Load dependent modules
    var PreferencesManager      = require("PreferencesManager")
    ,   ProjectManager          = require("ProjectManager")
    ,   EditorManager           = require("EditorManager")
	,   WorkingSetView          = require("WorkingSetView")
    ,   FileCommandHandlers     = require("FileCommandHandlers")
    ,   KeyBindingManager       = require("KeyBindingManager").KeyBindingManager
    ,   KeyMap                  = require("KeyBindingManager").KeyMap
    ,   Commands                = require("Commands")
    ;

    // Define core brackets namespace
    brackets = window.brackets || {};

    // TODO: Make sure the "test" object is not included in final builds
    // All modules that need to be tested from the context of the application
    // must to be added to this object. The unit tests cannot just pull
    // in the modules since they would run in context of the unit test window,
    // and would not have access to the app html/css.
    brackets.test =
        { ProjectManager        : ProjectManager
        , FileCommandHandlers   : FileCommandHandlers
        , Commands              : Commands
        , CommandManager        : require("CommandManager")
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
     *     is dismissed.
     */
    brackets.showModalDialog = function(id, title, message, callback) {
        var result = $.Deferred();
        var dlg = $("#" + id);

        // Set title and message
        $(".dialog-title", dlg).html(title);
        $(".dialog-message", dlg).html(message);

        function dismissDialog(buttonId) {
            dlg.one("hidden", function() {
                result.resolve(buttonId);
            });
            dlg.modal(true).hide();
        }
        // Click handler for buttons
        dlg.one("click", ".dialog-button", function(e) {
            dismissDialog($(this).attr("data-button-id"));
        });

        // Enter/Return handler for the primary button. Need to
        // add both keydown and keyup handlers here to make sure
        // the enter key was pressed while the dialog was showing.
        // Otherwise, if a keydown or keypress from somewhere else
        // triggered an alert, the keyup could immediately dismiss it.
        var enterKeyPressed = false;
        $(document).on("keydown.modal", function(e) {
            if (e.keyCode === 13) {
                enterKeyPressed = true;
            }
        }).on("keyup.modal", function(e) {
            if (e.keyCode === 13 && enterKeyPressed) {
                var primaryBtn = dlg.find(".primary");
                if (primaryBtn) {
                    dismissDialog(primaryBtn.attr("data-button-id"));
                }
            }
            enterKeyPressed = false;
        });


        // Run the dialog
        dlg.modal(
            { backdrop: "static"
            , show: true
            }
        ).on("hide", function(e) {
            // Remove all handlers in the .modal namespace
            $(document).off(".modal");
        });
        return result;
    };

    $(document).ready(function() {

        EditorManager.setEditorArea( $('#editorHolder') );
    
        initProject();
        initMenus();
        initCommandHandlers();
        initKeyBindings();

        function initProject() {
            ProjectManager.loadProject();

            // Open project button
            $("#btn-open-project").click(function() {
                ProjectManager.openProject();
            });

            // Handle toggling top level disclosure arrows of file list area
            $("#open-files-disclosure-arrow").click(function(){
                $(this).toggleClass( "disclosure-arrow-closed");
                $("#open-files-container").toggle();
            });
            $("#project-files-disclosure-arrow").click(function(){
                $(this).toggleClass( "disclosure-arrow-closed");
                $("#project-files-container").toggle();
            });
			
       
        }

        function initMenus() {
            // Implements the File menu items
            $("#menu-file-new").click(function() {
                CommandManager.execute(Commands.FILE_NEW);
            });
            $("#menu-file-open").click(function() {
                CommandManager.execute(Commands.FILE_OPEN);
            });
            $("#menu-file-close").click(function() {
                CommandManager.execute(Commands.FILE_CLOSE);
            });
            $("#menu-file-save").click(function() {
                CommandManager.execute(Commands.FILE_SAVE);
            });

            // Implements the 'Run Tests' menu to bring up the Jasmine unit test window
            var testWindow = null;
            $("#menu-debug-runtests").click(function(){
                if (!(testWindow === null)) {
                    try {
                        testWindow.location.reload();
                    } catch(e) {
                        testWindow = null;  // the window was probably closed
                    }
                }

                if (testWindow === null) {
                    testWindow = window.open("../test/SpecRunner.html");
                    testWindow.location.reload(); // if it was opened before, we need to reload because it will be cached
                }
            });
            
            // Other debug menu items
            $("#menu-debug-wordwrap").click(function() {
                editor.setOption("lineWrapping", !(editor.getOption("lineWrapping")));
            });     
        }

        function initCommandHandlers() {
            FileCommandHandlers.init( $("#main-toolbar .title") );
        }

        function initKeyBindings() {
            // Register keymaps and install the keyboard handler
            // TODO: show keyboard equivalents in the menus
            var _globalKeymap = new KeyMap(
                { "Ctrl-O": Commands.FILE_OPEN
                , "Ctrl-S": Commands.FILE_SAVE
                , "Ctrl-W": Commands.FILE_CLOSE
                }
            );
            KeyBindingManager.installKeymap(_globalKeymap);

            $(document.body).keydown(function(event) {
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
    });

    $(window).unload(function () {
        PreferencesManager.savePreferences();
    });
});
