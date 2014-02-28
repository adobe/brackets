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
 * 
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, window, Mustache */

/**
 * Utilities for managing file-set filters, as used in Find in Files.
 * Includes both UI for selecting/editing filters, as well as the actual file-filtering implementation.
 */
define(function (require, exports, module) {
    "use strict";
    
    var _                   = require("thirdparty/lodash"),
        DefaultDialogs      = require("widgets/DefaultDialogs"),
        Dialogs             = require("widgets/Dialogs"),
        DropdownButton      = require("widgets/DropdownButton").DropdownButton,
        StringUtils         = require("utils/StringUtils"),
        Strings             = require("strings"),
        globmatch           = require("thirdparty/globmatch"),
        PreferencesManager  = require("preferences/PreferencesManager");
    
    
    /**
     * A search filter is an array of one or more glob strings. The filter must be 'compiled' via compile()
     * before passing to filterPath().
     * @return {!Array.<string>>}
     */
    function getLastFilter() {
        return PreferencesManager.getViewState("search.exclusions") || [];
    }
    
    /**
     * A search filter is an array of one or more glob strings. The filter must be 'compiled' via compile()
     * before passing to filterPath().
     * @return {!Array.<string>>}
     */
    function setLastFilter(filter) {
        PreferencesManager.setViewState("search.exclusions", filter);
    }
    
    
    /**
     * Opens a dialog box to edit the given filter. When editing is finished, the value of getLastFilter() changes to
     * reflect the edits. If the dialog was canceled, the preference is left unchanged.
     * @return {!$.Promise} Dialog box promise
     */
    function editFilter(filter) {
        var lastFocus = window.document.activeElement;
        
        var globInfoURL = "https://github.com/adobe/brackets/wiki/Using-File-Filters";
        var html = StringUtils.format(Strings.FILE_FILTER_INSTRUCTIONS, globInfoURL) +
            "<textarea class='exclusions-editor'></textarea>";
        var buttons = [
            { className : Dialogs.DIALOG_BTN_CLASS_PRIMARY, id: Dialogs.DIALOG_BTN_OK, text: Strings.OK },
            { className : Dialogs.DIALOG_BTN_CLASS_NORMAL, id: Dialogs.DIALOG_BTN_CANCEL, text: Strings.CANCEL }
        ];
        var dialog = Dialogs.showModalDialog(DefaultDialogs.DIALOG_ID_INFO, "Edit Filter", html, buttons);
        
        dialog.getElement().find(".exclusions-editor").val(filter.join("\n")).focus();
        
        dialog.done(function (buttonId) {
            if (buttonId === Dialogs.DIALOG_BTN_OK) {
                var newFilter = dialog.getElement().find(".exclusions-editor").val().split("\n");
                newFilter = newFilter.filter(function (glob) {
                    return glob.trim().length;
                });
                
                // Update saved filter preference
                setLastFilter(newFilter);
            }
            lastFocus.focus();  // restore focus to old pos
        });
        
        return dialog.getPromise();
    }
    
    
    /**
     * Converts a user-specified filter object (as chosen in picker or retrieved from getFilters()) to a 'compiled' form
     * that can be used with filterPath().
     * @param {!Array.<string>} userFilter
     * @return {!Array.<string>} 'compiled' filter that can be passed to filterPath()
     */
    function compile(userFilter) {
        return userFilter.map(function (glob) {
            // Automatic "**" prefix if not explicitly present
            if (glob.substr(0, 2) !== "**") {
                glob = "**" + glob;
            }
            // Automatic "**" suffix if not explicitly present and no "." in last path segment of filter string
            if (glob.substr(-2, 2) !== "**") {
                var lastSeg = glob.lastIndexOf("/");
                if (glob.indexOf(".", lastSeg + 1) === -1) {  // if no "/" present, this treats whole string as 'last segment'
                    glob += "**";
                }
            }
            return glob;
        });
    }
    
    /**
     * Marks the filter picker's currently selected item as most-recently used, and returns the corresponding
     * 'compiled' filter object ready for use with filterPath().
     */
    function commitPicker(picker) {
        var filter = getLastFilter();
        return compile(filter);
    }
    
    /**
     * Creates a UI element for selecting a filter, populated with a list of recently used filters and an option to
     * edit the selected filter. The edit option is fully functional, but selecting any other item does nothing. The
     * client should call commitDropdown() when the UI containing the filter picker is confirmed (which updates the MRU
     * order) and then use the returned filter object as needed.
     */
    function createFilterPicker() {
        var $picker = $("<div class='filter-picker'><span class='filter-label'></span><button class='btn no-focus'></button></div>"),
            $button = $picker.find("button");
        
        function joinBolded(segments) {
            var html = "";
            segments.forEach(function (seg, index) {
                if (index) {
                    html += ", ";
                }
                html += "<strong>" + _.escape(seg) + "</strong>";
            });
            return html;
        }
        function itemRenderer(filter) {
            // Format filter in condensed form
            if (filter.length > 2) {
                return Strings.FILE_FILTER_LIST_PREFIX + " " + joinBolded(filter.slice(0, 2)) + " " +
                       StringUtils.format(Strings.FILE_FILTER_CLIPPED_SUFFIX, filter.length - 2);
            } else {
                return Strings.FILE_FILTER_LIST_PREFIX + " " + joinBolded(filter);
            }
        }
        
        function updatePicker() {
            var filter = getLastFilter();
            if (filter.length) {
                $button.text(Strings.EDIT_FILE_FILTER);
                $picker.find(".filter-label").html(itemRenderer(filter))
                    .attr("title", filter.join("\n"));
            } else {
                $button.text(Strings.NO_FILE_FILTER);
                $picker.find(".filter-label").html("").attr("title", "");
            }
        }
        
        updatePicker();
        
        $button.click(function () {
            editFilter(getLastFilter())
                .done(function (buttonId) {
                    if (buttonId === Dialogs.DIALOG_BTN_OK) {
                        updatePicker();
                    }
                });
        });
        
        return $picker;
    }
    
    
    /**
     * Returns false if the given path matches any of the exclusion globs in the given filter. Returns true
     * if the path does not match any of the globs.
     * 
     * @param {!Array.<string>} compiledFilter  'Compiled' filter object as returned by compile()
     * @param {!string} fullPath
     */
    function filterPath(compiledFilter, fullPath) {
        var i;
        for (i = 0; i < compiledFilter.length; i++) {
            var glob = compiledFilter[i];

            if (globmatch(fullPath, glob)) {
                return false;
            }
        }
        return true;
    }
    
    
    exports.createFilterPicker = createFilterPicker;
    exports.commitPicker       = commitPicker;
    exports.getLastFilter      = getLastFilter;
    exports.editFilter = editFilter;
    exports.compile    = compile;
    exports.filterPath = filterPath;
});
