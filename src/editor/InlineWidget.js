/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, $: false, CodeMirror: false */

define(function (require, exports, module) {
    'use strict';

    // Load dependent modules
    var EditorManager       = require("editor/EditorManager");
    
    /**
     * @constructor
     *
     */
    function InlineWidget() {
        // create the outer wrapper div
        this.htmlContent = document.createElement("div");
        this.$htmlContent = $(this.htmlContent).addClass("InlineWidget");
        this.$htmlContent.append('<div class="shadow top"/>')
            .append('<div class="shadow bottom"/>');
    }
    InlineWidget.prototype.htmlContent = null;
    InlineWidget.prototype.height = 0;
    InlineWidget.prototype.id = null;
    InlineWidget.prototype.hostEditor = null;

    /**
     * Called any time inline is closed, whether manually or automatically
     */
    InlineWidget.prototype.close = function () {
        // do nothing - base implementation
    };

    /**
     * Some tasks have to wait until we've been parented into the outer editor
     */
    InlineWidget.prototype.onAdded = function () {
        // do nothing - base implementation
    };

    /**
     * @param {Editor} hostEditor
     */
    InlineWidget.prototype.load = function (hostEditor) {
        this.hostEditor = hostEditor;

        // TODO: incomplete impelementation. It's not clear yet if InlineTextEditor
        // will fuction as an abstract class or as generic inline editor implementation
        // that just shows a range of text. See CSSInlineEditor.css for an implementation of load()
    };
    

    /**
     * Called when the editor containing the inline is made visible.
     */
    InlineWidget.prototype.onParentShown = function () {
        // do nothing - base implementation
    };

    exports.InlineWidget = InlineWidget;

});
