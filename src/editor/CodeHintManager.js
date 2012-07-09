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


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, window */

define(function (require, exports, module) {
    'use strict';
    
    // Load dependent modules
    var HTMLUtils       = require("language/HTMLUtils"),
        CommandManager  = require("command/CommandManager"),
        Commands        = require("command/Commands"),
        DocumentManager = require("document/DocumentManager"),
        Menus           = require("command/Menus"),
        EditorManager   = require("editor/EditorManager");
    
    /**
     * @private
     * Test functions to see if the hinting is working
     * @param {CodeMirror} editor An instance of a CodeMirror editor
     */
    function _triggerClassHint(editor, pos, tagInfo) {
        console.log("_triggerClassHint called for tag: " + tagInfo.tagName + " and attr value: " + tagInfo.attr.value);
    }
    
    function _triggerIdHint(editor, pos, tagInfo) {
        console.log("_triggerIdHint called for tag: " + tagInfo.tagName + " and attr value: " + tagInfo.attr.value);
    }
    
    /**
     * @private
     * Checks to see if this is an attribute value we can hint
     * @param {CodeMirror} editor An instance of a CodeMirror editor
     */
    function _checkForHint(editor, event) {
        var pos = editor.getCursorPos();
        var tagInfo = HTMLUtils.getTagInfo(editor, pos);
        if (tagInfo.position.type === HTMLUtils.ATTR_VALUE) {
            if (tagInfo.attr.name === "class") {
                _triggerClassHint(editor, pos, tagInfo);
            } else if (tagInfo.attr.name === "id") {
                _triggerIdHint(editor, pos, tagInfo);
            }
        }

        // $("#codehint-text")
        //     .focus();
        var cursorCoords = editor._codeMirror.cursorCoords()
        var lineHeight = 15; // todo: make dynamic
        hintList.open({pageX: cursorCoords.x, pageY: cursorCoords.y - lineHeight});
    }
    
    /**
     * @private
     * Called whenever a CodeMirror editor gets a key event
     * @param {object} event the jQuery event for onKeyEvent
     * @param {CodeMirror} editor An instance of a CodeMirror editor
     * @param {object} keyboardEvent  the raw keyboard event that CM is handling
     */
    function _onKeyEvent(event, editor, keyboardEvent) {
        if (keyboardEvent.type !== "keypress") {
            return;
        }
        window.setTimeout(function () { _checkForHint(editor); }, 40);
    }
    
    CommandManager.register("Code Hint", Commands.CODE_HINT, function () {
        _checkForHint(EditorManager.getFocusedEditor());
    });



    // $("#codehint-text").smartAutoComplete({
    //     maxResults: 20,
    //     minCharLimit: 0,
    //     autocompleteFocused: true,
    //     forceSelect: false,
    //     typeAhead: false,
    //     filter: _handleFilter,
    //     // resultFormatter: _handleResultsFormatter
    // });



    function CodeHintList() {
        this.source = ["dog", "dig", "cat", "calf", "cool"];
        this.query = "";
        this.filterFunction = null;
        this.displayList = [];
        var options = {};

        // TODO: remove context-menu class
        this.$hintMenu = $("<li class='dropdown context-menu'></li>");

        var $toggle = $("<a href='#' class='dropdown-toggle'></a>")
            .hide();

        this.$hintMenu.append($toggle)
            .append("<ul class='dropdown-menu'></ul>");

        $("#codehint-menu-bar > ul").append(this.$hintMenu);

    }

    CodeHintList.prototype.addItem = function (name) {
        var $item = $("<li><a href='#'><span class='codehint-item'>" + name + "</span></a></li>");

        $item.on("click", function () {
            // TODO
        });

        this.$hintMenu.find("ul.dropdown-menu")
            .append($item);
    };

    CodeHintList.prototype.updateList = function () {
        this.filterList();
        this.buildListView();
    };
            
    CodeHintList.prototype.buildListView = function () {
        this.$hintMenu.find("li").remove();
        var self = this;
        $.each(this.displayList, function (index, item) {
            self.addItem(item);
        });
    };

    CodeHintList.prototype.handleKeyEvent = function (event, editor, keyEvent) {
        // TODO: temporary, should actually look from pos of first char typed to last char typed
        
        var cursor = editor.indexFromPos(editor.getCursorPos());

        // cleanup vars
        // TODO: get doc for focused editor
        var doc = DocumentManager.getCurrentDocument();

        // TODO: if doc is null
        var text = doc.getText();
        var start = text.lastIndexOf("<", cursor);
        var end = text.indexOf(" ", cursor);
        this.query = text.slice(start, end);

        console.log( "query: " +  this.query);

        this.updateList();
    };
    
    CodeHintList.prototype.open = function (mouseOrLocation) {
        // TODO error check

        var editor = EditorManager.getFocusedEditor();

        // TODO when to remove listener?
        $(editor).on("keyEvent", this.handleKeyEvent.bind(this));

        this.query = "";

        Menus.closeAll();

        this.updateList();

        var posTop  = mouseOrLocation.pageY,
            posLeft = mouseOrLocation.pageX;
        // TODO: reuse context menu repositioning logic

        // open the context menu at final location
        this.$hintMenu.addClass("open")
                   .css({"left": posLeft, "top": posTop});
    };

    CodeHintList.prototype.filterList = function () {
        var matcher = new RegExp(this.query.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), "i");

        this.displayList = $.grep(this.source, function (value) {
            return matcher.test(value);
        });
    };

    var hintList = new CodeHintList();

    // Define public API
});
