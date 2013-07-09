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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true */
/*global define, window, $, brackets, Mustache */
/*unittests: ExtensionManager*/

define(function (require, exports, module) {
    "use strict";
   
    var Strings                   = require("strings"),
        Dialogs                   = require("widgets/Dialogs"),
        DefaultDialogs            = require("widgets/DefaultDialogs"),
        StringUtils               = require("utils/StringUtils"),
        DropboxChooserViewModel   = require("file/DropboxChooserViewModel").DropboxChooserViewModel,
        itemTemplate              = require("text!htmlContent/dropbox-chooser-view-item.html");

    /**
     * @constructor
     * Creates a view enabling the user browse a drop box. Must be initialized
     * with initialize(). When the view is closed, dispose() must be called.
     */
    function DropboxChooserView() {
    }
    
    
    /**
     * Initializes the view to show the files and folders in the selected folder
     * @param {string} folder to view.
     * @return {$.Promise} a promise that's resolved once the view has been initialized. Never
     *     rejected.
     */
    DropboxChooserView.prototype.initialize = function (folder, foldersOnly) {
        var self = this,
            result = new $.Deferred();
        this.model = new DropboxChooserViewModel();
        this._itemTemplate = Mustache.compile(itemTemplate);
        this._itemViews = {};
        this.$el = $("<div class='dropbox-file-chooser'/>");
        this._$emptyMessage = $("<div class='empty-message'/>")
            .appendTo(this.$el);
        this._$div = $("<div class='dropbox-list-container'/>").appendTo(this.$el);
        this._$ul = $("<ul class='dropbox-list'/>").appendTo(this.$el);
        
        // Show the busy spinner and access the registry.
        var $spinner = $("<div class='spinner large spin'/>")
            .appendTo(this.$el);
        this.model.initialize(folder, foldersOnly).done(function () {
            self._setupEventHandlers();
            self._render();
        }).fail(function () {
            $("<div class='alert error load-error'/>")
                .text("Dropbox")
                .appendTo(self.$el);
        }).always(function () {
            $spinner.remove();
            result.resolve();
        });
        return result.promise();
    };
        
    /**
     * @type {jQueryObject}
     * The root of the view's DOM tree.
     */
    DropboxChooserView.prototype.$el = null;
    
    /**
     * @type {Model}
     * The view's model. Handles sorting and filtering of items in the view.
     */
    DropboxChooserView.prototype.model = null;
    
    /**
     * @type {jQueryObject}
     * Element showing a message when there are no extensions.
     */
    DropboxChooserView.prototype._$emptyMessage = null;
    
    /**
     * @private
     * @type {jQueryObject}
     * The root of the table inside the view.
     */
    DropboxChooserView.prototype._$table = null;
    
    /**
     * @private
     * @type {function} The compiled template we use for rendering items in the extension list.
     */
    DropboxChooserView.prototype._itemTemplate = null;
    
    /**
     * @private
     * @type {Object.<string, jQueryObject>}
     * The individual views for each item, keyed by the extension ID.
     */
    DropboxChooserView.prototype._itemViews = null;
    
    /**
     * @private
     * Attaches our event handlers. We wait to do this until we've fully fetched the extension list.
     */
    DropboxChooserView.prototype._setupEventHandlers = function () {
        var self = this;
        
        // Listen for model data and filter changes.
        $(this.model)
            .on("filter", function () {
                self._render();
            });
        
        // UI event handlers
        this.$el
            .on("click", "li", function (e) {
                var $listItem = $(e.target).closest("li"),
                    $list = $listItem.parent(),
                    $listItems = $list.children("li"),
                    selected = $listItem.hasClass("selected");
                $listItems.removeClass("selected");
                if (!selected) {
                    $listItem.addClass("selected");
                }
            })
            .on("dblclick", "li", function (e) {
                var $listItem = $(e.target).closest("li"),
                    $list = $listItem.parent(),
                    $listItems = $list.children("li"),
                    filename = $listItem.attr("data-filename"),
                    entry = self.model.mappedEntries[filename];
                $listItems.removeClass("selected");
                $listItem.addClass("selected");

                if (entry.isDirectory()) {
                    $(this).trigger("openFolder", {folderName: entry.path + "/"});
                } else {
                    $(this).trigger("openFile", {fileName: entry.path});
                }
            });
    };
    
    /**
     * @private
     * Renders the view for a single file entry.
     * @param {Object} entry The file entry to render.
     * @return {jQueryObject} The rendered node as a jQuery object.
     */
    DropboxChooserView.prototype._renderItem = function (filename, entry) {
        // Create a Mustache context object containing the entry data and our helper functions.
        
        // Normally we would merge the strings into the context we're passing into the template,
        // but since we're instantiating the template for every item, it seems wrong to take the hit
        // of copying all the strings into the context, so we just make it a subfield.
        var context = {};
        context.Strings = Strings;
        context.image = entry.isDirectory() ? "styles/images/dropbox_folder.png" : "styles/images/dropbox_generic_file.png";
        context.filename = filename;
        context.fullpath = entry.path;
        
        return $(this._itemTemplate(context));
    };
    
    /**
     * @private
     * Renders the extension entry table based on the model's current filter set. Will create
     * new items for entries that haven't yet been rendered, but will not re-render existing items.
     */
    DropboxChooserView.prototype._render = function () {
        var self = this,
            $item;
        this._$ul.empty();
        this.model.filterSet.forEach(function (id) {
            var $item = self._itemViews[id];
            if (!$item) {
                $item = self._renderItem(id, self.model.mappedEntries[id]);
                self._itemViews[id] = $item;
            }
            $item.appendTo(self._$ul);
        });
        $(this).triggerHandler("render");
    };
    
    
    /**
     * Filters the contents of the view.
     * @param {string} query The query to filter by.
     */
    DropboxChooserView.prototype.filter = function (query) {
        this.model.filter(query);
    };
    /**
     * Disposes the view. Must be called when the view goes away.
     */
    DropboxChooserView.prototype.dispose = function () {
        this.model.dispose();
    };

    exports.DropboxChooserView = DropboxChooserView;
});