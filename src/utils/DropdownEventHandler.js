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
/*global define, $, window, brackets */

define(function (require, exports, module) {
    "use strict";
   
    var KeyBindingManager = require("command/KeyBindingManager"),
        KeyEvent          = require("utils/KeyEvent"),
        PopUpManager      = require("widgets/PopUpManager"),
        ViewUtils         = require("utils/ViewUtils");
    
    /**
     * Object to handle events for a dropdown list.
     *
     * DropdownEventHandler handles these events:
     *
     * Mouse:
     * - click       - execute selection callback and dismiss list
     * - mouseover   - highlight item
     * - mouseleave  - remove mouse highlighting
     *
     * Keyboard:
     * - Enter       - execute selection callback and dismiss list
     * - Esc         - dismiss list
     * - Up/Down     - change selection
     * - PageUp/Down - change selection
     *
     * @constructor
     * @param {jQueryObject} $list  associated list object
     * @param {Function} selectionCallback  function called when list item is selected.
     */
    function DropdownEventHandler($list, selectionCallback, closeCallback) {
        
        this.$list = $list;
        this.$items = $list.find("li");
        this.selectionCallback = selectionCallback;
        this.closeCallback = closeCallback;
        
        /**
         * @private
         * The selected position in the list; otherwise -1.
         * @type {number}
         */
        this._selectedIndex = -1;
    }

    /**
     * Public open method
     */
    DropdownEventHandler.prototype.open = function () {
        var self = this;

        /**
         * Convert keydown events into hint list navigation actions.
         *
         * @param {KeyboardEvent} event
         * @return {boolean} true if key was handled, otherwise false.
         */
        function _keydownHook(event) {
            var keyCode;
    
            // (page) up, (page) down, enter and tab key are handled by the list
            if (event.type === "keydown") {
                keyCode = event.keyCode;
    
                if (keyCode === KeyEvent.DOM_VK_UP) {
                    self._rotateSelection(-1);
                } else if (keyCode === KeyEvent.DOM_VK_DOWN) {
                    self._rotateSelection(1);
                } else if (keyCode === KeyEvent.DOM_VK_PAGE_UP) {
                    self._rotateSelection(-self._itemsPerPage());
                } else if (keyCode === KeyEvent.DOM_VK_PAGE_DOWN) {
                    self._rotateSelection(self._itemsPerPage());
                } else if (self._selectedIndex !== -1 &&
                        (keyCode === KeyEvent.DOM_VK_RETURN)) {
    
                    // Trigger a click handler to commmit the selected item
                    self._selectionHandler();
                } else {
                    // Let the event bubble.
                    return false;
                }
                
                event.stopImmediatePropagation();
                event.preventDefault();
                return true;
            }
            
            // If we didn't handle it, let other global keydown hooks handle it.
            return false;
        }

        /**
         * PopUpManager callback
         */
        function closeCallback() {
            KeyBindingManager.removeGlobalKeydownHook(_keydownHook);
            self._cleanup();
        }
        
        KeyBindingManager.addGlobalKeydownHook(_keydownHook);
        
        if (this.$list) {
            this._registerMouseEvents();
            PopUpManager.addPopUp(this.$list, closeCallback, true);
        }
    };

    /**
     * Public close method
     */
    DropdownEventHandler.prototype.close = function () {
        PopUpManager.removePopUp(this.$list);
    };

    /**
     * Cleanup
     */
    DropdownEventHandler.prototype._cleanup = function () {
        if (this.$list) {
            this.$list.off(".dropdownEventHandler");
        }
        if (this.closeCallback) {
            this.closeCallback();
        }
    };

    /**
     * Change selection by specified amount. After selection reaches the last item
     * in the rotation direction, then it wraps around to the start.
     *
     * @param {number} distance  Number of items to move change selection where
     *      positive distance rotates down and negative distance rotates up
     */
    DropdownEventHandler.prototype._rotateSelection = function (distance) {
        var len = this.$items.length,
            pos;

        if (this._selectedIndex < 0) {
            // set the initial selection
            pos = (distance > 0) ? distance - 1 : len - 1;

        } else {
            // adjust current selection
            pos = this._selectedIndex;

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

        // If the item to be selected is a divider, then rotate one more.
        if ($(this.$items[pos]).hasClass("divider")) {
            this._rotateSelection((distance > 0) ? (distance + 1) : (distance - 1));
        } else {
            this._setSelectedIndex(pos, true);
        }
    };

    /**
     * @return {number} The number of items per scroll page.
     */
    DropdownEventHandler.prototype._itemsPerPage = function () {
        var itemsPerPage = 1,
            itemHeight;

        if (this.$items.length !== 0) {
            itemHeight = $(this.$items[0]).height();
            if (itemHeight) {
                // round down to integer value
                itemsPerPage = Math.floor(this.$list.height() / itemHeight);
                itemsPerPage = Math.max(1, Math.min(itemsPerPage, this.$items.length));
            }
        }

        return itemsPerPage;
    };
    
    /**
     * Call selectionCallback with selected index
     */
    DropdownEventHandler.prototype._selectionHandler = function () {

        if (this._selectedIndex === -1) {
            return;
        }
        
        var $link = this.$items.eq(this._selectedIndex).find("a");
        this._clickHandler($link);
    };
    
    /**
     * Call selectionCallback with selected item
     *
     * @param {jQueryObject} $item
     */
    DropdownEventHandler.prototype._clickHandler = function ($link) {

        if (!this.selectionCallback || !this.$list || !$link) {
            return;
        }
        
        this.selectionCallback($link);
        PopUpManager.removePopUp(this.$list);
    };
    
    /**
     * Select the item in the hint list at the specified index, or remove the
     * selection if index < 0.
     *
     * @private
     * @param {number} index
     */
    DropdownEventHandler.prototype._setSelectedIndex = function (index, scrollIntoView) {
        
        // Range check
        index = Math.max(-1, Math.min(index, this.$items.length - 1));
        
        // Clear old highlight
        if (this._selectedIndex !== -1) {
            this.$items.eq(this._selectedIndex).find("a").removeClass("selected");
        }

        this._selectedIndex = index;

        // Highlight the new selected item, if necessary
        if (this._selectedIndex !== -1) {
            var $item = this.$items.eq(this._selectedIndex);

            if (scrollIntoView) {
                ViewUtils.scrollElementIntoView(this.$list, $item, false);
            }
            $item.find("a").addClass("selected");
        }
    };

    /**
     * Register mouse event handlers
     */
    DropdownEventHandler.prototype._registerMouseEvents = function () {
        var self = this;
        
        this.$list
            .on("click.dropdownEventHandler", "a", function () {
                self._clickHandler($(this));
            })
            .on("mouseover.dropdownEventHandler", "a", function (e) {
                var $link = $(e.currentTarget),
                    $item = $link.closest("li"),
                    viewOffset = self.$list.offset(),
                    elementOffset = $item.offset();

                // Only set selected if in view
                if (elementOffset.top < viewOffset.top + self.$list.height()) {
                    if (viewOffset.top <= elementOffset.top) {
                        self._setSelectedIndex(self.$items.index($item), false);
                    }
                }
            });
    };
    
    /**
     * Re-register mouse event handlers
     * @param {!jQueryObject} $list  newly updated list object
     */
    DropdownEventHandler.prototype.reRegisterMouseHandlers = function ($list) {
        if (this.$list) {
            this.$list.off(".dropdownEventHandler");
            
            this.$list = $list;
            this.$items = $list.find("li");
            
            this._registerMouseEvents();
        }
    };

    // Export public API
    exports.DropdownEventHandler    = DropdownEventHandler;
});
