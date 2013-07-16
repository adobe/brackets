/*
 * Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
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
/*global define, $, Mustache, window */

define(function (require, exports, module) {
    "use strict";
    
    var Dialogs                     = require("widgets/Dialogs"),
        DefaultDialogs              = require("widgets/DefaultDialogs"),
        Package                     = require("extensibility/Package"),
        Strings                     = require("strings"),
        StringUtils                 = require("utils/StringUtils"),
        Commands                    = require("command/Commands"),
        CommandManager              = require("command/CommandManager"),
        InstallExtensionDialog      = require("extensibility/InstallExtensionDialog"),
        AppInit                     = require("utils/AppInit"),
        ExtensionManager            = require("extensibility/ExtensionManager"),
        ExtensionManagerView        = require("extensibility/ExtensionManagerView").ExtensionManagerView,
        ExtensionManagerViewModel   = require("extensibility/ExtensionManagerViewModel");
    
    var dialogTemplate    = require("text!htmlContent/extension-manager-dialog.html");

    /**
     * @private
     * Triggers changes requested by the dialog UI.
     */
    function _performChanges() {
        var hasRemovedExtensions = ExtensionManager.hasExtensionsToRemove(),
            hasUpdatedExtensions = ExtensionManager.hasExtensionsToUpdate();
        // If an extension was removed or updated, prompt the user to quit Brackets.
        if (hasRemovedExtensions || hasUpdatedExtensions) {
            var buttonLabel = Strings.CHANGE_AND_QUIT;
            if (hasRemovedExtensions && !hasUpdatedExtensions) {
                buttonLabel = Strings.REMOVE_AND_QUIT;
            } else if (hasUpdatedExtensions && !hasRemovedExtensions) {
                buttonLabel = Strings.UPDATE_AND_QUIT;
            }
            Dialogs.showModalDialog(
                DefaultDialogs.DIALOG_ID_CHANGE_EXTENSIONS,
                Strings.CHANGE_AND_QUIT_TITLE,
                Strings.CHANGE_AND_QUIT_MESSAGE,
                [
                    {
                        className : Dialogs.DIALOG_BTN_CLASS_NORMAL,
                        id        : Dialogs.DIALOG_BTN_CANCEL,
                        text      : Strings.CANCEL
                    },
                    {
                        className : Dialogs.DIALOG_BTN_CLASS_PRIMARY,
                        id        : Dialogs.DIALOG_BTN_OK,
                        text      : buttonLabel
                    }
                ]
            )
                .done(function (buttonId) {
                    if (buttonId === "ok") {
                        ExtensionManager.removeMarkedExtensions()
                            .done(function () {
                                ExtensionManager.updateExtensions()
                                    .done(function () {
                                        CommandManager.execute(Commands.FILE_QUIT);
                                    })
                                    .fail(function (errorArray) {
                                        
                                        // This error case should be very uncommon.
                                        // Just let the user know that we couldn't update
                                        // this extension and log the errors to the console.
                                        var ids = [];
                                        errorArray.forEach(function (errorObj) {
                                            ids.push(errorObj.item);
                                            if (errorObj.error && errorObj.error.forEach) {
                                                console.error("Errors for ", errorObj.item);
                                                errorObj.error.forEach(function (error) {
                                                    console.error(Package.formatError(error));
                                                });
                                            }
                                        });
                                        Dialogs.showModalDialog(
                                            DefaultDialogs.DIALOG_ID_ERROR,
                                            Strings.EXTENSION_MANAGER_UPDATE,
                                            StringUtils.format(Strings.EXTENSION_MANAGER_UPDATE_ERROR, ids.join(", "))
                                        ).done(function () {
                                            // We still have to quit even if some of the removals failed.
                                            CommandManager.execute(Commands.FILE_QUIT);
                                        });
                                    });
                            })
                            .fail(function (errorArray) {
                                ExtensionManager.cleanupUpdates();
                                
                                var ids = [];
                                errorArray.forEach(function (errorObj) {
                                    ids.push(errorObj.item);
                                });
                                Dialogs.showModalDialog(
                                    DefaultDialogs.DIALOG_ID_ERROR,
                                    Strings.EXTENSION_MANAGER_REMOVE,
                                    StringUtils.format(Strings.EXTENSION_MANAGER_REMOVE_ERROR, ids.join(", "))
                                ).done(function () {
                                    // We still have to quit even if some of the removals failed.
                                    CommandManager.execute(Commands.FILE_QUIT);
                                });
                            });
                    } else {
                        ExtensionManager.cleanupUpdates();
                    }
                });
        }
    }
    
    /**
     * @private
     * Show a dialog that allows the user to browse and manage extensions.
     */
    function _showDialog() {
        var $dlg, view, model, $search, $searchClear;
        
        function updateSearch() {
            if (view.model.filterSet.length === 0) {
                $search.prop("disabled", true);
                $searchClear.prop("disabled", true);
            } else {
                $search.prop("disabled", false);
                $searchClear.prop("disabled", false);
            }
        }
        
        // Open the dialog.
        Dialogs.showModalDialogUsingTemplate(
            Mustache.render(dialogTemplate, Strings)
        ).done(function () {
            model.dispose();
            _performChanges();
        });
        
        // Create the view.
        $dlg = $(".extension-manager-dialog");
        $search = $(".search", $dlg);
        $searchClear = $(".search-clear", $dlg);
        view = new ExtensionManagerView();
        model = new ExtensionManagerViewModel.InstalledViewModel();
        view.initialize(model)
            .done(function () {
                view.$el.appendTo($(".modal-body", $dlg));
                
                // Filter the view when the user types in the search field.
                $dlg.on("input", ".search", function (e) {
                    view.filter($(this).val());
                }).on("click", ".search-clear", function (e) {
                    $search.val("");
                    view.filter("");
                });
                
                // Disable the search field when there are no items in the view.
                $(model).on("change", function () {
                    updateSearch();
                });

                // Handle the install button.                
                $(".extension-manager-dialog .install-from-url")
                    .click(function () {
                        InstallExtensionDialog.showDialog().done(ExtensionManager.updateFromDownload(view.model));
                    });
                
                updateSearch();
                if (!$search.prop("disabled")) {
                    $dlg.find(".search").focus();
                }
            });
    }
    
    CommandManager.register(Strings.CMD_EXTENSION_MANAGER, Commands.FILE_EXTENSION_MANAGER, _showDialog);

    AppInit.appReady(function () {
        $("#toolbar-extension-manager").click(_showDialog);
    });
    
    exports._performChanges = _performChanges;
});
