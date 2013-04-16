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
/*global define, window, $, brackets, Mustache */
/*unittests: ExtensionMgr*/

define(function (require, exports, module) {
    "use strict";
    
    var Strings          = require("strings"),
        NativeApp        = require("utils/NativeApp"),
        registry_utils   = require("extensibility/registry_utils"),
        registryTemplate = require("text!extensibility/extension-mgr-view.html");
    
    /**
     * @constructor
     * Creates a view listing the contents of the given registry.
     * @param {ExtensionMgrModel} model The model for this view.
     */
    function ExtensionMgrView(model) {
        var self = this;
        this._model = model;
        this._template = Mustache.compile(registryTemplate);
        this.$el = $("<div class='extension-list'/>");
        
        // Intercept clicks on external links to open in the native browser.
        $(this.$el).on("click", "a", function (e) {
            e.stopImmediatePropagation();
            e.preventDefault();
            NativeApp.openURLInDefaultBrowser($(e.target).attr("href"));
        });
        
        var $spinner = $("<div class='spinner large spin'/>")
            .appendTo(this.$el);
        model.getRegistry().done(function (registry) {
            self._render(registry_utils.sortRegistry(registry));
        }).fail(function () {
            $("<div class='alert-message error'/>")
                .text(Strings.EXTENSION_MANAGER_ERROR_LOAD)
                .appendTo(self.$el);
        }).always(function () {
            $spinner.remove();
        });
    }
    
    /**
     * @private
     * @type {ExtensionMgrModel}
     * The model containing the registry data.
     */
    ExtensionMgrView.prototype._model = null;
    
    /**
     * @private
     * @type {function} The compiled template we use for rendering the registry list.
     */
    ExtensionMgrView.prototype._template = null;
    
    /**
     * @type {jQueryObject}
     * The root of the view's DOM tree.
     */
    ExtensionMgrView.prototype.$el = null;
    
    /**
     * @private
     * Display the given registry data.
     * @param {object} registry The registry data to show.
     */
    ExtensionMgrView.prototype._render = function (registry) {
        // Create a Mustache context object containing the registry and our helper functions.
        var context = { registry: registry };
        ["lastVersionDate", "ownerLink", "formatUserId"].forEach(function (helper) {
            context[helper] = registry_utils[helper];
        });
        
        // TODO: localize strings in template
        this.$el.html(this._template(context));
    };
    
    exports.ExtensionMgrView = ExtensionMgrView;
});