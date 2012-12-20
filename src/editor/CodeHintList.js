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
/*global define, $, window, brackets */

define(function (require, exports, module) {
    "use strict";
    
    // Load dependent modules
    var Menus           = require("command/Menus"),
        StringUtils     = require("utils/StringUtils"),
        PopUpManager    = require("widgets/PopUpManager"),
        ViewUtils       = require("utils/ViewUtils"),
        KeyEvent        = require("utils/KeyEvent");

    /**
     * @constructor
     *
     * Displays a popup list of code completions.
     * Currently only HTML tags are supported, but this will greatly be extended in coming sprint
     * to include: extensibility API, HTML attributes hints, JavaScript hints, CSS hints
     */
    function CodeHintList(editor) {
        this.displayList = [];
        this.options = {
            maxResults: 999
        };

        this.opened = false;
        this.selectedIndex = -1;
        this.editor = editor;
        this.handleSelect = null;
        this.handleClose = null;

        this.$hintMenu = $("<li class='dropdown codehint-menu'></li>");
        var $toggle = $("<a href='#' class='dropdown-toggle'></a>")
            .hide();

        this.$hintMenu.append($toggle)
            .append("<ul class='dropdown-menu'></ul>");
    }

    /**
     * @private
     * Adds a single item to the hint list
     * @param {string} name
     */
    CodeHintList.prototype._addItem = function (name) {
        var self = this;
        var displayName = name.replace(
            new RegExp(StringUtils.regexEscape(this.query.queryStr), "i"),
            "<strong>$&</strong>"
        );

        var $item = $("<li><a href='#'><span class='codehint-item'>" + displayName + "</span></a></li>")
            .on("click", function (e) {
                // Don't let the click propagate upward (otherwise it will hit the close handler in
                // bootstrap-dropdown).
                e.stopPropagation();
                self.handleSelect(name);
            });

        this.$hintMenu.find("ul.dropdown-menu")
            .append($item);
    };
    
    /**
     * @private
     * Selects the item in the hint list specified by index
     * @param {number} index
     */
    CodeHintList.prototype._setSelectedIndex = function (index) {
        var items = this.$hintMenu.find("li");
        
        // Range check
        index = Math.max(-1, Math.min(index, items.length - 1));
        
        // Clear old highlight
        if (this.selectedIndex !== -1) {
            $(items[this.selectedIndex]).find("a").removeClass("highlight");
        }
        
        // Highlight the new selected item
        this.selectedIndex = index;

        if (this.selectedIndex !== -1) {
            var $item = $(items[this.selectedIndex]);
            var $view = this.$hintMenu.find("ul.dropdown-menu");

            ViewUtils.scrollElementIntoView($view, $item, false);
            $item.find("a").addClass("highlight");
        }
    };
            
    /**
     * @private
     * Rebuilds the list items for the hint list based on this.displayList
     */
    CodeHintList.prototype._buildListView = function () {
        var self = this;

        // clear the list 
        this.$hintMenu.find("li").remove();

        $.each(this.displayList, function (index, item) {
            if (index > self.options.maxResults) {
                return false;
            }
            self._addItem(item);
        });

        if (this.displayList.length === 0) {
            this.handleClose();
        } else {
            this._setSelectedIndex(this.initialSelect ? 0 : -1);
        }
    };

    /**
     * @private
     * Calculate the number of items per scroll page. Used for PageUp and PageDown.
     * @return {number}
     */
    CodeHintList.prototype._getItemsPerPage = function () {
        var itemsPerPage = 1,
            $items = this.$hintMenu.find("li"),
            $view = this.$hintMenu.find("ul.dropdown-menu"),
            itemHeight;

        if ($items.length !== 0) {
            itemHeight = $($items[0]).height();
            if (itemHeight) {
                // round down to integer value
                itemsPerPage = Math.floor($view.height() / itemHeight);
                itemsPerPage = Math.max(1, Math.min(itemsPerPage, $items.length));
            }
        }

        return itemsPerPage;
    };

    /**
     * @private
     * Computes top left location for hint list so that the list is not clipped by the window
     * @return {Object.<left: number, top: number> }
     */
    CodeHintList.prototype._calcHintListLocation = function () {
        var cursor = this.editor._codeMirror.cursorCoords(),
            posTop  = cursor.y,
            posLeft = cursor.x,
            $window = $(window),
            $menuWindow = this.$hintMenu.children("ul");

        // TODO Ty: factor out menu repositioning logic so code hints and Context menus share code
        // adjust positioning so menu is not clipped off bottom or right
        var bottomOverhang = posTop + 25 + $menuWindow.height() - $window.height();
        if (bottomOverhang > 0) {
            posTop -= (27 + $menuWindow.height());
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
     * Handles key presses when the hint list is being displayed
     * @param {Editor} editor
     * @param {KeyBoardEvent} keyEvent
     */
    CodeHintList.prototype.handleKeyEvent = function (event) {
        var keyCode,
            self = this;

        // positive distance rotates down; negative distance rotates up
        function _rotateSelection(distance) {
            var len = Math.min(self.displayList.length, self.options.maxResults),
                pos;

            // set the initial selection position if necessary
            if (self.selectedIndex < 0) {
                pos = (distance > 0) ? len - 1 : 0;
                self._setSelectedIndex(pos);
            } else {
                pos = self.selectedIndex;
            }

            // rotate the selection
            if (distance < 0) {
                distance %= len;
                distance += len;
            }
            self._setSelectedIndex((pos + distance) % len);
        }

        // (page) up, (page) down, enter and tab key are handled by the list
        if (event.type === "keydown") {
            keyCode = event.keyCode;

            if (keyCode === KeyEvent.DOM_VK_UP) {
                _rotateSelection.call(this, -1);
            } else if (keyCode === KeyEvent.DOM_VK_DOWN) {
                _rotateSelection.call(this, 1);
            } else if (keyCode === KeyEvent.DOM_VK_PAGE_UP) {
                _rotateSelection.call(this, -this._getItemsPerPage());
            } else if (keyCode === KeyEvent.DOM_VK_PAGE_DOWN) {
                _rotateSelection.call(this, this._getItemsPerPage());
            } else if (this.selectedIndex !== -1 &&
                    (keyCode === KeyEvent.DOM_VK_RETURN || keyCode === KeyEvent.DOM_VK_TAB)) {
                // Trigger a click handler to commmit the selected item
                $(this.$hintMenu.find("li")[this.selectedIndex]).triggerHandler("click");
            } else {
                // only prevent default handler when the list handles the event
                return;
            }
            
            event.preventDefault();
        }
    };

    /**
     * Return true if the CodeHintList is open.
     * @return {boolean}
     */
    CodeHintList.prototype.isOpen = function () {
        // We don't get a notification when the dropdown closes. The best
        // we can do is keep an "opened" flag and check to see if we
        // still have the "open" class applied.
        if (this.opened && !this.$hintMenu.hasClass("open")) {
            this.opened = false;
        }
        
        return this.opened;
    };
    
    /**
     * Displays the hint list at the current cursor position
     * @param {Editor} editor
     */
    CodeHintList.prototype.open = function (response) {
        this.query = {queryStr: response.match};
        this.displayList = response.hints;
        this.initialSelect = response.selectInitial;

        Menus.closeAll();
        this._buildListView();
    
        if (this.displayList.length) {
            // Need to add the menu to the DOM before trying to calculate its ideal location.
            $("#codehint-menu-bar > ul").append(this.$hintMenu);
            
            var hintPos = this._calcHintListLocation();
            
            this.$hintMenu.addClass("open")
                .css({"left": hintPos.left, "top": hintPos.top});
            this.opened = true;
            
            PopUpManager.addPopUp(this.$hintMenu, this.handleClose, true);
        }
    };

    /**
     * Gets the new query from the current provider and rebuilds the hint list based on the new one.
     */
    CodeHintList.prototype.update = function (response) {
        this.query = {queryStr: response.match};
        this.displayList = response.hints;
        this.initialSelect = response.selectInitial;

        this._buildListView();

        // Update the CodeHintList location
        if (this.displayList.length) {
            var hintPos = this._calcHintListLocation();
            this.$hintMenu.css({"left": hintPos.left, "top": hintPos.top});
        }
    };

    /**
     * Closes the hint list
     */
    CodeHintList.prototype.close = function () {
        this.$hintMenu.removeClass("open");
        this.opened = false;
        
        PopUpManager.removePopUp(this.$hintMenu);
        this.$hintMenu.remove();
    };
        
    CodeHintList.prototype.onSelect = function (callback) {
        this.handleSelect = callback;
    };

    CodeHintList.prototype.onClose = function (callback) {
        // TODO: Due to #1381, this won't get called if the user clicks out of
        // the code hint menu. That's (sort of) okay right now since it doesn't
        // really matter if a single old invisible code hint list is lying 
        // around (it'll get closed the next time the user pops up a code 
        // hint). Once #1381 is fixed this issue should go away.
        this.handleClose = callback;
    };


    // Define public API
    exports.CodeHintList = CodeHintList;
});
