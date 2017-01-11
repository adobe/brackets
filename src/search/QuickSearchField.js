/*
 * Copyright (c) 2013 - present Adobe Systems Incorporated. All rights reserved.
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
     *
     * @constructor
     *
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
     *          Converts one result object to a string of HTML text. Passed the item and the current query. The
     *          outermost element must be <li>. The ".highlight" class can be ignored as it is applied automatically.
     * @param {!function(?*, string):void} options.onCommit
     *          Called when an item is selected by clicking or pressing Enter. Passed the item and the current
     *          query. If the current result list is not up to date with the query text at the time Enter is
     *          pressed, waits until it is before running this callback. If Enter pressed with no results, passed
     *          null. The popup remains open after this event.
     * @param {!function(*, string, boolean):void} options.onHighlight
     *          Called when an item is highlighted in the list. Passed the item, the current query, and a flag that is
     *          true if the item was highlighted explicitly (arrow keys), not simply due to a results list update. Since
     *          the top item in the list is always initially highlighted, every time the list is updated onHighlight()
     *          is called with the top item and with the explicit flag set to false.
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

        options.maxResults = options.maxResults || 10;

        this._handleInput   = this._handleInput.bind(this);
        this._handleKeyDown = this._handleKeyDown.bind(this);

        $input.on("input", this._handleInput);
        $input.on("keydown", this._handleKeyDown);

        this._dropdownTop = $input.offset().top + $input.height() + (options.verticalAdjust || 0);
    }

    /** @type {!Object} */
    QuickSearchField.prototype.options = null;

    /** @type {?$.Promise} Promise corresponding to latest resultProvider call. Any earlier promises ignored */
    QuickSearchField.prototype._pending = null;

    /** @type {boolean} True if Enter already pressed & just waiting for results to arrive before committing */
    QuickSearchField.prototype._commitPending = false;

    /** @type {?string} Value of $input corresponding to the _displayedResults list */
    QuickSearchField.prototype._displayedQuery = null;

    /** @type {?Array.<*>}  Latest resultProvider result */
    QuickSearchField.prototype._displayedResults = null;

    /** @type {?number} */
    QuickSearchField.prototype._highlightIndex = null;

    /** @type {?jQueryObject} Dropdown's <ol>, while open; null while closed */
    QuickSearchField.prototype._$dropdown = null;

    /** @type {!jQueryObject} */
    QuickSearchField.prototype.$input = null;


    /** When text field changes, update results list */
    QuickSearchField.prototype._handleInput = function () {
        this._pending = null;  // immediately invalidate any previous Promise

        var valueAtEvent = this.$input.val();
        var self = this;
        // The timeout lets us skip over a backlog of multiple keyboard events when the provider is responding
        // so slowly that JS execution can't keep up. All the remaining input events are serviced before the
        // first timeout runs; then all the queued-up timeouts run in a row. All except the last one can no-op.
        setTimeout(function () {
            if (self.$input.val() === valueAtEvent) {
                self.updateResults();
            }
        }, 0);
    };

    /** Handle special keys: Enter, Up/Down */
    QuickSearchField.prototype._handleKeyDown = function (event) {
        if (event.keyCode === KeyEvent.DOM_VK_RETURN) {
            // Enter should always act on the latest results. If input has changed and we're still waiting for
            // new results, just flag the 'commit' for later
            if (this._displayedQuery === this.$input.val()) {
                event.preventDefault();  // prevents keyup from going to someone else after we close
                this._doCommit();
            } else {
                // Once the current wait resolves, _render() will run the commit
                this._commitPending = true;
            }
        } else if (event.keyCode === KeyEvent.DOM_VK_DOWN) {
            // Highlight changes are always done synchronously on the currently shown result list. If the list
            // later changes, the highlight is reset to the top
            if (this._displayedResults && this._displayedResults.length) {
                if (this._highlightIndex === null || this._highlightIndex === this._displayedResults.length - 1) {
                    this._highlightIndex = 0;
                } else {
                    this._highlightIndex++;
                }
                this._updateHighlight(true);
            }
            event.preventDefault(); // treated as Home key otherwise

        } else if (event.keyCode === KeyEvent.DOM_VK_UP) {
            if (this._displayedResults && this._displayedResults.length) {
                if (this._highlightIndex === null || this._highlightIndex === 0) {
                    this._highlightIndex = this._displayedResults.length - 1;
                } else {
                    this._highlightIndex--;
                }
                this._updateHighlight(true);
            }
            event.preventDefault(); // treated as End key otherwise
        }
    };

    /** Call onCommit() immediately */
    QuickSearchField.prototype._doCommit = function (index) {
        var item;
        if (this._displayedResults && this._displayedResults.length) {
            var committedIndex = index !== undefined ? index : (this._highlightIndex || 0);
            item = this._displayedResults[committedIndex];
        }
        this.options.onCommit(item, this._displayedQuery);
    };

    /** Update display to reflect value of _highlightIndex, & call onHighlight() */
    QuickSearchField.prototype._updateHighlight = function (explicit) {
        var $items = this._$dropdown.find("li");
        $items.removeClass("highlight");
        if (this._highlightIndex !== null) {
            $items.eq(this._highlightIndex).addClass("highlight");

            this.options.onHighlight(this._displayedResults[this._highlightIndex], this.$input.val(), explicit);
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
            // Provider returned an async result - mark it as the latest Promise and if it's still latest when
            // it resolves, render the results then
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
            // Synchronous result - render immediately
            this._render(results, query);
        }
    };


    /** Close dropdown result list if visible */
    QuickSearchField.prototype._closeDropdown = function () {
        if (this._$dropdown) {
            this._$dropdown.remove();
            this._$dropdown = null;
        }
    };

    /**
     * Open dropdown result list & populate with the given content
     * @param {!string} htmlContent
     */
    QuickSearchField.prototype._openDropdown = function (htmlContent) {
        if (!this._$dropdown) {
            var self = this;
            this._$dropdown = $("<ol class='quick-search-container'/>").appendTo("body")
                .css({
                    position: "absolute",
                    top: this._dropdownTop,
                    left: this.$input.offset().left,
                    width: this.$input.outerWidth()
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

    /**
     * Given finished provider result, format it into HTML and show in dropdown, and update "no-results" style.
     * If an Enter key commit was pending from earlier, process it now.
     * @param {!Array.<*>} results
     * @param {!string} query
     */
    QuickSearchField.prototype._render = function (results, query) {
        this._displayedQuery = query;
        this._displayedResults = results;
        this._highlightIndex = 0;
        // TODO: fixup to match prev value's item if possible?

        if (results.error || results.length === 0) {
            this._closeDropdown();
            this.$input.addClass("no-results");
        } else if (results.hasOwnProperty("error")) {
            // Error present but falsy - no results to show, but don't decorate with error style
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
            this._updateHighlight(false);
        }

        // If Enter key was pressed earlier, handle it now that we've gotten results back
        if (this._commitPending) {
            this._commitPending = false;
            this._doCommit();
        }
    };


    /**
     * Programmatically changes the search text and updates the results.
     * @param {!string} value
     */
    QuickSearchField.prototype.setText = function (value) {
        this.$input.val(value);
        this.updateResults();  // programmatic changes don't trigger "input" event
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
