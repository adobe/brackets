/*
 * Copyright (c) 2019 - present Adobe. All rights reserved.
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

define(function (require, exports, module) {
    "use strict";

    var AppInit                     = require("utils/AppInit"),
        CommandManager              = require("command/CommandManager"),
        MainViewManager             = require("view/MainViewManager"),
        LanguageManager             = require("language/LanguageManager"),
        DocumentManager             = require("document/DocumentManager"),
        Commands                    = require("command/Commands"),
        EditorManager               = require("editor/EditorManager"),
        ProjectManager              = require("project/ProjectManager"),
        ProviderRegistrationHandler = require("features/PriorityBasedRegistration").RegistrationHandler,
        SearchResultsView           = require("search/SearchResultsView").SearchResultsView,
        SearchModel                 = require("search/SearchModel").SearchModel,
        Strings                     = require("strings");

    var _providerRegistrationHandler = new ProviderRegistrationHandler(),
        registerFindReferencesProvider = _providerRegistrationHandler.registerProvider.bind(
            _providerRegistrationHandler
        ),
        removeFindReferencesProvider = _providerRegistrationHandler.removeProvider.bind(_providerRegistrationHandler);

    var searchModel = new SearchModel(),
        _resultsView;

    function _getReferences(provider, hostEditor, pos) {
        var result = new $.Deferred();

        if(!provider) {
            return result.reject();
        }

        provider.getReferences(hostEditor, pos)
            .done(function (rcvdObj) {

                searchModel.results = rcvdObj.results;
                searchModel.numFiles = rcvdObj.numFiles;
                searchModel.numMatches = rcvdObj.numMatches;
                searchModel.allResultsAvailable = true;
                searchModel.setQueryInfo({query: rcvdObj.queryInfo, caseSensitive: true, isRegExp: false});
                result.resolve();
            }).fail(function (){
                result.reject();
            });
        return result.promise();

    }

    function _openReferencesPanel() {
        var editor = EditorManager.getActiveEditor(),
            pos = editor ? editor.getCursorPos() : null,
            referencesPromise,
            result = new $.Deferred(),
            errorMsg = Strings.REFERENCES_NO_RESULTS,
            referencesProvider;

        var language = editor.getLanguageForSelection(),
            enabledProviders = _providerRegistrationHandler.getProvidersForLanguageId(language.getId());

        enabledProviders.some(function (item, index) {
            if (item.provider.hasReferences(editor)) {
                referencesProvider = item.provider;
                return true;
            }
        });

        referencesPromise = _getReferences(referencesProvider, editor, pos);

        // If one of them will provide a widget, show it inline once ready
        if (referencesPromise) {
            referencesPromise.done(function () {
                if(_resultsView) {
                    _resultsView.open();
                }
            }).fail(function () {
                if(_resultsView) {
                    _resultsView.close();
                }
                editor.displayErrorMessageAtCursor(errorMsg);
                result.reject();
            });
        } else {
            if(_resultsView) {
                _resultsView.close();
            }
            editor.displayErrorMessageAtCursor(errorMsg);
            result.reject();
        }

        return result.promise();
    }

    /**
     * @private
     * Clears any previous search information, removing update listeners and clearing the model.
     */
    function _clearSearch() {
        searchModel.clear();
    }

    function setMenuItemStateForLanguage(languageId) {
        CommandManager.get(Commands.CMD_FIND_ALL_REFERENCES).setEnabled(false);
        if (!languageId) {
            var editor = EditorManager.getActiveEditor();
            if (editor) {
                languageId = LanguageManager.getLanguageForPath(editor.document.file._path).getId();
            }
        }
        var enabledProviders = _providerRegistrationHandler.getProvidersForLanguageId(languageId),
            referencesProvider;

        enabledProviders.some(function (item, index) {
            if (item.provider.hasReferences()) {
                referencesProvider = item.provider;
                return true;
            }
        });
        if (referencesProvider) {
            CommandManager.get(Commands.CMD_FIND_ALL_REFERENCES).setEnabled(true);
        }

    }

    MainViewManager.on("currentFileChange", function (event, newFile, newPaneId, oldFile, oldPaneId) {
        if (!newFile) {
            CommandManager.get(Commands.CMD_FIND_ALL_REFERENCES).setEnabled(false);
            return;
        }

        var newFilePath = newFile.fullPath,
            newLanguageId = LanguageManager.getLanguageForPath(newFilePath).getId();
        setMenuItemStateForLanguage(newLanguageId);

        DocumentManager.getDocumentForPath(newFilePath)
            .done(function (newDoc) {
                newDoc.on("languageChanged.reference-in-files", function () {
                    var changedLanguageId = LanguageManager.getLanguageForPath(newDoc.file.fullPath).getId();
                    setMenuItemStateForLanguage(changedLanguageId);
                });
            });

        if (!oldFile) {
            return;
        }

        var oldFilePath = oldFile.fullPath;
        DocumentManager.getDocumentForPath(oldFilePath)
            .done(function (oldDoc) {
                oldDoc.off("languageChanged.reference-in-files");
            });
    });

    AppInit.htmlReady(function () {
        _resultsView = new SearchResultsView(
            searchModel,
            "reference-in-files-results",
            "reference-in-files.results",
            "reference"
        );
        if(_resultsView) {
            _resultsView
                .on("close", function () {
                    _clearSearch();
                })
                .on("getNextPage", function () {
                    if (searchModel.hasResults()) {
                        _resultsView.showNextPage();
                    }
                })
                .on("getLastPage", function () {
                    if (searchModel.hasResults()) {
                        _resultsView.showLastPage();
                    }
                });
        }
    });

    // Initialize: register listeners
    ProjectManager.on("beforeProjectClose", function () { if (_resultsView) { _resultsView.close(); } });

    CommandManager.register(Strings.FIND_ALL_REFERENCES, Commands.CMD_FIND_ALL_REFERENCES, _openReferencesPanel);
    CommandManager.get(Commands.CMD_FIND_ALL_REFERENCES).setEnabled(false);

    exports.registerFindReferencesProvider    = registerFindReferencesProvider;
    exports.removeFindReferencesProvider      = removeFindReferencesProvider;
    exports.setMenuItemStateForLanguage       = setMenuItemStateForLanguage;
});
