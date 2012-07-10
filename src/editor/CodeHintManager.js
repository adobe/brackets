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
        Menus           = require("command/Menus"),
        StringUtils     = require("utils/StringUtils"),
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


    
    /**
     * @constructor
     *
     */
    function CodeHintList() {
        // TODO Ty: should pass array of objects instead of strings as source so richer data can
        // be passed to hint list
        this.source = _getCodeHints(HTMLTags);
        this.query = "";
        this.displayList = [];
        this.options = {
            maxResults: 8
        };

        this.editor = null;

        // TODO Randy: remove context-menu class
        // how much class sharing should ContextMenus and CodeHints have?
        this.$hintMenu = $("<li class='dropdown context-menu'></li>");

        var $toggle = $("<a href='#' class='dropdown-toggle'></a>")
            .hide();

        this.$hintMenu.append($toggle)
            .append("<ul class='dropdown-menu'></ul>");

        $("#codehint-menu-bar > ul").append(this.$hintMenu);

    }

    /**
     * Adds a single item to the hint list
     * @param {string} name
     */
    CodeHintList.prototype.addItem = function (name) {
        var displayName = name.replace(
            new RegExp(StringUtils.regexEscape(this.query), "gi"),
            "<strong>$&</strong>"
        );

        var $item = $("<li><a href='#'><span class='codehint-item'>" + displayName + "</span></a></li>");
        var self = this;

        // TODO: factor click handler into separate function
        $item.on("click", function () {

            // TODO Ray:
            // use HTMLUtils to find tag bounds instead of using code below
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

    /**
     * Rebuilds the hint list based on this.query
     */
    CodeHintList.prototype.updateList = function () {
        this.filterList();
        this.buildListView();
    };

    /**
     * Removes all list items from hint list
     */
    CodeHintList.prototype.clearList = function () {
        this.$hintMenu.find("li").remove();
    };
            
    /**
     * Rebuilds the list items for the hint list based on the display list
     * array
     */
    CodeHintList.prototype.buildListView = function () {
        this.clearList();
        var self = this;
        var count = 0;
        $.each(this.displayList, function (index, item) {
            if (count > self.options.maxResults) {
                return false;
            }
            self.addItem(item);
            count++;
        });

        // TODO Ty: if no items, close list
    };

    /**
     * Figures out the text to use for the hint list query based on the text
     * around the cursor. Query is the text from the start of a tag to the current
     * cursor position
     */
    CodeHintList.prototype.updateQueryFromCurPos = function () {
        // TODO Ray: use HTMLUtils to do this in a more robust way

        var cursor = this.editor.indexFromPos(this.editor.getCursorPos());
        var text = this.editor.document.getText();
        var start = text.lastIndexOf("<", cursor) + 1;
        this.query = text.slice(start, cursor);
    };

    /**
     * Handles key presses when the hint list is being displayed
     * @param {Event} event
     * @param {Editor} editor
     * @param {KeyBoardEvent} keyEvent
     */
    CodeHintList.prototype.handleKeyEvent = function (event, editor, keyEvent) {
        if (keyEvent.type !== "keyup") {
            return;
        }

        // TODO Glenn: handle arrow keys and return key. Add persistant selection to list.
        
        this.updateQueryFromCurPos();
        this.updateList();
    };

    // TODO Glenn
    // Right now this code is never called. Need to determine best way to bottleneck
    // all ways that hint list is closed (esc, clicking, return, etc)
    CodeHintList.prototype.close = function () {
        $(this.editor).off("keyEvent", this.handleKeyEvent);

        this.clearList();
        this.source = [];
        this.displayList = [];
    };
    
    /**
     * Displays the hint list at the current cursor position
     */
    CodeHintList.prototype.open = function (editor) {
        this.editor = editor;

        Menus.closeAll();

        // TODO Glenn
        // Need to determine when/where listener is added/removed (see close())
        // Figure out how to override certain keys in the editor like up and down arrow
        $(this.editor).on("keyEvent", this.handleKeyEvent.bind(this));

        this.updateQueryFromCurPos();
        this.updateList();
    
        var hintPos = this.calcHintListLocation();
        this.$hintMenu.addClass("open")
                   .css({"left": hintPos.left, "top": hintPos.top});
    };

    /**
     * Computes top left location for hint list so that the list is not clipped by the window
     * @ return {Object.<left: Number, to: Number> }
     */
    CodeHintList.prototype.calcHintListLocation = function () {
        var cursor = this.editor._codeMirror.cursorCoords(),
            posTop  = cursor.y,
            posLeft = cursor.x,
            $window = $(window),
            $menuWindow = this.$hintMenu.children("ul");

        // TODO Ty: factor out menu repositioning logic so code hints and Context menus share code
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

        return {left: posLeft, top: posTop};
    };

    /**
     * Filters the source list by query and stores the result in displayList
     */
    CodeHintList.prototype.filterList = function () {
        var self = this;
        this.displayList = $.map(this.source, function (item) {
            if (item.indexOf(self.query) === 0) {
                return item;
            }
        }).sort();
        // TODO: better sorting. Should rank tags based on portion of query that is present in tag
    };



    // TODO Ty: singleton for now. Figure out broader strategy for hint list across editors
    // and different types of hint list.
    var hintList = new CodeHintList();
        
     /**
      * Show the code hint list near the current cursor position for the specified editor
      * @param {Editor}
      */
    function showHint(editor) {
    // To be used later when we get to attribute hinting
    //       var pos = editor.getCursorPos();
    //       var tagInfo = HTMLUtils.getTagInfo(editor, pos);
    //       if (tagInfo.position.type === HTMLUtils.ATTR_VALUE) {
    //           if (tagInfo.attr.name === "class") {
    //               _triggerClassHint(editor, pos, tagInfo);
    //           } else if (tagInfo.attr.name === "id") {
    //               _triggerIdHint(editor, pos, tagInfo);
    //           }
    //       }
    //      else if (tagInfo.position.tokenType === HTMLUtils.TAG_NAME) {
    //           console.log(_getCodeHints(HTMLTags, tagInfo.tagName));
    //       }

        
        hintList.open(editor);
    }
        

    // Define public API
    exports.showHint = showHint;
});
