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
        ClientLoader = brackets.getModule("languageTools/ClientLoader"),
        AppInit = brackets.getModule("utils/AppInit"),
        ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
        ProjectManager = brackets.getModule("project/ProjectManager"),
        EditorManager =  brackets.getModule("editor/EditorManager"),
        LanguageManager =  brackets.getModule("language/LanguageManager"),
        CodeHintManager = brackets.getModule("editor/CodeHintManager"),
        QuickOpen = brackets.getModule("search/QuickOpen"),
        ParameterHintManager = brackets.getModule("features/ParameterHintsManager"),
        JumpToDefManager = brackets.getModule("features/JumpToDefManager"),
        FindReferencesManager = brackets.getModule("features/FindReferencesManager"),
        CodeInspection = brackets.getModule("language/CodeInspection"),
        DefaultProviders = brackets.getModule("languageTools/DefaultProviders"),
        CodeHintsProvider = require("CodeHintsProvider").CodeHintsProvider,
        SymbolProviders = require("PHPSymbolProviders").SymbolProviders,
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
        chProvider = null,
        phProvider = null,
        lProvider = null,
        jdProvider = null,
        dSymProvider = null,
        pSymProvider = null,
        refProvider = null,
        providersRegistered = false;

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

    function resetClientInProviders() {
        var logErr = "PhpTooling: Can't reset client for : ";
        chProvider ? chProvider.setClient(_client) : console.log(logErr, "CodeHintsProvider");
        phProvider ? phProvider.setClient(_client) : console.log(logErr, "ParameterHintsProvider");
        jdProvider ? jdProvider.setClient(_client) : console.log(logErr, "JumpToDefProvider");
        dSymProvider ? dSymProvider.setClient(_client) : console.log(logErr, "DocumentSymbolsProvider");
        pSymProvider ? pSymProvider.setClient(_client) : console.log(logErr, "ProjectSymbolsProvider");
        refProvider ? refProvider.setClient(_client) : console.log(logErr, "FindReferencesProvider");
        lProvider ? lProvider.setClient(_client) : console.log(logErr, "LintingProvider");
        _client.addOnCodeInspection(lProvider.setInspectionResults.bind(lProvider));
    }

    function registerToolingProviders() {
        chProvider = new CodeHintsProvider(_client),
        phProvider = new DefaultProviders.ParameterHintsProvider(_client),
        lProvider = new DefaultProviders.LintingProvider(_client),
        jdProvider = new DefaultProviders.JumpToDefProvider(_client);
        dSymProvider = new SymbolProviders.DocumentSymbolsProvider(_client);
        pSymProvider = new SymbolProviders.ProjectSymbolsProvider(_client);
        refProvider = new DefaultProviders.ReferencesProvider(_client);

        JumpToDefManager.registerJumpToDefProvider(jdProvider, ["php"], 0);
        CodeHintManager.registerHintProvider(chProvider, ["php"], 0);
        ParameterHintManager.registerHintProvider(phProvider, ["php"], 0);
        FindReferencesManager.registerFindReferencesProvider(refProvider, ["php"], 0);
        FindReferencesManager.setMenuItemStateForLanguage();
        CodeInspection.register(["php"], {
            name: "",
            scanFileAsync: lProvider.getInspectionResultsAsync.bind(lProvider)
        });
        //Attach plugin for Document Symbols
        QuickOpen.addQuickOpenPlugin({
            name: "PHP Document Symbols",
            label: Strings.CMD_FIND_DOCUMENT_SYMBOLS + "\u2026",
            languageIds: ["php"],
            search: dSymProvider.search.bind(dSymProvider),
            match: dSymProvider.match.bind(dSymProvider),
            itemFocus: dSymProvider.itemFocus.bind(dSymProvider),
            itemSelect: dSymProvider.itemSelect.bind(dSymProvider),
            resultsFormatter: dSymProvider.resultsFormatter.bind(dSymProvider)
        });
        CommandManager.get(Commands.NAVIGATE_GOTO_DEFINITION).setEnabled(true);
        //Attach plugin for Project Symbols
        QuickOpen.addQuickOpenPlugin({
            name: "PHP Project Symbols",
            label: Strings.CMD_FIND_PROJECT_SYMBOLS + "\u2026",
            languageIds: ["php"],
            search: pSymProvider.search.bind(pSymProvider),
            match: pSymProvider.match.bind(pSymProvider),
            itemFocus: pSymProvider.itemFocus.bind(pSymProvider),
            itemSelect: pSymProvider.itemSelect.bind(pSymProvider),
            resultsFormatter: pSymProvider.resultsFormatter.bind(pSymProvider)
        });
        CommandManager.get(Commands.NAVIGATE_GOTO_DEFINITION_PROJECT).setEnabled(true);

        _client.addOnCodeInspection(lProvider.setInspectionResults.bind(lProvider));

        providersRegistered = true;
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
        if(!err) {
            return;
        }
        var localizedErrStr = "";
        if (typeof (err) === "string") {
            localizedErrStr = Strings[err];
        } else {
            localizedErrStr = StringUtils.format(Strings[err[0]], err[1]);
        }
        if(!localizedErrStr) {
            console.error("Php Tooling Error: " + err);
            return;
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
            localizedErrStr,
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

            if (providersRegistered) {
                resetClientInProviders();
            } else {
                registerToolingProviders();
            }

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

    function initiateService(evt, onAppReady) {
        if (onAppReady) {
            console.log("Php tooling: Starting the service");
        } else {
            console.log("Php tooling: Something went wrong. Restarting the service");
        }

        phpServerRunning = false;
        LanguageTools.initiateToolingService(clientName, clientFilePath, ['php']).done(function (client) {
            _client = client;
            //Attach only once
            EditorManager.off("activeEditorChange.php");
            EditorManager.on("activeEditorChange.php", activeEditorChangeHandler);
            //Attach only once
            LanguageManager.off("languageModified.php");
            LanguageManager.on("languageModified.php", languageModifiedHandler);
            activeEditorChangeHandler(null, EditorManager.getActiveEditor());
        });
    }

    AppInit.appReady(function () {
        initiateService(null, true);
        ClientLoader.on("languageClientModuleInitialized", initiateService);
    });

    //Only for Unit testing
    exports.getClient = function() { return _client; };
});
