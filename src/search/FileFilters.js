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
/*global define, $, brackets, window */

/**
 * Utilities for managing file-set filters, as used in Find in Files.
 * Includes both UI for selecting/editing filters, as well as the actual file-filtering implementation.
 */
define(function (require, exports, module) {
    "use strict";
    
    var _                   = require("thirdparty/lodash"),
        ProjectManager      = require("project/ProjectManager"),
        DefaultDialogs      = require("widgets/DefaultDialogs"),
        Dialogs             = require("widgets/Dialogs"),
        DropdownButton      = require("widgets/DropdownButton").DropdownButton,
        StringUtils         = require("utils/StringUtils"),
        Strings             = require("strings"),
        PreferencesManager  = require("preferences/PreferencesManager");
    
    
    /**
     * A search filter is an array of one or more glob strings. The filter must be 'compiled' via compile()
     * before passing to filterPath()/filterFileList().
     * @return {!Array.<string>}
     */
    function getLastFilter() {
        return PreferencesManager.getViewState("search.exclusions") || [];
    }
    
    /**
     * Sets the value of getLastFilter(). Automatically set when editFilter() is completed.
     * @param {!Array.<string>} filter
     * @return {!Array.<string>}
     */
    function setLastFilter(filter) {
        PreferencesManager.setViewState("search.exclusions", filter);
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
     * @param {!Array.<string>} filter
     * @param {?{label:string, promise:$.Promise}} context Info on which files the filter will be applied to. If specified,
     *          editing UI will indicate how many files are excluded by the filter. Label should be of the form "in ..."
     * @return {!$.Promise} Dialog box promise
     */
    function editFilter(filter, context) {
        var lastFocus = window.document.activeElement;
        
        var html = StringUtils.format(Strings.FILE_FILTER_INSTRUCTIONS, brackets.config.glob_help_url) +
            "<textarea class='exclusions-editor'></textarea><div class='exclusions-filecount'>" + Strings.FILTER_COUNTING_FILES + "</div>";
        var buttons = [
            { className : Dialogs.DIALOG_BTN_CLASS_NORMAL, id: Dialogs.DIALOG_BTN_CANCEL, text: Strings.CANCEL },
            { className : Dialogs.DIALOG_BTN_CLASS_PRIMARY, id: Dialogs.DIALOG_BTN_OK, text: Strings.OK }
        ];
        var dialog = Dialogs.showModalDialog(DefaultDialogs.DIALOG_ID_INFO, Strings.FILE_FILTER_DIALOG, html, buttons);
        
        var $editField = dialog.getElement().find(".exclusions-editor");
        $editField.val(filter.join("\n")).focus();
        
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
                setLastFilter(getValue());
            }
            lastFocus.focus();  // restore focus to old pos
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
        return compile(filter);
    }
    
    /**
     * Creates a UI element for selecting a filter, populated with a list of recently used filters and an option to
     * edit the selected filter. The edit option is fully functional, but selecting any other item does nothing. The
     * client should call commitDropdown() when the UI containing the filter picker is confirmed (which updates the MRU
     * order) and then use the returned filter object as needed.
     * 
     * @param {?{label:string, promise:$.Promise}} context Info on files filter will apply to - see editFilter()
     * @return {!jQueryObject} Picker UI. To retrieve the selected value, use commitPicker().
     */
    function createFilterPicker(context) {
        var $picker = $("<div class='filter-picker'><span class='filter-label'></span><button class='btn no-focus'></button></div>"),
            $button = $picker.find("button");
        
        function joinBolded(segments) {
            return segments
                .map(function (seg) {
                    return "<strong>" + _.escape(seg) + "</strong>";
                })
                .join(", ");
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
            editFilter(getLastFilter(), context)
                .done(function (buttonId) {
                    if (buttonId === Dialogs.DIALOG_BTN_OK) {
                        updatePicker();
                    }
                });
        });
        
        return $picker;
    }
    
    
    exports.createFilterPicker  = createFilterPicker;
    exports.commitPicker        = commitPicker;
    exports.getLastFilter       = getLastFilter;
    exports.editFilter          = editFilter;
    exports.compile             = compile;
    exports.filterPath          = filterPath;
    exports.filterFileList      = filterFileList;
});
