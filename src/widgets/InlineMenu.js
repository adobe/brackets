/*
 * Copyright (c) 2012 - present Adobe Systems Incorporated. All rights reserved.
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

define(function (require, exports, module) {


    // Load dependent modules
    var KeyBindingManager = require("command/KeyBindingManager"),
        Menus             = require("command/Menus"),
        KeyEvent          = require("utils/KeyEvent"),
        StringUtils       = require("utils/StringUtils"),
        ValidationUtils   = require("utils/ValidationUtils"),
        ViewUtils         = require("utils/ViewUtils"),
        PopUpManager      = require("widgets/PopUpManager"),
        Mustache          = require("thirdparty/mustache/mustache");

    var MenuHTML  = require("text!htmlContent/inline-menu.html");

    /**
     * Displays a popup list of items for a given editor context
     *
     * @constructor
     * @param {Editor} editor
     * @param {string} menuText
     */
    function InlineMenu(editor, menuText) {
        /**
         * The list of items to display
         *
         * @type {Array.<{id: number, name: string>}
         */
        this.items = [];

        /**
         * The selected position in the list; otherwise -1.
         *
         * @type {number}
         */
        this.selectedIndex = -1;


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
         * The menu selection callback function
         *
         * @type {Function}
         */
        this.handleSelect = null;

        /**
         * The menu closure callback function
         *
         * @type {Function}
         */
        this.handleClose = null;

        /**
         * The menu object
         *
         * @type {jQuery.Object}
         */
        this.$menu =
            $("<li class='dropdown inlinemenu-menu'></li>")
                .append($("<a href='#' class='dropdown-toggle' data-toggle='dropdown'></a>")
                        .hide())
                .append("<ul class='dropdown-menu'>" +
                            "<li class='inlinemenu-header'>" +
                                "<a>" + menuText + "</a>" +
                            "</li>" +
                         "</ul>");

        this._keydownHook = this._keydownHook.bind(this);
    }

    /**
     * Select the item in the menu at the specified index, or remove the
     * selection if index < 0.
     *
     * @private
     * @param {number} index
     */
    InlineMenu.prototype._setSelectedIndex = function (index) {
        var items = this.$menu.find("li.inlinemenu-item");

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
            var $view = this.$menu.find("ul.dropdown-menu");

            $item.find("a").addClass("highlight");
            ViewUtils.scrollElementIntoView($view, $item, false);
        }

        // Invoke handleHover callback if any
        if (this.handleHover) {
            this.handleHover(this.items[index].id);
        }
    };

    /**
     * Rebuilds the list items for the menu.
     *
     * @private
     */
    InlineMenu.prototype._buildListView = function (items) {
        var self            = this,
            view            = { items: [] },
            _addItem;

        this.items = items;

        _addItem = function (item) {
            view.items.push({ formattedItem: "<span>" + item.name + "</span>"});
        };

        // clear the list
        this.$menu.find("li.inlinemenu-item").remove();

        // if there are no items then close the list; otherwise add them and
        // set the selection
        if (this.items.length === 0) {
            if (this.handleClose) {
                this.handleClose();
            }
        } else {
            this.items.some(function (item, index) {
                _addItem(item);
            });

            // render the menu list
            var $ul = this.$menu.find("ul.dropdown-menu"),
                $parent = $ul.parent();

            // remove list temporarily to save rendering time
            $ul.remove().append(Mustache.render(MenuHTML, view));

            $ul.children("li.inlinemenu-item").each(function (index, element) {
                var item      = self.items[index],
                    $element    = $(element);

                // store id of item in the element
                $element.data("itemid", item.id);
            });

            // delegate list item events to the top-level ul list element
            $ul.on("click", "li.inlinemenu-item", function (e) {
                // Don't let the click propagate upward (otherwise it will
                // hit the close handler in bootstrap-dropdown).
                e.stopPropagation();
                if (self.handleSelect) {
                    self.handleSelect($(this).data("itemid"));
                }
            });

            $ul.on("mouseover", "li.inlinemenu-item", function (e) {
                e.stopPropagation();
                // _setSelectedIndex sets the selected index and call handle hover
                // callback funtion
                self._setSelectedIndex(self.items.findIndex(function(element) {
                    return element.id === $(e.currentTarget).data("itemid");
                }));
            });

            $parent.append($ul);

            this._setSelectedIndex(0);
        }
    };

    /**
     * Computes top left location for menu so that the menu is not clipped by the window.
     * Also computes the largest available width.
     *
     * @private
     * @return {{left: number, top: number, width: number}}
     */
    InlineMenu.prototype._calcMenuLocation = function () {
        var cursor      = this.editor._codeMirror.cursorCoords(),
            posTop      = cursor.bottom,
            posLeft     = cursor.left,
            textHeight  = this.editor.getTextHeight(),
            $window     = $(window),
            $menuWindow = this.$menu.children("ul"),
            menuHeight  = $menuWindow.outerHeight();

        // TODO Ty: factor out menu repositioning logic so inline menu and Context menus share code
        // adjust positioning so menu is not clipped off bottom or right
        var bottomOverhang = posTop + menuHeight - $window.height();
        if (bottomOverhang > 0) {
            posTop -= (textHeight + 2 + menuHeight);
        }

        posTop -= 30;   // shift top for hidden parent element

        var menuWidth = $menuWindow.width();
        var availableWidth = menuWidth;
        var rightOverhang = posLeft + menuWidth - $window.width();
        if (rightOverhang > 0) {
            // Right overhang is negative
            posLeft = Math.max(0, posLeft - rightOverhang);
        }

        return {left: posLeft, top: posTop, width: availableWidth};
    };


    /**
     * Check whether Event is one of the keys that we handle or not.
     *
     * @param {KeyBoardEvent|keyBoardEvent.keyCode} keyEvent
     */
    InlineMenu.prototype.isHandlingKeyCode = function (keyCodeOrEvent) {
        var keyCode = typeof keyCodeOrEvent === "object" ? keyCodeOrEvent.keyCode : keyCodeOrEvent;
        var ctrlKey = typeof keyCodeOrEvent === "object" ? keyCodeOrEvent.ctrlKey : false;


        return (keyCode === KeyEvent.DOM_VK_UP || keyCode === KeyEvent.DOM_VK_DOWN ||
            keyCode === KeyEvent.DOM_VK_PAGE_UP || keyCode === KeyEvent.DOM_VK_PAGE_DOWN ||
            keyCode === KeyEvent.DOM_VK_RETURN ||
            keyCode === KeyEvent.DOM_VK_ESCAPE
        );
    };

    /**
     * Convert keydown events into hint list navigation actions.
     *
     * @param {KeyBoardEvent} keyEvent
     */
    InlineMenu.prototype._keydownHook = function (event) {
        var keyCode,
            self = this;

        // positive distance rotates down; negative distance rotates up
        function _rotateSelection(distance) {
            var len = self.items.length,
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
                $items = self.$menu.find("li.inlinemenu-item"),
                $view = self.$menu.find("ul.dropdown-menu"),
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

        // If we're no longer visible, skip handling the key and end the session.
        if (!this.isOpen()) {
            this.handleClose();
            return false;
        }

        // (page) up, (page) down, enter are handled by the list
        if ((event.type === "keydown") && this.isHandlingKeyCode(event)) {
            keyCode = event.keyCode;

            if (event.keyCode === KeyEvent.DOM_VK_ESCAPE) {
                event.stopImmediatePropagation();
                this.handleClose();

                return false;
            } else if (event.shiftKey &&
                    (event.keyCode === KeyEvent.DOM_VK_UP ||
                     event.keyCode === KeyEvent.DOM_VK_DOWN ||
                     event.keyCode === KeyEvent.DOM_VK_PAGE_UP ||
                     event.keyCode === KeyEvent.DOM_VK_PAGE_DOWN)) {
                this.handleClose();
                // Let the event bubble.
                return false;
            } else if (keyCode === KeyEvent.DOM_VK_UP) {
                _rotateSelection.call(this, -1);
            } else if (keyCode === KeyEvent.DOM_VK_DOWN) {
                _rotateSelection.call(this, 1);
            } else if (keyCode === KeyEvent.DOM_VK_PAGE_UP) {
                _rotateSelection.call(this, -_itemsPerPage());
            } else if (keyCode === KeyEvent.DOM_VK_PAGE_DOWN) {
                _rotateSelection.call(this, _itemsPerPage());
            } else if (this.selectedIndex !== -1 &&
                    (keyCode === KeyEvent.DOM_VK_RETURN)) {
                // Trigger a click handler to commmit the selected item
                $(this.$menu.find("li.inlinemenu-item")[this.selectedIndex]).trigger("click");
            } else {
                return false;
            }

            event.stopImmediatePropagation();
            event.preventDefault();
            return true;
        }

        return false;
    };

    /**
     * Is the Inline menu open?
     *
     * @return {boolean}
     */
    InlineMenu.prototype.isOpen = function () {
        // We don't get a notification when the dropdown closes. The best
        // we can do is keep an "opened" flag and check to see if we
        // still have the "open" class applied.
        if (this.opened && !this.$menu.hasClass("open")) {
            this.opened = false;
        }

        return this.opened;
    };

    /**
     * Displays the menu at the current cursor position
     *
     * @param {Array.<{id: number, name: string>} hints
     */
    InlineMenu.prototype.open = function (items) {
        Menus.closeAll();

        this._buildListView(items);

        if (this.items.length) {
            // Need to add the menu to the DOM before trying to calculate its ideal location.
            $("#inlinemenu-menu-bar > ul").append(this.$menu);

            var menuPos = this._calcMenuLocation();

            this.$menu.addClass("open")
                .css({"left": menuPos.left, "top": menuPos.top, "width": menuPos.width + "px"});
            this.opened = true;

            KeyBindingManager.addGlobalKeydownHook(this._keydownHook);
        }
    };

    /**
     * Displays the last menu which was closed due to Scrolling
     */
    InlineMenu.prototype.openRemovedMenu = function () {
        if (this.opened === true) {
            if (this.$menu && !this.$menu.hasClass("open")) {
                var menuPos = this._calcMenuLocation();
                this.$menu.addClass("open")
                    .css({"left": menuPos.left, "top": menuPos.top, "width": menuPos.width + "px"});
            }
        }
    };

    /**
     * Closes the menu
     */
    InlineMenu.prototype.close = function () {
        this.opened = false;

        if (this.$menu) {
            this.$menu.removeClass("open");
            PopUpManager.removePopUp(this.$menu);
            this.$menu.remove();
        }

        KeyBindingManager.removeGlobalKeydownHook(this._keydownHook);
    };

    /**
     * Set the menu selection callback function
     *
     * @param {Function} callback
     */
    InlineMenu.prototype.onSelect = function (callback) {
        this.handleSelect = callback;
    };

    /**
     * Set the hover callback function
     *
     * @param {Function} callback
     */
    InlineMenu.prototype.onHover = function (callback) {
        this.handleHover = callback;
    };

    /**
     * Set the menu closure callback function
     *
     * @param {Function} callback
     */
    InlineMenu.prototype.onClose = function (callback) {
        this.handleClose = callback;
    };

    // Define public API
    exports.InlineMenu = InlineMenu;
});
