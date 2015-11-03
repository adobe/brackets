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

/*global define, $, window, Mustache */

/*
 * Panel showing search results for a Find/Replace in Files operation.
 */
define(function (require, exports, module) {
    "use strict";

    var CommandManager        = require("command/CommandManager"),
        EventDispatcher       = require("utils/EventDispatcher"),
        Commands              = require("command/Commands"),
        DocumentManager       = require("document/DocumentManager"),
        EditorManager         = require("editor/EditorManager"),
        ProjectManager        = require("project/ProjectManager"),
        FileViewController    = require("project/FileViewController"),
        FileUtils             = require("file/FileUtils"),
        FindUtils             = require("search/FindUtils"),
        WorkspaceManager      = require("view/WorkspaceManager"),
        StringUtils           = require("utils/StringUtils"),
        Strings               = require("strings"),
        HealthLogger          = require("utils/HealthLogger"),
        _                     = require("thirdparty/lodash"),

        searchPanelTemplate   = require("text!htmlContent/search-panel.html"),
        searchResultsTemplate = require("text!htmlContent/search-results.html"),
        searchSummaryTemplate = require("text!htmlContent/search-summary.html");


    /** 
     * @const 
     * The maximum results to show per page.
     * @type {number}
     */
    var RESULTS_PER_PAGE = 100;
    
    /**
     * @const
     * Debounce time for document changes updating the search results view.
     * @type {number}
     */
    var UPDATE_TIMEOUT   = 400;
    
    /**
     * @constructor
     * Handles the search results panel.
     * Dispatches the following events:
     *      replaceAll - when the "Replace" button is clicked.
     *      close - when the panel is closed.
     *
     * @param {SearchModel} model The model that this view is showing.
     * @param {string} panelID The CSS ID to use for the panel.
     * @param {string} panelName The name to use for the panel, as passed to PanelManager.createBottomPanel().
     */
    function SearchResultsView(model, panelID, panelName) {
        var panelHtml  = Mustache.render(searchPanelTemplate, {panelID: panelID});

        this._panel    = WorkspaceManager.createBottomPanel(panelName, $(panelHtml), 100);
        this._$summary = this._panel.$panel.find(".title");
        this._$table   = this._panel.$panel.find(".table-container");
        this._model    = model;
    }
    EventDispatcher.makeEventDispatcher(SearchResultsView.prototype);
    
    /** @type {SearchModel} The search results model we're viewing. */
    SearchResultsView.prototype._model = null;
    
    /**
     * Array with content used in the Results Panel
     * @type {Array.<{fileIndex: number, filename: string, fullPath: string, items: Array.<Object>}>}
     */
    SearchResultsView.prototype._searchList = [];
    
    /** @type {Panel} Bottom panel holding the search results */
    SearchResultsView.prototype._panel = null;
    
    /** @type {?string} The full path of the file that was open in the main editor on the initial search */
    SearchResultsView.prototype._initialFilePath = null;
    
    /** @type {number} The index of the first result that is displayed */
    SearchResultsView.prototype._currentStart = 0;
        
    /** @type {boolean} Used to remake the replace all summary after it is changed */
    SearchResultsView.prototype._allChecked = false;
    
    /** @type {$.Element} The currently selected row */
    SearchResultsView.prototype._$selectedRow = null;
    
    /** @type {$.Element} The element where the title is placed */
    SearchResultsView.prototype._$summary = null;
    
    /** @type {$.Element} The table that holds the results */
    SearchResultsView.prototype._$table = null;
    
    /** @type {number} The ID we use for timeouts when handling model changes. */
    SearchResultsView.prototype._timeoutID = null;
        
    /**
     * @private
     * Handles when model changes. Updates the view, buffering changes if necessary so as not to churn too much.
     */
    SearchResultsView.prototype._handleModelChange = function (quickChange) {
        // If this is a replace, to avoid complications with updating, just close ourselves if we hear about
        // a results model change after we've already shown the results initially.
        // TODO: notify user, re-do search in file
        if (this._model.isReplace) {
            this.close();
            return;
        }
        
        var self = this;
        if (this._timeoutID) {
            window.clearTimeout(this._timeoutID);
        }
        if (quickChange) {
            this._timeoutID = window.setTimeout(function () {
                self._updateResults();
                self._timeoutID = null;
            }, UPDATE_TIMEOUT);
        } else {
            this._updateResults();
        }
    };
    
    /**
     * @private
     * Adds the listeners for close, prev, next, first, last and check all
     */
    SearchResultsView.prototype._addPanelListeners = function () {
        var self = this;
        this._panel.$panel
            .off(".searchResults")  // Remove the old events
            .on("click.searchResults", ".close", function () {
                self.close();
            })
            // The link to go the first page
            .on("click.searchResults", ".first-page:not(.disabled)", function () {
                self._currentStart = 0;
                self._render();
                HealthLogger.searchDone(HealthLogger.SEARCH_FIRST_PAGE);
            })
            // The link to go the previous page
            .on("click.searchResults", ".prev-page:not(.disabled)", function () {
                self._currentStart -= RESULTS_PER_PAGE;
                self._render();
                HealthLogger.searchDone(HealthLogger.SEARCH_PREV_PAGE);
            })
            // The link to go to the next page
            .on("click.searchResults", ".next-page:not(.disabled)", function () {
                self.trigger('getNextPage');
                HealthLogger.searchDone(HealthLogger.SEARCH_NEXT_PAGE);
            })
            // The link to go to the last page
            .on("click.searchResults", ".last-page:not(.disabled)", function () {
                self.trigger('getLastPage');
                HealthLogger.searchDone(HealthLogger.SEARCH_LAST_PAGE);
            })
            
            // Add the file to the working set on double click
            .on("dblclick.searchResults", ".table-container tr:not(.file-section)", function (e) {
                var item = self._searchList[$(this).data("file-index")];
                FileViewController.openFileAndAddToWorkingSet(item.fullPath);
            })
        
            // Add the click event listener directly on the table parent
            .on("click.searchResults .table-container", function (e) {
                var $row = $(e.target).closest("tr");

                if ($row.length) {
                    if (self._$selectedRow) {
                        self._$selectedRow.removeClass("selected");
                    }
                    $row.addClass("selected");
                    self._$selectedRow = $row;

                    var searchItem = self._searchList[$row.data("file-index")],
                        fullPath   = searchItem.fullPath;

                    // This is a file title row, expand/collapse on click
                    if ($row.hasClass("file-section")) {
                        var $titleRows,
                            collapsed = !self._model.results[fullPath].collapsed;

                        if (e.metaKey || e.ctrlKey) { //Expand all / Collapse all
                            $titleRows = $(e.target).closest("table").find(".file-section");
                        } else {
                            // Clicking the file section header collapses/expands result rows for that file
                            $titleRows = $row;
                        }

                        $titleRows.each(function () {
                            fullPath   = self._searchList[$(this).data("file-index")].fullPath;
                            searchItem = self._model.results[fullPath];

                            if (searchItem.collapsed !== collapsed) {
                                searchItem.collapsed = collapsed;
                                $(this).nextUntil(".file-section").toggle();
                                $(this).find(".disclosure-triangle").toggleClass("expanded");
                            }
                        });

                        //In Expand/Collapse all, reset all search results 'collapsed' flag to same value(true/false).
                        if (e.metaKey || e.ctrlKey) {
                            FindUtils.setCollapseResults(collapsed);
                            _.forEach(self._model.results, function (item) {
                                item.collapsed = collapsed;
                            });
                        }
                    
                    // This is a file row, show the result on click
                    } else {
                        // Grab the required item data
                        var item = searchItem.items[$row.data("item-index")];

                        CommandManager.execute(Commands.FILE_OPEN, {fullPath: fullPath})
                            .done(function (doc) {
                                // Opened document is now the current main editor
                                EditorManager.getCurrentFullEditor().setSelection(item.start, item.end, true);
                            });
                    }
                }
            });
        
        function updateHeaderCheckbox($checkAll) {
            var $allFileRows     = self._panel.$panel.find(".file-section"),
                $checkedFileRows = $allFileRows.filter(function (index) {
                    return $(this).find(".check-one-file").is(":checked");
                });
            if ($checkedFileRows.length === $allFileRows.length) {
                $checkAll.prop("checked", true);
            }
        }
        
        function updateFileAndHeaderCheckboxes($clickedRow, isChecked) {
            var $firstMatch = ($clickedRow.data("item-index") === 0) ? $clickedRow :
                    $clickedRow.prevUntil(".file-section").last(),
                $fileRow = $firstMatch.prev(),
                $siblingRows = $fileRow.nextUntil(".file-section"),
                $fileCheckbox = $fileRow.find(".check-one-file"),
                $checkAll = self._panel.$panel.find(".check-all");
        
            if (isChecked) {
                if (!$fileCheckbox.is(":checked")) {
                    var $checkedSibilings = $siblingRows.filter(function (index) {
                            return $(this).find(".check-one").is(":checked");
                        });
                    if ($checkedSibilings.length === $siblingRows.length) {
                        $fileCheckbox.prop("checked", true);
                        if (!$checkAll.is(":checked")) {
                            updateHeaderCheckbox($checkAll);
                        }
                    }
                }
            } else {
                if ($checkAll.is(":checked")) {
                    $checkAll.prop("checked", false);
                }
                if ($fileCheckbox.is(":checked")) {
                    $fileCheckbox.prop("checked", false);
                }
            }
        }
        
        // Add the Click handlers for replace functionality if required
        if (this._model.isReplace) {
            this._panel.$panel
                .on("click.searchResults", ".check-all", function (e) {
                    var isChecked = $(this).is(":checked");
                    _.forEach(self._model.results, function (results) {
                        results.matches.forEach(function (match) {
                            match.isChecked = isChecked;
                        });
                    });
                    self._$table.find(".check-one").prop("checked", isChecked);
                    self._$table.find(".check-one-file").prop("checked", isChecked);
                    self._allChecked = isChecked;
                })
                .on("click.searchResults", ".check-one-file", function (e) {
                    var isChecked = $(this).is(":checked"),
                        $row = $(e.target).closest("tr"),
                        item = self._searchList[$row.data("file-index")],
                        $matchRows = $row.nextUntil(".file-section"),
                        $checkAll = self._panel.$panel.find(".check-all");
                    
                    if (item) {
                        self._model.results[item.fullPath].matches.forEach(function (match) {
                            match.isChecked = isChecked;
                        });
                    }
                    $matchRows.find(".check-one").prop("checked", isChecked);
                    if (!isChecked) {
                        if ($checkAll.is(":checked")) {
                            $checkAll.prop("checked", false);
                        }
                    } else if (!$checkAll.is(":checked")) {
                        updateHeaderCheckbox($checkAll);
                    }
                    e.stopPropagation();
                })
                .on("click.searchResults", ".check-one", function (e) {
                    var $row = $(e.target).closest("tr"),
                        item = self._searchList[$row.data("file-index")],
                        match = self._model.results[item.fullPath].matches[$row.data("match-index")];

                    match.isChecked = $(this).is(":checked");
                    updateFileAndHeaderCheckboxes($row, match.isChecked);
                    e.stopPropagation();
                })
                .on("click.searchResults", ".replace-checked", function (e) {
                    self.trigger("replaceAll");
                });
        }
    };
    
    
    /**
     * @private
     * Shows the Results Summary
     */
    SearchResultsView.prototype._showSummary = function () {
        var count     = this._model.countFilesMatches(),
            lastIndex = this._getLastIndex(count.matches),
            filesStr,
            summary;
        
        filesStr = StringUtils.format(
            Strings.FIND_NUM_FILES,
            count.files,
            (count.files > 1 ? Strings.FIND_IN_FILES_FILES : Strings.FIND_IN_FILES_FILE)
        );
        
        // This text contains some formatting, so all the strings are assumed to be already escaped
        summary = StringUtils.format(
            Strings.FIND_TITLE_SUMMARY,
            this._model.exceedsMaximum ? Strings.FIND_IN_FILES_MORE_THAN : "",
            String(count.matches),
            (count.matches > 1) ? Strings.FIND_IN_FILES_MATCHES : Strings.FIND_IN_FILES_MATCH,
            filesStr
        );

        this._$summary.html(Mustache.render(searchSummaryTemplate, {
            query:       (this._model.queryInfo && this._model.queryInfo.query && this._model.queryInfo.query.toString()) || "",
            replaceWith: this._model.replaceText,
            titleLabel:  this._model.isReplace ? Strings.FIND_REPLACE_TITLE_LABEL : Strings.FIND_TITLE_LABEL,
            scope:       this._model.scope ? "&nbsp;" + FindUtils.labelForScope(this._model.scope) + "&nbsp;" : "",
            summary:     summary,
            allChecked:  this._allChecked,
            hasPages:    count.matches > RESULTS_PER_PAGE,
            results:     StringUtils.format(Strings.FIND_IN_FILES_PAGING, this._currentStart + 1, lastIndex),
            hasPrev:     this._currentStart > 0,
            hasNext:     lastIndex < count.matches,
            replace:     this._model.isReplace,
            Strings:     Strings
        }));
    };
    
    /**
     * @private
     * Shows the current set of results.
     */
    SearchResultsView.prototype._render = function () {
        var searchItems, match, i, item, multiLine,
            count            = this._model.countFilesMatches(),
            searchFiles      = this._model.prioritizeOpenFile(this._initialFilePath),
            lastIndex        = this._getLastIndex(count.matches),
            matchesCounter   = 0,
            showMatches      = false,
            allInFileChecked = true,
            self             = this;
        
        this._showSummary();
        this._searchList = [];
        
        // Iterates throuh the files to display the results sorted by filenamess. The loop ends as soon as
        // we filled the results for one page
        searchFiles.some(function (fullPath) {
            showMatches = true;
            item = self._model.results[fullPath];

            // Since the amount of matches on this item plus the amount of matches we skipped until
            // now is still smaller than the first match that we want to display, skip these.
            if (matchesCounter + item.matches.length < self._currentStart) {
                matchesCounter += item.matches.length;
                showMatches = false;

            // If we still haven't skipped enough items to get to the first match, but adding the
            // item matches to the skipped ones is greater the the first match we want to display,
            // then we can display the matches from this item skipping the first ones
            } else if (matchesCounter < self._currentStart) {
                i = self._currentStart - matchesCounter;
                matchesCounter = self._currentStart;

            // If we already skipped enough matches to get to the first match to display, we can start
            // displaying from the first match of this item
            } else if (matchesCounter < lastIndex) {
                i = 0;

            // We can't display more items by now. Break the loop
            } else {
                return true;
            }

            if (showMatches && i < item.matches.length) {
                // Add a row for each match in the file
                searchItems = [];

                allInFileChecked = true;
                // Add matches until we get to the last match of this item, or filling the page
                while (i < item.matches.length && matchesCounter < lastIndex) {
                    match     = item.matches[i];
                    multiLine = match.start.line !== match.end.line;
                    
                    searchItems.push({
                        fileIndex:   self._searchList.length,
                        itemIndex:   searchItems.length,
                        matchIndex:  i,
                        line:        match.start.line + 1,
                        pre:         match.line.substr(0, match.start.ch - match.highlightOffset),
                        highlight:   match.line.substring(match.start.ch - match.highlightOffset, multiLine ? undefined : match.end.ch - match.highlightOffset),
                        post:        multiLine ? "\u2026" : match.line.substr(match.end.ch - match.highlightOffset),
                        start:       match.start,
                        end:         match.end,
                        isChecked:   match.isChecked,
                        isCollapsed: item.collapsed
                    });
                    if (!match.isChecked) {
                        allInFileChecked = false;
                    }
                    matchesCounter++;
                    i++;
                }

                // Add a row for each file
                var relativePath    = FileUtils.getDirectoryPath(ProjectManager.makeProjectRelativeIfPossible(fullPath)),
                    directoryPath   = FileUtils.getDirectoryPath(relativePath),
                    displayFileName = StringUtils.format(
                        Strings.FIND_IN_FILES_FILE_PATH,
                        StringUtils.breakableUrl(FileUtils.getBaseName(fullPath)),
                        StringUtils.breakableUrl(directoryPath),
                        directoryPath ? "&mdash;" : ""
                    );

                self._searchList.push({
                    fileIndex:   self._searchList.length,
                    filename:    displayFileName,
                    fullPath:    fullPath,
                    isChecked:   allInFileChecked,
                    items:       searchItems,
                    isCollapsed: item.collapsed
                });
            }
        });

        
        // Insert the search results
        this._$table
            .empty()
            .append(Mustache.render(searchResultsTemplate, {
                replace:       this._model.isReplace,
                searchList:    this._searchList,
                Strings:       Strings
            }));
        
        if (this._$selectedRow) {
            this._$selectedRow.removeClass("selected");
            this._$selectedRow = null;
        }
        
        this._panel.show();
        this._$table.scrollTop(0); // Otherwise scroll pos from previous contents is remembered
    };
    
    /**
     * Updates the results view after a model change, preserving scroll position and selection.
     */
    SearchResultsView.prototype._updateResults = function () {
        // In general this shouldn't get called if the panel is closed, but in case some
        // asynchronous process kicks this (e.g. a debounced model change), we double-check.
        if (this._panel.isVisible()) {
            var scrollTop  = this._$table.scrollTop(),
                index      = this._$selectedRow ? this._$selectedRow.index() : null,
                numMatches = this._model.countFilesMatches().matches;

            if (this._currentStart > numMatches) {
                this._currentStart = this._getLastCurrentStart(numMatches);
            }
            
            this._render();

            this._$table.scrollTop(scrollTop);
            if (index) {
                this._$selectedRow = this._$table.find("tr:eq(" + index + ")");
                this._$selectedRow.addClass("selected");
            }
        }
    };
        
    /**
     * @private
     * Returns one past the last result index displayed for the current page.
     * @param {number} numMatches
     * @return {number}
     */
    SearchResultsView.prototype._getLastIndex = function (numMatches) {
        return Math.min(this._currentStart + RESULTS_PER_PAGE, numMatches);
    };
    
    /**
     * Shows the next page of the resultrs view if possible
     */
    SearchResultsView.prototype.showNextPage = function () {
        this._currentStart += RESULTS_PER_PAGE;
        this._render();
    };

    /**
     * Shows the last page of the results view.
     */
    SearchResultsView.prototype.showLastPage = function () {
        this._currentStart = this._getLastCurrentStart();
        this._render();
    };

    /**
     * @private
     * Returns the last possible current start based on the given number of matches
     * @param {number=} numMatches
     * @return {number}
     */
    SearchResultsView.prototype._getLastCurrentStart = function (numMatches) {
        numMatches = numMatches || this._model.countFilesMatches().matches;
        return Math.floor((numMatches - 1) / RESULTS_PER_PAGE) * RESULTS_PER_PAGE;
    };
    
    /**
     * Opens the results panel and displays the current set of results from the model.
     */
    SearchResultsView.prototype.open = function () {
        // Clear out any paging/selection state.
        this._currentStart  = 0;
        this._$selectedRow  = null;
        this._allChecked    = true;
        
        // Save the currently open document's fullpath, if any, so we can sort it to the top of the result list.
        var currentDoc = DocumentManager.getCurrentDocument();
        this._initialFilePath = currentDoc ? currentDoc.file.fullPath : null;

        this._render();
        
        // Listen for user interaction events with the panel and change events from the model.
        this._addPanelListeners();
        this._model.on("change.SearchResultsView", this._handleModelChange.bind(this));
    };
    
    /**
     * Hides the Search Results Panel and unregisters listeners.
     */
    SearchResultsView.prototype.close = function () {
        if (this._panel && this._panel.isVisible()) {
            this._$table.empty();
            this._panel.hide();
            this._panel.$panel.off(".searchResults");
            this._model.off("change.SearchResultsView");
            this.trigger("close");
        }
    };
    
    // Public API
    exports.SearchResultsView = SearchResultsView;
});
