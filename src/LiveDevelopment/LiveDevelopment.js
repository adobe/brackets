/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 * @author Jonathan Diehl <jdiehl@adobe.com>
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, forin: true, maxerr: 50, regexp: true */
/*global define, $, FileError, brackets */

/**
 * LiveDevelopment manages the Inspector, all Agents, and the active LiveDocument
 *
 * # STARTING
 *
 * To start a session call `open`. This will read the currentDocument from brackets,
 * launch the LiveBrowser (currently Chrome) with the remote debugger port open,
 * establish the Inspector connection to the remote debugger, and finally load all
 * agents.
 *
 * # STOPPING
 *
 * To stop a session call `close`. This will close the active browser window,
 * disconnect the Inspector, unload all agents, and clean up.
 *
 * # STATUS
 *
 * Status updates are dispatched as `statusChange` jQuery events. The status
 * codes are:
 *
 * -1: Error
 * 0: Inactive
 * 1: Connecting to the remote debugger
 * 2: Loading agents
 * 3: Active
 */
define(function LiveDevelopment(require, exports, module) {
    'use strict';

    var DocumentManager = require("document/DocumentManager");
    var EditorManager = require("editor/EditorManager");
    var NativeApp = require("utils/NativeApp");
    var Dialogs = require("widgets/Dialogs");
    var Strings = require("strings");

    // Inspector
    var Inspector = require("LiveDevelopment/Inspector/Inspector");

    // Documents
    var HTMLDocument = require("LiveDevelopment/Documents/HTMLDocument");
    var CSSDocument = require("LiveDevelopment/Documents/CSSDocument");
    var JSDocument = require("LiveDevelopment/Documents/JSDocument");

    // Agents
    var agents = {
        "console": require("LiveDevelopment/Agents/ConsoleAgent"),
        "remote": require("LiveDevelopment/Agents/RemoteAgent"),
        "network": require("LiveDevelopment/Agents/NetworkAgent"),
        "dom": require("LiveDevelopment/Agents/DOMAgent"),
        "css": require("LiveDevelopment/Agents/CSSAgent")
        /* FUTURE 
        "script": require("LiveDevelopment/Agents/ScriptAgent"),
        "highlight": require("LiveDevelopment/Agents/HighlightAgent"),
        "goto": require("LiveDevelopment/Agents/GotoAgent"),
        "edit": require("LiveDevelopment/Agents/EditAgent")
        */
    };

    var _liveDocument; // the live document
    var _document; // the open live-document

    /** Get the current document from the document manager
     * _adds extension, url and root to the document
     */
    function _getCurrentDocument() {
        var doc = DocumentManager.getCurrentDocument();
        if (doc) {
            var matches = /^(.*\/)(.+\.([^.]+))$/.exec(doc.file.fullPath);
            if (matches) {
                var prefix = "file://";
                
                // The file.fullPath on Windows starts with a drive letter ("C:").
                // In order to make it a valid file: URL we need to add an 
                // additional slash to the prefix.
                if (brackets.platform === "win") {
                    prefix += "/";
                }
                
                doc.extension = matches[3];
                doc.url = encodeURI(prefix + doc.file.fullPath);
    
                // the root represents the document that should be displayed in the browser
                // for live development (the file for HTML files, index.html for others)
                var fileName = /^html?$/.test(matches[3]) ? matches[2] : "index.html";
                doc.root = {url: encodeURI(prefix + matches[1] + fileName)};
            }
        }
        return doc;
    }

    /** Determine which document class should be used for a given document
     * @param {Document} document
     */
    function _classForDocument(doc) {
        switch (doc.extension) {
        case "css":
            return CSSDocument;
        /* FUTURE:
        case "js":
            return JSDocument;
        case "html":
        case "htm":
            return HTMLDocument;
        default:
            throw "Invalid document type: " + doc.extension;
        */
        }
        
        return null;
    }

    /** Close a live document */
    function _closeDocument() {
        if (_liveDocument) {
            _liveDocument.close();
            _liveDocument = undefined;
        }
    }

    /** Open a live document
     * @param {Document} source document to open
     */
    function _openDocument(doc, editor) {
        _closeDocument();
        var DocumentClass = _classForDocument(doc);
        if (DocumentClass) {
            _liveDocument = new DocumentClass(doc, editor);
        }
    }

    /** Unload the agents */
    function unloadAgents() {
        var i;
        for (i in agents) {
            if (agents.hasOwnProperty(i) && agents[i].unload) {
                agents[i].unload();
            }
        }
    }

    /** Load the agents */
    function loadAgents() {
        var i, promises = [];
        for (i in agents) {
            if (agents.hasOwnProperty(i) && agents[i].load) {
                promises.push(agents[i].load());
            }
        }
        return promises;
    }

    /** Update the status
     * @param {integer} new status
     */
    function _setStatus(status) {
        exports.status = status;
        $(exports).triggerHandler("statusChange", status);
    }

    /** Triggered by Inspector.error */
    function _onError(error) {
        console.error(error.message);
    }

    /** Run when all agents are loaded */
    function _onLoad() {
        var doc = _getCurrentDocument();
        if (doc) {
            var editor = EditorManager.getCurrentFullEditor();
            _openDocument(doc, editor);
        }
        _setStatus(3);
    }

    /** Triggered by Inspector.connect */
    function _onConnect() {
        var promises = loadAgents();
        _setStatus(2);
        $.when.apply(undefined, promises).then(_onLoad, _onError);
    }

    /** Triggered by Inspector.disconnect */
    function _onDisconnect() {
        unloadAgents();
        _closeDocument();
        _setStatus(0);
    }

    /** Open the Connection and go live */
    function open() {
        var doc = _getCurrentDocument();
        var browserStarted = false;
        var retryCount = 0;
                
        if (doc && doc.root) {
            // For Sprint 6, we only open live development connections for HTML files
            // FUTURE: Remove this test when we support opening connections for different
            // file types.
            if (doc.extension.indexOf('htm') !== 0) {
                return;
            }
            
            _setStatus(1);
            Inspector.connectToURL(doc.root.url).fail(function onConnectFail(err) {
                if (err === "CANCEL") {
                    return;
                }
                if (retryCount > 4) {
                    _setStatus(-1);
                    Dialogs.showModalDialog(
                        Dialogs.DIALOG_ID_LIVE_DEVELOPMENT,
                        Strings.LIVE_DEVELOPMENT_ERROR_TITLE,
                        Strings.LIVE_DEVELOPMENT_ERROR_MESSAGE
                    ).done(function (id) {
                        if (id === Dialogs.DIALOG_BTN_OK) {
                            // User has chosen to reload Chrome, quit the running instance
                            _setStatus(0);
                            NativeApp.closeLiveBrowser()
                                .done(function () {
                                    browserStarted = false;
                                    setTimeout(open);
                                })
                                .fail(function (err) {
                                    // Report error?
                                    _setStatus(-1);
                                    browserStarted = false;
                                });
                        }
                    });
                    return;
                }
                retryCount++;
                
                if (!browserStarted) {
                    NativeApp.openLiveBrowser(
                        doc.root.url
                    )
                        .done(function () {
                            browserStarted = true;
                        })
                        .fail(function (err) {
                            var message;
                            
                            _setStatus(-1);
                            if (err === FileError.NOT_FOUND_ERR) {
                                message = Strings.ERROR_CANT_FIND_CHROME;
                            } else {
                                message = Strings.format(Strings.ERROR_LAUNCHING_BROWSER, err);
                            }
                            
                            Dialogs.showModalDialog(
                                Dialogs.DIALOG_ID_ERROR,
                                Strings.ERROR_LAUNCHING_BROWSER_TITLE,
                                message
                            );
                        });
                }
                
                if (exports.status !== -1) {
                    setTimeout(function retryConnect() {
                        Inspector.connectToURL(doc.root.url).fail(onConnectFail);
                    }, 500);
                }
            });
        }
    }

    /** Close the Connection */
    function close() {
        if (Inspector.connected()) {
            Inspector.Runtime.evaluate("window.close()");
        }
        Inspector.disconnect();
        _setStatus(0);
    }

    /** Triggered by a document change from the DocumentManager */
    function _onDocumentChange() {
        var doc = _getCurrentDocument();
        if (Inspector.connected()) {
            if (!doc) {
                close();
            } else if (agents.network && agents.network.wasURLRequested(doc.url)) {
                _closeDocument();
                var editor = EditorManager.getCurrentFullEditor();
                _openDocument(doc, editor);
            } else {
                /* FUTURE: support live connections for docments other than html */
                if (doc.extension.indexOf('htm') === 0) {
                    close();
                    setTimeout(open);
                }
            }
        } else if (exports.config.autoconnect) {
            setTimeout(open);
        }
    }

    /** Hide any active highlighting */
    function hideHighlight() {
        if (Inspector.connected() && agents.highlight) {
            agents.highlight.hide();
        }
    }

    /** Initialize the LiveDevelopment Session */
    function init(theConfig) {
        exports.config = theConfig;
        Inspector.on("connect", _onConnect);
        Inspector.on("disconnect", _onDisconnect);
        Inspector.on("error", _onError);
        Inspector.on("load", _onLoad);
        $(DocumentManager).on("currentDocumentChange", _onDocumentChange);
    }

    // Export public functions
    exports.agents = agents;
    exports.open = open;
    exports.close = close;
    exports.hideHighlight = hideHighlight;
    exports.init = init;
});