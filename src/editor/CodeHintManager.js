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
    var HTMLUtils       = require("language/HTMLUtils"),
        Menus           = require("command/Menus"),
        StringUtils     = require("utils/StringUtils"),
        EditorManager   = require("editor/EditorManager"),
        PopUpManager    = require("widgets/PopUpManager"),
        ViewUtils       = require("utils/ViewUtils"),
        KeyEvent        = require("utils/KeyEvent");


    var hintProviders = [],
        hintList,
        shouldShowHintsOnChange = false,
        keyDownEditor;


    /**
     * @constructor
     *
     * Displays a popup list of code completions.
     * Currently only HTML tags are supported, but this will greatly be extended in coming sprint
     * to include: extensibility API, HTML attributes hints, JavaScript hints, CSS hints
     */
    function CodeHintList() {
        this.currentProvider = null;
        this.query = {queryStr: null};
        this.displayList = [];
        this.options = {
            maxResults: 999
        };

        this.opened = false;
        this.selectedIndex = -1;
        this.editor = null;

        this.$hintMenu = $("<li class='dropdown codehint-menu'></li>");
        var $toggle = $("<a href='#' class='dropdown-toggle'></a>")
            .hide();

        this.$hintMenu.append($toggle)
            .append("<ul class='dropdown-menu'></ul>");
    }

    /**
     * @private
     * Enters the code completion text into the editor and closes list if the provider 
     * returns true. Otherwise, get a new query and update the list based on the new query.
     * @string {string} completion - text to insert into current code editor
     */
    CodeHintList.prototype._handleItemClick = function (completion) {
        if (this.currentProvider.handleSelect(completion, this.editor, this.editor.getCursorPos())) {
            this.close();
        } else {
            this.updateQueryAndList();
        }
    };

    /**
     * Adds a single item to the hint list
     * @param {string} name
     */
    CodeHintList.prototype.addItem = function (name) {
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
                self._handleItemClick(name);
            });

        this.$hintMenu.find("ul.dropdown-menu")
            .append($item);
    };

    /**
     * Rebuilds the hint list based on this.query
     */
    CodeHintList.prototype.updateList = function () {
        this.displayList = this.currentProvider.search(this.query);
        this.buildListView();
    };

    /**
     * Removes all list items from hint list
     */
    CodeHintList.prototype.clearList = function () {
        this.$hintMenu.find("li").remove();
    };
            
    /**
     * Rebuilds the list items for the hint list based on this.displayList
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

        if (count === 0) {
            this.close();
        } else {
            // Select the first item in the list
            this.setSelectedIndex(0);
        }
    };


    /**
     * Selects the item in the hint list specified by index
     * @param {Number} index
     */
    CodeHintList.prototype.setSelectedIndex = function (index) {
        var items = this.$hintMenu.find("li");
        
        // Range check
        index = Math.max(0, Math.min(index, items.length - 1));
        
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
     * Gets the new query from the current provider and rebuilds the hint list based on the new one.
     */
    CodeHintList.prototype.updateQueryAndList = function () {
        this.query = this.currentProvider.getQueryInfo(this.editor, this.editor.getCursorPos());
        this.updateList();

        // Update the CodeHintList location
        if (this.displayList.length) {
            var hintPos = this.calcHintListLocation();
            this.$hintMenu.css({"left": hintPos.left, "top": hintPos.top});
        }
    };

    /**
     * Handles key presses when the hint list is being displayed
     * @param {Editor} editor
     * @param {KeyBoardEvent} keyEvent
     */
    CodeHintList.prototype.handleKeyEvent = function (editor, event) {
        var keyCode = event.keyCode;
        
        // Up arrow, down arrow and enter key are always handled here
        if (event.type !== "keypress") {

            if (keyCode === KeyEvent.DOM_VK_RETURN || keyCode === KeyEvent.DOM_VK_TAB ||
                    keyCode === KeyEvent.DOM_VK_UP || keyCode === KeyEvent.DOM_VK_DOWN ||
                    keyCode === KeyEvent.DOM_VK_PAGE_UP || keyCode === KeyEvent.DOM_VK_PAGE_DOWN) {

                var isNavigationKey = (keyCode !== KeyEvent.DOM_VK_RETURN && keyCode !== KeyEvent.DOM_VK_TAB);
                if (event.type === "keydown") {
                    if (keyCode === KeyEvent.DOM_VK_UP) {
                        // Up arrow
                        this.setSelectedIndex(this.selectedIndex - 1);
                    } else if (keyCode === KeyEvent.DOM_VK_DOWN) {
                        // Down arrow
                        this.setSelectedIndex(this.selectedIndex + 1);
                    } else if (keyCode === KeyEvent.DOM_VK_PAGE_UP) {
                        // Page Up
                        this.setSelectedIndex(this.selectedIndex - this.getItemsPerPage());
                    } else if (keyCode === KeyEvent.DOM_VK_PAGE_DOWN) {
                        // Page Down
                        this.setSelectedIndex(this.selectedIndex + this.getItemsPerPage());
                    } else {
                        // Enter/return key or Tab key
                        // Trigger a click handler to commmit the selected item
                        $(this.$hintMenu.find("li")[this.selectedIndex]).triggerHandler("click");
                    }
                }

                event.preventDefault();
                return;
            }
        }
        
        // All other key events trigger a rebuild of the list, but only
        // on keyup events
        if (event.type === "keyup") {
            this.updateQueryAndList();
        }
    };

    /**
     * Return true if the CodeHintList is open.
     * @return {Boolean}
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
    CodeHintList.prototype.open = function (editor) {
        var self = this;
        this.editor = editor;

        Menus.closeAll();

        this.currentProvider = null;
        $.each(hintProviders, function (index, item) {
            var query = item.getQueryInfo(self.editor, self.editor.getCursorPos());
            if (query.queryStr !== null) {
                self.query = query;
                self.currentProvider = item;
                return false;
            }
        });
        if (!this.currentProvider) {
            return;
        }

        this.updateList();
    
        if (this.displayList.length) {
            // Need to add the menu to the DOM before trying to calculate its ideal location.
            $("#codehint-menu-bar > ul").append(this.$hintMenu);
            
            var hintPos = this.calcHintListLocation();
            
            this.$hintMenu.addClass("open")
                       .css({"left": hintPos.left, "top": hintPos.top});
            this.opened = true;
            
            PopUpManager.addPopUp(this.$hintMenu,
                function () {
                    self.close();
                },
                true);
        }
    };

    /**
     * Closes the hint list
     */
    CodeHintList.prototype.close = function () {
        // TODO: Due to #1381, this won't get called if the user clicks out of the code hint menu.
        // That's (sort of) okay right now since it doesn't really matter if a single old invisible
        // code hint list is lying around (it'll get closed the next time the user pops up a code
        // hint). Once #1381 is fixed this issue should go away.
        this.$hintMenu.removeClass("open");
        this.opened = false;
        this.currentProvider = null;
        
        PopUpManager.removePopUp(this.$hintMenu);
        this.$hintMenu.remove();
        if (hintList === this) {
            hintList = null;
            shouldShowHintsOnChange = false;
            keyDownEditor = null;
        }
    };
        
    /**
     * Computes top left location for hint list so that the list is not clipped by the window
     * @return {Object.<left: Number, top: Number> }
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
     * @private
     * Calculate the number of items per scroll page. Used for PageUp and PageDown.
     * @return {number}
     */
    CodeHintList.prototype.getItemsPerPage = function () {
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
      * Show the code hint list near the current cursor position for the specified editor
      * @param {Editor}
      */
    function showHint(editor) {
        if (hintList) {
            hintList.close();
        }
        hintList = new CodeHintList();
        hintList.open(editor);
    }
    
    /**
     * Handles keys related to displaying, searching, and navigating the hint list
     * @param {Editor} editor
     * @param {KeyboardEvent} event
     */
    function handleKeyEvent(editor, event) {
        var provider = null;
        
        // Check for Control+Space
        if (event.type === "keydown" && event.keyCode === 32 && event.ctrlKey) {
            showHint(editor);
            event.preventDefault();
        } else if (event.type === "keypress") {
            // Check if any provider wants to show hints on this key.
            $.each(hintProviders, function (index, item) {
                if (item.shouldShowHintsOnKey(String.fromCharCode(event.charCode))) {
                    provider = item;
                    return false;
                }
            });
            
            shouldShowHintsOnChange = !!provider;
            if (shouldShowHintsOnChange) {
                keyDownEditor = editor;
            }
        }

        // Pass to the hint list, if it's open
        if (hintList && hintList.isOpen()) {
            hintList.handleKeyEvent(editor, event);
        }
    }
    
    /**
     *
     */
    function handleChange(editor) {
        if (shouldShowHintsOnChange && keyDownEditor === editor) {
            shouldShowHintsOnChange = false;
            keyDownEditor = null;
            showHint(editor);
        }
    }

    /**
     * Registers an object that is able to provide code hints. When the user requests a code
     * hint getQueryInfo() will be called on every hint provider. Providers should examine
     * the state of the editor and return a search query object with a filter string if hints 
     * can be provided. search() will then be called allowing the hint provider to create a 
     * list of hints for the search query. When the user chooses a hint handleSelect() is called
     * so that the hint provider can insert the hint into the editor.
     *
     * @param {Object.< getQueryInfo: function(editor, cursor),
     *                  search: function(string),
     *                  handleSelect: function(string, Editor, cursor),
     *                  shouldShowHintsOnKey: function(string)>}
     *
     * Parameter Details:
     * - getQueryInfo - examines cursor location of editor and returns an object representing
     *      the search query to be used for hinting. queryStr is a required property of the search object
     *      and a client may provide other properties on the object to carry more context about the query.
     * - search - takes a query object and returns an array of hint strings based on the queryStr property
     *      of the query object.
     * - handleSelect - takes a completion string and inserts it into the editor near the cursor
     *      position. It should return true by default to close the hint list, but if the code hint provider
     *      can return false if it wants to keep the hint list open and continue with a updated list. 
     * - shouldShowHintsOnKey - inspects the char code and returns true if it wants to show code hints on that key.
     */
    function registerHintProvider(providerInfo) {
        hintProviders.push(providerInfo);
    }

    /**
     * Expose CodeHintList for unit testing
     */
    function _getCodeHintList() {
        return hintList;
    }
    
    // Define public API
    exports.handleKeyEvent          = handleKeyEvent;
    exports.handleChange            = handleChange;
    exports.showHint                = showHint;
    exports._getCodeHintList        = _getCodeHintList;
    exports.registerHintProvider    = registerHintProvider;
});
