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
 * LiveDevelopment allows Brackets to launch a browser with a "live preview" that's
 * connected to the current editor.
 *
 * # STARTING
 *
 * To start a session call `open`. This will read the currentDocument from brackets,
 * launch it in the default browser, and connect to it for live editing.
 *
 * # STOPPING
 *
 * To stop a session call `close`. This will close the connection to the browser
 * (but will not close the browser tab).
 *
 * # STATUS
 *
 * (TODO: some of these are likely obsolete in the new architecture)
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
define(function (require, exports, module) {
    "use strict";

    // Status Codes
    var STATUS_ERROR          = exports.STATUS_ERROR          = -1;
    var STATUS_INACTIVE       = exports.STATUS_INACTIVE       =  0;
    var STATUS_CONNECTING     = exports.STATUS_CONNECTING     =  1;
    var STATUS_ACTIVE         = exports.STATUS_ACTIVE         =  2;
    var STATUS_OUT_OF_SYNC    = exports.STATUS_OUT_OF_SYNC    =  3;
    var STATUS_SYNC_ERROR     = exports.STATUS_SYNC_ERROR     =  4;
    var STATUS_RELOADING      = exports.STATUS_RELOADING      =  5;
    var STATUS_RESTARTING     = exports.STATUS_RESTARTING     =  6;

    var Async                = require("utils/Async"),
        Dialogs              = require("widgets/Dialogs"),
        DefaultDialogs       = require("widgets/DefaultDialogs"),
        DocumentManager      = require("document/DocumentManager"),
        EditorManager        = require("editor/EditorManager"),
        ExtensionUtils       = require("utils/ExtensionUtils"),
        FileSystemError      = require("filesystem/FileSystemError"),
        FileUtils            = require("file/FileUtils"),
        PreferencesDialogs   = require("preferences/PreferencesDialogs"),
        ProjectManager       = require("project/ProjectManager"),
        Strings              = require("strings"),
        _                    = require("thirdparty/lodash"),
        LiveDevServerManager = require("LiveDevelopment/LiveDevServerManager"),
        NodeSocketTransport  = require("LiveDevelopment/impls/livedev2/transports/NodeSocketTransport"),
        LiveDevProtocol      = require("LiveDevelopment/impls/livedev2/protocol/LiveDevProtocol");
    
    // Documents
    var LiveCSSDocument     = require("LiveDevelopment/impls/livedev2/documents/LiveCSSDocument"),
        LiveHTMLDocument    = require("LiveDevelopment/impls/livedev2/documents/LiveHTMLDocument");
    
    /** 
     * @private
     * The live HTML document for the currently active preview.
     * @type {LiveHTMLDocument} 
     */
    var _liveDocument;
    
    /** 
     * @private
     * Live documents related to the active HTML document - for example, CSS files
     * that are used by the document.
     * TODO: this is not yet maintained in the new architecture - will need to be reimplemented.
     * @type {Object.<string: {LiveHTMLDocument|LiveCSSDocument}>}
     */
    var _relatedDocuments = {};
    
    /**
     * @private
     * Current transport for communicating with browser instances. See setTransport().
     * @type {{launch: function(string), send: function(number|Array.<number>, string), close: function(number)}}
     */
    var _transport;
    
    /**
     * @private
     * Protocol handler that provides the actual live development API on top of the current transport.
     */
    var _protocol = LiveDevProtocol;
    
    /**
     * @private
     * Current live preview server
     * @type {BaseServer}
     */
    var _server;
    
    /**
     * @private
     * Returns true if we think the given extension is for an HTML file.
     * @param {string} ext The extension to check.
     * @return {boolean} true if this is an HTML extension
     */
    function _isHtmlFileExt(ext) {
        return (FileUtils.isStaticHtmlFileExt(ext) ||
                (ProjectManager.getBaseUrl() && FileUtils.isServerHtmlFileExt(ext)));
    }

    /** 
     * @private
     * Get the current active document from the document manager.
     * TODO: might no longer be necessary - there used to be more stuff in here but I think it was
     * removed awhile ago.
     * @return {?Document} The currently active document, or null for no document.
     */
    function _getCurrentDocument() {
        return DocumentManager.getCurrentDocument();
    }

    /** 
     * @private
     * Determine which live document class should be used for a given document
     * @param {Document} document The document we want to create a live document for.
     * @return {function} The constructor for the live document class; will be a subclass of LiveDocument.
     */
    function _classForDocument(doc) {
        if (doc.getLanguage().getId() === "css") {
            return LiveCSSDocument;
        }

        if (_isHtmlFileExt(doc.file.fullPath)) {
            return LiveHTMLDocument;
        }

        return null;
    }
    
    /**
     * Returns true if the global Live Development mode is on (might be in the middle of connecting).
     * @return {boolean}
     */
    function isActive() {
        return exports.status > STATUS_INACTIVE;
    }
    
    /**
     * Returns the live document for a given path, or null if there is no live document for it.
     * @param {string} path
     * @return {?LiveDocument}
     */
    function getLiveDocForPath(path) {
        if (!_server) {
            return undefined;
        }
        
        return _server.get(path);
    }
    
    /**
     * Returns the live document for a given editor, or null if there is no live document for it.
     * @param {Editor} editor
     * @return {?LiveDocument}
     */
    function getLiveDocForEditor(editor) {
        if (!editor) {
            return null;
        }
        return getLiveDocForPath(editor.document.file.fullPath);
    }

    /**
     * @private
     * Close a live document.
     * @param {LiveDocument}
     */
    function _closeDocument(liveDocument) {
        $(liveDocument).off(".livedev");
        liveDocument.close();
    }
    
    /**
     * Removes the given CSS/JSDocument from _relatedDocuments. Signals that the
     * given file is no longer associated with the HTML document that is live (e.g.
     * if the related file has been deleted on disk).
     * @param {$.Event} event
     * @param {LiveDocument} liveDoc
     */
    function _handleRelatedDocumentDeleted(url) {
        var liveDoc = _relatedDocuments[url];
        if (liveDoc) {
            delete _relatedDocuments[url];
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
     * Close all live documents.
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
     * Returns the URL that we would serve the given path at.
     * @param {string} path
     * @return {string}
     */
    function _resolveUrl(path) {
        return _server && _server.pathToUrl(path);
    }

    /**
     * @private
     * Create a LiveDocument for a Brackets editor/document to manage communication between the
     * editor and the browser.
     * @param {Document} doc
     * @param {Editor} editor
     * @param {roots} roots
     * @return {?LiveDocument} The live document, or null if this type of file doesn't support live editing.
     */
    function _createLiveDocument(doc, editor, roots) {
        var DocClass        = _classForDocument(doc),
            liveDocument    = new DocClass(_protocol, _resolveUrl, doc, editor, roots);

        if (!DocClass) {
            return null;
        }

        $(liveDocument).on("errorStatusChanged.livedev", function (event, hasErrors) {
            if (isActive()) {
                _setStatus(hasErrors ? STATUS_SYNC_ERROR : STATUS_ACTIVE);
            }
        });

        return liveDocument;
    }

    /** 
     * Documents are considered to be out-of-sync if they are dirty and
     * do not have "update while editing" support
     * @param {Document} doc
     * @return {boolean}
     */
    function _docIsOutOfSync(doc) {
        var docClass    = _classForDocument(doc),
            liveDoc     = _server && _server.get(doc.file.fullPath),
            isLiveEditingEnabled = liveDoc && liveDoc.isLiveEditingEnabled();

        return doc.isDirty && !isLiveEditingEnabled;
    }

    /**
     * Handles a notification from the browser that a stylesheet was loaded into
     * the live HTML document. If the stylesheet maps to a file in the project, then
     * creates a live document for the stylesheet and adds it to _relatedDocuments.
     * TODO: this isn't implemented in the prototype yet. We'll need to implement
     * this notification on the browser side.
     * @param {$.Event} event
     * @param {string} url The URL of the stylesheet that was added.
     * @param {array} roots The URLs of the roots of the stylesheet (the css files loaded through <link>)
     */
    function _styleSheetAdded(event, url, roots) {
        var path = _server && _server.urlToPath(url),
            alreadyAdded = !!_relatedDocuments[url];

        // path may be null if loading an external stylesheet.
        // Also, the stylesheet may already exist and be reported as added twice
        // due to Chrome reporting added/removed events after incremental changes
        // are pushed to the browser
        if (!path || alreadyAdded) {
            return;
        }

        var docPromise = DocumentManager.getDocumentForPath(path);

        docPromise.done(function (doc) {
            if ((_classForDocument(doc) === LiveCSSDocument) &&
                    (!_liveDocument || (doc !== _liveDocument.doc))) {
                var liveDoc = _createLiveDocument(doc, null, roots);
                if (liveDoc) {
                    _server.add(liveDoc);
                    _relatedDocuments[doc.url] = liveDoc;
                    $(liveDoc).on("updateDoc", function (event, url) {
                        var path = _server.urlToPath(url),
                            doc = getLiveDocForPath(path);
                        doc._updateBrowser();
                    });
                }
            }
        });
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
     * Close the connection and the associated window
     * @param {boolean} doCloseWindow Use true to close the window/tab in the browser
     * @param {?string} reason Optional string key suffix to display to user (see LIVE_DEV_* keys)
     */
    function _close(doCloseWindow, reason) {
        if (exports.status !== STATUS_INACTIVE) {
            // Close live documents 
            _closeDocuments();
            // Close all active connections
            _protocol.closeAllConnections();
            
            if (_server) {
                // Stop listening for requests when disconnected
                _server.stop();

                // Dispose server
                _server = null;
            }
        }

        // TODO: don't have a way to close windows in the new architecture
//        if (doCloseWindow) {
//        }
        
        _setStatus(STATUS_INACTIVE, reason || "explicit_close");
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
     * Displays an error when no HTML file can be found to preview.
     */
    function _showWrongDocError() {
        Dialogs.showModalDialog(
            DefaultDialogs.DIALOG_ID_ERROR,
            Strings.LIVE_DEVELOPMENT_ERROR_TITLE,
            Strings.LIVE_DEV_NEED_HTML_MESSAGE
        );
    }

    /**
     * @private
     * Displays an error when the server for live development files can't be started.
     */
    function _showLiveDevServerNotReadyError() {
        Dialogs.showModalDialog(
            DefaultDialogs.DIALOG_ID_ERROR,
            Strings.LIVE_DEVELOPMENT_ERROR_TITLE,
            Strings.LIVE_DEV_SERVER_NOT_READY_MESSAGE
        );
    }

    /**
     * @private
     * Creates the main live document for a given HTML document and notifies the server it exists.
     * TODO: we should really maintain the list of live documents, not the server.
     * @param {Document} doc
     */
    function _createLiveDocumentForFrame(doc) {
        // create live document
        doc._ensureMasterEditor();
        _liveDocument = _createLiveDocument(doc, doc._masterEditor);
        _server.add(_liveDocument);
    }
    
    /**
     * @private
     * Launches the given document in the browser, given that a live document has already
     * been created for it. 
     * @param {Document} doc
     */
    function _open(doc) {
        if (doc && _liveDocument && doc === _liveDocument.doc) {
            if (_server) {
                // Launch the URL in the browser. If it's the first one to connect back to us,
                // our status will transition to ACTIVE once it does so.
                if (exports.status < STATUS_ACTIVE) {
                    _protocol.launch(_server.pathToUrl(doc.file.fullPath));
                }
                if (exports.status === STATUS_RESTARTING) {
                    // change page in browser
                    _protocol.navigate(_server.pathToUrl(doc.file.fullPath));
                }

                $(_protocol)
                    // TODO: timeout if we don't get a connection within a certain time
                    .on("Connection.connect.livedev", function (event, msg) {
                        // check for the first connection
                        if (_protocol.getConnectionIds().length === 1) {
                            var doc = _getCurrentDocument();
                            // check the page that connection comes from matches the current live document session
                            if (_liveDocument && (msg.url === _resolveUrl(_liveDocument.doc.file.fullPath))) {
                                _setStatus(STATUS_ACTIVE);
                            }
                        }
                    })
                    .on("Connection.close.livedev", function (event, msg) {
                        // close session when the last connection was closed
                        if (_protocol.getConnectionIds().length === 0) {
                            if (exports.status <= STATUS_ACTIVE) {
                                close("detached_target_closed");
                            }
                        }
                    })
                    // extract stylesheets and create related LiveCSSDocument instances
                    .on("Document.Related.livedev", function (event, msg) {
                        var relatedDocs = msg.related;
                        var docs = Object.keys(relatedDocs.stylesheets);
                        docs.forEach(function (url) {
                            _styleSheetAdded(null, url, relatedDocs.stylesheets[url]);
                        });
                    })
                    // create new LiveCSSDocument if a new stylesheet is added
                    .on("Stylesheet.Added.livedev", function (event, msg) {
                        _styleSheetAdded(null, msg.href, msg.roots);
                    })
                    // remove LiveCSSDocument instance when stylesheet is removed
                    .on("Stylesheet.Removed.livedev", function (event, msg) {
                        _handleRelatedDocumentDeleted(msg.href);
                    });
            } else {
                console.error("LiveDevelopment._open(): No server active");
            }
        } else {
            // Unlikely that we would get to this state where
            // a connection is in process but there is no current
            // document
            close();
        }
    }
    
    /**
     * @private
     * Creates the live document in preparation for launching the 
     * preview of the given document, then launches it. (The live document 
     * must already exist before we launch it so that the server can
     * ask it for the instrumented version of the document when the browser 
     * requests it.)
     * TODO: could probably just consolidate this with _open()
     * @param {Document} doc
     */
    function _doLaunchAfterServerReady(initialDoc) {

        _createLiveDocumentForFrame(initialDoc);

        // start listening for requests
        _server.start();

        // open browser to the url
        _open(initialDoc);
    }
    
    /**
     * @private
     * Create the server in preparation for opening a live preview.
     * @param {Document} doc The document we want the server for. Different servers handle
     * different types of project (a static server for when no app server is configured,
     * vs. a user server when there is an app server set in File > Project Settings).
     */
    function _prepareServer(doc) {
        var deferred = new $.Deferred(),
            showBaseUrlPrompt = false;
        
        _server = LiveDevServerManager.getServer(doc.file.fullPath);

        // Optionally prompt for a base URL if no server was found but the
        // file is a known server file extension
        showBaseUrlPrompt = !_server && FileUtils.isServerHtmlFileExt(doc.file.fullPath);

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
     * @private
     * When switching documents, close the current preview and open a new one.
     * TODO: closing the current preview doesn't actually work in the new architecture.
     */
    function _onDocumentChange() {
        var doc = _getCurrentDocument();
        if (!isActive() || !doc) {
            return;
        }
        
        // close the current session and begin a new session
        var docUrl = _server && _server.pathToUrl(doc.file.fullPath),
            isViewable = _server && _server.canServe(doc.file.fullPath);
        
        if (_liveDocument.doc.url !== docUrl && isViewable) {
            // clear live doc and related docs
            _closeDocuments();

            // create new live doc
            _createLiveDocumentForFrame(doc);
            _setStatus(STATUS_RESTARTING);
            _open(doc);

        }
    }

    
    /**
     * Open a live preview on the current docuemnt.
     */
    function open() {
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
                    _setStatus(STATUS_CONNECTING);
                    _doLaunchAfterServerReady(doc);
                })
                .fail(function () {
                    _showWrongDocError();
                });
        });
    }
    
    /**
     * For files that don't support as-you-type live editing, but are loaded by live HTML documents
     * (e.g. JS files), we want to reload the full document when they're saved.
     * TODO: not implemented, see below.
     * @param {$.Event} event
     * @param {Document} doc
     */
    function _onDocumentSaved(event, doc) {
        if (!isActive() || !_server) {
            return;
        }
        
        var absolutePath            = doc.file.fullPath,
            liveDocument            = absolutePath && _server.get(absolutePath),
            liveEditingEnabled      = liveDocument && liveDocument.isLiveEditingEnabled  && liveDocument.isLiveEditingEnabled();
        
        // Skip reload if the saved document has live editing enabled
        if (liveEditingEnabled) {
            return;
        }
        
        // reload the page if the given document is a JS file related 
        // to the current live document.
        if (_liveDocument.isRelated(absolutePath)) {
            if (doc.getLanguage().getId() === "javascript") {
                _setStatus(STATUS_RELOADING);
                _protocol.reload();
            }
        }
    }

    /** 
     * For files that don't support as-you-type live editing, but are loaded by live HTML documents
     * (e.g. JS files), we want to show a dirty indicator on the live development icon when they
     * have unsaved changes, so the user knows s/he needs to save in order to have the page reload.
     * @param {$.Event} event
     * @param {Document} doc
     */
    function _onDirtyFlagChange(event, doc) {
        if (!isActive() || !_server) {
            return;
        }
        
        var absolutePath = doc.file.fullPath;
        
        if (_liveDocument.isRelated(absolutePath)) {
            // Set status to out of sync if dirty. Otherwise, set it to active status.
            _setStatus(_docIsOutOfSync(doc) ? STATUS_OUT_OF_SYNC : STATUS_ACTIVE);
        }
    }

    // TODO: These aren't necessary in the prototype because they're related to servers that are
    // registered by the original LiveDevelopment feature when it starts up.
//    function getCurrentProjectServerConfig() {
//        return {
//            baseUrl: ProjectManager.getBaseUrl(),
//            pathResolver: ProjectManager.makeProjectRelativeIfPossible,
//            root: ProjectManager.getProjectRoot().fullPath
//        };
//    }
//    
//    function _createUserServer() {
//        return new UserServer(getCurrentProjectServerConfig());
//    }
//    
//    function _createFileServer() {
//        return new FileServer(getCurrentProjectServerConfig());
//    }

    /**
     * Sets the current transport mechanism to be used by the live development protocol
     * (e.g. socket server, iframe postMessage, etc.)
     * @param {{launch: function(string), send: function(number|Array.<number>, string), close: function(number), getRemoteScript: function(): ?string}} transport
     *      The low-level transport. Must provide the following methods:
     *
     *      launch(url): Opens the url in the target browser.
     *      send(idOrArray, string): Dispatches the given protocol message (provided as a JSON string) to the given client ID
     *          or array of client IDs. (See the "connect" message for an explanation of client IDs.)
     *      close(id): Closes the connection to the given client ID.
     *      getRemoteScript(): Returns a script that should be injected into the page's HTML in order to handle the remote side
     *          of the transport. Should include the "<script>" tags. Should return null if no injection is necessary.
     *
     *      It must also dispatch the following jQuery events:
     *
     *      "connect": When a target browser connects back to the transport. Must provide two parameters: 
     *          clientID - a unique number representing this connection
     *          url - the URL of the page in the target browser that's connecting to us
     *      "message": When a message is received by the transport. Must provide two parameters:
     *          clientID - the ID of the client sending the message
     *          message - the text of the message as a JSON string
     *      "close": When the remote browser closes the connection. Must provide one parameter:
     *          clientID - the ID of the client closing the connection
     */
    function setTransport(transport) {
        _protocol.setTransport(transport);
    }

    /**
     * Initialize the LiveDevelopment module.
     */
    function init() {
        $(DocumentManager).on("currentDocumentChange", _onDocumentChange)
            .on("documentSaved", _onDocumentSaved)
            .on("dirtyFlagChange", _onDirtyFlagChange);
        $(ProjectManager).on("beforeProjectClose beforeAppClose", close);
        
        // Register user defined server provider
        // TODO: main LiveDevelopment does this already, so we don't want to do it again here.
//        LiveDevServerManager.registerServer({ create: _createUserServer }, 99);
//        LiveDevServerManager.registerServer({ create: _createFileServer }, 0);
        
        // Default transport for live connection messages - can be changed
        setTransport(NodeSocketTransport);
        
        // Initialize exports.status
        _setStatus(STATUS_INACTIVE);
    }

    /**
     * @private
     * Returns the current server being used to serve the active live document. Will be null
     * if there is no active live document.
     * @return {?BaseServer}
     */
    function _getServer() {
        return _server;
    }

    /**
     * @private
     * Returns the base URL of the current server serving the active live document, or null if
     * there is no active live document.
     * @return {?string}
     */
    function getServerBaseUrl() {
        return _server && _server.getBaseUrl();
    }
    
    function _getCurrentLiveDoc() {
        return _liveDocument;
    }
    
    // For unit testing
    exports._getServer                = _getServer;
    exports._getInitialDocFromCurrent = _getInitialDocFromCurrent;
    exports._getCurrentLiveDoc        = _getCurrentLiveDoc;

    // Export public functions
    exports.open                = open;
    exports.close               = close;
    exports.getLiveDocForPath   = getLiveDocForPath;
    exports.init                = init;
    exports.isActive            = isActive;
//    exports.getCurrentProjectServerConfig = getCurrentProjectServerConfig;
    exports.getServerBaseUrl    = getServerBaseUrl;
    exports.setTransport        = setTransport;
});