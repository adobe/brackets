/*
 * Copyright (c) 2012 Adobe Systems Incorporated. All rights reserved.
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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, forin: true, maxerr: 50, regexp: true */
/*global define, $, brackets, window, open */

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
 * is passed as the first parameter and the reason for the change as the second
 * parameter. Currently only the "Inactive" status supports the reason parameter.
 * The status codes are:
 *
 * -1: Error
 *  0: Inactive
 *  1: Connecting to the remote debugger
 *  2: Loading agents
 *  3: Active
 *  4: Out of sync
 *
 * The reason codes are:
 * - null (Unknown reason)
 * - "explicit_close" (LiveDevelopment.close() was called)
 * - "navigated_away" (The browser changed to a location outside of the project)
 * - "detached_target_closed" (The tab or window was closed)
 * - "detached_replaced_with_devtools" (The developer tools were opened in the browser)
 */
define(function LiveDevelopment(require, exports, module) {
    "use strict";

    require("utils/Global");

    var _ = require("thirdparty/lodash");

    // Status Codes
    var STATUS_ERROR          = exports.STATUS_ERROR          = -1;
    var STATUS_INACTIVE       = exports.STATUS_INACTIVE       =  0;
    var STATUS_CONNECTING     = exports.STATUS_CONNECTING     =  1;
    var STATUS_LOADING_AGENTS = exports.STATUS_LOADING_AGENTS =  2;
    var STATUS_ACTIVE         = exports.STATUS_ACTIVE         =  3;
    var STATUS_OUT_OF_SYNC    = exports.STATUS_OUT_OF_SYNC    =  4;
    var STATUS_SYNC_ERROR     = exports.STATUS_SYNC_ERROR     =  5;

    var Async                = require("utils/Async"),
        Dialogs              = require("widgets/Dialogs"),
        DefaultDialogs       = require("widgets/DefaultDialogs"),
        DocumentManager      = require("document/DocumentManager"),
        EditorManager        = require("editor/EditorManager"),
        FileServer           = require("LiveDevelopment/Servers/FileServer").FileServer,
        FileSystemError      = require("filesystem/FileSystemError"),
        FileUtils            = require("file/FileUtils"),
        LiveDevServerManager = require("LiveDevelopment/LiveDevServerManager"),
        NativeApp            = require("utils/NativeApp"),
        PreferencesDialogs   = require("preferences/PreferencesDialogs"),
        ProjectManager       = require("project/ProjectManager"),
        Strings              = require("strings"),
        StringUtils          = require("utils/StringUtils"),
        UserServer           = require("LiveDevelopment/Servers/UserServer").UserServer;

    // Inspector
    var Inspector       = require("LiveDevelopment/Inspector/Inspector");

    // Documents
    var CSSDocument     = require("LiveDevelopment/Documents/CSSDocument"),
        HTMLDocument    = require("LiveDevelopment/Documents/HTMLDocument"),
        JSDocument      = require("LiveDevelopment/Documents/JSDocument");
    
    // Document errors
    var SYNC_ERROR_CLASS = "live-preview-sync-error";

    // Agents
    var CSSAgent = require("LiveDevelopment/Agents/CSSAgent"),
        NetworkAgent = require("LiveDevelopment/Agents/NetworkAgent");
    
    var agents = {
        "console"   : require("LiveDevelopment/Agents/ConsoleAgent"),
        "remote"    : require("LiveDevelopment/Agents/RemoteAgent"),
        "network"   : NetworkAgent,
        "dom"       : require("LiveDevelopment/Agents/DOMAgent"),
        "css"       : CSSAgent,
        "script"    : require("LiveDevelopment/Agents/ScriptAgent"),
        "highlight" : require("LiveDevelopment/Agents/HighlightAgent"),
        "goto"      : require("LiveDevelopment/Agents/GotoAgent"),
        "edit"      : require("LiveDevelopment/Agents/EditAgent")
    };

    // construct path to launch.html
    // window location is can be one of the following:
    // Installed:                /path/to/Brackets.app/Contents/www/index.html
    // Installed, dev:           /path/to/Brackets.app/Contents/dev/src/index.html
    // Installed, dev, test:     /path/to/Brackets.app/Contents/dev/test/SpecRunner.html
    // Arbitrary git repo:       /path/to/brackets/src/index.html
    // Arbitrary git repo, test: /path/to/brackets/test/SpecRunner.html
    var launcherUrl = window.location.pathname;

    // special case for test/SpecRunner.html since we can't tell how requirejs
    // baseUrl is configured dynamically
    launcherUrl = launcherUrl.replace("/test/SpecRunner.html", "/src/index.html");

    launcherUrl = launcherUrl.substr(0, launcherUrl.lastIndexOf("/")) + "/LiveDevelopment/launch.html";
    launcherUrl = window.location.origin + launcherUrl;

    // Some agents are still experimental, so we don't enable them all by default
    // However, extensions can enable them by calling enableAgent().
    // This object is used as a set (thus all properties have the value 'true').
    // Property names should match property names in the 'agents' object.
    var _enabledAgentNames = {
        "console"   : true,
        "remote"    : true,
        "network"   : true,
        "css"       : true,
        "highlight" : true
    };

    // store the names (matching property names in the 'agent' object) of agents that we've loaded
    var _loadedAgentNames = [];

    /** @type {HTMLDocument} */
    var _liveDocument;
    
    /** @type {Object.<string: {HTMLDocument|CSSDocument}>} */
    var _relatedDocuments = {};
    
    /**
     * Promise returned for each call to open()
     * @type {jQuery.Deferred}
     */
    var _openDeferred;
    
    /**
     * Promise returned for each call to close()
     * @type {jQuery.Deferred}
     */
    var _closeDeferred;

    // Disallow re-entrancy of loadAgents()
    var _loadAgentsPromise;
    
    /**
     * Current live preview server
     * @type {BaseServer}
     */
    var _server;

    function _isPromisePending(promise) {
        return promise && promise.state() === "pending";
    }
    
    function _isHtmlFileExt(ext) {
        return (FileUtils.isStaticHtmlFileExt(ext) ||
                (ProjectManager.getBaseUrl() && FileUtils.isServerHtmlFileExt(ext)));
    }
    
    function _isHtmlTemplateFileExt(path) {
        // HACK
        return FileUtils.getFileExtension(path) === "tmpl";
    }

    /** Get the current document from the document manager
     * _adds extension, url and root to the document
     */
    function _getCurrentDocument() {
        return DocumentManager.getCurrentDocument();
    }

    /** Determine which document class should be used for a given document
     * @param {Document} document
     */
    function _classForDocument(doc) {
        switch (doc.getLanguage().getId()) {
        case "css":
            return CSSDocument;
        case "javascript":
            return exports.config.experimental ? JSDocument : null;
        }

        if (_isHtmlFileExt(doc.file.fullPath) || _isHtmlTemplateFileExt(doc.file.fullPath)) {
            return HTMLDocument;
        }

        return null;
    }

    function getLiveDocForPath(path) {
        if (!_server) {
            return undefined;
        }
        
        return _server.get(path);
    }
    
    function getLiveDocForEditor(editor) {
        if (!editor) {
            return null;
        }
        return getLiveDocForPath(editor.document.file.fullPath);
    }

    /**
     * @private
     * Clears errors from line number gutter (line class)
     * @param {HTMLDocument|CSSDocument} liveDocument
     */
    function _doClearErrors(liveDocument) {
        var lineHandle;
        
        if (!liveDocument.editor ||
                !liveDocument._errorLineHandles ||
                !liveDocument._errorLineHandles.length) {
            return;
        }
        
        liveDocument.editor._codeMirror.operation(function () {
            while (true) {
                // Iterate over all lines that were previously marked with an error
                lineHandle = liveDocument._errorLineHandles.pop();
                
                if (!lineHandle) {
                    break;
                }
                
                liveDocument.editor._codeMirror.removeLineClass(lineHandle, "wrap", SYNC_ERROR_CLASS);
            }
        });
    }

    /**
     * @private
     * Close a live document
     */
    function _closeDocument(liveDocument) {
        _doClearErrors(liveDocument);
        liveDocument.close();
        
        if (liveDocument.editor) {
            $(liveDocument.editor).off(".livedev");
        }
        
        $(liveDocument).off(".livedev");
    }
    
    /**
     * Removes the given CSS/JSDocument from _relatedDocuments. Signals that the
     * given file is no longer associated with the HTML document that is live (e.g.
     * if the related file has been deleted on disk).
     */
    function _handleRelatedDocumentDeleted(event, liveDoc) {
        if (_relatedDocuments[liveDoc.doc.url]) {
            delete _relatedDocuments[liveDoc.doc.url];
        }
            
        if (_server) {
            _server.remove(liveDoc);
        }
        
        _closeDocument(liveDoc);
    }

    /**
     * Update the status. Triggers a statusChange event.
     * @param {number} status new status
     * @param {?string} closeReason Optional string key suffix to display to
     *     user when closing the live development connection (see LIVE_DEV_* keys)
     */
    function _setStatus(status, closeReason) {
        // Don't send a notification when the status didn't actually change
        if (status === exports.status) {
            return;
        }
        
        exports.status = status;
        
        var reason = status === STATUS_INACTIVE ? closeReason : null;
        $(exports).triggerHandler("statusChange", [status, reason]);
    }
    
    /**
     * @private
     * Event handler for live document errors. Displays error status in the editor gutter.
     * @param {$.Event} event
     * @param {HTMLDocument|CSSDocument} liveDocument
     * @param {Array.<{token: SimpleNode, startPos: Pos, endPos: Pos}>} errors 
     */
    function _handleLiveDocumentStatusChanged(liveDocument) {
        var startLine,
            endLine,
            lineInfo,
            i,
            lineHandle,
            status = (liveDocument.errors.length) ? STATUS_SYNC_ERROR : STATUS_ACTIVE;

        _setStatus(status);
        
        if (!liveDocument.editor) {
            return;
        }

        // Buffer addLineClass DOM changes in a CodeMirror operation
        liveDocument.editor._codeMirror.operation(function () {
            // Remove existing errors before marking new ones
            _doClearErrors(liveDocument);
            
            liveDocument._errorLineHandles = liveDocument._errorLineHandles || [];
    
            liveDocument.errors.forEach(function (error) {
                startLine = error.startPos.line;
                endLine = error.endPos.line;
                
                for (i = startLine; i < endLine + 1; i++) {
                    lineHandle = liveDocument.editor._codeMirror.addLineClass(i, "wrap", SYNC_ERROR_CLASS);
                    liveDocument._errorLineHandles.push(lineHandle);
                }
            });
        });
    }

    /**
     * @private
     * Close all live documents
     */
    function _closeDocuments() {
        if (_liveDocument) {
            _closeDocument(_liveDocument);
            _liveDocument = undefined;
        }
        
        Object.keys(_relatedDocuments).forEach(function (url) {
            _closeDocument(_relatedDocuments[url]);
            delete _relatedDocuments[url];
        });
        
        // Clear all documents from request filtering
        if (_server) {
            _server.clear();
        }
    }

    /**
     * @private
     * Create a live version of a Brackets document
     * @param {Document} doc
     * @param {Editor} editor
     * @return {?(HTMLDocument|CSSDocument)}
     */
    function _createDocument(doc, editor) {
        var DocClass        = _classForDocument(doc),
            liveDocument    = new DocClass(doc, editor);

        if (!DocClass) {
            return null;
        }

        $(liveDocument).on("statusChanged.livedev", function () {
            _handleLiveDocumentStatusChanged(liveDocument);
        });

        return liveDocument;
    }

    /** Enable an agent. Takes effect next time a connection is made. Does not affect
     *  current live development sessions.
     *
     *  @param {string} name of agent to enable
     */
    function enableAgent(name) {
        if (agents.hasOwnProperty(name) && !_enabledAgentNames.hasOwnProperty(name)) {
            _enabledAgentNames[name] = true;
        }
    }

    /** Disable an agent. Takes effect next time a connection is made. Does not affect
     *  current live development sessions.
     *
     *  @param {string} name of agent to disable
     */
    function disableAgent(name) {
        if (_enabledAgentNames.hasOwnProperty(name)) {
            delete _enabledAgentNames[name];
        }
    }

    /** Documents are considered to be out-of-sync if they are dirty and
     *  do not have "update while editing" support
     * @param {Document} doc
     */
    function _docIsOutOfSync(doc) {
        var docClass    = _classForDocument(doc),
            liveDoc     = _server && _server.get(doc.file.fullPath),
            isLiveEditingEnabled = liveDoc && liveDoc.isLiveEditingEnabled();

        return doc.isDirty && !isLiveEditingEnabled;
    }
    
    /** Triggered by Inspector.error */
    function _onError(event, error, msgData) {
        var message;
        
        // Sometimes error.message is undefined
        if (!error.message) {
            console.warn("Expected a non-empty string in error.message, got this instead:", error.message);
            message = JSON.stringify(error);
        } else {
            message = error.message;
        }

        // Remove "Uncaught" from the beginning to avoid the inspector popping up
        if (message && message.substr(0, 8) === "Uncaught") {
            message = message.substr(9);
        }

        // Additional information, like exactly which parameter could not be processed.
        var data = error.data;
        if (Array.isArray(data)) {
            message += "\n" + data.join("\n");
        }

        // Show the message, but include the error object for further information (e.g. error code)
        console.error(message, error, msgData);
    }
    
    function _handleRequestedDoc(url, type, callback) {
        var path = _server && _server.urlToPath(url),
            exists = !!_relatedDocuments[url];

        // path may be null if loading an external stylesheet.
        // Also, the stylesheet may already exist and be reported as added twice
        // due to Chrome reporting added/removed events after incremental changes
        // are pushed to the browser
        if (!path || exists) {
            return;
        }

        var docPromise = DocumentManager.getDocumentForPath(path);

        docPromise.done(function (doc) {
            if ((_classForDocument(doc) === type) &&
                    (!_liveDocument || (doc !== _liveDocument.doc))) {
                var liveDoc = _createDocument(doc);
                if (liveDoc) {
                    // HACK STUPID
                    if (callback) {
                        callback(liveDoc);
                    } else {
                        _server.add(liveDoc);
                    }
                    _relatedDocuments[doc.url] = liveDoc;

                    $(liveDoc).on("deleted.livedev", _handleRelatedDocumentDeleted);
                }
            }
        });
    }
    
    function _styleSheetAdded(event, url) {
        _handleRequestedDoc(url, CSSDocument);
    }
    
    function _urlRequested(event, url) {
        _handleRequestedDoc(url, HTMLDocument);
    }
    
    function _handleNeedLiveDocument(event, path, callback) {
        // TODO: should map extensions to doc types
        _handleRequestedDoc(_server && _server.pathToUrl(path), HTMLDocument, callback);
    }

    /** Unload the agents */
    function unloadAgents() {
        _loadedAgentNames.forEach(function (name) {
            agents[name].unload();
        });
        _loadedAgentNames = [];
    }
    
    /**
     * @private
     * Invoke a no-arg method on an inspector agent
     * @param {string} name Agent name
     * @param {stirng} methodName Method name to call on the agent
     */
    function _invokeAgentMethod(name, methodName) {
        var oneAgentPromise;

        if (agents[name] && agents[name][methodName]) {
            oneAgentPromise = agents[name][methodName].call();
        }

        if (!oneAgentPromise) {
            oneAgentPromise = new $.Deferred().resolve().promise();
        } else {
            oneAgentPromise.fail(function () {
                console.error(methodName + " failed on agent", name);
            });
        }

        return oneAgentPromise;
    }

    function getEnabledAgents() {
        var enabledAgents;

        // Select agents to use
        if (exports.config.experimental) {
            // load all agents
            enabledAgents = agents;
        } else {
            // load only enabled agents
            enabledAgents = _enabledAgentNames;
        }
        
        return Object.keys(enabledAgents);
    }
    
    /**
     * @private
     * Setup agents that need inspector domains enabled before loading
     */
    function _enableAgents() {
        // enable agents in parallel
        return Async.doInParallel(
            getEnabledAgents(),
            function (name) {
                return _invokeAgentMethod(name, "enable");
            },
            true
        );
    }

    /** Load the agents */
    function loadAgents() {
        // If we're already loading agents return same promise
        if (_loadAgentsPromise) {
            return _loadAgentsPromise;
        }
        
        var result = new $.Deferred(),
            promises = [],
            enableAgentsPromise,
            allAgentsPromise;

        _loadAgentsPromise = result.promise();

        _setStatus(STATUS_LOADING_AGENTS);

        // load agents in parallel
        allAgentsPromise = Async.doInParallel(
            getEnabledAgents(),
            function (name) {
                return _invokeAgentMethod(name, "load").done(function () {
                    _loadedAgentNames.push(name);
                });
            },
            true
        );

        // wrap agent loading with a timeout
        allAgentsPromise = Async.withTimeout(allAgentsPromise, 10000);

        allAgentsPromise.done(function () {
            var doc = (_liveDocument) ? _liveDocument.doc : null;

            if (doc) {
                var status = STATUS_ACTIVE;

                if (_docIsOutOfSync(doc)) {
                    status = STATUS_OUT_OF_SYNC;
                }
                
                _setStatus(status);
                result.resolve();
            } else {
                result.reject();
            }
        });

        allAgentsPromise.fail(result.reject);
        
        _loadAgentsPromise
            .fail(function () {
                // show error loading live dev dialog
                _setStatus(STATUS_ERROR);

                Dialogs.showModalDialog(
                    Dialogs.DIALOG_ID_ERROR,
                    Strings.LIVE_DEVELOPMENT_ERROR_TITLE,
                    Strings.LIVE_DEV_LOADING_ERROR_MESSAGE
                );
            })
            .always(function () {
                _loadAgentsPromise = null;
            });

        return _loadAgentsPromise;
    }

    /**
     * @private
     * Determine an index file that can be used to start Live Development.
     * This function will inspect all files in a project to find the closest index file
     * available for currently opened document. We are searching for these files:
     *  - index.html
     *  - index.htm
     * 
     * If the project is configured with a custom base url for live developmment, then
     * the list of possible index files is extended to contain these index files too:
     *  - index.php
     *  - index.php3
     *  - index.php4
     *  - index.php5
     *  - index.phtm
     *  - index.phtml
     *  - index.cfm
     *  - index.cfml
     *  - index.asp
     *  - index.aspx
     *  - index.jsp
     *  - index.jspx
     *  - index.shm
     *  - index.shml
     * 
     * If a file was found, the promise will be resolved with the full path to this file. If no file
     * was found in the whole project tree, the promise will be resolved with null.
     * 
     * @return {jQuery.Promise} A promise that is resolved with a full path
     * to a file if one could been determined, or null if there was no suitable index
     * file.
     */
    function _getInitialDocFromCurrent() {
        var doc = _getCurrentDocument(),
            refPath,
            i;

        // TODO: FileUtils.getParentFolder()
        function getParentFolder(path) {
            return path.substring(0, path.lastIndexOf('/', path.length - 2) + 1);
        }

        function getFilenameWithoutExtension(filename) {
            var index = filename.lastIndexOf(".");
            return index === -1 ? filename : filename.slice(0, index);
        }

        // Is the currently opened document already a file we can use for Live Development?
        if (doc) {
            refPath = doc.file.fullPath;
            if (FileUtils.isStaticHtmlFileExt(refPath) || FileUtils.isServerHtmlFileExt(refPath)) {
                return new $.Deferred().resolve(doc);
            }
        }

        var result = new $.Deferred();

        var baseUrl = ProjectManager.getBaseUrl(),
            hasOwnServerForLiveDevelopment = (baseUrl && baseUrl.length);

        ProjectManager.getAllFiles().done(function (allFiles) {
            var projectRoot = ProjectManager.getProjectRoot().fullPath,
                containingFolder,
                indexFileFound = false,
                stillInProjectTree = true;
            
            if (refPath) {
                containingFolder = FileUtils.getDirectoryPath(refPath);
            } else {
                containingFolder = projectRoot;
            }
            
            var filteredFiltered = allFiles.filter(function (item) {
                var parent = getParentFolder(item.fullPath);
                
                return (containingFolder.indexOf(parent) === 0);
            });
            
            var filterIndexFile = function (fileInfo) {
                if (fileInfo.fullPath.indexOf(containingFolder) === 0) {
                    if (getFilenameWithoutExtension(fileInfo.name) === "index") {
                        if (hasOwnServerForLiveDevelopment) {
                            if ((FileUtils.isServerHtmlFileExt(fileInfo.name)) ||
                                    (FileUtils.isStaticHtmlFileExt(fileInfo.name))) {
                                return true;
                            }
                        } else if (FileUtils.isStaticHtmlFileExt(fileInfo.name)) {
                            return true;
                        }
                    } else {
                        return false;
                    }
                }
            };

            while (!indexFileFound && stillInProjectTree) {
                i = _.findIndex(filteredFiltered, filterIndexFile);

                // We found no good match
                if (i === -1) {
                    // traverse the directory tree up one level
                    containingFolder = getParentFolder(containingFolder);
                    // Are we still inside the project?
                    if (containingFolder.indexOf(projectRoot) === -1) {
                        stillInProjectTree = false;
                    }
                } else {
                    indexFileFound = true;
                }
            }

            if (i !== -1) {
                DocumentManager.getDocumentForPath(filteredFiltered[i].fullPath).then(result.resolve, result.resolve);
                return;
            }
            
            result.resolve(null);
        });

        return result.promise();
    }

    /**
     * @private
     * While still connected to the Inspector, do cleanup for agents,
     * documents and server.
     * @param {boolean} doCloseWindow Use true to close the window/tab in the browser
     * @return {jQuery.Promise} A promise that is always resolved
     */
    function _doInspectorDisconnect(doCloseWindow) {
        var closePromise,
            deferred    = new $.Deferred(),
            connected   = Inspector.connected();

        $(Inspector.Page).off(".livedev");
        $(Inspector).off(".livedev");

        // Wait if agents are loading
        if (_loadAgentsPromise) {
            _loadAgentsPromise.always(unloadAgents);
        } else {
            unloadAgents();
        }
        
        // Close live documents 
        _closeDocuments();
        
        if (_server) {
            // Stop listening for requests when disconnected
            $(_server).off(".livedev");
            _server.stop();

            // Dispose server
            _server = null;
        }

        if (doCloseWindow && connected) {
            closePromise = Inspector.Runtime.evaluate("window.open('', '_self').close();");

            // Add a timeout to continue cleanup if Inspector does not respond
            closePromise = Async.withTimeout(closePromise, 5000);
        } else {
            closePromise = new $.Deferred().resolve();
        }

        // Disconnect WebSocket if connected
        closePromise.always(function () {
            if (Inspector.connected()) {
                Inspector.disconnect().always(deferred.resolve);
            } else {
                deferred.resolve();
            }
        });

        return deferred.promise();
    }

    /**
     * @private
     * Close the connection and the associated window asynchronously
     * @param {boolean} doCloseWindow Use true to close the window/tab in the browser
     * @param {?string} reason Optional string key suffix to display to user (see LIVE_DEV_* keys)
     * @return {jQuery.Promise} Always return a resolved promise once the connection is closed
     */
    function _close(doCloseWindow, reason) {
        if (_closeDeferred) {
            return _closeDeferred;
        } else {
            _closeDeferred = new $.Deferred();
            _closeDeferred.always(function () {
                _closeDeferred = null;
            });
        }

        var promise = _closeDeferred.promise();

        /*
         * Finish closing the live development connection, including setting
         * the status accordingly.
         */
        function cleanup() {
            // Need to do this in order to trigger the corresponding CloseLiveBrowser cleanups required on 
            // the native Mac side
            var closeDeferred = (brackets.platform === "mac") ? NativeApp.closeLiveBrowser() : $.Deferred().resolve();
            closeDeferred.done(function () {
                _setStatus(STATUS_INACTIVE, reason || "explicit_close");
                _closeDeferred.resolve();
            }).fail(function (err) {
                if (err) {
                    reason +=  " (" + err + ")";
                }
                _setStatus(STATUS_INACTIVE, reason || "explicit_close");
                _closeDeferred.resolve();
            });
        }
        
        if (_isPromisePending(_openDeferred)) {
            // Reject calls to open if requests are still pending
            _openDeferred.reject();
        }

        if (exports.status === STATUS_INACTIVE) {
            // Ignore close if status is inactive
            _closeDeferred.resolve();
        } else {
            _doInspectorDisconnect(doCloseWindow).always(cleanup);
        }
        
        return promise;
    }

    // WebInspector Event: Page.frameNavigated
    function _onFrameNavigated(event, res) {
        // res = {frame}
        var url = res.frame.url,
            baseUrl,
            baseUrlRegExp;

        // Only check domain of root frame (with undefined parentId)
        if (res.frame.parentId) {
            return;
        }

        // Any local file is OK
        if (url.match(/^file:\/\//i) || !_server) {
            return;
        }

        // Need base url to build reg exp
        baseUrl = _server.getBaseUrl();
        if (!baseUrl) {
            return;
        }

        // Test that url is within site
        baseUrlRegExp = new RegExp("^" + StringUtils.regexEscape(baseUrl), "i");
        if (!url.match(baseUrlRegExp)) {
            // No longer in site, so terminate live dev, but don't close browser window
            _close(false, "navigated_away");
        }
    }

    /**
     * @private
     * Triggered by unexpected Inspector disconnect event
     */
    function _onDisconnect(event) {
        _close(false, "closed_unknown_reason");
    }

    function _onDetached(event, res) {
        var closeReason;

        if (res && res.reason) {
            // Get the explanation from res.reason, e.g. "replaced_with_devtools", "target_closed", "canceled_by_user"
            // Examples taken from https://chromiumcodereview.appspot.com/10947037/patch/12001/13004
            // However, the link refers to the Chrome Extension API, it may not apply 100% to the Inspector API
            // Prefix with "detached_" to create a quasi-namespace for Chrome's reasons
            closeReason = "detached_" + res.reason;
        }

        _close(false, closeReason);
    }

    /**
     * Unload and reload agents
     * @return {jQuery.Promise} Resolves once the agents are loaded
     */
    function reconnect() {
        if (_loadAgentsPromise) {
            // Agents are already loading, so don't unload
            return _loadAgentsPromise;
        }

        unloadAgents();
        return loadAgents();
    }

    /**
     * Close the connection and the associated window asynchronously
     * @return {jQuery.Promise} Resolves once the connection is closed
     */
    function close() {
        return _close(true);
    }
    
    /**
     * @private
     * Create a promise that resolves when the interstitial page has
     * finished loading.
     * 
     * @return {jQuery.Promise} Resolves once page is loaded
     */
    function _waitForInterstitialPageLoad() {
        var deferred    = $.Deferred(),
            keepPolling = true,
            timer       = window.setTimeout(function () {
                keepPolling = false;
                deferred.reject();
            }, 10000); // 10 seconds
        
        /* 
         * Asynchronously check to see if the interstitial page has
         * finished loading; if not, check again until timing out.
         */
        function pollInterstitialPage() {
            if (keepPolling && Inspector.connected()) {
                Inspector.Runtime.evaluate("window.isBracketsLiveDevelopmentInterstitialPageLoaded", function (response) {
                    var result = response.result;
                    
                    if (result.type === "boolean" && result.value) {
                        window.clearTimeout(timer);
                        deferred.resolve();
                    } else {
                        window.setTimeout(pollInterstitialPage, 100);
                    }
                });
            } else {
                deferred.reject();
            }
        }
        
        pollInterstitialPage();
        return deferred.promise();
    }
        
    /**
     * @private
     * Load agents and navigate to the target document once the 
     * interstitial page has finished loading.
     */
    function _onInterstitialPageLoad() {
        // Domains for some agents must be enabled first before loading
        var enablePromise = Inspector.Page.enable().then(_enableAgents);
        
        enablePromise.done(function () {
            // Some agents (e.g. DOMAgent and RemoteAgent) require us to
            // navigate to the page first before loading can complete.
            // To accomodate this, we load all agents and navigate in
            // parallel.

            // resolve/reject the open() promise after agents complete
            loadAgents().then(_openDeferred.resolve, _openDeferred.reject);

            _getInitialDocFromCurrent().done(function (doc) {
                if (doc && _liveDocument && doc === _liveDocument.doc) {
                    // Navigate from interstitial to the document
                    // Fires a frameNavigated event
                    if (_server) {
                        Inspector.Page.navigate(_server.pathToUrl(doc.file.fullPath));
                    } else {
                        console.error("LiveDevelopment._onInterstitialPageLoad(): No server active");
                    }
                } else {
                    // Unlikely that we would get to this state where
                    // a connection is in process but there is no current
                    // document
                    close();
                }
            });
        });
    }
    
    /** Triggered by Inspector.connect */
    function _onConnect(event) {
        // When the browser navigates away from the primary live document
        $(Inspector.Page).on("frameNavigated.livedev", _onFrameNavigated);

        // When the Inspector WebSocket disconnects unexpectedely
        $(Inspector).on("disconnect.livedev", _onDisconnect);
		
        _waitForInterstitialPageLoad()
            .fail(function () {
                close();

                Dialogs.showModalDialog(
                    DefaultDialogs.DIALOG_ID_ERROR,
                    Strings.LIVE_DEVELOPMENT_ERROR_TITLE,
                    Strings.LIVE_DEV_LOADING_ERROR_MESSAGE
                );
            })
            .done(_onInterstitialPageLoad);
    }

    function _showWrongDocError() {
        Dialogs.showModalDialog(
            DefaultDialogs.DIALOG_ID_ERROR,
            Strings.LIVE_DEVELOPMENT_ERROR_TITLE,
            Strings.LIVE_DEV_NEED_HTML_MESSAGE
        );
        _openDeferred.reject();
    }

    function _showLiveDevServerNotReadyError() {
        Dialogs.showModalDialog(
            DefaultDialogs.DIALOG_ID_ERROR,
            Strings.LIVE_DEVELOPMENT_ERROR_TITLE,
            Strings.LIVE_DEV_SERVER_NOT_READY_MESSAGE
        );
        _openDeferred.reject();
    }
    
    function _openInterstitialPage() {
        var browserStarted  = false,
            retryCount      = 0;
        
        // Open the live browser if the connection fails, retry 3 times
        Inspector.connectToURL(launcherUrl).fail(function onConnectFail(err) {
            if (err === "CANCEL") {
                _openDeferred.reject(err);
                return;
            }

            if (retryCount > 3) {
                _setStatus(STATUS_ERROR);

                var dialogPromise = Dialogs.showModalDialog(
                    DefaultDialogs.DIALOG_ID_LIVE_DEVELOPMENT,
                    Strings.LIVE_DEVELOPMENT_RELAUNCH_TITLE,
                    Strings.LIVE_DEVELOPMENT_ERROR_MESSAGE,
                    [
                        {
                            className: Dialogs.DIALOG_BTN_CLASS_LEFT,
                            id:        Dialogs.DIALOG_BTN_CANCEL,
                            text:      Strings.CANCEL
                        },
                        {
                            className: Dialogs.DIALOG_BTN_CLASS_PRIMARY,
                            id:        Dialogs.DIALOG_BTN_OK,
                            text:      Strings.RELAUNCH_CHROME
                        }
                    ]
                );

                dialogPromise.done(function (id) {
                    if (id === Dialogs.DIALOG_BTN_OK) {
                        // User has chosen to reload Chrome, quit the running instance
                        _setStatus(STATUS_INACTIVE);
                        _close()
                            .done(function () {
                                browserStarted = false;
                                // Continue to use _openDeferred
                                open(true);
                            })
                            .fail(function (err) {
                                // Report error?
                                _setStatus(STATUS_ERROR);
                                browserStarted = false;
                                _openDeferred.reject("CLOSE_LIVE_BROWSER");
                            });
                    } else {
                        _close()
                            .done(function () {
                                browserStarted = false;
                                _openDeferred.reject("CANCEL");
                            })
                            .fail(function (err) {
                                // Report error?
                                _setStatus(STATUS_ERROR);
                                browserStarted = false;
                                _openDeferred.reject("CLOSE_LIVE_BROWSER");
                            });
                    }
                });

                return;
            }
            retryCount++;

            if (!browserStarted && exports.status !== STATUS_ERROR) {
                NativeApp.openLiveBrowser(
                    launcherUrl,
                    true        // enable remote debugging
                )
                    .done(function () {
                        browserStarted = true;
                    })
                    .fail(function (err) {
                        var message;

                        _setStatus(STATUS_ERROR);
                        if (err === FileSystemError.NOT_FOUND) {
                            message = Strings.ERROR_CANT_FIND_CHROME;
                        } else {
                            message = StringUtils.format(Strings.ERROR_LAUNCHING_BROWSER, err);
                        }
                        
                        // Append a message to direct users to the troubleshooting page.
                        if (message) {
                            message += " " + StringUtils.format(Strings.LIVE_DEVELOPMENT_TROUBLESHOOTING, brackets.config.troubleshoot_url);
                        }

                        Dialogs.showModalDialog(
                            DefaultDialogs.DIALOG_ID_ERROR,
                            Strings.ERROR_LAUNCHING_BROWSER_TITLE,
                            message
                        );

                        _openDeferred.reject("OPEN_LIVE_BROWSER");
                    });
            }
                
            if (exports.status !== STATUS_ERROR) {
                window.setTimeout(function retryConnect() {
                    Inspector.connectToURL(launcherUrl).fail(onConnectFail);
                }, 3000);
            }
        });
    }

    function _createLiveDocumentForFrame(doc) {
        // create live document
        doc._ensureMasterEditor();
        _liveDocument = _createDocument(doc, doc._masterEditor);
        _server.add(_liveDocument);
    }
    
    // helper function that actually does the launch once we are sure we have
    // a doc and the server for that doc is up and running.
    function _doLaunchAfterServerReady(initialDoc) {
        // update status
        _setStatus(STATUS_CONNECTING);
        _createLiveDocumentForFrame(initialDoc);

        // start listening for requests
        _server.start();

        // Install a one-time event handler when connected to the launcher page
        $(Inspector).one("connect", _onConnect);
        
        // open browser to the interstitial page to prepare for loading agents
        _openInterstitialPage();
    }
    
    function _prepareServer(doc) {
        var deferred = new $.Deferred(),
            showBaseUrlPrompt = false;
        
        _server = LiveDevServerManager.getServer(doc.file.fullPath);
        $(_server).on("needLiveDocument.livedev", _handleNeedLiveDocument);

        // Optionally prompt for a base URL if no server was found but the
        // file is a known server file extension
        showBaseUrlPrompt = !exports.config.experimental && !_server &&
            FileUtils.isServerHtmlFileExt(doc.file.fullPath);

        if (showBaseUrlPrompt) {
            // Prompt for a base URL
            PreferencesDialogs.showProjectPreferencesDialog("", Strings.LIVE_DEV_NEED_BASEURL_MESSAGE)
                .done(function (id) {
                    if (id === Dialogs.DIALOG_BTN_OK && ProjectManager.getBaseUrl()) {
                        // If base url is specifed, then re-invoke _prepareServer() to continue
                        _prepareServer(doc).then(deferred.resolve, deferred.reject);
                    } else {
                        deferred.reject();
                    }
                });
        } else if (_server) {
            // Startup the server
            var readyPromise = _server.readyToServe();
            if (!readyPromise) {
                _showLiveDevServerNotReadyError();
                deferred.reject();
            } else {
                readyPromise.then(deferred.resolve, function () {
                    _showLiveDevServerNotReadyError();
                    deferred.reject();
                });
            }
        } else {
            // No server found
            deferred.reject();
        }
        
        return deferred.promise();
    }

    /**
     * Open the Connection and go live
     *
     * @param {!boolean} restart  true if relaunching and _openDeferred already exists
     * @return {jQuery.Promise} Resolves once live preview is open
     */
    function open(restart) {
        // If close() is still pending, wait for close to finish before opening
        if (_isPromisePending(_closeDeferred)) {
            return _closeDeferred.then(function () {
                return open(restart);
            });
        }

        if (!restart) {
            // Return existing promise if it is still pending
            if (_isPromisePending(_openDeferred)) {
                return _openDeferred;
            } else {
                _openDeferred = new $.Deferred();
                _openDeferred.always(function () {
                    _openDeferred = null;
                });
            }
        }
        
        // TODO: need to run _onDocumentChange() after load if doc != currentDocument here? Maybe not, since activeEditorChange
        // doesn't trigger it, while inline editors can still cause edits in doc other than currentDoc...
        _getInitialDocFromCurrent().done(function (doc) {
            var prepareServerPromise = (doc && _prepareServer(doc)) || new $.Deferred().reject(),
                otherDocumentsInWorkingFiles;

            if (doc && !doc._masterEditor) {
                otherDocumentsInWorkingFiles = DocumentManager.getWorkingSet().length;
                DocumentManager.addToWorkingSet(doc.file);

                if (!otherDocumentsInWorkingFiles) {
                    DocumentManager.setCurrentDocument(doc);
                }
            }

            // wait for server (StaticServer, Base URL or file:)
            prepareServerPromise
                .done(function () {
                    _doLaunchAfterServerReady(doc);
                })
                .fail(function () {
                    _showWrongDocError();
                });
        });

        return _openDeferred.promise();
    }
    
    /** Enable highlighting */
    function showHighlight() {
        var doc = getLiveDocForEditor(EditorManager.getActiveEditor());
        
        if (doc && doc.updateHighlight) {
            doc.updateHighlight();
        }
    }

    /** Hide any active highlighting */
    function hideHighlight() {
        if (Inspector.connected() && agents.highlight) {
            agents.highlight.hide();
        }
    }
    
    /** Redraw highlights **/
    function redrawHighlight() {
        if (Inspector.connected() && agents.highlight) {
            agents.highlight.redraw();
        }
    }

    /**
     * @private
     * DocumentManager currentDocumentChange event handler. 
     */
    function _onDocumentChange() {
        var doc = _getCurrentDocument();
        
        if (!doc || !Inspector.connected()) {
            return;
        }
        
        // close the current session and begin a new session if the current
        // document changes to an HTML document that was not loaded yet
        var docUrl = _server && _server.pathToUrl(doc.file.fullPath),
            wasRequested = agents.network && agents.network.wasURLRequested(docUrl),
            isViewable = exports.config.experimental || (_server && _server.canServe(doc.file.fullPath));
        
        if (!wasRequested && isViewable) {
            // Update status
            _setStatus(STATUS_CONNECTING);

            // clear live doc and related docs
            _closeDocuments();

            // create new live doc
            _createLiveDocumentForFrame(doc);

            // Navigate to the new page within this site. Agents must handle
            // frameNavigated event to clear any saved state.
            Inspector.Page.navigate(docUrl).then(function () {
                _setStatus(STATUS_ACTIVE);
            }, function () {
                _close(false, "closed_unknown_reason");
            });
        } else if (wasRequested) {
            // Update highlight
            showHighlight();
        }
    }

    /**
     * Triggered by a documentSaved event from DocumentManager.
     * @param {$.Event} event
     * @param {Document} doc
     */
    function _onDocumentSaved(event, doc) {
        if (!Inspector.connected() || !_server) {
            return;
        }
        
        var absolutePath            = doc.file.fullPath,
            liveDocument            = absolutePath && _server.get(absolutePath),
            liveEditingEnabled      = liveDocument && liveDocument.isLiveEditingEnabled  && liveDocument.isLiveEditingEnabled();
        
        // Skip reload if the saved document has live editing enabled
        if (liveEditingEnabled) {
            return;
        }
        
        var documentUrl     = _server.pathToUrl(absolutePath),
            wasRequested    = agents.network && agents.network.wasURLRequested(documentUrl);
        
        if (wasRequested) {
            // Unload and reload agents before reloading the page
            // Some agents (e.g. DOMAgent and RemoteAgent) require us to
            // navigate to the page first before loading can complete.
            // To accomodate this, we load all agents (in reconnect())
            // and navigate in parallel.
            reconnect();

            // Reload HTML page
            Inspector.Page.reload();
        }
    }

    /** Triggered by a change in dirty flag from the DocumentManager */
    function _onDirtyFlagChange(event, doc) {
        if (doc && Inspector.connected() &&
                _server && agents.network && agents.network.wasURLRequested(_server.pathToUrl(doc.file.fullPath))) {
            // Set status to out of sync if dirty. Otherwise, set it to active status.
            _setStatus(_docIsOutOfSync(doc) ? STATUS_OUT_OF_SYNC : STATUS_ACTIVE);
        }
    }

    function getCurrentProjectServerConfig() {
        return {
            baseUrl: ProjectManager.getBaseUrl(),
            pathResolver: ProjectManager.makeProjectRelativeIfPossible,
            root: ProjectManager.getProjectRoot().fullPath
        };
    }
    
    function _createUserServer() {
        return new UserServer(getCurrentProjectServerConfig());
    }
    
    function _createFileServer() {
        return new FileServer(getCurrentProjectServerConfig());
    }

    /** Initialize the LiveDevelopment Session */
    function init(theConfig) {
        exports.config = theConfig;
        
        $(Inspector).on("error", _onError);
        $(Inspector.Inspector).on("detached", _onDetached);

        // Only listen for styleSheetAdded
        // We may get interim added/removed events when pushing incremental updates
        $(CSSAgent).on("styleSheetAdded.livedev", _styleSheetAdded);
        $(NetworkAgent).on("request.livedev", _urlRequested);
        
        $(DocumentManager).on("currentDocumentChange", _onDocumentChange)
            .on("documentSaved", _onDocumentSaved)
            .on("dirtyFlagChange", _onDirtyFlagChange);
        $(ProjectManager).on("beforeProjectClose beforeAppClose", close);
        
        // Register user defined server provider
        LiveDevServerManager.registerServer({ create: _createUserServer }, 99);
        LiveDevServerManager.registerServer({ create: _createFileServer }, 0);

        // Initialize exports.status
        _setStatus(STATUS_INACTIVE);
    }

    function _getServer() {
        return _server;
    }

    function getServerBaseUrl() {
        return _server && _server.getBaseUrl();
    }

    // For unit testing
    exports.launcherUrl               = launcherUrl;
    exports._getServer                = _getServer;
    exports._getInitialDocFromCurrent = _getInitialDocFromCurrent;

    // Export public functions
    exports.agents              = agents;
    exports.open                = open;
    exports.close               = close;
    exports.reconnect           = reconnect;
    exports.enableAgent         = enableAgent;
    exports.disableAgent        = disableAgent;
    exports.getLiveDocForPath   = getLiveDocForPath;
    exports.showHighlight       = showHighlight;
    exports.hideHighlight       = hideHighlight;
    exports.redrawHighlight     = redrawHighlight;
    exports.init                = init;
    exports.getCurrentProjectServerConfig = getCurrentProjectServerConfig;
    exports.getServerBaseUrl    = getServerBaseUrl;
});