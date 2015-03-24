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
/*global define, $ */

/*
 * UI and controller logic for find/replace across multiple files within the project.
 *
 * FUTURE:
 *  - Handle matches that span multiple lines
 */
define(function (require, exports, module) {
    "use strict";
    
    var AppInit           = require("utils/AppInit"),
        CommandManager    = require("command/CommandManager"),
        Commands          = require("command/Commands"),
        Dialogs           = require("widgets/Dialogs"),
        DefaultDialogs    = require("widgets/DefaultDialogs"),
        EditorManager     = require("editor/EditorManager"),
        WorkspaceManager  = require("view/WorkspaceManager"),
        FileFilters       = require("search/FileFilters"),
        FileUtils         = require("file/FileUtils"),
        FindBar           = require("search/FindBar").FindBar,
        FindInFiles       = require("search/FindInFiles"),
        FindUtils         = require("search/FindUtils"),
        InMemoryFile      = require("document/InMemoryFile"),
        ProjectManager    = require("project/ProjectManager"),
        SearchResultsView = require("search/SearchResultsView").SearchResultsView,
        StatusBar         = require("widgets/StatusBar"),
        Strings           = require("strings"),
        StringUtils       = require("utils/StringUtils"),
        _                 = require("thirdparty/lodash");


    /** @const Maximum number of files to do replacements in-memory instead of on disk. */
    var MAX_IN_MEMORY = 20;
    
    /** @type {SearchResultsView} The results view. Initialized in htmlReady() */
    var _resultsView = null;
    
    /** @type {FindBar} Find bar containing the search UI. */
    var _findBar = null;

    /**
     * Does a search in the given scope with the given filter. Shows the result list once the search is complete.
     * @param {{query: string, caseSensitive: boolean, isRegexp: boolean}} queryInfo Query info object
     * @param {?Entry} scope Project file/subfolder to search within; else searches whole project.
     * @param {?string} filter A "compiled" filter as returned by FileFilters.compile(), or null for no filter
     * @param {?string} replaceText If this is a replacement, the text to replace matches with.
     * @param {?$.Promise} candidateFilesPromise If specified, a promise that should resolve with the same set of files that
     *      getCandidateFiles(scope) would return.
     * @return {$.Promise} A promise that's resolved with the search results or rejected when the find competes.
     */
    function searchAndShowResults(queryInfo, scope, filter, replaceText, candidateFilesPromise) {
        return FindInFiles.doSearchInScope(queryInfo, scope, filter, replaceText, candidateFilesPromise)
            .done(function (zeroFilesToken) {
                // Done searching all files: show results
                if (FindInFiles.searchModel.hasResults()) {
                    _resultsView.open();

                    if (_findBar) {
                        _findBar.close();
                    }

                } else {
                    _resultsView.close();

                    if (_findBar) {
                        var showMessage = false;
                        _findBar.enable(true);
                        _findBar.focusQuery();
                        if (zeroFilesToken === FindInFiles.ZERO_FILES_TO_SEARCH) {
                            _findBar.showError(StringUtils.format(Strings.FIND_IN_FILES_ZERO_FILES, FindUtils.labelForScope(FindInFiles.searchModel.scope)), true);
                        } else {
                            showMessage = true;
                        }
                        _findBar.showNoResults(true, showMessage);
                    }
                }

                StatusBar.hideBusyIndicator();
            })
            .fail(function (err) {
                console.log("find in files failed: ", err);
                StatusBar.hideBusyIndicator();
            });
    }
    
    /**
     * @private
     * Displays a non-modal embedded dialog above the code mirror editor that allows the user to do
     * a find operation across all files in the project.
     * @param {?Entry} scope  Project file/subfolder to search within; else searches whole project.
     * @param {boolean=} showReplace If true, show the Replace controls.
     */
    function _showFindBar(scope, showReplace) {
        // If the scope is a file with a custom viewer, then we
        // don't show find in files dialog.
        if (scope && !EditorManager.canOpenPath(scope.fullPath)) {
            return;
        }
        
        if (scope instanceof InMemoryFile) {
            CommandManager.execute(Commands.FILE_OPEN, { fullPath: scope.fullPath }).done(function () {
                CommandManager.execute(Commands.CMD_FIND);
            });
            return;
        }
        
        // Get initial query/replace text
        var currentEditor = EditorManager.getActiveEditor(),
            initialQuery = FindUtils.getInitialQuery(_findBar, currentEditor);

        // Close our previous find bar, if any. (The open() of the new _findBar will
        // take care of closing any other find bar instances.)
        if (_findBar) {
            _findBar.close();
        }

        _findBar = new FindBar({
            multifile: true,
            replace: showReplace,
            initialQuery: initialQuery.query,
            initialReplaceText: initialQuery.replaceText,
            queryPlaceholder: Strings.FIND_QUERY_PLACEHOLDER,
            scopeLabel: FindUtils.labelForScope(scope)
        });
        _findBar.open();

        // TODO Should push this state into ModalBar (via a FindBar API) instead of installing a callback like this.
        // Custom closing behavior: if in the middle of executing search, blur shouldn't close ModalBar yet. And
        // don't close bar when opening Edit Filter dialog either.
        _findBar._modalBar.isLockedOpen = function () {
            // TODO: should have state for whether the search is executing instead of looking at find bar state
            // TODO: should have API on filterPicker to figure out if dialog is open
            return !_findBar.isEnabled() || $(".modal.instance .exclusions-editor").length > 0;
        };
        
        var candidateFilesPromise = FindInFiles.getCandidateFiles(scope),  // used for eventual search, and in exclusions editor UI
            filterPicker;
        
        function handleQueryChange() {
            // Check the query expression on every input event. This way the user is alerted
            // to any RegEx syntax errors immediately.
            var queryInfo = _findBar.getQueryInfo(),
                queryResult = FindUtils.parseQueryInfo(queryInfo);

            // Enable the replace button appropriately.
            _findBar.enableReplace(queryResult.valid);

            if (queryResult.valid || queryResult.empty) {
                _findBar.showNoResults(false);
                _findBar.showError(null);
            } else {
                _findBar.showNoResults(true, false);
                _findBar.showError(queryResult.error);
            }
        }
        
        function startSearch(replaceText) {
            var queryInfo = _findBar.getQueryInfo();
            if (queryInfo && queryInfo.query) {
                _findBar.enable(false);
                StatusBar.showBusyIndicator(true);

                var filter;
                if (filterPicker) {
                    filter = FileFilters.commitPicker(filterPicker);
                } else {
                    // Single-file scope: don't use any file filters
                    filter = null;
                }
                searchAndShowResults(queryInfo, scope, filter, replaceText, candidateFilesPromise);
            }
            return null;
        }
        
        function startReplace() {
            startSearch(_findBar.getReplaceText());
        }
        
        _findBar
            .on("doFind.FindInFiles", function () {
                // Subtle issue: we can't just pass startSearch directly as the handler, because
                // we don't want it to get the event object as an argument.
                startSearch();
            })
            .on("queryChange.FindInFiles", handleQueryChange)
            .on("close.FindInFiles", function (e) {
                _findBar.off(".FindInFiles");
                _findBar = null;
            });
        
        if (showReplace) {
            // We shouldn't get a "doReplace" in this case, since the Replace button
            // is hidden when we set options.multifile.
            _findBar.on("doReplaceAll.FindInFiles", startReplace);
        }
        
        var oldModalBarHeight = _findBar._modalBar.height();
        
        // Show file-exclusion UI *unless* search scope is just a single file
        if (!scope || scope.isDirectory) {
            var exclusionsContext = {
                label: FindUtils.labelForScope(scope),
                promise: candidateFilesPromise
            };

            filterPicker = FileFilters.createFilterPicker(exclusionsContext);
            // TODO: include in FindBar? (and disable it when FindBar is disabled)
            _findBar._modalBar.getRoot().find(".scope-group").append(filterPicker);
        }
        
        handleQueryChange();
        
        // Appending FilterPicker and query text can change height of modal bar, so resize editor.
        // Preserve scroll position of the current full editor across the editor refresh, adjusting
        // for the height of the modal bar so the code doesn't appear to shift if possible.
        var fullEditor = EditorManager.getCurrentFullEditor(),
            scrollPos;
        if (fullEditor) {
            scrollPos = fullEditor.getScrollPos();
            scrollPos.y -= oldModalBarHeight;   // modalbar already showing, adjust for old height
        }
        WorkspaceManager.recomputeLayout();
        if (fullEditor) {
            fullEditor._codeMirror.scrollTo(scrollPos.x, scrollPos.y + _findBar._modalBar.height());
        }
    }
    
    /**
     * @private
     * Finish a replace across files operation when the user clicks "Replace" on the results panel.
     * @param {SearchModel} model The model for the search associated with ths replace.
     */
    function _finishReplaceAll(model) {
        var replaceText = model.replaceText;
        if (replaceText === null) {
            return;
        }
        
        // Clone the search results so that they don't get updated in the middle of the replacement.
        var resultsClone = _.cloneDeep(model.results),
            replacedFiles = Object.keys(resultsClone).filter(function (path) {
                return FindUtils.hasCheckedMatches(resultsClone[path]);
            }),
            isRegexp = model.queryInfo.isRegexp;
        
        function processReplace(forceFilesOpen) {
            StatusBar.showBusyIndicator(true);
            FindInFiles.doReplace(resultsClone, replaceText, { forceFilesOpen: forceFilesOpen, isRegexp: isRegexp })
                .fail(function (errors) {
                    var message = Strings.REPLACE_IN_FILES_ERRORS + FileUtils.makeDialogFileList(
                            errors.map(function (errorInfo) {
                                return ProjectManager.makeProjectRelativeIfPossible(errorInfo.item);
                            })
                        );
                    
                    Dialogs.showModalDialog(
                        DefaultDialogs.DIALOG_ID_ERROR,
                        Strings.REPLACE_IN_FILES_ERRORS_TITLE,
                        message,
                        [
                            {
                                className : Dialogs.DIALOG_BTN_CLASS_PRIMARY,
                                id        : Dialogs.DIALOG_BTN_OK,
                                text      : Strings.BUTTON_REPLACE_WITHOUT_UNDO
                            }
                        ]
                    );
                })
                .always(function () {
                    StatusBar.hideBusyIndicator();
                });
        }
                
        if (replacedFiles.length <= MAX_IN_MEMORY) {
            // Just do the replacements in memory.
            _resultsView.close();
            processReplace(true);
        } else {
            Dialogs.showModalDialog(
                DefaultDialogs.DIALOG_ID_INFO,
                Strings.REPLACE_WITHOUT_UNDO_WARNING_TITLE,
                StringUtils.format(Strings.REPLACE_WITHOUT_UNDO_WARNING, MAX_IN_MEMORY),
                [
                    {
                        className : Dialogs.DIALOG_BTN_CLASS_NORMAL,
                        id        : Dialogs.DIALOG_BTN_CANCEL,
                        text      : Strings.CANCEL
                    },
                    {
                        className : Dialogs.DIALOG_BTN_CLASS_PRIMARY,
                        id        : Dialogs.DIALOG_BTN_OK,
                        text      : Strings.BUTTON_REPLACE_WITHOUT_UNDO
                    }
                ]
            )
                .done(function (id) {
                    if (id === Dialogs.DIALOG_BTN_OK) {
                        _resultsView.close();
                        processReplace(false);
                    }
                });
        }
    }

    // Command handlers
    
    /**
     * @private
     * Bring up the Find in Files UI with the replace options.
     */
    function _showReplaceBar() {
        _showFindBar(null, true);
    }
    
    /**
     * @private
     * Search within the file/subtree defined by the sidebar selection
     */
    function _showFindBarForSubtree() {
        var selectedEntry = ProjectManager.getSelectedItem();
        _showFindBar(selectedEntry);
    }
    
    /**
     * @private
     * Search within the file/subtree defined by the sidebar selection
     */
    function _showReplaceBarForSubtree() {
        var selectedEntry = ProjectManager.getSelectedItem();
        _showFindBar(selectedEntry, true);
    }
    
    /**
     * @private
     * Close the open search bar, if any. For unit tests.
     */
    function _closeFindBar() {
        if (_findBar) {
            _findBar.close();
        }
    }
    
    // Initialize items dependent on HTML DOM
    AppInit.htmlReady(function () {
        var model = FindInFiles.searchModel;
        _resultsView = new SearchResultsView(model, "find-in-files-results", "find-in-files.results");
        _resultsView
            .on("replaceAll", function () {
                _finishReplaceAll(model);
            })
            .on("close", function () {
                FindInFiles.clearSearch();
            });
    });
    
    // Initialize: register listeners
    ProjectManager.on("beforeProjectClose", function () { _resultsView.close(); });
    
    // Initialize: command handlers
    CommandManager.register(Strings.CMD_FIND_IN_FILES,       Commands.CMD_FIND_IN_FILES,       _showFindBar);
    CommandManager.register(Strings.CMD_FIND_IN_SUBTREE,     Commands.CMD_FIND_IN_SUBTREE,     _showFindBarForSubtree);
    
    CommandManager.register(Strings.CMD_REPLACE_IN_FILES,    Commands.CMD_REPLACE_IN_FILES,    _showReplaceBar);
    CommandManager.register(Strings.CMD_REPLACE_IN_SUBTREE,  Commands.CMD_REPLACE_IN_SUBTREE,  _showReplaceBarForSubtree);
    
    // Public exports
    exports.searchAndShowResults = searchAndShowResults;
    
    // For unit testing
    exports._showFindBar  = _showFindBar;
    exports._closeFindBar = _closeFindBar;
});
