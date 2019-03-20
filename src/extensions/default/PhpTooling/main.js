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
        ParameterHintManager = brackets.getModule("features/ParameterHintsManager"),
        JumpToDefManager = brackets.getModule("features/JumpToDefManager"),
        CodeInspection = brackets.getModule("language/CodeInspection"),
        DefaultProviders = brackets.getModule("languageTools/DefaultProviders"),
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
        phpConfig = {},
        DEBUG_OPEN_PREFERENCES_IN_SPLIT_VIEW  = "debug.openPrefsInSplitView";

    PreferencesManager.definePreference("php", "object", {
        enablePhpTooling: true,
        showDiagnosisOnType: false,
        executablePath: "php",
        validate_executablePath: "php",
        memoryLimit: "default"
    }, {
        description: Strings.DESCRIPTION_PHP_TOOLING_CONFIGURATION
    });
    
    PreferencesManager.on("change", "php", function () {
        var newPhpConfig = PreferencesManager.get("php");

        if((newPhpConfig["executablePath"] !== phpConfig["executablePath"])
            || (newPhpConfig["enablePhpTooling"] !== phpConfig["enablePhpTooling"]))  {
            phpConfig = newPhpConfig;
            startPhpServer();
            return;
        }
        phpConfig = newPhpConfig;
    });
	
    var handleProjectOpen = function (event, directory) {
        _client.stop()
            .done(function (){
                setTimeout(function () {
                    _client.start({
                    rootPath : directory.fullPath
                });
            }, 1500);
       });
    };

    function registerToolingProviders(client) {
        var languageClient = client || _client;
        var chProvider = new DefaultProviders.CodeHintsProvider(languageClient),
            phProvider = new DefaultProviders.ParameterHintsProvider(languageClient),
            jdProvider = new DefaultProviders.JumpToDefProvider(languageClient),
            lProvider = new DefaultProviders.LintingProvider(languageClient);

            CodeHintManager.registerHintProvider(chProvider, ["php"], 0);
            ParameterHintManager.registerHintProvider(phProvider, ["php"], 0);
            JumpToDefManager.registerJumpToDefProvider(jdProvider, ["php"], 0);
            CodeInspection.register(["php"], {
                name: "Diagnostics",
                scanFile: lProvider.getInspectionResults.bind(lProvider)
            });

            languageClient.addOnDiagnostics(lProvider.setInspectionResults.bind(lProvider));
    }

    function startPhpServer() {
        if(_client && phpConfig["enablePhpTooling"]) {
            _client.sendCustomRequest({
                messageType: "brackets",
                type: "validatePhpExecutable",
                params: phpConfig
            }).done(function (){
                _client.start({
                    rootPath: ProjectManager.getProjectRoot()._path
                }).done(function (result) {
                    registerToolingProviders();
                    _client.addOnLogMessage(function () {});
                    _client.addOnShowMessage(function () {});
                    var evtHandler = new DefaultEventHandlers.EventPropagationProvider(_client);
                    evtHandler.registerClientForEditorEvent();

                    if (phpConfig["showDiagnosisOnType"]) {
                        _client.addOnDocumentChangeHandler(function () { 
                            CodeInspection.requestRun("Diagnostics");
                        });
                    } else {
                        _client.addOnDocumentDirtyFlagChangeHandler(function (event, document) { 
                            if (!document.isDirty) {
                                CodeInspection.requestRun("Diagnostics");
                            }
                        });
                    }

                    _client.addOnProjectOpenHandler(handleProjectOpen);

                    console.log("php Language Server started");
                });
            }).fail(function(err) {
                if(typeof(err) === "string") {
                    err = Strings[err];
                } else {
                    err = StringUtils.format(Strings[err[0]], err[1]);
                }
                var Buttons = [{ className: Dialogs.DIALOG_BTN_CLASS_NORMAL, id: Dialogs.DIALOG_BTN_CANCEL, text: Strings.CANCEL },
                                { className: Dialogs.DIALOG_BTN_CLASS_PRIMARY, id: Dialogs.DIALOG_BTN_DOWNLOAD, text: Strings.CMD_OPEN_PREFERENCES}];
                Dialogs.showModalDialog(
                    DefaultDialogs.DIALOG_ID_ERROR,
                    Strings.PHP_SERVER_ERROR_TITLE,
                    err,
                    Buttons
                ).done(function (id) {
                    if(id === Dialogs.DIALOG_BTN_DOWNLOAD) {
                        if(CommandManager.get(DEBUG_OPEN_PREFERENCES_IN_SPLIT_VIEW)) {
                            CommandManager.execute(DEBUG_OPEN_PREFERENCES_IN_SPLIT_VIEW);
                        } else {
                            CommandManager.execute(Commands.CMD_OPEN_PREFERENCES);
                        }
                    }
                });
            });
        }
    }

    function activeEditorChangeHandler(event, current) {
        if (current) {
            var language = current.document.getLanguage();
            if (language.getId() === "php") {
                startPhpServer();
                EditorManager.off("activeEditorChange.php");
                LanguageManager.off("languageModified.php");
            }
        }
    }

    function languageModifiedHandler(event, language) {
        if (language && language.getId() === "php") {
            startPhpServer();
            EditorManager.off("activeEditorChange.php");
            LanguageManager.off("languageModified.php");
        }
    }

	AppInit.appReady(function () {
		LanguageTools.intiateToolingService(clientName, clientFilePath, ['php'])
			.done(function (client) {
				_client = client;
                EditorManager.on("activeEditorChange.php", activeEditorChangeHandler);
                LanguageManager.on("languageModified.php", languageModifiedHandler);
                activeEditorChangeHandler(null, EditorManager.getActiveEditor());
			});
	});
});
