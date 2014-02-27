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
    
    /** Max number of recently-used filters to store in preferences */
    var MAX_FILTER_HISTORY = 10;
    
    
    /**
     * Each filter is an array of one or more glob strings.
     * @return {!Array.<!Array.<string>>}
     */
    function getFilters() {
        return PreferencesManager.getViewState("search.exclusions") || [];
    }
    
    /** Moves a filter to the top of the MRU list */
    function markLastUsed(filter) {
        // Update MRU order
        // (unless this filter is empty - 'No filter' is always at top of dropdown, and can never fall off the MRU list)
        if (filter.length) {
            var filters = getFilters();
            var filterIndex = _.findIndex(filters, function (oldFilter) {
                return _.isEqual(oldFilter, filter);
            });
            if (filterIndex === -1) {
                // This filter wasn't in the MRU list before. Bump oldest item if necessary to make room for it.
                if (filters.length >= MAX_FILTER_HISTORY) {
                    filters.length = MAX_FILTER_HISTORY - 1;
                }
            } else {
                // Same exact filter was in the MRU list already. Remove from old spot so we can move it to the front.
                filters.splice(filterIndex, 1);
            }

            filters.unshift(filter);
            PreferencesManager.setViewState("search.exclusions", filters);
        }
        
        // Update last-used pref (-1 for "No filter", else MRU-list index - which will always be 0 due to above code)
        PreferencesManager.setViewState("search.exclusion.lastUsed", filter.length ? 0 : -1);
    }
    
    
    /**
     * Opens a dialog box to edit the given filter. When editing is finished, the newly modified filter is added to the top of
     * the MRU list; the original filter is left intact (unless it was pushed off the end of the MRU list). If no changes were
     * made or the dialog was canceled, the MRU list is unchanged.
     * 
     * @return {!$.Promise} Dialog box promise
     */
    function editFilter(filter) {
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
                
                // Add new filter to top of MRU list
                markLastUsed(newFilter);
            }
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
        var filter = picker.items[picker.selectedIndex];
        markLastUsed(filter);
        return compile(filter);
    }
    
    /**
     * Creates a UI element for selecting a filter, populated with a list of recently used filters and an option to
     * edit the selected filter. The edit option is fully functional, but selecting any other item does nothing. The
     * client should call commitDropdown() when the UI containing the filter picker is confirmed (which updates the MRU
     * order) and then use the returned filter object as needed.
     */
    function createFilterPicker() {
        var dropdownItems,
            picker;
        
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
            if (!filter) {
                return Strings.EDIT_FILE_FILTER;
            } else if (!filter.length) {
                return Strings.NO_FILE_FILTER;
            } else {
                // Normal filter object from the MRU list
                if (filter.length > 2) {
                    return Strings.FILE_FILTER_LIST_PREFIX + " " + joinBolded(filter.slice(0, 2)) + " " +
                           StringUtils.format(Strings.FILE_FILTER_CLIPPED_SUFFIX, filter.length - 2);
                } else {
                    return Strings.FILE_FILTER_LIST_PREFIX + " " + joinBolded(filter);
                }
            }
        }
        
        function setSelected(index) {
            // Store selection in an expando we stuff onto picker, so it's easily retrieved in commitPicker() later
            picker.selectedIndex = index;
            
            // Custom formatted button label
            picker.$button.html(itemRenderer(dropdownItems[picker.selectedIndex]));
            
            // Tooltip with full filter text (not clipped as in label)
            if (picker.selectedIndex > 0) {
                picker.$button.attr("title", Strings.FILE_FILTER_LIST_PREFIX + " " + dropdownItems[picker.selectedIndex].join(", "));
            } else {
                picker.$button.attr("title", "");
            }
        }
        
        function doPopulate() {
            dropdownItems = _.clone(getFilters());
            dropdownItems.unshift([]);  // 'No filter' item always at top
            dropdownItems.push(undefined);  // 'Edit filter' item always at bottom
            picker.items = dropdownItems;

            // Initialize selection (pref unset or -1 indicates 'No filter'; else specifies index in MRU list)
            var lastUsedFilterIndex = PreferencesManager.getViewState("search.exclusion.lastUsed");
            if (lastUsedFilterIndex === undefined || lastUsedFilterIndex === -1) {
                setSelected(0);
            } else {
                setSelected(lastUsedFilterIndex + 1);
            }
        }
        
        picker = new DropdownButton("", []);
        picker.itemRenderer = itemRenderer;
        picker.dropdownExtraClasses = "exclusions-dropdown";
        doPopulate();
        
        $(picker).on("select", function (event, item, itemIndex) {
            if (!item) {
                editFilter(dropdownItems[picker.selectedIndex])
                    .done(function (buttonId) {
                        if (buttonId === Dialogs.DIALOG_BTN_OK) {
                            // Update dropdownItems list - editFilter() changes MRU order
                            doPopulate();
                        }
                    });
            } else {
                setSelected(itemIndex);
            }
        });
        
        return picker;
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
    exports.getFilters = getFilters;
    exports.editFilter = editFilter;
    exports.compile    = compile;
    exports.filterPath = filterPath;
});
