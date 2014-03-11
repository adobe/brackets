/*
 * Copyright (c) 2014 Adobe Systems Incorporated. All rights reserved.
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
 */


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, window */

/**
 * Button that opens a dropdown list when clicked. More akin to a popup menu than a combobox. Compared to a
 * simple <select> element:
 *  - There's no "selected" state
 *  - The button's label is not automatically changed when an item in the list is clicked
 *  - Its width is not the max of all the dropdown items' labels
 *  - The button & dropdown's appearance can be customized far more
 * 
 * TODO: merge DropdownEventHandler into this? Are there any other widgets that might want to use it separately?
 */
define(function (require, exports, module) {
    "use strict";
    
    // Load dependent modules
    var DropdownEventHandler    = require("utils/DropdownEventHandler").DropdownEventHandler,
        PanelManager            = require("view/PanelManager"),
        Menus                   = require("command/Menus"),
        ViewUtils               = require("utils/ViewUtils"),
        _                       = require("thirdparty/lodash");

    /**
     * Creates a single dropdown-button instance. The DOM node is created but not attached to
     * the document anywhere - clients should append this.$button to the appropriate location.
     * 
     * DropdownButton dispatches the following events:
     *  - "select" - when an option in the dropdown is clicked. Passed item object and index.
     * 
     * @param {!string} label  Label to display on the button
     * @param {!Array.<*>} items  Items in the dropdown list
     * @param {?function(*, number):!string} itemRenderer  Optional function to convert a single item to HTML
     *          (see itemRenderer() docs below). If not provided, items are assumed to be plain text strings.
     */
    function DropdownButton(label, items, itemRenderer) {
        this.items = items;
        
        this.itemRenderer = itemRenderer || this.itemRenderer;
        
        this._onClick        = this._onClick.bind(this);
        this.closeDropdown   = this.closeDropdown.bind(this);
        this._onClickOutside = this._onClickOutside.bind(this);
        
        this.$button = $("<button class='btn btn-dropdown'/>")
            .text(label)
            .on("click", this._onClick);
    }
    
    /** @type {!Array.<*>} Items in dropdown list - may be changed any time dropdown isn't open */
    DropdownButton.prototype.items = null;
    
    /** @type {!jQueryObject} The clickable button. Available as soon as the DropdownButton is constructed. */
    DropdownButton.prototype.$button = null;
    
    /** @type {?jQueryObject} The dropdown element. Only non-null while open. */
    DropdownButton.prototype.$dropdown = null;
    
    /** @type {?string} Extra CSS class(es) to apply to $dropdown */
    DropdownButton.prototype.dropdownExtraClasses = null;
    
    /** @private @type {?HTMLElement} Where to restore focus when dropdown closed */
    DropdownButton.prototype._lastFocus = null;
    
    /** @private @type {?DropdownEventHandler} Helper object for dropdown. Only non-null while open. */
    DropdownButton.prototype._dropdownEventHandler = null;
    
    
    /** @private Handle clicking button */
    DropdownButton.prototype._onClick = function (event) {
        if (!this.$button.hasClass("disabled")) {
            this.toggleDropdown();
        }
        // Indicate click was handled (e.g. to shield from MultiRangeInlineEditor._onClick())
        event.stopPropagation();
    };
    
    /**
     * Called for each item when rendering the dropdown.
     * @param {*} item from items array
     * @param {number} index in items array
     * @return {!string} Formatted & escaped HTML
     */
    DropdownButton.prototype.itemRenderer = function (item, index) {
        return _.escape(String(item));
    };
    
    /** Converts the list of item objects into HTML list items in format required by DropdownEventHandler */
    DropdownButton.prototype._renderList = function () {
        var html = "";
        this.items.forEach(function (item, i) {
            html += "<li><a class='stylesheet-link' data-index='" + i + "'>";
            html += this.itemRenderer(item, i);
            html += "</a></li>";
        }.bind(this));
        return html;
    };
    
    /** Pops open the dropdown if currently closed. Does nothing if items.length == 0 */
    DropdownButton.prototype.showDropdown = function () {
        // Act like a plain old button if no items to show
        if (!this.items.length) {
            return;
        }
        
        if (this.$dropdown) {
            return;
        }
        
        Menus.closeAll();
        
        var $dropdown = $("<ul class='dropdown-menu dropdownbutton-popup' tabindex='-1'>")
            .addClass(this.dropdownExtraClasses)  // (no-op if unspecified)
            .append(this._renderList())
            .appendTo($("body"))
            .data("attached-to", this.$button[0]);  // keep ModalBar open while dropdown focused

        // Calculate position of dropdown
        var toggleOffset   = this.$button.offset(),
            posLeft        = toggleOffset.left,
            posTop         = toggleOffset.top + this.$button.outerHeight(),
            elementRect = {
                top:    posTop,
                left:   posLeft,
                height: $dropdown.height(),
                width:  $dropdown.width()
            },
            clip = ViewUtils.getElementClipSize($(window), elementRect);

        if (clip.bottom > 0) {
            // Bottom is clipped, so move entire menu above button
            posTop = Math.max(0, toggleOffset.top - $dropdown.height() - 4);
        }

        if (clip.right > 0) {
            // Right is clipped, so adjust left to fit menu in editor
            posLeft = Math.max(0, posLeft - clip.right);
        }

        $dropdown.css({
            left: posLeft,
            top: posTop,
            minWidth: this.$button.outerWidth()
        });

        // Attach event handlers
        this._dropdownEventHandler = new DropdownEventHandler($dropdown, this._onSelect.bind(this), this._onDropdownClose.bind(this));
        this._dropdownEventHandler.open();

        window.document.body.addEventListener("click", this._onClickOutside, true);
        $(PanelManager).on("editorAreaResize", this.closeDropdown);
        
        // Manage focus
        this._lastFocus = window.document.activeElement;
        $dropdown.focus();
        
        this.$dropdown = $dropdown;
    };
    
    /**
     * @private
     * Clean up event handlers after dropdown closed & dispose old dropdown DOM. Called regardless of how the dropdown
     * was closed.
     */
    DropdownButton.prototype._onDropdownClose = function () {
        window.document.body.removeEventListener("click", this._onClickOutside, true);
        $(PanelManager).off("editorAreaResize", this.closeDropdown);
        this._dropdownEventHandler = null;
        this.$dropdown = null;  // already remvoed from DOM automatically by PopUpManager

        this._lastFocus.focus();  // restore focus to old pos
    };
    
    /** Closes the dropdown if currently open */
    DropdownButton.prototype.closeDropdown = function () {
        if (this._dropdownEventHandler) {
            this._dropdownEventHandler.close();
        }
    };
    
    /** @private Clicking outside the dropdown closes it */
    DropdownButton.prototype._onClickOutside = function (event) {
        var $container = $(event.target).closest(".dropdownbutton-popup");

        // If click is outside dropdown list, then close dropdown list
        if ($container.length === 0 || $container[0] !== this.$dropdown[0]) {
            this.closeDropdown();
        }
    };
    
    /** Opens the dropdown if closed; closes it if open */
    DropdownButton.prototype.toggleDropdown = function () {
        if (this.$dropdown) {
            this.closeDropdown();
        } else {
            this.showDropdown();
        }
    };
    
    /**
     * @private
     * Callback from DropdownEventHandler when item in dropdown list is selected (via mouse or keyboard)
     * @param {!jQueryObject} $link  The `a` element selected
     */
    DropdownButton.prototype._onSelect = function ($link) {
        var itemIndex = Number($link.data("index"));
        $(this).triggerHandler("select", [this.items[itemIndex], itemIndex]);
    };
    
    
    exports.DropdownButton = DropdownButton;
});
