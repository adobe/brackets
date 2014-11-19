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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, brackets, $, Mustache */

define(function (require, exports, module) {
    "use strict";
    
    // Brackets modules
    var FileUtils                   = brackets.getModule("file/FileUtils"),
        ExtensionUtils              = brackets.getModule("utils/ExtensionUtils"),
        DocumentManager             = brackets.getModule("document/DocumentManager"),
        MainViewFactory             = brackets.getModule("view/MainViewFactory"),
        ConfigViewContent           = require("text!htmlContent/Config.html");
        
    /* our module object */
    var _module = module;
    
    /* @type {Object.<string, ConfigView>} List of open views */
    function ConfigView(doc, $container) {
        this.$container = $container;
        this.doc = doc;
        this.json = JSON.parse(this.doc.getText());
        this.$view = $(Mustache.render(ConfigViewContent, this.json));
        this.$view.css({
            "background-image": "url(file://" + FileUtils.getNativeModuleDirectoryPath(_module) + "/htmlContent/logo-sm.png)",
            "background-position": "bottom right",
            "background-repeat": "no-repeat"
        });
        $container.append(this.$view);
    }
    
    /* 
     * Retrieves the file object for this view
     * return {!File} the file object for this view
     */
    ConfigView.prototype.getFile = function () {
        return this.doc.file;
    };
    
    /* 
     * Updates the layout of the view
     */
    ConfigView.prototype.updateLayout = function () {
    };

    /* 
     * Destroys the view
     */
    ConfigView.prototype.destroy = function () {
        this.$view.remove();
    };
    
    /* 
     * Creates a view of a file (.brackets.json)
     * @param {!File} file - the file to create a view for
     * @param {!Pane} pane - the pane where to create the view
     * @private
     */
    function _createConfigViewOf(file, pane) {
        var result = new $.Deferred(),
            view = pane.findViewOfFile(file.fullPath);
        
        if (view) {
            // existing view, then just show it
            pane.showView(view);
            result.resolve(view.getFile());
        } else {
            DocumentManager.getDocumentForPath(file.fullPath)
                .done(function (doc) {
                    var view = new ConfigView(doc, pane.$el);
                    pane.addView(view, true);
                    result.resolve(doc.file);
                })
                .fail(function (fileError) {
                    result.reject(fileError);
                });
        }
        return result.promise();
    }
    
    /* 
     *  Create a view factory that can create views for the file 
     *  `.brackets.json` in a project's root folder.
     */
    var configViewFactory = {
        canOpenFile: function (fullPath) {
            var filename = fullPath.substr(fullPath.lastIndexOf("/") + 1);
            return (filename.toLowerCase() === ".brackets.json");
        },
        openFile: function (file, pane) {
            return _createConfigViewOf(file, pane);
        }
    };
    
    /* load styles used by our template */
    ExtensionUtils.loadStyleSheet(module, "styles/styles.css");
    MainViewFactory.registerViewFactory(configViewFactory);
});
