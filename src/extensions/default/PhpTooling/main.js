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

    var LanguageTools = brackets.getModule("languageTools/LanguageTools"),
        AppInit = brackets.getModule("utils/AppInit"),
        ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
        ProjectManager = brackets.getModule("project/ProjectManager"),
        EditorManager =  brackets.getModule("editor/EditorManager"),
        LanguageManager =  brackets.getModule("language/LanguageManager"),
        CodeHintManager = brackets.getModule("editor/CodeHintManager"),
        QuickOpen = brackets.getModule("search/QuickOpen"),
        ParameterHintManager = brackets.getModule("features/ParameterHintsManager"),
        JumpToDefManager = brackets.getModule("features/JumpToDefManager"),
        CodeInspection = brackets.getModule("language/CodeInspection"),
        DefaultProviders = brackets.getModule("languageTools/DefaultProviders"),
        CodeHintsProvider = require("CodeHintsProvider").CodeHintsProvider,
        SymbolsProvider = require("PHPSymbolsProvider").SymbolsProvider,
        DefaultEventHandlers = brackets.getModule("languageTools/DefaultEventHandlers"),
        PreferencesManager  = brackets.getModule("preferences/PreferencesManager"),
        Strings             = brackets.getModule("strings"),
        Dialogs             = brackets.getModule("widgets/Dialogs"),
        DefaultDialogs      = brackets.getModule("widgets/DefaultDialogs"),
        Commands               = brackets.getModule("command/Commands"),
        CommandManager         = brackets.getModule("command/CommandManager"),
        StringUtils             = brackets.getModule("utils/StringUtils");

    var clientFilePath = ExtensionUtils.getModulePath(module, "client.js"),
        clientName = "PhpClient",
        _client = null,
        evtHandler,
        phpConfig = {
            enablePhpTooling: true,
            executablePath: "php",
            memoryLimit: "4095M",
            validateOnType: "false"
        },
        DEBUG_OPEN_PREFERENCES_IN_SPLIT_VIEW  = "debug.openPrefsInSplitView",
        phpServerRunning = false,
        serverCapabilities,
        currentRootPath,
        chProvider,
        phProvider,
        lProvider,
        jdProvider,
        symProvider;

    PreferencesManager.definePreference("php", "object", phpConfig, {
        description: Strings.DESCRIPTION_PHP_TOOLING_CONFIGURATION
    });

    PreferencesManager.on("change", "php", function () {
        var newPhpConfig = PreferencesManager.get("php");

        if (lProvider && newPhpConfig["validateOnType"] !== phpConfig["validateOnType"]) {
            lProvider._validateOnType = !(newPhpConfig["validateOnType"] === "false");
        }
        if ((newPhpConfig["executablePath"] !== phpConfig["executablePath"])
                || (newPhpConfig["enablePhpTooling"] !== phpConfig["enablePhpTooling"])) {
            phpConfig = newPhpConfig;
            runPhpServer();
            return;
        }
        phpConfig = newPhpConfig;
    });

    var handleProjectOpen = function (event, directory) {
        lProvider.clearExistingResults();
        if(serverCapabilities["workspace"] && serverCapabilities["workspace"]["workspaceFolders"]) {
            _client.notifyProjectRootsChanged({
                foldersAdded: [directory.fullPath],
                foldersRemoved: [currentRootPath]
            });
            currentRootPath = directory.fullPath;
        } else {
            _client.restart({
                rootPath: directory.fullPath
            }).done(handlePostPhpServerStart);
        }
    };

    function registerToolingProviders() {
        chProvider = new CodeHintsProvider(_client),
        phProvider = new DefaultProviders.ParameterHintsProvider(_client),
        lProvider = new DefaultProviders.LintingProvider(_client),
        jdProvider = new DefaultProviders.JumpToDefProvider(_client);
        symProvider = new SymbolsProvider(_client);

        JumpToDefManager.registerJumpToDefProvider(jdProvider, ["php"], 0);
        CodeHintManager.registerHintProvider(chProvider, ["php"], 0);
        ParameterHintManager.registerHintProvider(phProvider, ["php"], 0);
        CodeInspection.register(["php"], {
            name: "",
            scanFileAsync: lProvider.getInspectionResultsAsync.bind(lProvider)
        });
        QuickOpen.addQuickOpenPlugin({
            name: "PHP Symbols",
            languageIds: ["php"],
            search: symProvider.search.bind(symProvider),
            match: symProvider.match,
            itemFocus: symProvider.itemFocus,
            itemSelect: symProvider.itemSelect,
            resultsFormatter: symProvider.resultsFormatter
        });

        _client.addOnCodeInspection(lProvider.setInspectionResults.bind(lProvider));
    }

    function addEventHandlers() {
        _client.addOnLogMessage(function () {});
        _client.addOnShowMessage(function () {});
        evtHandler = new DefaultEventHandlers.EventPropagationProvider(_client);
        evtHandler.registerClientForEditorEvent();


        if (phpConfig["validateOnType"] !== "false") {
            lProvider._validateOnType = true;
        }

        _client.addOnProjectOpenHandler(handleProjectOpen);
    }

    function validatePhpExecutable() {
        var result = $.Deferred();

        _client.sendCustomRequest({
            messageType: "brackets",
            type: "validatePhpExecutable",
            params: phpConfig
        }).done(result.resolve).fail(result.reject);

        return result;
    }

    function showErrorPopUp(err) {
        if (typeof (err) === "string") {
            err = Strings[err];
        } else {
            err = StringUtils.format(Strings[err[0]], err[1]);
        }
        var Buttons = [
            { className: Dialogs.DIALOG_BTN_CLASS_NORMAL, id: Dialogs.DIALOG_BTN_CANCEL,
                text: Strings.CANCEL },
            { className: Dialogs.DIALOG_BTN_CLASS_PRIMARY, id: Dialogs.DIALOG_BTN_DOWNLOAD,
                text: Strings.OPEN_PREFERENNCES}
        ];
        Dialogs.showModalDialog(
            DefaultDialogs.DIALOG_ID_ERROR,
            Strings.PHP_SERVER_ERROR_TITLE,
            err,
            Buttons
        ).done(function (id) {
            if (id === Dialogs.DIALOG_BTN_DOWNLOAD) {
                if (CommandManager.get(DEBUG_OPEN_PREFERENCES_IN_SPLIT_VIEW)) {
                    CommandManager.execute(DEBUG_OPEN_PREFERENCES_IN_SPLIT_VIEW);
                } else {
                    CommandManager.execute(Commands.CMD_OPEN_PREFERENCES);
                }
            }
        });
    }

    function handlePostPhpServerStart() {
        if (!phpServerRunning) {
            phpServerRunning = true;
            registerToolingProviders();
            addEventHandlers();
            EditorManager.off("activeEditorChange.php");
            LanguageManager.off("languageModified.php");
        }
        evtHandler.handleActiveEditorChange(null, EditorManager.getActiveEditor());
        currentRootPath = ProjectManager.getProjectRoot()._path;
    }

    function runPhpServer() {
        if (_client && phpConfig["enablePhpTooling"]) {
            validatePhpExecutable()
                .done(function () {
                    var startFunc = _client.start.bind(_client);
                    if (phpServerRunning) {
                        startFunc = _client.restart.bind(_client);
                    }
                    currentRootPath = ProjectManager.getProjectRoot()._path;
                    startFunc({
                        rootPath: currentRootPath
                    }).done(function (result) {
                        console.log("php Language Server started");
                        serverCapabilities = result.capabilities;
                        handlePostPhpServerStart();
                    });
                }).fail(showErrorPopUp);
        }
    }

    function activeEditorChangeHandler(event, current) {
        if (current) {
            var language = current.document.getLanguage();
            if (language.getId() === "php") {
                runPhpServer();
                EditorManager.off("activeEditorChange.php");
                LanguageManager.off("languageModified.php");
            }
        }
    }

    function languageModifiedHandler(event, language) {
        if (language && language.getId() === "php") {
            runPhpServer();
            EditorManager.off("activeEditorChange.php");
            LanguageManager.off("languageModified.php");
        }
    }

    AppInit.appReady(function () {
        LanguageTools.initiateToolingService(clientName, clientFilePath, ['php']).done(function (client) {
            _client = client;
            EditorManager.on("activeEditorChange.php", activeEditorChangeHandler);
            LanguageManager.on("languageModified.php", languageModifiedHandler);
            activeEditorChangeHandler(null, EditorManager.getActiveEditor());
        });
    });

    //Only for Unit testing
    exports.getClient = function() { return _client; };
});
