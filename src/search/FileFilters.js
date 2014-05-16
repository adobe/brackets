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
/*global define, $, brackets, window, Mustache */

/**
 * Utilities for managing file-set filters, as used in Find in Files.
 * Includes both UI for selecting/editing filters, as well as the actual file-filtering implementation.
 */
define(function (require, exports, module) {
    "use strict";
    
    var _                  = require("thirdparty/lodash"),
        ProjectManager     = require("project/ProjectManager"),
        DefaultDialogs     = require("widgets/DefaultDialogs"),
        Dialogs            = require("widgets/Dialogs"),
        DropdownButton     = require("widgets/DropdownButton").DropdownButton,
        StringUtils        = require("utils/StringUtils"),
        Strings            = require("strings"),
        PreferencesManager = require("preferences/PreferencesManager");
  
    var FIRST_FILTER_INDEX = 3;
    var _context = null,
        _picker  = null;
    
    /**
     * Populate the list of dropdown menu with two filter commands and
     * the list of saved filter sets.
     */
    function _doPopulate() {
        var dropdownItems = [Strings.NEW_FILE_FILTER, Strings.CLEAR_FILE_FILTER],
            filterSets = PreferencesManager.get("fileFilters") || [];

        if (filterSets.length) {
            dropdownItems.push("---");
            dropdownItems = dropdownItems.concat(filterSets);
        }
        _picker.items = dropdownItems;
    }
    
    /**
     * Find the index of a filter set in the list of saved filter sets.
     * @param {Array.<{name: string, patterns: Array.<string>}>} filterSets
     * @param {{name: string, patterns: Array.<string>}} filter
     */
    function _getFilterIndex(filterSets, filter) {
        var index = -1,
            found = false;
        
        if (!filter || !filterSets.length) {
            return index;
        }
        
        filterSets.forEach(function (curFilter, curIndex) {
            if (!found && _.isEqual(curFilter, filter)) {
                index = curIndex;
                found = true;
            }
        });
        
        return index;
    }
    
    /**
     * A search filter is an array of one or more glob strings. The filter must be 'compiled' via compile()
     * before passing to filterPath()/filterFileList().
     * @return {?{name: string, patterns: Array.<string>}}
     */
    function getLastFilter() {
        var filterSets        = PreferencesManager.get("fileFilters") || [],
            activeFilterIndex = PreferencesManager.getViewState("activeFileFilter"),
            oldFilter         = PreferencesManager.getViewState("search.exclusions") || [],
            activeFilter      = null;

        if (activeFilterIndex === undefined && oldFilter.length) {
            activeFilter = { name: "", patterns: oldFilter };
            activeFilterIndex = _getFilterIndex(filterSets, activeFilter);
            
            // Migrate the old filter into the new filter storage
            if (activeFilterIndex === -1) {
                activeFilterIndex = filterSets.length;
                filterSets.push(activeFilter);
                PreferencesManager.set("fileFilters", filterSets);
            }
            PreferencesManager.setViewState("activeFileFilter", activeFilterIndex);
        } else if (activeFilterIndex > -1 && activeFilterIndex < filterSets.length) {
            activeFilter = filterSets[activeFilterIndex];
        }
        
        return activeFilter;
    }
    
    /**
     * Get the condensed form of the filter set by joining the first two in the set with
     * a comma separator and appending a short message with the number of filters being clipped.
     */
    function _getCondensedForm(filter) {
        // Format filter in condensed form
        if (filter.length > 2) {
            return filter.slice(0, 2).join(", ") + " " +
                   StringUtils.format(Strings.FILE_FILTER_CLIPPED_SUFFIX, filter.length - 2);
        } else {
            return filter.join(", ");
        }
    }
    
    /**
     * Update the picker button label with the name/patterns of the selected filter or 
     * No Files Excluded if no filter is selected.
     */
    function _updatePicker() {
        var filter = getLastFilter();
        if (filter && filter.patterns.length) {
            var label = filter.name || _getCondensedForm(filter.patterns);
            _picker.$button.text(StringUtils.format(Strings.EXCLUDE_FILE_FILTER, label));
        } else {
            _picker.$button.text(Strings.NO_FILE_FILTER);
        }
    }
    
    /**
     * Sets and save the index of the active filter. Automatically set when editFilter() is completed.
     * If no filter is passed in, then clear the last active filter index by setting it to -1.
     *
     * @param {{name: string, patterns: Array.<string>}=} filter
     * @param {number=} index The index of the filter set in the list of saved filter sets or -1 if it is a new one
     */
    function setLastFilter(filter, index) {
        var filterSets = PreferencesManager.get("fileFilters") || [];
        
        if (filter) {
            if (index === -1) {
                // Add a new filter set
                index = filterSets.length;
                filterSets.push(filter);
            } else if (index > -1 && index < filterSets.length) {
                // Update an existing filter set only if the filter set has some changes
                if (!_.isEqual(filterSets[index], filter)) {
                    filterSets[index] = filter;
                }
            } else {
                // Should not have been called with an invalid index to the available filter sets.
                console.log("setLastFilter is called with an invalid index: " + index);
                return;
            }

            PreferencesManager.set("fileFilters", filterSets);
            PreferencesManager.setViewState("activeFileFilter", index);
        } else {
            // Explicitly set to -1 to remove the active file filter
            PreferencesManager.setViewState("activeFileFilter", -1);
        }
    }
    
    
    /**
     * Converts a user-specified filter object (as chosen in picker or retrieved from getFilters()) to a 'compiled' form
     * that can be used with filterPath()/filterFileList().
     * @param {!Array.<string>} userFilter
     * @return {!string} 'compiled' filter that can be passed to filterPath()/filterFileList().
     */
    function compile(userFilter) {
        // Automatically apply ** prefix/suffix to make writing simple substring-match filters more intuitive
        var wrappedGlobs = userFilter.map(function (glob) {
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
        
        // Convert to regular expression for fast matching
        var regexStrings = wrappedGlobs.map(function (glob) {
            var reStr = "", i;
            for (i = 0; i < glob.length; i++) {
                var ch = glob[i];
                if (ch === "*") {
                    // Check for `**`
                    if (glob[i + 1] === "*") {
                        // Special case: `/**/` can collapse - that is, it shouldn't require matching both slashes
                        if (glob[i + 2] === "/" && glob[i - 1] === "/") {
                            reStr += "(.*/)?";
                            i += 2; // skip 2nd * and / after it
                        } else {
                            reStr += ".*";
                            i++;    // skip 2nd *
                        }
                    } else {
                        // Single `*`
                        reStr += "[^/]*";
                    }
                } else if (ch === "?") {
                    reStr += "[^/]";  // unlike '?' in regexp, in globs this requires exactly 1 char
                } else {
                    // Regular char with no special meaning
                    reStr += StringUtils.regexEscape(ch);
                }
            }
            return "^" + reStr + "$";
        });
        return regexStrings.join("|");
    }
    
    
    /**
     * Returns false if the given path matches any of the exclusion globs in the given filter. Returns true
     * if the path does not match any of the globs. If filtering many paths at once, use filterFileList()
     * for much better performance.
     * 
     * @param {?string} compiledFilter  'Compiled' filter object as returned by compile(), or null to no-op
     * @param {!string} fullPath
     * @return {boolean}
     */
    function filterPath(compiledFilter, fullPath) {
        if (!compiledFilter) {
            return true;
        }
        
        var re = new RegExp(compiledFilter);
        return !fullPath.match(re);
    }
    
    /**
     * Returns a copy of 'files' filtered to just those that don't match any of the exclusion globs in the filter.
     * 
     * @param {?string} compiledFilter  'Compiled' filter object as returned by compile(), or null to no-op
     * @param {!Array.<File>} files
     * @return {!Array.<File>}
     */
    function filterFileList(compiledFilter, files) {
        if (!compiledFilter) {
            return files;
        }
        
        var re = new RegExp(compiledFilter);
        return files.filter(function (f) {
            return !f.fullPath.match(re);
        });
    }
    
    
    /**
     * Opens a dialog box to edit the given filter. When editing is finished, the value of getLastFilter() changes to
     * reflect the edits. If the dialog was canceled, the preference is left unchanged.
     * @param {!{name: string, patterns: Array.<string>}} filter
     * @param {?{label:string, promise:$.Promise}} context Info on which files the filter will be applied to. If specified,
     *          editing UI will indicate how many files are excluded by the filter. Label should be of the form "in ..."
     * @param {number} index The index of the filter set to be edited or created. The value is -1 if it is for a new one 
     *          to be created, 
     * @return {!$.Promise} Dialog box promise
     */
    function editFilter(filter, context, index) {
        var lastFocus = window.document.activeElement;
        
        var html = StringUtils.format(Strings.FILE_FILTER_INSTRUCTIONS, brackets.config.glob_help_url) +
            "<input type='text' class='exclusions-name' placeholder='Name this exclusion set (optional)'>" +
            "<textarea class='exclusions-editor'></textarea><div class='exclusions-filecount'>" +
            Strings.FILTER_COUNTING_FILES + "</div>";
        var buttons = [
            { className : Dialogs.DIALOG_BTN_CLASS_NORMAL, id: Dialogs.DIALOG_BTN_CANCEL, text: Strings.CANCEL },
            { className : Dialogs.DIALOG_BTN_CLASS_PRIMARY, id: Dialogs.DIALOG_BTN_OK, text: Strings.OK }
        ];
        var dialog = Dialogs.showModalDialog(DefaultDialogs.DIALOG_ID_INFO, Strings.FILE_FILTER_DIALOG, html, buttons),
            $nameField = dialog.getElement().find(".exclusions-name"),
            $editField = dialog.getElement().find(".exclusions-editor");
        
        $nameField.val(filter.name).focus();
        $editField.val(filter.patterns.length ? filter.patterns.join("\n") : "");
        
        function getValue() {
            var newFilter = $editField.val().split("\n");

            // Remove blank lines
            return newFilter.filter(function (glob) {
                return glob.trim().length;
            });
        }
        
        dialog.done(function (buttonId) {
            if (buttonId === Dialogs.DIALOG_BTN_OK) {
                // Update saved filter preference
                setLastFilter({ name: $nameField.val(), patterns: getValue() }, index);
                _updatePicker();
                _doPopulate();
            }
            lastFocus.focus();  // restore focus to old po
        });
        
        // Code to update the file count readout at bottom of dialog (if context provided)
        var $fileCount = dialog.getElement().find(".exclusions-filecount");
        
        function updateFileCount() {
            context.promise.done(function (files) {
                var filter = getValue();
                if (filter.length) {
                    var filtered = filterFileList(compile(filter), files);
                    $fileCount.html(StringUtils.format(Strings.FILTER_FILE_COUNT, filtered.length, files.length, context.label));
                } else {
                    $fileCount.html(StringUtils.format(Strings.FILTER_FILE_COUNT_ALL, files.length, context.label));
                }
            });
        }
        
        if (context) {
            $editField.on("input", _.debounce(updateFileCount, 400));
            updateFileCount();
        } else {
            $fileCount.hide();
        }
        
        return dialog.getPromise();
    }
    
    
    /**
     * Marks the filter picker's currently selected item as most-recently used, and returns the corresponding
     * 'compiled' filter object ready for use with filterPath().
     * @param {!jQueryObject} picker UI returned from createFilterPicker()
     * @return {!string} 'compiled' filter that can be passed to filterPath()/filterFileList().
     */
    function commitPicker(picker) {
        var filter = getLastFilter();
        return (filter && filter.patterns.length) ? compile(filter.patterns) : "";
    }
    
    /**
     * Set up mouse click events for 'Delete' and 'Edit' buttons
     * when the dropdown is open.
     * @param {!Event>} event openDropdown event triggered when the dropdown is open
     * @param {!jQueryObject} $dropdown the jQuery DOM node of the dropdown list
     */
    function _handleListEvents(event, $dropdown) {

        function adjustSuccedingFilters(removedFilterIndex) {
            $dropdown.children().each(function () {
                var index = $(".stylesheet-link", this).data("index");
                if (index > removedFilterIndex) {
                    if (index === removedFilterIndex + 1) {
                        $(this).find("a").addClass("selected");
                    }
                    $(".stylesheet-link", this).data("index", index - 1);
                }
            });
        }
        
        $dropdown.find(".filter-trash-icon")
            .on("click", function (e) {
                // Remove the filter set from the preferences and 
                // clear the active filter set index from view state.
                var filterSets        = PreferencesManager.get("fileFilters") || [],
                    activeFilterIndex = PreferencesManager.getViewState("activeFileFilter"),
                    filterIndex       = $(this).parent().data("index") - FIRST_FILTER_INDEX;

                // Don't let the click bubble upward.
                e.stopPropagation();

                filterSets.splice(filterIndex, 1);
                PreferencesManager.set("fileFilters", filterSets);

                _doPopulate();
                
                // Explicitly remove the list item to refresh the dropdown menu
                $(this).closest("li").remove();
                
                if (filterSets.length === 0) {
                    $dropdown.find(".divider").remove();
                }

                if (activeFilterIndex === filterIndex) {
                    // Removing the active filter, so clear the active filter 
                    // both in the view state and the picker button label.
                    setLastFilter();
                } else if (activeFilterIndex > filterIndex) {
                    // Adjust the active filter index after the removal of a filter set before it.
                    setLastFilter(filterSets[--activeFilterIndex], activeFilterIndex);
                }

                // Also adjust the data-index of all filter sets in the dropdown that are after the deleted one
                adjustSuccedingFilters(filterIndex + FIRST_FILTER_INDEX);
                
                _updatePicker();
            });
        
        $dropdown.find(".filter-edit-icon")
            .on("click", function (e) {
                var filterSets        = PreferencesManager.get("fileFilters") || [],
                    filterIndex       = $(this).parent().data("index") - FIRST_FILTER_INDEX;

                // Don't let the click bubble upward.
                e.stopPropagation();
                
                // Close the dropdown first before opening the edit filter dialog 
                // so that it will restore focus to the DOM element that has focus
                // prior to opening it.
                _picker.closeDropdown();
                
                editFilter(filterSets[filterIndex], _context, filterIndex);
            });
    }
                      
    /**
     * Creates a UI element for selecting a filter, populated with a list of recently used filters, an option to
     * edit the selected filter and another option to create a new filter. The client should call commitDropdown() 
     * when the UI containing the filter picker is confirmed (which updates the MRU order) and then use the 
     * returned filter object as needed.
     * 
     * @param {?{label:string, promise:$.Promise}} context Info on files filter will apply to - see editFilter()
     * @return {!jQueryObject} Picker UI. To retrieve the selected value, use commitPicker().
     */
    function createFilterPicker(context) {

        function itemRenderer(item, index) {
            if (index < FIRST_FILTER_INDEX) {
                // Prefix the two filter commands with 'recent-filter-name' so that
                // they also get the same margin-left as the actual filters.
                return "<span class='recent-filter-name'></span>" + _.escape(item);
            }
            
            var condensedPatterns = _getCondensedForm(item.patterns),
                menuItem = "<div class='filter-trash-icon'>&times;</div>" +
                           "<span class='recent-filter-name'>";
            
            menuItem += _.escape(item.name || condensedPatterns);
            menuItem += "</span><span class='recent-filter-patterns'>";
            menuItem += (item.name ? _.escape(" - " + condensedPatterns) : "");
            menuItem += "</span><span class='filter-edit-icon'></span>";
            
            return menuItem;
        }

        _context = context;
        _picker = new DropdownButton("", [], itemRenderer);
        _doPopulate();
        _updatePicker();
        
        // Add 'file-filter-picker' to keep some margin space on the left of the button
        _picker.$button.addClass("file-filter-picker no-focus");
        
        // Set up mouse click events for 'Delete' and 'Edit' buttons
        $(_picker).on("openDropdown", _handleListEvents);
        
        $(_picker).on("select", function (event, item, itemIndex) {
            if (itemIndex === 0) {
                // Close the dropdown first before opening the edit filter dialog 
                // so that it will restore focus to the DOM element that has focus
                // prior to opening it.
                _picker.closeDropdown();

                // Create a new filter set
                editFilter({ name: "", patterns: [] }, _context, -1);
            } else if (itemIndex === 1) {
                // Clear the active filter
                setLastFilter();
                _updatePicker();
            } else if (itemIndex >= FIRST_FILTER_INDEX && item) {
                var filterSets = PreferencesManager.get("fileFilters") || [];
                setLastFilter(item, itemIndex - FIRST_FILTER_INDEX);
                _updatePicker();
            }
        });
        
        return _picker.$button;
    }
    
    // For unit tests only
    exports.setLastFilter      = setLastFilter;

    exports.createFilterPicker = createFilterPicker;
    exports.commitPicker       = commitPicker;
    exports.getLastFilter      = getLastFilter;
    exports.editFilter         = editFilter;
    exports.compile            = compile;
    exports.filterPath         = filterPath;
    exports.filterFileList     = filterFileList;
});
