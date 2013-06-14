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
    
    var Dialogs                = require("widgets/Dialogs"),
        Strings                = require("strings"),
        Commands               = require("command/Commands"),
        CommandManager         = require("command/CommandManager"),
        InstallExtensionDialog = require("extensibility/InstallExtensionDialog"),
        AppInit                = require("utils/AppInit"),
        ExtensionManagerView   = require("extensibility/ExtensionManagerView").ExtensionManagerView,
        ExtensionManagerViewModel  = require("extensibility/ExtensionManagerViewModel").ExtensionManagerViewModel;
    
    var dialogTemplate    = require("text!htmlContent/extension-manager-dialog.html");

    /**
     * @private
     * Show a dialog that allows the user to browse and manage extensions.
     */
    function _showDialog() {
        var $dlg, view, $search, $searchClear;
        
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
            view.dispose();
        });
        
        // Create the view.
        $dlg = $(".extension-manager-dialog");
        $search = $(".search", $dlg);
        $searchClear = $(".search-clear", $dlg);
        view = new ExtensionManagerView();
        view.initialize(ExtensionManagerViewModel.SOURCE_INSTALLED)
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
                $(view.model).on("change", function () {
                    updateSearch();
                });

                // Handle the install button.                
                $(".extension-manager-dialog .install-from-url")
                    .click(function () {
                        InstallExtensionDialog.showDialog().done(view.model.updateFromDownload.bind(view.model));
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
});
