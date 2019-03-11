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

/*eslint no-console: 0*/
/*eslint max-len: ["error", { "code": 200 }]*/
/*eslint-env es6*/
define(function (require, exports, module) {
    "use strict";

    var MessageHandler = require("languageTools/MessageHandler"),
        EditorManager = require("editor/EditorManager"),
        ProjectManager = require("project/ProjectManager"),
        DocumentManager = require("document/DocumentManager"),
        DocumentModule = require("document/Document"),
        LanguageClientWrapper = require("languageTools/LanguageClientWrapper").LanguageClientWrapper;

    var languageClients = new Map(),
        BRACKETS_EVENTS_NAMES = {
            EDITOR_CHANGE_EVENT: "activeEditorChange",
            PROJECT_OPEN_EVENT: "projectOpen",
            PROJECT_CLOSE_EVENT: "beforeProjectClose",
            DOCUMENT_DIRTY_EVENT: "dirtyFlagChange",
            DOCUMENT_CHANGE_EVENT: "documentChange",
            FILE_RENAME_EVENT: "fileNameChange"
        };

    function registerLanguageClient(clientName, languageClient) {
        languageClients.set(clientName, languageClient);
    }

    function _withNamespace(event) {
        var retval = event.split(" ")
                        .filter((value) => !!value)
                        .map((value) => value + ".language-tools")
                        .join(" ");

        return retval;
    }

    function _eventHandler() {
        var eventArgs = arguments;
        //Broadcast event to all clients
        languageClients.forEach(function (client) {
            client.triggerEvent.apply(client, eventArgs);
        });
    }

    function _attachEventHandlers() {
        EditorManager.on(_withNamespace(BRACKETS_EVENTS_NAMES.EDITOR_CHANGE_EVENT), _eventHandler);//(event, current, previous)
        ProjectManager.on(_withNamespace(BRACKETS_EVENTS_NAMES.PROJECT_OPEN_EVENT), _eventHandler);//(event, directory)
        ProjectManager.on(_withNamespace(BRACKETS_EVENTS_NAMES.PROJECT_CLOSE_EVENT), _eventHandler);//(event, directory)
        DocumentManager.on(_withNamespace(BRACKETS_EVENTS_NAMES.DOCUMENT_DIRTY_EVENT), _eventHandler);//(event, document)
        DocumentModule.on(_withNamespace(BRACKETS_EVENTS_NAMES.DOCUMENT_CHANGE_EVENT), _eventHandler);//(event, document, changeList)
        DocumentManager.on(_withNamespace(BRACKETS_EVENTS_NAMES.FILE_RENAME_EVENT), _eventHandler);//(event, oldName, newName)
    }

    _attachEventHandlers();

    function intiateToolingService(clientName, clientFilePath, languages) {
        var result = $.Deferred();

        MessageHandler.initiateLanguageClient(clientName, clientFilePath)
            .done(function (languageClientInfo) {
                var languageClientName = languageClientInfo.name,
                    languageClientInterface = languageClientInfo.interface,
                    languageClient = new LanguageClientWrapper(languageClientName, clientFilePath, languageClientInterface, languages);

                registerLanguageClient(languageClientName, languageClient);

                result.resolve(languageClient);
            })
            .fail(result.reject);

        return result;
    }

    exports.intiateToolingService = intiateToolingService;
});
