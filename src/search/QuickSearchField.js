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
/*global define, $, window, setTimeout */


/*
 * Text field with attached dropdown list that is updated (based on a provider) whenever the text changes.
 * 
 * For styling, the DOM structure of the popup is as follows:
 *  body
 *      ol.quick-search-container
 *          li
 *          li.highlight
 *          li
 * And the text field is:
 *      input
 *      input.no-results
 */
define(function (require, exports, module) {
    "use strict";
    
    var KeyEvent = require("utils/KeyEvent");
    
    
    /**
     * Attaches to an existing <input> tag
     * @param {!jQueryObject} $input
     * @param {!function(string):($.Promise|Array.<*>|{error:?string}} options.resultProvider
     *          Given the current search text, returns an an array of result objects, an error object, or a
     *          Promise that yields one of those. If the Promise is still outstanding when the query next
     *          changes, resultProvider() will be called again (without waiting for the earlier Promise), and
     *          the Promise's result will be ignored.
     *          If the provider yields [], or a non-null error string, input is decorated with ".no-results"; if
     *          the provider yields a null error string, input is not decorated.
     * 
     * @param {!function(*, string):string} options.formatter
     *          Converts one result object to a string of HTML text. Passed the item and the current query.
     * @param {!function(?*, string):void} options.onCommit
     *          Called when an item is selected by clicking or pressing Enter. Passed the item and the current
     *          query. If the current result list is not up to date with the query text at the time Enter is
     *          pressed, waits until it is before running this callback. If Enter pressed with no results, passed
     *          null. The popup remains open after this event.
     * @param {!function(*, string):void} options.onHighlight
     *          Called when an item is highlighted via the arrow keys. Passed the item and the current query.
     *          Always called once with the top item in the result list, each time the list is updated (because
     *          the top item is always initially highlighted).
     *          TODO: only if query not blank - fix IN THE HANDLER by no-oping if query.length===1 !!!
     * @param {?number} options.maxResults
     *          Maximum number of items from resultProvider() to display in the popup.
     * @param {?number} options.verticalAdjust
     *          Number of pixels to position the popup below where $input is when constructor is called. Useful
     *          if UI is going to animate position after construction, but QuickSearchField may receive input
     *          before the animation is done.
     */
    function QuickSearchField($input, options) {
        this.$input = $input;
        this.options = options;
        
        this._handleInput   = this._handleInput.bind(this);
        this._handleKeyDown = this._handleKeyDown.bind(this);
        
        $input.on("input", this._handleInput);
        $input.on("keydown", this._handleKeyDown);
        
        this._dropdownTop = $input.offset().top + $input.height() + (options.verticalAdjust || 0);
    }
    
    /** @type {!Object} */
    QuickSearchField.prototype.options = null;
    
    /** @type {?$.Promise} */
    QuickSearchField.prototype._pending = null;
    
    /** @type {boolean} */
    QuickSearchField.prototype._commitPending = false;
    
    /** @type {?string} */
    QuickSearchField.prototype._displayedQuery = null;
    
    /** @type {?Array.<*>} */
    QuickSearchField.prototype._displayedResults = null;
    
    /** @type {?number} */
    QuickSearchField.prototype._highlightIndex = null;
    
    /** @type {?jQueryObject} */
    QuickSearchField.prototype._$dropdown = null;
    
    /** @type {!jQueryObject} */
    QuickSearchField.prototype.$input = null;  // TODO: _ prefix?
    
    /**
     */
    QuickSearchField.prototype._handleInput = function () {
        this._pending = null;  // immediately invalidate any previous Promise
        
        var valueAtEvent = this.$input.val();
        var self = this;
        setTimeout(function () {
            if (self.$input.val() === valueAtEvent) {
                self.updateResults();
            }
        }, 0);
    };
    
    /**
     */
    QuickSearchField.prototype._handleKeyDown = function (event) {
        if (event.keyCode === KeyEvent.DOM_VK_RETURN) {
            if (this._displayedQuery === this.$input.val()) {
                event.preventDefault();  // prevents keyup from going to someone else after we close
                this._doCommit();
            } else {
                // Once the current wait resolves, _render() will run the commit
                this._commitPending = true;
            }
        } else if (event.keyCode === KeyEvent.DOM_VK_DOWN) {
            // Highlight changes are always done synchronously on the currently shown result list. If the list
            // later changes, the highlight is reset
            if (this._displayedResults && this._displayedResults.length) {
                if (this._highlightIndex === null || this._highlightIndex === this._displayedResults.length - 1) {
                    this._highlightIndex = 0;
                } else {
                    this._highlightIndex++;
                }
                this._updateHighlight();
            }
            event.preventDefault(); // treated as Home key otherwise
            
        } else if (event.keyCode === KeyEvent.DOM_VK_UP) {
            if (this._displayedResults && this._displayedResults.length) {
                if (this._highlightIndex === null || this._highlightIndex === 0) {
                    this._highlightIndex = this._displayedResults.length - 1;
                } else {
                    this._highlightIndex--;
                }
                this._updateHighlight();
            }
            event.preventDefault(); // treated as End key otherwise
        }
    };
    QuickSearchField.prototype._doCommit = function (clickedIndex) {
        var item;
        if (this._displayedResults && this._displayedResults.length) {
            var committedIndex = clickedIndex !== undefined ? clickedIndex : (this._highlightIndex || 0);
            item = this._displayedResults[committedIndex];
        }
        this.options.onCommit(item, this._displayedQuery);
    };
    QuickSearchField.prototype._updateHighlight = function () {
        var $items = this._$dropdown.find("li");
        $items.removeClass("highlight");
        if (this._highlightIndex !== null) {
            $items.eq(this._highlightIndex).addClass("highlight");
            this.options.onHighlight(this._displayedResults[this._highlightIndex], this.$input.val());
        }
    };
    
    /**
     * Refresh the results dropdown, as if the user had changed the search text. Useful for providers that
     * want to show cached data initially, then update the results with fresher data once available.
     */
    QuickSearchField.prototype.updateResults = function () {
        this._pending = null;  // immediately invalidate any previous Promise
        
        var query = this.$input.val();
        var results = this.options.resultProvider(query);
        if (results.done && results.fail) {
            this._pending = results;
            var self = this;
            this._pending.done(function (realResults) {
                if (self._pending === results) {
                    self._render(realResults, query);
                    this._pending = null;
                }
            });
            this._pending.fail(function () {
                if (self._pending === results) {
                    self._render([], query);
                    this._pending = null;
                }
            });
        } else {
            this._render(results, query);
        }
    };
    
    QuickSearchField.prototype._$dropdown = null;
    QuickSearchField.prototype._closeDropdown = function () {
        if (this._$dropdown) {
            this._$dropdown.remove();
            this._$dropdown = null;
        }
    };
    QuickSearchField.prototype._openDropdown = function (htmlContent) {
        if (!this._$dropdown) {
            var self = this;
            this._$dropdown = $("<ol class='quick-search-container'/>").appendTo("body")
                .css({
                    position: "absolute",
                    top: this._dropdownTop,
                    left: this.$input.offset().left,
                    width: this.$input.width()
                })
                .click(function (event) {
                    // Unlike the Enter key, where we wait to catch up with typing, clicking commits immediately
                    var $item = $(event.target).closest("li");
                    if ($item.length) {
                        self._doCommit($item.index());
                    }
                });
        }
        this._$dropdown.html(htmlContent);
    };
    
    QuickSearchField.prototype._render = function (results, query) {
        this._displayedQuery = query;
        this._displayedResults = results;
        this._highlightIndex = 0;
        // TODO: fixup to match prev value's item if possible?
        // (Sublime moves arrowed highlight to stay on same item as list is filters, as long as it's
        // still visible; then jumps back to top when not. Do we need a equals(*, *):boolean to track this?)
        
        if (results.error || results.length === 0) {
            this._closeDropdown();
            this.$input.addClass("no-results");
        } else if (results.hasOwnProperty("error")) {
            this._closeDropdown();
            this.$input.removeClass("no-results");
        } else {
            this.$input.removeClass("no-results");
            
            var count = Math.min(results.length, this.options.maxResults),
                html = "",
                i;
            for (i = 0; i < count; i++) {
                html += this.options.formatter(results[i], query);
            }
            this._openDropdown(html);
            
            // Highlight top item and trigger highlight callback
            // TODO: if we had equals(), could avoid running callback when topmost item is same as before
            // (though master doesn't do this either)
            this._updateHighlight();
        }
        
        if (this._commitPending) {
            this._commitPending = false;
            this._doCommit();
        }
    };
    
    /**
     * Programmatically changes the search text and updates the results.
     */
    QuickSearchField.prototype.setText = function (value) {
        this.$input.val(value);
        this.updateResults();  // programmatic changes don't trigger "input" event
    };
    
    /**
     * Returns the currently highlighted item. Returns null if there is no result popup open (i.e. no text has
     * been entered yet; the provider returned zero results; or one of those was previously true and we are
     * still waiting for the provider to return newer results).
     */
    QuickSearchField.prototype.getSelectedItem = function () {
    };
    
    /**
     * Closes the dropdown, and discards any pending Promises.
     */
    QuickSearchField.prototype.destroy = function () {
        this._pending = null;  // immediately invalidate any pending Promise
        this._closeDropdown();
    };
    
    
    exports.QuickSearchField = QuickSearchField;
});
