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
    
    var _                    = require("thirdparty/lodash"),
        ProjectManager       = require("project/ProjectManager"),
        DefaultDialogs       = require("widgets/DefaultDialogs"),
        Dialogs              = require("widgets/Dialogs"),
        DropdownButton       = require("widgets/DropdownButton").DropdownButton,
        Menus                = require("command/Menus"),
        PopUpManager         = require("widgets/PopUpManager"),
        StringUtils          = require("utils/StringUtils"),
        Strings              = require("strings"),
        PreferencesManager   = require("preferences/PreferencesManager"),
        ProjectsMenuTemplate = require("text!htmlContent/filters-menu.html");
    
    var _context      = null,
        _$pickerLabel = null;
    
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
     * @return {?Array.<string>}
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
    
    function _itemRenderer(filter) {
        // Format filter in condensed form
        if (filter.length > 2) {
            return filter.slice(0, 2).join(", ") + " " +
                   StringUtils.format(Strings.FILE_FILTER_CLIPPED_SUFFIX, filter.length - 2);
        } else {
            return filter.join(", ");
        }
    }
    
    function _updatePicker() {
        var filter = getLastFilter();
        if (filter && filter.patterns.length) {
            var label = filter.name || _itemRenderer(filter.patterns);
            _$pickerLabel.text(StringUtils.format(Strings.EXCLUDE_FILE_FILTER, label));
        } else {
            _$pickerLabel.text(Strings.NO_FILE_FILTER);
        }
    }
    
    /**
     * Sets the value of getLastFilter(). Automatically set when editFilter() is completed.
     * If no filter is passed in, then clear the last active filter index.
     *
     * @param {{name: string, patterns: Array.<string>}=} filter
     * @param {number=} index The index of the filter set in the MRU list or -1 if it is a new one
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
        
        _updatePicker();
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
    function editFilter(filter, context, index) {
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
            }
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
    
    /** @type {$.Element} jQuery elements used for the dropdown menu */
    var $dropdown,
        $dropdownItem;

    /**
     * Close the dropdown.
     */
    function closeDropdown() {
        // Since we passed "true" for autoRemove to addPopUp(), this will
        // automatically remove the dropdown from the DOM. Also, PopUpManager
        // will call cleanupDropdown().
        if ($dropdown) {
            PopUpManager.removePopUp($dropdown);
        }
    }

    /**
     * Remove the various event handlers that close the dropdown. This is called by the
     * PopUpManager when the dropdown is closed.
     */
    function cleanupDropdown() {
        $("html").off("click", closeDropdown);
        $dropdown = null;
    }

    /**
     * Check the list of items to see if any of them are hovered, and if so trigger a mouseenter.
     * Normally the mouseenter event handles this, but when a previous item is deleted and the next
     * item moves up to be underneath the mouse, we don't get a mouseenter event for that item.
     */
    function checkHovers(pageX, pageY) {
        $dropdown.children().each(function () {
            var offset = $(this).offset(),
                width  = $(this).outerWidth(),
                height = $(this).outerHeight();

            if (pageX >= offset.left && pageX <= offset.left + width &&
                    pageY >= offset.top && pageY <= offset.top + height) {
                $(".recent-filter-link", this).triggerHandler("mouseenter");
            }
        });
    }

    /**
     * Create the "delete" button that shows up when you hover over a filter set.
     */
    function renderDelete() {
        return $("<div id='recent-filter-delete' class='filter-trash-icon'>&times;</div>")
            .mouseup(function (e) {
                // Don't let the click bubble upward.
                e.stopPropagation();

                // Remove the filter set from the preferences and 
                // clear the active filter set index from view state.
                var filterSets        = PreferencesManager.get("fileFilters") || [],
                    activeFilter      = getLastFilter(),
                    activeFilterIndex = _getFilterIndex(filterSets, activeFilter),
                    filterIndex       = _getFilterIndex(filterSets, $(this).parent().data("filter"));
                
                filterSets.splice(filterIndex, 1);
                PreferencesManager.set("fileFilters", filterSets);
                
                if (activeFilterIndex === filterIndex) {
                    setLastFilter();
                } else if (activeFilterIndex > filterIndex) {
                    // Adjust the active filter index after the removal of a filter set before it.
                    setLastFilter(filterSets[--activeFilterIndex], activeFilterIndex);
                }

                $(this).closest("li").remove();
                checkHovers(e.pageX, e.pageY);
            });
    }

    /**
     * Create the "edit" button that shows up when you hover over a filter set.
     */
    function renderEdit() {
        return $("<span id='recent-filter-edit' class='filter-edit-icon'></span>")
            .mouseup(function (e) {
                var filter     = $(this).parent().data("filter"),
                    filterSets = PreferencesManager.get("fileFilters") || [];
                
                // Don't let the click bubble upward.
                e.stopPropagation();
                editFilter(filter, _context, _getFilterIndex(filterSets, filter));
            });
    }

    /**
     * Hide the delete and edit button.
     */
    function removeDeleteAndEditButtons() {
        $("#recent-filter-delete").remove();
        $("#recent-filter-edit").remove();
    }

    /**
     * Show the delete and edit buttons over a given target.
     * @param {!jQueryObject} $target the dropdown menu item for delete and edit buttons
     */
    function addDeleteAndEditButtons($target) {
        removeDeleteAndEditButtons();
        renderDelete()
            .css("top", $target.position().top + 6)
            .prependTo($target);
        renderEdit()
            .appendTo($target);
    }

    /**
     * Adds the click and mouse enter/leave events to the dropdown
     */
    function _handleListEvents() {
        $dropdown
            .on("click", "a", function () {
                var $link      = $(this),
                    id         = $link.attr("id"),
                    filter     = $link.data("filter"),
                    filterSets = PreferencesManager.get("fileFilters") || [];

                if (filter) {
                    setLastFilter(filter, _getFilterIndex(filterSets, filter));
                    closeDropdown();
                } else if (id === "new-filter-link") {
                    editFilter({ name: "", patterns: [] }, _context, -1);
                } else if (id === "remove-filter-link") {
                    setLastFilter();
                }
            })
            .on("mouseenter", "a", function () {
                if ($dropdownItem) {
                    $dropdownItem.removeClass("selected");
                }
                $dropdownItem = $(this).addClass("selected");

                if ($dropdownItem.hasClass("recent-filter-link")) {
                    // Note: we can't depend on the event here because this can be triggered
                    // manually from checkHovers().
                    addDeleteAndEditButtons($(this));
                }
            })
            .on("mouseleave", "a", function () {
                var $link = $(this).removeClass("selected");

                if ($link.get(0) === $dropdownItem.get(0)) {
                    $dropdownItem = null;
                }
                if ($link.hasClass("recent-filter-link")) {
                    removeDeleteAndEditButtons();
                }
            });
    }

    /**
     * Create the list of filter sets in the dropdown menu.
     * @return {string} The html content
     */
    function renderList() {
        var templateVars   = {
                filterList : [],
                Strings    : Strings
            },
            filterSets = PreferencesManager.get("fileFilters") || [];

        filterSets.forEach(function (filter) {
            var condensedPatterns = _itemRenderer(filter.patterns),
                menuItem = {
                    filter: JSON.stringify(filter),
                    name  : filter.name || condensedPatterns,
                    rest  : filter.name ? " - " + condensedPatterns : ""
                };
            
            templateVars.filterList.push(menuItem);
        });

        return Mustache.render(ProjectsMenuTemplate, templateVars);
    }

    /**
     * Show or hide the recent projects dropdown.
     *
     * @param {{pageX:number, pageY:number}} position - the absolute position where to open the dropdown
     */
    function showDropdown(position) {
        // If the dropdown is already visible, just return (so the root 
        // click handler on htmlwill close it).
        if ($dropdown) {
            return;
        }

        Menus.closeAll();

        $dropdown = $(renderList())
            .css({
                // Use the relatrive coordinate of the toggle button for "left" since 
                // the dropdown menu is appended to the Find Bar and not to the document.
                left: $("#filter-dropdown-toggle").position().left + 10,
                top: position.pageY + 1
            })
            .appendTo($("#find-group"));    // Append to Find Bar

//        $dropdown.css("left", $dropdown.position().left - $dropdown.width() + $("#filter-dropdown-toggle").innerWidth());
        PopUpManager.addPopUp($dropdown, cleanupDropdown, true);

        // TODO: should use capture, otherwise clicking on the menus doesn't close it. More fallout
        // from the fact that we can't use the Boostrap (1.4) dropdowns.
        $("html").on("click", closeDropdown);

        _handleListEvents();
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
        var $picker = $("<div id='filter-dropdown-toggle' class='btn'>" +
                        "<span id='filter-title' class='title'></span>" +
                        "<span class='filter-dropdown-arrow'></span></div>");
            
        _context = context;
        _$pickerLabel = $picker.find("#filter-title");
        _updatePicker();
        
        return $picker;
    }
    
    /**
     * 
     */
    function attachPickerToDropdown() {
        var cmenuAdapter = {
            open: showDropdown,
            close: closeDropdown,
            isOpen: function () {
                return !!$dropdown;
            }
        };
        Menus.ContextMenu.assignContextMenuToSelector("#filter-dropdown-toggle", cmenuAdapter);
    }
    
    exports.createFilterPicker     = createFilterPicker;
    exports.commitPicker           = commitPicker;
    exports.getLastFilter          = getLastFilter;
    exports.editFilter             = editFilter;
    exports.compile                = compile;
    exports.filterPath             = filterPath;
    exports.filterFileList         = filterFileList;
    exports.attachPickerToDropdown = attachPickerToDropdown;
});
