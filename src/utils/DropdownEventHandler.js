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
/*global define, $ */

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
     * Items whose <a> has the .disabled class do not respond to selection.
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
        this.scrolling = false;
        
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
    
                if (keyCode === KeyEvent.DOM_VK_TAB) {
                    self.close();
                } else if (keyCode === KeyEvent.DOM_VK_UP) {
                    // Move up one, wrapping at edges (if nothing selected, select the last item)
                    self._tryToSelect(self._selectedIndex === -1 ? -1 : self._selectedIndex - 1, -1);
                } else if (keyCode === KeyEvent.DOM_VK_DOWN) {
                    // Move down one, wrapping at edges (if nothing selected, select the first item)
                    self._tryToSelect(self._selectedIndex === -1 ? 0 : self._selectedIndex + 1, +1);
                } else if (keyCode === KeyEvent.DOM_VK_PAGE_UP) {
                    // Move up roughly one 'page', stopping at edges (not wrapping) (if nothing selected, selects the first item)
                    self._tryToSelect((self._selectedIndex || 0) - self._itemsPerPage(), -1, true);
                } else if (keyCode === KeyEvent.DOM_VK_PAGE_DOWN) {
                    // Move down roughly one 'page', stopping at edges (not wrapping) (if nothing selected, selects the item one page down from the top)
                    self._tryToSelect((self._selectedIndex || 0) + self._itemsPerPage(), +1, true);
                    
                } else if (keyCode === KeyEvent.DOM_VK_HOME) {
                    self._tryToSelect(0, +1);
                } else if (keyCode === KeyEvent.DOM_VK_END) {
                    self._tryToSelect(self.$items.length - 1, -1);
                    
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
        if (this.$list) {
            PopUpManager.removePopUp(this.$list);
        }
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
     * Try to select item at the given index. If it's disabled or a divider, keep trying by incrementing
     * index by 'direction' each time (wrapping around if needed).
     * @param {number} index  If out of bounds, index either wraps around to remain in range (e.g. -1 yields
     *                      last item, length+1 yields 2nd item) or if noWrap set, clips instead (e.g. -1 yields
     *                      first item, length+1 yields last item).
     * @param {number} direction  Either +1 or -1
     * @param {boolean=} noWrap  Clip out of range index values instead of wrapping. Default false (wrap).
     */
    DropdownEventHandler.prototype._tryToSelect = function (index, direction, noWrap) {
        // Fix up 'index' if out of bounds (>= len or < 0)
        var len = this.$items.length;
        if (noWrap) {
            // Clip to stay in range (and set direction so we don't wrap in the recursion case either)
            if (index < 0) {
                index = 0;
                direction = +1;
            } else if (index >= len) {
                index = len - 1;
                direction = -1;
            }
        } else {
            // Wrap around to keep index in bounds
            index %= len;
            if (index < 0) {
                index += len;
            }
        }

        var $item = this.$items.eq(index);
        if ($item.hasClass("divider") || $item.find("a.disabled").length) {
            // Desired item is ineligible for selection: try next one
            this._tryToSelect(index + direction, direction, noWrap);
        } else {
            this._setSelectedIndex(index, true);
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
        if ($link.hasClass("disabled")) {
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

            $item.find("a").addClass("selected");
            if (scrollIntoView) {
                this.scrolling = true;
                ViewUtils.scrollElementIntoView(this.$list, $item, false);
            }
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
                // Don't select item under mouse cursor when scrolling.
                if (self.scrolling) {
                    self.scrolling = false;
                    return;
                }
                
                var $link = $(e.currentTarget),
                    $item = $link.closest("li"),
                    viewOffset = self.$list.offset(),
                    elementOffset = $item.offset();

                // Only set selected if enabled & in view
                // (dividers are already screened out since they don't have an "a" tag in them)
                if (!$link.hasClass("disabled")) {
                    if (elementOffset.top < viewOffset.top + self.$list.height() && viewOffset.top <= elementOffset.top) {
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
