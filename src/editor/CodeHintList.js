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
     * Displays a popup list of hints for a given editor context.
     *
     * @constructor
     * @param {Editor} editor
     */
    function CodeHintList(editor) {

        /**
         * The list of hints to display
         *
         * @type {Array<String + jQuery.Object>}
         */
        this.hints = [];

        /**
         * The selected position in the list; otherwise -1.
         *
         * @type {number}
         */
        this.selectedIndex = -1;

        /**
         * The maximum number of hints to display
         *
         * @type {number}
         */
        this.maxResults = 999;

        /**
         * Is the list currently open?
         *
         * @type {boolean}
         */
        this.opened = false;

        /**
         * The editor context
         *
         * @type {Editor}
         */
        this.editor = editor;

        /**
         * The hint selection callback function
         *
         * @type {Function}
         */
        this.handleSelect = null;

        /**
         * The hint list closure callback function
         *
         * @type {Function}
         */
        this.handleClose = null;

        /**
         * The hint list menu object
         *
         * @type {jQuery.Object}
         */
        this.$hintMenu =
            $("<li class='dropdown codehint-menu'></li>")
                .append($("<a href='#' class='dropdown-toggle'></a>")
                        .hide())
                .append("<ul class='dropdown-menu'></ul>");
    }

    /**
     * Select the item in the hint list at the specified index, or remove the
     * selection if index < 0.
     *
     * @private
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

        this.selectedIndex = index;

        // Highlight the new selected item, if necessary
        if (this.selectedIndex !== -1) {
            var $item = $(items[this.selectedIndex]);
            var $view = this.$hintMenu.find("ul.dropdown-menu");

            ViewUtils.scrollElementIntoView($view, $item, false);
            $item.find("a").addClass("highlight");
        }
    };

    /**
     * Rebuilds the list items for the hint list.
     *
     * @private
     */
    CodeHintList.prototype._buildListView = function (hintObj) {
        var self            = this,
            match           = hintObj.match,
            selectInitial   = hintObj.selectInitial,
            _addHint;

        this.hints = hintObj.hints;

        // add a formatted hint to the hint list
        function _addListItem(hint, formattedHint) {
            var $spanItem = $("<span class='codehint-item'>").append(formattedHint),
                $anchorItem = $("<a href='#'>").append($spanItem),
                $listItem = $("<li>").append($anchorItem)
                    .on("click", function (e) {
                        // Don't let the click propagate upward (otherwise it will
                        // hit the close handler in bootstrap-dropdown).
                        e.stopPropagation();
                        if (self.handleSelect) {
                            self.handleSelect(hint);
                        }
                    });

            self.$hintMenu.find("ul.dropdown-menu")
                .append($listItem);
        }

        // if there is no match, assume name is already a formatted jQuery
        // object; otherwise, use match to format name for display.
        if (match) {
            _addHint = function (name) {
                var displayName = $("<span>")
                    .append(name.replace(
                        new RegExp(StringUtils.regexEscape(match), "i"),
                        "<strong>$&</strong>"
                    ));
                _addListItem(name, displayName);
            };
        } else {
            _addHint = function (name) {
                _addListItem(name, name);
            };
        }

        // clear the list 
        this.$hintMenu.find("li").remove();

        // if there are no hints then close the list; otherwise add them and
        // set the selection
        if (this.hints.length === 0) {
            if (this.handleClose) {
                this.handleClose();
            }
        } else {
            $.each(this.hints, function (index, item) {
                if (index > self.maxResults) {
                    return false;
                }
                _addHint(item);
            });
            this._setSelectedIndex(selectInitial ? 0 : -1);
        }
    };

    /**
     * Computes top left location for hint list so that the list is not clipped by the window
     *
     * @private
     * @return {{left: number, top: number}}
     */
    CodeHintList.prototype._calcHintListLocation = function () {
        var cursor      = this.editor._codeMirror.cursorCoords(),
            posTop      = cursor.bottom,
            posLeft     = cursor.left,
            textHeight  = this.editor.getTextHeight(),
            $window     = $(window),
            $menuWindow = this.$hintMenu.children("ul"),
            menuHeight  = $menuWindow.outerHeight();

        // TODO Ty: factor out menu repositioning logic so code hints and Context menus share code
        // adjust positioning so menu is not clipped off bottom or right
        var bottomOverhang = posTop + menuHeight - $window.height();
        if (bottomOverhang > 0) {
            posTop -= (textHeight + 2 + menuHeight);
        }

        posTop -= 30;   // shift top for hidden parent element

        var rightOverhang = posLeft + $menuWindow.width() - $window.width();
        if (rightOverhang > 0) {
            posLeft = Math.max(0, posLeft - rightOverhang);
        }

        return {left: posLeft, top: posTop};
    };
    
    /**
     * Convert keydown events into hint list navigation actions.
     *
     * @param {KeyBoardEvent} keyEvent
     */
    CodeHintList.prototype.handleKeyEvent = function (event) {
        var keyCode,
            self = this;

        // positive distance rotates down; negative distance rotates up
        function _rotateSelection(distance) {
            var len = Math.min(self.hints.length, self.maxResults),
                pos;

            if (self.selectedIndex < 0) {
                // set the initial selection
                pos = (distance > 0) ? distance - 1 : len - 1;

            } else {
                // adjust current selection
                pos = self.selectedIndex;

                // Don't "rotate" until all items have been shown
                if (distance > 0) {
                    if (pos === (len - 1)) {
                        pos = 0;  // wrap
                    } else {
                        pos = Math.min(pos + distance, len - 1);
                    }
                } else {
                    if (pos === 0) {
                        pos = (len - 1);  // wrap
                    } else {
                        pos = Math.max(pos + distance, 0);
                    }
                }
            }

            self._setSelectedIndex(pos);
        }

        // Calculate the number of items per scroll page.
        function _itemsPerPage() {
            var itemsPerPage = 1,
                $items = self.$hintMenu.find("li"),
                $view = self.$hintMenu.find("ul.dropdown-menu"),
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
        }

        // (page) up, (page) down, enter and tab key are handled by the list
        if (event.type === "keydown") {
            keyCode = event.keyCode;

            if (keyCode === KeyEvent.DOM_VK_UP) {
                _rotateSelection.call(this, -1);
            } else if (keyCode === KeyEvent.DOM_VK_DOWN) {
                _rotateSelection.call(this, 1);
            } else if (keyCode === KeyEvent.DOM_VK_PAGE_UP) {
                _rotateSelection.call(this, -_itemsPerPage());
            } else if (keyCode === KeyEvent.DOM_VK_PAGE_DOWN) {
                _rotateSelection.call(this, _itemsPerPage());
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
     * Is the CodeHintList open?
     *
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
     *
     * @param {Object<hints: Array<String + jQuery.Object>, match: String,
     *          selectInitial: boolean>} hintObj
     */
    CodeHintList.prototype.open = function (hintObj) {
        Menus.closeAll();
        this._buildListView(hintObj);

        if (this.hints.length) {
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
     * Updates the (already open) hint list window with new hints
     *
     * @param {Object<hints: Array<String + jQuery.Object>, match: String,
     *          selectInitial: boolean>} hintObj
     */
    CodeHintList.prototype.update = function (hintObj) {
        this._buildListView(hintObj);

        // Update the CodeHintList location
        if (this.hints.length) {
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

    /**
     * Set the hint list selection callback function
     *
     * @param {Function} callback
     */
    CodeHintList.prototype.onSelect = function (callback) {
        this.handleSelect = callback;
    };

    /**
     * Set the hint list closure callback function
     *
     * @param {Function} callback
     */
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
