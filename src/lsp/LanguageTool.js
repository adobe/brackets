/*
 * Copyright (c) 2018 - present Adobe Systems Incorporated. All rights reserved.
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

    var AppInit                 = brackets.getModule("utils/AppInit"),
        ParameterHintManager    = require("lsp/ParameterHintManager"),
        LSPInterface            = require("lsp/LSPInterface"),
        LSPSession              = require("lsp/LSPSession"),
        LanguageManager         = brackets.getModule("language/LanguageManager"),
        DocumentManager         = brackets.getModule("document/DocumentManager"),
        FileUtils               = brackets.getModule("file/FileUtils"),
        ExtensionUtils          = brackets.getModule("utils/ExtensionUtils"),
        EditorManager           = brackets.getModule('editor/EditorManager'),
        CodeInspection          = brackets.getModule("language/CodeInspection"),
        CodeHintManager         = brackets.getModule("editor/CodeHintManager"),
        CommandManager          = brackets.getModule("command/CommandManager"),
        Commands                = brackets.getModule("command/Commands"),
        Menus                   = brackets.getModule('command/Menus'),
        Utils                   = require("lsp/Utils");

    let _commandID = {};
    let _clientList = {};
    let _session     = null;
    let _diagnostics = null;

    function LanguageClient() {
    };

    /**
     * Determine whether hints are available for a given editor context
     * @param {Editor} editor - the current editor context
     * @param {string} implicitChar - charCode of the last pressed key
     * @return {boolean} - are hints available in the current context.
     */
    LanguageClient.prototype.hasHints = function (editor, implicitChar){
        let langId = editor.document.getLanguage().getId();
        if (langId in _clientList) {
            this.editor = editor;
            return true;
        }
        return false;
    };

    /**
     * Return a list of hints, possibly deferred, for the current editor context
     * @param   {String} implicitChar - charCode of the last pressed key
     * @returns {jQuery.Deferred} hint response as defined by the CodeHintManager API 
     */
    LanguageClient.prototype.getHints = function (implicitChar) {
        if(this.editor === null){
            return null;
        }
        let pos = this.editor.getCursorPos();;
        if(implicitChar && Utils.hintable(implicitChar)){
            let content = this.editor.document.getText();
            let $deferredHints = $.Deferred();
            let docPath = this.editor.document.file._path;
            let docPathUri = "file://"+docPath;
            let client = getActiveClient(this.editor.document);
            postNotification(client,{
                method:"textDocument/didChange", 
                param:{
                    textDocument: {
                        uri: docPathUri,
                        version: 1
                    },
                    contentChanges: [
                        {
                            text: content
                        }
                    ]
                }
            });

            postRequest(client,{method:"textDocument/completion", param:{
                textDocument: {
                    uri: docPathUri
                },
                position: {
                    line: pos.line,
                    character: pos.ch
                }}
            }).done(function(msgObj){
                var hints = [];
                if(msgObj.param.result){
                    let res;
                    if(msgObj.param.result instanceof Array){
                        res = msgObj.param.result;
                    }
                    else{
                        res = msgObj.param.result.items;
                    }
                    res.forEach(element => {
                        var $fHint = $("<span>")
                        .addClass("brackets-hints")
                        .text(element.label);
                        
                        $fHint.data("token",element);
                        Utils.formatTypeDataForToken($fHint, element);
                        hints.push($fHint);
                    });
                }
                $deferredHints.resolve({"hints":hints});
            }).fail(function(){
                $deferredHints.reject();
            });
            return $deferredHints;
        }
        return null;
    };


    /**
     * Inserts the hint selected by the user into the current editor.
     * @param   {jQuery.Object} $completion - hint object to insert into current editor
     * @returns {boolean} - should a new hinting session be requested
     *      immediately after insertion? 
     */
    LanguageClient.prototype.insertHint = function ($completion) {
        var cursor  = _session.getCursor(),
            query   = _session.getQuery(),
            start   = {line: -1, ch: -1},
            end     = {line: -1, ch: -1},
            token   =  $completion.data("token"),
            txt     = null;

        start       = {line: cursor.line, ch: cursor.ch - query.length};
        end         = {line: cursor.line, ch: cursor.ch};

        txt = token.label;
        if (token.textEdit && token.textEdit.newText) {
            txt = token.textEdit.newText;
            start = {line: token.textEdit.range.start.line, ch: token.textEdit.range.start.character};
        }
        if(this.editor){
            this.editor.document.replaceRange(txt, start, end);
        }
        // Return false to indicate that another hinting session is not needed
        return false;
    };

    /**
     * Send Request to LSP Server
     * @param   {String} serverName - server where message is to be sent
     * @param   {Object} msgObj - json object containg information associated with the request
     * @returns {Object} $deffered Object  
     */
    LanguageClient.prototype.getParameterHints = function(){
        if(this.editor === null){
            return null;
        }
        let pos = this.editor.getCursorPos();
        let content = this.editor.document.getText();
        let $deferredHints = $.Deferred();
        let docPath = this.editor.document.file._path;
        let docPathUri = "file://"+docPath;
        let client = getActiveClient(this.editor.document);
        postNotification(client,{
            method:"textDocument/didChange", 
            param:{
                textDocument: {
                    uri: docPathUri,
                    version: 1
                },
                contentChanges: [
                    {
                        text: content
                    }
                ]
            }
        });

        postRequest(client,{method:"textDocument/signatureHelp", param:{
			textDocument: {
				uri: docPathUri
			},
			position: {
				line: pos.line,
				character: pos.ch
			}}
        }).done(function(msgObj){
            let paramList = [];
            let label ;
            if(msgObj.param.result){
                let res;
                if(msgObj.param.result){
                    res = msgObj.param.result.signatures;
                }
                res.forEach(element => {
                    label = element.label;
                    let param = element.parameters;
                    param.forEach(ele =>{
                        paramList.push(ele.label);
                    });
                });
            }
            if(paramList.length > 0){
                $deferredHints.resolve(paramList);
            }
            else{
                $deferredHints.reject();
            }
        }).fail(function(){
            $deferredHints.reject();
        });

        return $deferredHints;
    };
    
    /**
     * Send Request to LSP Server Interface
     * @param   {Object} client - Client which has invoked the request
     * @param   {Object} msgObj - json object containg information associated with the request
     * @returns {Object} $deffered Object  
     */
    function postRequest(client, msgObj){
        return LSPInterface.postRequest(client.getServerName(), msgObj);
    };

    /**
     * Send Notification to LSP Server Interface
     * @param   {Object} client - Client which has invoked the notification
     * @param   {Object} msgObj - json object containg information associated with the notification
     */
    function postNotification(client, msgObj){
        LSPInterface.postNotification(client.getServerName(), msgObj);
    };

    /**
     * Initialize/Enable language tooling support for the LSP server associated with client
     * @param   {Object} client - Client which is registering the LSP server
     */
    function initLanguageTooling(client){
        let serverName = client.getServerName();
        let msgObj = {};
        msgObj.serverName = client.getServerName();
        msgObj.serverPath = client.getServerPath();
        msgObj.rootPath = client.getProjectRootUri();
        msgObj.capabilities = client.getCapabilities();
        LSPInterface.registerLSPServer(msgObj);

        let languageId = client.getLanguageId();
        _clientList[languageId] = client;


        let languageClient = new LanguageClient();
        CodeHintManager.registerHintProvider(languageClient, [languageId], 0);
        ParameterHintManager.registerHintProvider(languageClient, [languageId], 0);

        registerCallback(client, 'textDocument/publishDiagnostics', publishDiagnostics);
        CodeInspection.register(languageId, {
            name: "Diagnostics",
            scanFile: ()=>{return _diagnostics;}
        });
    };

    /**
     * Register a callback function to the custom method client wants to support
     * @param   {Object} client - Client which has rtegistered the LSP server
     * @param   {String} method - Method that client wants to support
     * @param   {Function} callback -  callback function
     */
    function registerCallback(client, method, callback){
        let serverName = client.getServerName();
        LSPInterface.registerCallback(serverName, method, callback);
    };

    /**
     * Get the client registerd to provide tooling support for the current document
     * @param   {Object} document - Current active document loaded in Editor
     * @returns {Object} client - Client register to support the active language  
     */
    function getActiveClient(document){
        let languageId = document.getLanguage().getId();
        if(_clientList[languageId]){
            return _clientList[languageId];
        }
    };

    /**
     * When the editor is changed, reset the hinting session and cached
     * information, and reject any pending deferred requests.
     * @param {!Editor} editor - editor context to be initialized.
     * @param {?Editor} previousEditor - the previous editor.
     */
    function initializeSession(editor, previousEditor) {
        let session = new LSPSession(editor);
        let client = getActiveClient(editor.document);
        if(client){
            _session = session;
        }
        ParameterHintManager.setSession(session);
    };

    /**
     * Connects to the given editor, creating a new Session & adding listeners
     * @param   {?Editor} editor - editor context on which to listen for
     * @param   {?Editor} previousEditor - the previous editor
     */
    function installEditorListeners(editor, previousEditor) {
        if (editor ){//&& HintUtils.isSupportedLanguage(LanguageManager.getLanguageForPath(editor.document.file.fullPath).getId())) {
            initializeSession(editor, previousEditor);
            editor.on("change.brackets-hints", function (event, editor, changeList) {
                        ParameterHintManager.popUpHintAtOpenParen();
                });
            ParameterHintManager.installListeners(editor);
        } else {
            _session = null;
        }
    };
    
    /**
     * Uninstall editor change listeners
     * @param {Editor} editor - editor context on which to stop listening
     */
    function uninstallEditorListeners(editor) {
        if (editor) {
            editor.off("change.brackets-hints");
            ParameterHintManager.uninstallListeners(editor);
        }
    };

    /**
     * Send Request to LSP Server to unload the current document
     * @param   {Object} document - Current document loaded into editor.
     */
    function closeDocument(document){
        let docPathUri = "file://"+document.file._path;
        let client = getActiveClient(document);
        if(client){
            postNotification(client,{
                method:"textDocument/didClose", 
                param:{
                    textDocument: {
                        uri: docPathUri
                    }
                }});
        }
    };

    /**
     * Send Request to LSP Server to load the current document
     * @param   {Object} document - Current document loaded into editor.
     */
    function openDocument(document){
        let content = document.getText();
        let docPathUri = "file://"+document.file._path;
        let client = getActiveClient(document);
        if(client){
            let languageID = client.getLanguageId();
            postNotification(client,{method:"textDocument/didOpen", param:{
                textDocument: {
                    languageId: languageID,
                    version: 1,
                    uri: docPathUri,
                    text: content}
                }
            });
        }
    };
    
    /** 
     * Handle the activeEditorChange event fired by EditorManager.
     * Uninstalls the change listener on the previous editor
     * and installs a change listener on the new editor.
     *
     * @param {Event} event - editor change event (ignored)
     * @param {Editor} current - the new current editor context
     * @param {Editor} previous - the previous editor context
     */
    function handleActiveEditorChange(event, current, previous) {
        if (previous) {
            previous.document
                .off("languageChanged.brackets-hints");
            closeDocument(previous.document);
        }
        if (current) {
            current.document
                .on("languageChanged.brackets-hints", function () {
                    uninstallEditorListeners(current);
                    installEditorListeners(current);
                    openDocument(current.document); 
                });
            openDocument(current.document); 
        }
    
        uninstallEditorListeners(previous);
        installEditorListeners(current, previous);
    };

    /**
     * Utility function to make the jump
     * @param   {Object} curPos - target postion fo the cursor after the jump
     */
    function setJumpSelection(curPos){
        EditorManager.getCurrentFullEditor().setCursorPos(curPos.line, curPos.ch, true);
        EditorManager.getCurrentFullEditor().setSelection(curPos);
    };

    /**
     * Method to handle jump to definition feature. 
     */
    function handleJumpToDefinition(){
        let editor = EditorManager.getFocusedEditor();
        let client = getActiveClient(editor.document);
        let pos = editor.getCursorPos();
        let content = editor.document.getText();
        let docPath = editor.document.file._path;
        let docPathUri = "file://"+docPath;
        
        // Only provide a php editor when cursor is in php content
        let langId = editor.document.getLanguage().getId();
        if (!(langId in _clientList)) {
            return null;
        }

        postRequest(client,{method:"textDocument/definition", param:{
			textDocument: {
                uri: docPathUri,
                text: content
			},
			position: {
				line: pos.line,
				character: pos.ch
			}}
        }).done(function(msgObj){
            if(msgObj.method === "textDocument/definition"){
                if(msgObj.param.result){
                    let docUri = msgObj.param.result.uri;
                    let curPos = {};
                    curPos.line = msgObj.param.result.range.start.line;
                    curPos.ch = msgObj.param.result.range.start.character;
                    if(docUri !== docPathUri){
                        let docPath = docUri.substr(7);
                        CommandManager.execute(Commands.FILE_OPEN, {fullPath: docPath})
                        .done(function () {
                            setJumpSelection(curPos);
                        });
                    }
                    else{ //definition is in current document
                        setJumpSelection(curPos);
                    }
                }
            }
        }).fail(function(){
        });
    };

    /**
     * Publish the diagnostics information related to current document
     * @param   {Object} msgObj - json object containg information associated with 'textDocument/publishDiagnostics' notification from server
     */
    function publishDiagnostics(msgObj){
        let diagnostics = msgObj.param.params.diagnostics;
        let errors = [];
        diagnostics.forEach(obj => {
            let err  = {
                pos: { line:obj.range.start.line, ch: obj.range.start.character},
                message: obj.message,
                type: (obj.severity === 1 ? CodeInspection.Type.ERROR: (obj.severity === 2 ?  CodeInspection.Type.WARNING : CodeInspection.Type.META))
            };
            errors.push(err);
        });
        _diagnostics = {errors: errors};
        CodeInspection.requestRun("Diagnostics");
    };
    
    /**
     * Overriding the appReady for LanguageTool
     */
    AppInit.appReady(function () {
        EditorManager.on("activeEditorChange.brackets-hints", handleActiveEditorChange);
        EditorManager.registerJumpToDefProvider(handleJumpToDefinition);
        ExtensionUtils.loadStyleSheet(module, "styles/brackets-hints.css");
        ParameterHintManager.addCommands();
    });

    exports.initLanguageTooling = initLanguageTooling;
    exports.postNotification = postNotification;
    exports.postRequest = postRequest;
    exports.registerCallback = registerCallback;
});