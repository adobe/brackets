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
/*global define, $, Mustache, window, brackets */

define(function (require, exports, module) {
    "use strict";
    
    var Dialogs         = require("widgets/Dialogs"),
        Strings         = require("strings");
    
    var dialogTemplate  = require("text!htmlContent/dropbox-chooser-dialog.html"),
        DropboxChooserView   = require("file/DropboxChooserView").DropboxChooserView,
        DropboxChooserViewModel  = require("file/DropboxChooserViewModel").DropboxChooserViewModel;

    
    /**
     * @private
     * Show a dialog that allows the user to browse and manage extensions.
     */
    function _showDialog(initialPath, chooseDirectory, title, callback) {
        var currentView,
            $dlg,
            dialog,
            setupEventHandlers,
            updateBreadcrumbs,
            currentPath = initialPath;
       
        var computeSelectedFiles = function () {
            var $files = $dlg.find(".selected"),
                files = [];
            
            $files.each(function () {
                files.push($(this).attr("data-fullpath"));
            });

            return files;
        };
        
        var doOpenFolder = function (folderName) {
            currentView.$el.remove();
            currentView.dispose();
            currentView = new DropboxChooserView();
            currentPath = folderName;
            currentView.initialize(currentPath, chooseDirectory)
                .done(function () {
                    currentView.$el.appendTo($(".modal-body", $dlg));
                    setupEventHandlers();
                });
            updateBreadcrumbs();
        };
        
        var handleOpenFolder = function (e, data) {
            doOpenFolder(data.folderName);
        };
        
        var handleDialogButtonClick = function (btnId) {
            if (btnId === "cancel" || chooseDirectory) {
                dialog.dismiss(btnId);
            } else {
                var $selected = $dlg.find(".selected");
                    
                if ($selected.length === 1) {
                    if (currentView.model.mappedEntries[$selected.attr("data-filename")].isDirectory()) {
                        doOpenFolder($selected.attr("data-fullpath") + "/");
                    } else {
                        dialog.dismiss(btnId);
                    }
                } else if ($selected.length > 0) {
                    dialog.dismiss(btnId);
                }
            }
        };
        
        setupEventHandlers = function () {
            currentView.$el.on("openFolder", handleOpenFolder);
        };
        

        updateBreadcrumbs = function () {
            var $breadCrumbs = $dlg.find(".dropbox-breadcrumbs");
                
            $breadCrumbs.off("click");
            $breadCrumbs.find("ul").remove();
            $breadCrumbs.append("<ul class='dropbox-breadcrumb-list'></ul>");
            
            var $list = $breadCrumbs.find(".dropbox-breadcrumb-list");
            
            var i,
                runningPath = "/",
                folders = currentPath.split("/");
            
            for (i = 0; i < folders.length; i++) {
                var folder = folders[i];
                if (i === 0) {
                    if (folders.length > 2) {
                        $list.append("<li class='dropbox-breadcrumb-item'><a href='/'>Dropbox</a></li>");
                    } else {
                        $list.append("<li class='dropbox-breadcrumb-item'>Dropbox</li>");
                    }

                } else if (folder.length > 0) {
                    runningPath += folder + "/";
                    if (i < folders.length - 2) {
                        $list.append("<li class='dropbox-breadcrumb-item child-folder'><a href='" + runningPath + "'>" + folder + "</a></li>");
                    } else {
                        $list.append("<li class='dropbox-breadcrumb-item child-folder'>" + folder + "</li>");
                    }
                }
            }
            
            $breadCrumbs.on("click", "a", function (e) {
                var folder = $(e.target).attr("href");
                doOpenFolder(folder);
                e.stopPropagation();
                e.preventDefault();
            });
        };
        
        var context = {};
        context.Strings = Strings;
        context.title = title;
        
        // Open the dialog.
        dialog = Dialogs.showModalDialogUsingTemplate(
            Mustache.render(dialogTemplate, context),
            false
        );
        
        dialog.done(function (btnId) {
            currentView.dispose();
            
            if (btnId !== "cancel") {
                var files = computeSelectedFiles();
                
                if (files.length > 0) {
                    callback(brackets.fs.NO_ERROR, files);
                } else if (chooseDirectory) {
                    // nothing selected return current folder
                    callback(brackets.fs.NO_ERROR, [currentPath]);
                }
            }
        });
        
        // Create the view.
        $dlg = $(".dropbox-chooser-dialog");
        
        $dlg.on("click", ".dialog-button", function (e) {
            handleDialogButtonClick($(this).attr("data-button-id"));
        });
        
        updateBreadcrumbs();
        
        currentView = new DropboxChooserView();
        currentView.initialize(initialPath, chooseDirectory)
            .done(function () {
                currentView.$el.appendTo($(".modal-body", $dlg));
                setupEventHandlers();
            });
    }
    
    function showOpenDialog(allowMultipleSelection, chooseDirectory, title, initialPath, fileTypes, callback) {
        _showDialog(initialPath, chooseDirectory, title, callback);
    }

    brackets.fs.showOpenDialog = showOpenDialog;
});
