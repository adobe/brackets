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
     * @constructor
     * Object to handle events for a dropdown list.
     *
     * DropdownEventHandler handles these events:
     *
     * Mouse:
     *  click       - execute selection callback and dismiss list
     *  mouseover   - highlight item
     *  mouseleave  - remove mouse highlighting
     *
     * Keyboard:
     *  Enter       - execute selection callback and dismiss list
     *  Esc         - dismiss list
     *  Up/Down     - change selection
     *  PageUp/Down - change selection
     *
     * @param {jQueryObject} $list  associated list object
     * @param {Function} selectionCallback  function called when list item is selected.
     */
    function DropdownEventHandler($list, selectionCallback, closeCallback) {
        
        this.$list = $list;
        this.$items = $list.find("li");
        this.selectionCallback = selectionCallback;
        this.closeCallback = closeCallback;
        
        /**
         * The selected position in the list; otherwise -1.
         * @type {number}
         */
        this.selectedIndex = -1;
    }

    /**
     * open
     */
    DropdownEventHandler.prototype.open = function () {
        var self = this;

        /**
         * Convert keydown events into hint list navigation actions.
         *
         * @param {KeyBoardEvent} keyEvent
         */
        function _keydownHook(event) {
            var keyCode;
    
            // positive distance rotates down; negative distance rotates up
            function _rotateSelection(distance) {
                var len = self.$items.length,
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
                    itemHeight;
        
                if (self.$items.length !== 0) {
                    itemHeight = $(self.$items[0]).height();
                    if (itemHeight) {
                        // round down to integer value
                        itemsPerPage = Math.floor(self.$list.height() / itemHeight);
                        itemsPerPage = Math.max(1, Math.min(itemsPerPage, self.$items.length));
                    }
                }
    
                return itemsPerPage;
            }
    
            // (page) up, (page) down, enter and tab key are handled by the list
            if (event.type === "keydown") {
                keyCode = event.keyCode;
    
                if (keyCode === KeyEvent.DOM_VK_UP) {
                    _rotateSelection.call(self, -1);
                } else if (keyCode === KeyEvent.DOM_VK_DOWN) {
                    _rotateSelection.call(self, 1);
                } else if (keyCode === KeyEvent.DOM_VK_PAGE_UP) {
                    _rotateSelection.call(self, -_itemsPerPage());
                } else if (keyCode === KeyEvent.DOM_VK_PAGE_DOWN) {
                    _rotateSelection.call(self, _itemsPerPage());
                } else if (self.selectedIndex !== -1 &&
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
         * Cleanup
         */
        function close() {
            KeyBindingManager.removeGlobalKeydownHook(_keydownHook);
            
            if (self.$list) {
                self.$list.off("click mouseover");
            }
            if (self.closeCallback) {
                self.closeCallback();
            }
        }
        
        KeyBindingManager.addGlobalKeydownHook(_keydownHook);
        
        if (this.$list) {
            this._registerMouseEvents();
            PopUpManager.addPopUp(this.$list, close, true);
        }
    };

    /**
     * Call selectionCallback with selected index
     */
    DropdownEventHandler.prototype._selectionHandler = function () {

        if (this.selectedIndex === -1) {
            return;
        }
        
        var $link = this.$items.eq(this.selectedIndex).find("a");
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
    DropdownEventHandler.prototype._setSelectedIndex = function (index) {
        
        // Range check
        index = Math.max(-1, Math.min(index, this.$items.length - 1));
        
        // Clear old highlight
        if (this.selectedIndex !== -1) {
            this.$items.eq(this.selectedIndex).find("a").removeClass("selected");
        }

        this.selectedIndex = index;

        // Highlight the new selected item, if necessary
        if (this.selectedIndex !== -1) {
            var $item = this.$items.eq(this.selectedIndex);

            ViewUtils.scrollElementIntoView(this.$list, $item, false);
            $item.find("a").addClass("selected");
        }
    };

    /**
     * Register mouse event handlers
     */
    DropdownEventHandler.prototype._registerMouseEvents = function () {
        var self = this,
            $highlightItem;
        
        this.$list
            .on("click", "a", function () {
                self._clickHandler($(this));
            })
            .on("mouseover", "a", function (e) {
                if (self.selectedIndex >= 0) {
                    self.$items.eq(self.selectedIndex).find("a").removeClass("selected");
                }
                var $link = $(e.currentTarget),
                    $item = $link.closest("li");
                self.selectedIndex = self.$items.index($item);
                if (self.selectedIndex >= 0) {
                    $link.addClass("selected");
                }
            });
    };

    // Export public API
    exports.DropdownEventHandler    = DropdownEventHandler;
});
