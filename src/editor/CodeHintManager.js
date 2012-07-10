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
		HTMLTags        = require("text!CodeHints/HtmlTags.json"),
        EditorManager   = require("editor/EditorManager");
    
    /**
     * @private
     * Parse the code hints from JSON data and extract all hints from property names.
     * @param {string} a JSON string that has the code hints data
     * @return {!Array.<string>} An array of code hints read from the JSON data source.
     */
    function _getCodeHints(jsonStr) {
        var hintObj = JSON.parse(jsonStr);
        return $.map(hintObj, function (value, key) {
            return key;
        }).sort();
    }



    function CodeHintList() {
        this.source = _getCodeHints(HTMLTags);
        this.query = "";
        this.filterFunction = null;
        this.displayList = [];
        this.options = {
            maxResults: 8
        };

        this.editor = null;

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
        var self = this;

        // TODO: factor click handler into separate function
        $item.on("click", function () {
            var start = {line: -1, ch: -1},
                end = {line: -1, ch: -1};
            if (self.editor.hasSelection()) {
                var sel = self.editor.getSelection();
                start = sel.start;
                end = sel.end;
            } else {
                // find start of tag
                var cursor = self.editor.getCursorPos();
                var line = self.editor.document.getLine(cursor.line);
                end.line = start.line = cursor.line;
                start.ch = line.lastIndexOf("<", cursor.ch) + 1;

                // find end of tag
                //TODO: needs to be much smarter
                end.ch = line.indexOf(" ", cursor.ch);
                if (end.ch === -1) {
                    end.ch = line.indexOf(">", cursor.ch);
                }
            }
            
            if (start.ch !== "-1" && end.ch !== "-1") {
                self.editor.document.replaceRange(name, start, end);
            } else {
                self.editor.document.replaceRange(name, start);
            }
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
        var count = 0;
        $.each(this.displayList, function (index, item) {
            if (count > self.options.maxResults) {
                return false;
            }
            self.addItem(item);
            count++;
        });

        // TODO: if no items, close list
    };

    CodeHintList.prototype.updateQueryFromCurPos = function () {
        var cursor = this.editor.indexFromPos(this.editor.getCursorPos());

        // TODO: needs to be more robust
        var text = this.editor.document.getText();
        var start = text.lastIndexOf("<", cursor) + 1;
        this.query = text.slice(start, cursor);
    };

    CodeHintList.prototype.handleKeyEvent = function (event, editor, keyEvent) {
        if (keyEvent.type !== "keyup") {
            return;
        }
        
        this.updateQueryFromCurPos();
        this.updateList();
    };

    CodeHintList.prototype.close = function () {
        $(this.editor).off("keyEvent", this.handleKeyEvent);
    };
    
    CodeHintList.prototype.open = function (editor) {
        var cursor = editor._codeMirror.cursorCoords(),
            posTop  = cursor.y,
            posLeft = cursor.x,
            $window = $(window),
            $menuWindow = this.$hintMenu.children("ul");

        this.editor = editor;

        Menus.closeAll();

        // TODO when to remove listener? How to only add one?
        $(this.editor).on("keyEvent", this.handleKeyEvent.bind(this));



        this.updateQueryFromCurPos();
        this.updateList();

    
        // TODO: factor out menu repositioning logic so code hints and Context menus share code
        // adjust positioning so menu is not clipped off bottom or right
        var bottomOverhang = posTop + 25 + $menuWindow.height() - $window.height();
        if (bottomOverhang > 0) {
            posTop = Math.max(0, posTop - bottomOverhang);
        }
        // todo: should be shifted by line height
        posTop -= 15;   // shift top for hidden parent element
        //posLeft += 5;

        var rightOverhang = posLeft + $menuWindow.width() - $window.width();
        if (rightOverhang > 0) {
            posLeft = Math.max(0, posLeft - rightOverhang);
        }

        // open the context menu at final location
        this.$hintMenu.addClass("open")
                   .css({"left": posLeft, "top": posTop});
    };

    CodeHintList.prototype.filterList = function () {
        var self = this;
        this.displayList = $.map(this.source, function (item) {
            if (item.indexOf(self.query) === 0) {
                return item;
            }
        }).sort();
        // TODO: beter sorting. Should rank tags based on portion of query that is present in tag
    };

        /**
         * @private
         * Test functions to see if the hinting is working
         * @param {CodeMirror} editor An instance of a CodeMirror editor
         */
        // function _triggerClassHint(editor, pos, tagInfo) {
        //     console.log("_triggerClassHint called for tag: " + tagInfo.tagName + " and attr value: " + tagInfo.attr.value);
        // }
        
        // function _triggerIdHint(editor, pos, tagInfo) {
        //     console.log("_triggerIdHint called for tag: " + tagInfo.tagName + " and attr value: " + tagInfo.attr.value);
        // }

        // TODO: singleton for now. 
    var hintList = new CodeHintList();
        
        /**
         * @private
         * Checks to see if this is an attribute value we can hint
         * @param {CodeMirror} editor An instance of a CodeMirror editor
         */
    function showHint(editor) {
    //       var pos = editor.getCursorPos();
    //       var tagInfo = HTMLUtils.getTagInfo(editor, pos);
    //       if (tagInfo.position.type === HTMLUtils.ATTR_VALUE) {
    //           if (tagInfo.attr.name === "class") {
    //               _triggerClassHint(editor, pos, tagInfo);
    //           } else if (tagInfo.attr.name === "id") {
    //               _triggerIdHint(editor, pos, tagInfo);
    //           }
    //       }
        // else if (tagInfo.position.tokenType === HTMLUtils.TAG_NAME) {
    //           console.log(_getCodeHints(HTMLTags, tagInfo.tagName));
    //       }

        
        hintList.open(editor);
    }
        
        /**
         * @private
         * Called whenever a CodeMirror editor gets a key event
         * @param {object} event the jQuery event for onKeyEvent
         * @param {CodeMirror} editor An instance of a CodeMirror editor
         * @param {object} keyboardEvent  the raw keyboard event that CM is handling
         */
        // function _onKeyEvent(event, editor, keyboardEvent) {
        //     if (keyboardEvent.type !== "keypress") {
        //         return;
        //     }
        //     window.setTimeout(function () { checkForHint(editor); }, 40);
        // }

    // Define public API
    exports.showHint = showHint;
});
