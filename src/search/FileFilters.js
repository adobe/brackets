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
        
        // Update last-used pref (-1 for 'No filter", or MRU-list index - which will always be 0 due to above code)
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
        var globInfoURL = "https://github.com/adobe/brackets/wiki/How-to-Use-Brackets";  // FIXME: link to a dedicated wiki page
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
    
    
    /** Returns the selected DOM node's jQuery object given a <select> tag's jQuery object */
    function selectedOption($select) {
        return $($select[0].selectedOptions[0]);
    }

    /**
     * Marks the filter picker's currently selected item as most-recently used, and returns the corresponding
     * filter object for use with filterPath().
     */
    function commitDropdown($select) {
        var filter = selectedOption($select).data("filter");
        markLastUsed(filter);
        return filter;
    }
    
    /**
     * Turns the given <select> element into a filter picker: it is populated with a list of recently used filters
     * and an option to edit the selected filter. The edit option is automatically functional, but selecting any
     * other item does nothing; the client should call commitDropdown() when the UI containing the filter picker is
     * confirmed (which updates the MRU order) and then use the returned filter object as needed.
     */
    function populateDropdown($select) {
        var $lastSelected;
        
        function doPopulate() {
            $select.empty();

            function addOption(filter, label) {
                var $option = $("<option/>");
                $option.text(label);
                if (filter !== undefined) {
                    $option.data("filter", filter);
                }

                $select.append($option);
            }

            addOption([], Strings.NO_FILE_FILTER);

            getFilters().forEach(function (filter) {
                if (filter.length > 2) {
                    addOption(filter, Strings.FILE_FILTER_LIST_PREFIX + " " + filter[0] + ", " + filter[1] + " " +
                                      StringUtils.format(Strings.FILE_FILTER_CLIPPED_SUFFIX, filter.length - 2));
                } else {
                    addOption(filter, Strings.FILE_FILTER_LIST_PREFIX + " " + filter.join(", "));
                }
            });

            addOption(undefined, Strings.EDIT_FILE_FILTER);
            
            // Initialize selection
            var lastUsedFilterIndex = PreferencesManager.getViewState("search.exclusion.lastUsed");
            if (lastUsedFilterIndex === undefined) {  // index 0 is falsy, so must check more explicitly
                lastUsedFilterIndex = -1;
            }
            if (lastUsedFilterIndex !== -1) {  // -1 indicates 'No filter'; nothing to do in that case since it's always first in list
                $select[0].selectedIndex = lastUsedFilterIndex + 1;
            }
            $lastSelected = selectedOption($select);
        }
        
        doPopulate();
        
        $select.on("change", function () {
            var $selected = selectedOption($select);
            if ($selected.data("filter") === undefined) {
                editFilter($lastSelected.data("filter"))
                    .done(function (buttonId) {
                        if (buttonId === Dialogs.DIALOG_BTN_OK) {
                            // Update dropdown contents (also automatically reselects the edited filter, due to markLastUsed() call)
                            doPopulate();
                        } else {
                            // If canceled, just reselect what was selected before
                            $select[0].selectedIndex = $lastSelected.index();
                        }
                    });
            } else {
                $lastSelected = $selected;
            }
        });
    }
    
    
    /**
     * Returns false if the given path matches any of the exclusion globs in the given filter. Returns true
     * if the path does not match any of the globs.
     * 
     * @param {!Array.<string>} filter
     * @param {!string} fullPath
     */
    function filterPath(filter, fullPath) {
        var i;
        for (i = 0; i < filter.length; i++) {
            var glob = filter[i];

            if (globmatch(fullPath, glob)) {
                return false;
            }
        }
        return true;
    }
    
    
    exports.populateDropdown = populateDropdown;
    exports.commitDropdown   = commitDropdown;
    exports.getFilters = getFilters;
    exports.editFilter = editFilter;
    exports.filterPath = filterPath;
});
