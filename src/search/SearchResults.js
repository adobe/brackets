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

define(function (require, exports, module) {
    "use strict";
    
    var CommandManager        = require("command/CommandManager"),
        Commands              = require("command/Commands"),
        EditorManager         = require("editor/EditorManager"),
        ProjectManager        = require("project/ProjectManager"),
        FileViewController    = require("project/FileViewController"),
        FileUtils             = require("file/FileUtils"),
        PanelManager          = require("view/PanelManager"),
        StringUtils           = require("utils/StringUtils"),
        Strings               = require("strings"),
        _                     = require("thirdparty/lodash"),
        
        searchPanelTemplate   = require("text!htmlContent/search-panel.html"),
        searchResultsTemplate = require("text!htmlContent/search-results.html"),
        searchPagingTemplate  = require("text!htmlContent/search-summary-paging.html"),
        searchSummaryTemplate = require("text!htmlContent/search-summary.html");
    
    
    /** @const Constants used to define the maximum results show per page and found in a single file */
    var RESULTS_PER_PAGE = 100;
    
    
    
    /**
     * @constructor
     * Handles the Search Results and the Panel
     * Dispatches the following events:
     *      replaceAll - when the "Replace" button is clicked.
     */
    function SearchResults() {
        return undefined;
    }
    
    /**
     * Map of all the last search results
     * @type {Object.<fullPath: string, {matches: Array.<Object>, collapsed: boolean}>}
     */
    SearchResults.prototype._searchResults = {};
    
    /**
     * Array with content used in the Results Panel
     * @type {Array.<{file: number, filename: string, fullPath: string, items: Array.<Object>}>}
     */
    SearchResults.prototype._searchList = [];
    
    /** @type {Panel} Bottom panel holding the search results */
    SearchResults.prototype._panel = null;
    
    /** @type {?Entry} The File selected on the initial search */
    SearchResults.prototype._selectedEntry = null;
    
    /** @type {number} The index of the first result that is displayed */
    SearchResults.prototype._currentStart = 0;
    
    /** @type {boolean} Determines if this is in replace mode */
    SearchResults.prototype._replace = false;
    
    /** @type {boolean} Used to remake the replace all summary after it is changed */
    SearchResults.prototype._allChecked = false;
    
    /** @type {$.Element} The currently selected row */
    SearchResults.prototype._$selectedRow = null;
    
    /** @type {$.Element} The element where the title is placed */
    SearchResults.prototype._$summary = null;
    
    /** @type {$.Element} The table that holds the results */
    SearchResults.prototype._$table = null;
    
    
    /**
     * Creates the Bottom Panel using the given name
     * @param {string} panelID
     * @param {string} panelName
     */
    SearchResults.prototype.createPanel = function (panelID, panelName) {
        var panelHtml  = Mustache.render(searchPanelTemplate, {panelID: panelID});
        
        this._panel    = PanelManager.createBottomPanel(panelName, $(panelHtml), 100);
        this._$summary = this._panel.$panel.find(".title");
        this._$table   = this._panel.$panel.find(".table-container");
    };
    
    /**
     * @private
     * Adds the listeners for close, prev, next, first, last and check all
     */
    SearchResults.prototype._addPanelListeners = function () {
        var self = this;
        this._panel.$panel
            .off(".searchResults")  // Remove the old events
            .on("click.searchResults", ".close", function () {
                self.hideResults();
            })
            // The link to go the first page
            .on("click.searchResults", ".first-page:not(.disabled)", function () {
                self._currentStart = 0;
                self.showResults();
            })
            // The link to go the previous page
            .on("click.searchResults", ".prev-page:not(.disabled)", function () {
                self._currentStart -= RESULTS_PER_PAGE;
                self.showResults();
            })
            // The link to go to the next page
            .on("click.searchResults", ".next-page:not(.disabled)", function () {
                self._currentStart += RESULTS_PER_PAGE;
                self.showResults();
            })
            // The link to go to the last page
            .on("click.searchResults", ".last-page:not(.disabled)", function () {
                self._currentStart = self._getLastCurrentStart();
                self.showResults();
            })
            
            // Add the file to the working set on double click
            .on("dblclick.searchResults", ".table-container tr:not(.file-section)", function (e) {
                var item = self._searchList[$(this).data("file")];
                FileViewController.addToWorkingSetAndSelect(item.fullPath);
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

                    var searchItem = self._searchList[$row.data("file")],
                        fullPath   = searchItem.fullPath;

                    // This is a file title row, expand/collapse on click
                    if ($row.hasClass("file-section")) {
                        var $titleRows,
                            collapsed = !self._searchResults[fullPath].collapsed;

                        if (e.metaKey || e.ctrlKey) { //Expand all / Collapse all
                            $titleRows = $(e.target).closest("table").find(".file-section");
                        } else {
                            // Clicking the file section header collapses/expands result rows for that file
                            $titleRows = $row;
                        }

                        $titleRows.each(function () {
                            fullPath   = self._searchList[$(this).data("file")].fullPath;
                            searchItem = self._searchResults[fullPath];

                            if (searchItem.collapsed !== collapsed) {
                                searchItem.collapsed = collapsed;
                                $(this).nextUntil(".file-section").toggle();
                                $(this).find(".disclosure-triangle").toggleClass("expanded").toggleClass("collapsed");
                            }
                        });

                        //In Expand/Collapse all, reset all search results 'collapsed' flag to same value(true/false).
                        if (e.metaKey || e.ctrlKey) {
                            _.forEach(self._searchResults, function (item) {
                                item.collapsed = collapsed;
                            });
                        }
                    
                    // This is a file row, show the result on click
                    } else {
                        // Grab the required item data
                        var item = searchItem.items[$row.data("item")];

                        CommandManager.execute(Commands.FILE_OPEN, {fullPath: fullPath})
                            .done(function (doc) {
                                // Opened document is now the current main editor
                                EditorManager.getCurrentFullEditor().setSelection(item.start, item.end, true);
                            });
                    }
                }
            });
        
        
        // Add the Click handlers for replace functionality if required
        if (this._replace) {
            this._panel.$panel
                .on("click.searchResults", ".check-all", function (e) {
                    var isChecked = $(this).is(":checked");
                    _.forEach(self._searchResults, function (results) {
                        results.matches.forEach(function (match) {
                            match.isChecked = isChecked;
                        });
                    });
                    self._$table.find(".check-one").prop("checked", isChecked);
                    self._allChecked = isChecked;
                })
                .on("click.searchResults", ".check-one", function (e) {
                    var $row = $(e.target).closest("tr"),
                        item = self._searchList[$row.data("file")];

                    self._searchResults[item.fullPath].matches[$row.data("index")].isChecked = $(this).is(":checked");
                    e.stopPropagation();
                })
                .on("click.searchResults", ".replace-checked", function (e) {
                    $(self).triggerHandler("doReplaceAll");
                    self.hideResults();
                });
        }
    };
    
    
    /**
     * Initializes the Search Results
     */
    SearchResults.prototype.initializeResults = function () {
        this._searchResults = {};
        this._currentStart  = 0;
        this._$selectedRow  = null;
        this._allChecked    = true;
        
        // Save the currently selected file's fullpath if there is one selected and if it is a file
        var selectedItem = ProjectManager.getSelectedItem();
        if (selectedItem && !selectedItem.isDirectory) {
            this._selectedEntry = selectedItem.fullPath;
        } else {
            this._selectedEntry = null;
        }
    };
    
    /**
     * Adds the given Result Matches to the search results
     * @param {string} fullpath
     * @param {Array.<Object>} matches
     */
    SearchResults.prototype.addResultMatches = function (fullpath, matches, timestamp) {
        this._searchResults[fullpath] = {
            matches:   matches,
            collapsed: false,
            timestamp: timestamp
        };
    };
    
    
    /**
     * Shows the Results Panel
     */
    SearchResults.prototype.showResults = function () {
        return undefined;
    };
    
    /**
     * Hides the Search Results Panel and unregisters listeners
     */
    SearchResults.prototype.hideResults = function () {
        if (this._panel.isVisible()) {
            this._panel.hide();
            this._panel.$panel.off(".searchResults");
        }
    };
    
    
    /**
     * @private
     * Shows the Results Summary
     * @param {Object} summaryData
     */
    SearchResults.prototype._showSummary = function (summaryData) {
        var count     = this._countFilesMatches(),
            lastIndex = this._getLastIndex(count.matches);
        
        this._$summary.html(Mustache.render(searchSummaryTemplate, $.extend({
            allChecked: this._allChecked,
            hasPages:   count.matches > RESULTS_PER_PAGE,
            results:    StringUtils.format(Strings.FIND_IN_FILES_PAGING, this._currentStart + 1, lastIndex),
            hasPrev:    this._currentStart > 0,
            hasNext:    lastIndex < count.matches,
            replace:    this._replace,
            Strings:    Strings
        }, summaryData), { paging: searchPagingTemplate }));
    };
    
    /**
     * @private
     * Shows the Results List
     */
    SearchResults.prototype._showResultsList = function () {
        var searchItems, match, i, item, multiLine,
            count          = this._countFilesMatches(),
            searchFiles    = this._getSortedFiles(),
            lastIndex      = this._getLastIndex(count.matches),
            matchesCounter = 0,
            showMatches    = false,
            self           = this;
        
        this._searchList   = [];
        
        // Iterates throuh the files to display the results sorted by filenamess. The loop ends as soon as
        // we filled the results for one page
        searchFiles.some(function (fullPath) {
            showMatches = true;
            item = self._searchResults[fullPath];

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

                // Add matches until we get to the last match of this item, or filling the page
                while (i < item.matches.length && matchesCounter < lastIndex) {
                    match     = item.matches[i];
                    multiLine = match.start.line !== match.end.line;
                    
                    searchItems.push({
                        file:      self._searchList.length,
                        item:      searchItems.length,
                        index:     i,
                        line:      match.start.line + 1,
                        pre:       match.line.substr(0, match.start.ch),
                        highlight: match.line.substring(match.start.ch, multiLine ? undefined : match.end.ch),
                        post:      multiLine ? "\u2026" : match.line.substr(match.end.ch),
                        start:     match.start,
                        end:       match.end,
                        isChecked: match.isChecked
                    });
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
                    file:     self._searchList.length,
                    filename: displayFileName,
                    fullPath: fullPath,
                    items:    searchItems
                });
            }
        });

        
        // Insert the search results
        this._$table
            .empty()
            .append(Mustache.render(searchResultsTemplate, {
                replace:       this._replace,
                searchList:    this._searchList,
                Strings:       Strings
            }))
            // Restore the collapsed files
            .find(".file-section").each(function () {
                var fullPath = self._searchList[$(this).data("file")].fullPath;

                if (self._searchResults[fullPath].collapsed) {
                    self._searchResults[fullPath].collapsed = false;
                    $(this).trigger("click");
                }
            });
        
        if (this._$selectedRow) {
            this._$selectedRow.removeClass("selected");
            this._$selectedRow = null;
        }
        
        this._panel.show();
        this._$table.scrollTop(0); // Otherwise scroll pos from previous contents is remembered
        
        this._addPanelListeners();
    };
    
    /**
     * Restores the state of the Results Panel
     */
    SearchResults.prototype.restoreResults = function () {
        if (this._panel.isVisible()) {
            var scrollTop  = this._$table.scrollTop(),
                index      = this._$selectedRow ? this._$selectedRow.index() : null,
                numMatches = this._countFilesMatches().matches;

            if (this._currentStart > numMatches) {
                this._currentStart = this._getLastCurrentStart(numMatches);
            }
            
            this.showResults();

            this._$table.scrollTop(scrollTop);
            if (index) {
                this._$selectedRow = this._$table.find("tr:eq(" + index + ")");
                this._$selectedRow.addClass("selected");
            }
        }
    };
    
    
    /**
     * @private
     * Sorts the file keys to show the results from the selected file first and the rest sorted by path
     * @return {Array.<string>}
     */
    SearchResults.prototype._getSortedFiles = function () {
        var searchFiles = Object.keys(this._searchResults),
            self        = this;
        
        searchFiles.sort(function (key1, key2) {
            if (self._selectedEntry === key1) {
                return -1;
            } else if (self._selectedEntry === key2) {
                return 1;
            }
            return FileUtils.comparePaths(key1, key2);
        });
        
        return searchFiles;
    };
    
    
    
    /**
     * @private
     * Counts the total number of matches and files
     * @return {{files: number, matches: number}}
     */
    SearchResults.prototype._countFilesMatches = function () {
        var numFiles = 0, numMatches = 0;
        _.forEach(this._searchResults, function (item) {
            numFiles++;
            numMatches += item.matches.length;
        });

        return {files: numFiles, matches: numMatches};
    };
    
    /**
     * @private
     * Returns the last result index displayed
     * @param {number} numMatches
     * @return {number}
     */
    SearchResults.prototype._getLastIndex = function (numMatches) {
        return Math.min(this._currentStart + RESULTS_PER_PAGE, numMatches);
    };
    
    /**
     * @private
     * Returns the last possible current start based on the given number of matches
     * @param {number=} numMatches
     * @return {number}
     */
    SearchResults.prototype._getLastCurrentStart = function (numMatches) {
        numMatches = numMatches || this._countFilesMatches().matches;
        return Math.floor((numMatches - 1) / RESULTS_PER_PAGE) * RESULTS_PER_PAGE;
    };
    
    
    
    
    // Public API
    exports.SearchResults = SearchResults;
});
