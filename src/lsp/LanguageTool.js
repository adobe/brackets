define(function (require, exports, module) {
    "use strict";

    var AppInit                 = brackets.getModule("utils/AppInit"),
        ParameterHintManager    = require("lsp/ParameterHintManager"),
        HintUtils               = brackets.getModule("JSUtils/HintUtils"),
        ScopeManager            = brackets.getModule("JSUtils/ScopeManager"),
        LanguageManager         = brackets.getModule("language/LanguageManager"),
        DocumentManager         = brackets.getModule("document/DocumentManager"),
        FileUtils               = brackets.getModule("file/FileUtils"),
        ExtensionUtils          = brackets.getModule("utils/ExtensionUtils"),
        EditorManager           = brackets.getModule('editor/EditorManager'),
        CodeInspection          = brackets.getModule("language/CodeInspection"),
        LSPInterface            = require("lsp/LSPInterface"),
        Session                 = require("JSUtils/Session"),
        CodeHintManager         = brackets.getModule("editor/CodeHintManager"),
        CommandManager          = brackets.getModule("command/CommandManager"),
        Commands             = brackets.getModule("command/Commands"),
        Menus                   = brackets.getModule('command/Menus'),
        util                    = require("lsp/Util");

    let _commandID = {};
    let _clientList = {};
    let _session     = null;
    let _diagnostics = null;

    function LanguageClient() {
    };

    LanguageClient.prototype.hasHints = function (editor, implicitChar){
        let langId = editor.document.getLanguage().getId();
        if (langId in _clientList) {
            this.editor = editor;
            return true;
        }
        return false;
    };

    LanguageClient.prototype.getHints = function (implicitChar) {
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
                    util.formatTypeDataForToken($fHint, element);
                    hints.push($fHint);
                });
            }
            if(hints.length > 0){
                $deferredHints.resolve({"hints":hints});
            }
            else{
                $deferredHints.reject();
            }
        }).fail(function(){
            $deferredHints.reject();
        });

        return $deferredHints;
    };

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
        if (token.insertText) {
            txt = token.insertText;
        }
        this.editor.document.replaceRange(txt, start, end);
    };

    LanguageClient.prototype.getParameterHints = function(){
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
                        let obj = {};
                        obj.name = ele.label;
                        obj.type = "var";
                        paramList.push(obj);
                    });
                });
            }
            if(paramList.length > 0){
                $deferredHints.resolve(label);//paramList)
            }
            else{
                $deferredHints.reject();
            }
        }).fail(function(){
            $deferredHints.reject();
        });

        return $deferredHints;
    };
    
    function postRequest(client, msgObj){
        return LSPInterface.postRequest(client.getServerName(), msgObj);
    };

    function postNotification(client, msgObj){
        LSPInterface.postNotification(client.getServerName(), msgObj);
    };

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

    function registerCallback(client, method, callback){
        let serverName = client.getServerName();
        LSPInterface.registerCallback(serverName, method, callback);
    };

    function getActiveClient(document){
        let languageId = document.getLanguage().getId();
        if(_clientList[languageId]){
            return _clientList[languageId];
        }
    };

    function initializeSession(editor, previousEditor) {
        let session = new Session(editor);
        let client = getActiveClient(editor.document);
        if(client){
            _session = session;
        }
        ScopeManager.handleEditorChange(session, editor.document,
            previousEditor ? previousEditor.document : null);
        ParameterHintManager.setSession(session);
    };

    function installEditorListeners(editor, previousEditor) {
        if (editor ){//&& HintUtils.isSupportedLanguage(LanguageManager.getLanguageForPath(editor.document.file.fullPath).getId())) {
            initializeSession(editor, previousEditor);
            editor
                .on(HintUtils.eventName("change"), function (event, editor, changeList) {
                        ScopeManager.handleFileChange(changeList);
                        ParameterHintManager.popUpHintAtOpenParen();
                });
            ParameterHintManager.installListeners(editor);
        } else {
            _session = null;
        }
    };
    
    function uninstallEditorListeners(editor) {
        if (editor) {
            editor.off(HintUtils.eventName("change"));
            ParameterHintManager.uninstallListeners(editor);
        }
    };

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
    
    function handleActiveEditorChange(event, current, previous) {
        if (previous) {
            previous.document
                .off(HintUtils.eventName("languageChanged"));
            closeDocument(previous.document);
        }
        if (current) {
            current.document
                .on(HintUtils.eventName("languageChanged"), function () {
                    uninstallEditorListeners(current);
                    installEditorListeners(current);
                    openDocument(current.document); 
                });
            openDocument(current.document); 
        }
    
        uninstallEditorListeners(previous);
        installEditorListeners(current, previous);
    };

    function setJumpSelection(curPos){
        EditorManager.getCurrentFullEditor().setCursorPos(curPos.line, curPos.ch, true);
        EditorManager.getCurrentFullEditor().setSelection(curPos);
    };

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
        CodeInspection.requestRun("PHP Diagnostics");
    };
    
    AppInit.appReady(function () {


        EditorManager.on(HintUtils.eventName("activeEditorChange"), handleActiveEditorChange);
        EditorManager.registerJumpToDefProvider(handleJumpToDefinition);

        //DocumentManager.on("documentRefreshed",(event, doc)=>{openDocument(doc)});
        //installEditorListeners(EditorManager.getActiveEditor());
        ExtensionUtils.loadStyleSheet(module, "styles/brackets-hints.css");

        /*var MY_COMMAND_ID_FORWARD = 'gotodefinition';
        CommandManager.register('Go To Definition', MY_COMMAND_ID_FORWARD, handleGoToDef);
        var contextMenu = Menus.getContextMenu(Menus.ContextMenuIds.EDITOR_MENU);
        contextMenu.addMenuItem(MY_COMMAND_ID_FORWARD);*/

    });

    exports.initLanguageTooling = initLanguageTooling;
    exports.postNotification = postNotification;
    exports.postRequest = postRequest;
    exports.registerCallback = registerCallback;
});