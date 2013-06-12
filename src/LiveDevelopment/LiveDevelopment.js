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
/*global define, $, brackets, window */

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

    // Status Codes
    var STATUS_ERROR          = exports.STATUS_ERROR          = -1;
    var STATUS_INACTIVE       = exports.STATUS_INACTIVE       =  0;
    var STATUS_CONNECTING     = exports.STATUS_CONNECTING     =  1;
    var STATUS_LOADING_AGENTS = exports.STATUS_LOADING_AGENTS =  2;
    var STATUS_ACTIVE         = exports.STATUS_ACTIVE         =  3;
    var STATUS_OUT_OF_SYNC    = exports.STATUS_OUT_OF_SYNC    =  4;

    var Async                = require("utils/Async"),
        Dialogs              = require("widgets/Dialogs"),
        DefaultDialogs       = require("widgets/DefaultDialogs"),
        DocumentManager      = require("document/DocumentManager"),
        EditorManager        = require("editor/EditorManager"),
        FileUtils            = require("file/FileUtils"),
        LiveDevServerManager = require("LiveDevelopment/LiveDevServerManager"),
        NativeFileError      = require("file/NativeFileError"),
        NativeApp            = require("utils/NativeApp"),
        PreferencesDialogs   = require("preferences/PreferencesDialogs"),
        ProjectManager       = require("project/ProjectManager"),
        Strings              = require("strings"),
        StringUtils          = require("utils/StringUtils");

    // Inspector
    var Inspector       = require("LiveDevelopment/Inspector/Inspector");

    // Documents
    var CSSDocument     = require("LiveDevelopment/Documents/CSSDocument"),
        HTMLDocument    = require("LiveDevelopment/Documents/HTMLDocument"),
        JSDocument      = require("LiveDevelopment/Documents/JSDocument");

    // Agents
    var agents = {
        "console"   : require("LiveDevelopment/Agents/ConsoleAgent"),
        "remote"    : require("LiveDevelopment/Agents/RemoteAgent"),
        "network"   : require("LiveDevelopment/Agents/NetworkAgent"),
        "dom"       : require("LiveDevelopment/Agents/DOMAgent"),
        "css"       : require("LiveDevelopment/Agents/CSSAgent"),
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
        "dom"       : true,
        "css"       : true,
        "highlight" : true
    };

    // store the names (matching property names in the 'agent' object) of agents that we've loaded
    var _loadedAgentNames = [];

    var _liveDocument;        // the document open for live editing.
    var _relatedDocuments;    // CSS and JS documents that are used by the live HTML document
    var _serverProvider;      // current LiveDevServerProvider
    var _closeReason;         // reason why live preview was closed
    
    function _isHtmlFileExt(ext) {
        return (FileUtils.isStaticHtmlFileExt(ext) ||
                (ProjectManager.getBaseUrl() && FileUtils.isServerHtmlFileExt(ext)));
    }

    /** Convert a URL to a local full file path */
    function _urlToPath(url) {
        var path,
            baseUrl = "";

        if (_serverProvider) {
            baseUrl = _serverProvider.getBaseUrl();
        }

        if (baseUrl !== "" && url.indexOf(baseUrl) === 0) {
            // Use base url to translate to local file path.
            // Need to use encoded project path because it's decoded below.
            path = url.replace(baseUrl, encodeURI(ProjectManager.getProjectRoot().fullPath));

        } else if (url.indexOf("file://") === 0) {
            // Convert a file URL to local file path
            path = url.slice(7);
            if (path && brackets.platform === "win" && path.charAt(0) === "/") {
                path = path.slice(1);
            }
        }
        return decodeURI(path);
    }

    /** Convert a local full file path to a URL */
    function _pathToUrl(path) {
        var url,
            baseUrl = "";

        if (_serverProvider) {
            baseUrl = _serverProvider.getBaseUrl();
        }

        // See if base url has been specified and path is within project
        if (baseUrl !== "" && ProjectManager.isWithinProject(path)) {
            // Map to server url. Base url is already encoded, so don't encode again.
            var encodedDocPath = encodeURI(path);
            var encodedProjectPath = encodeURI(ProjectManager.getProjectRoot().fullPath);
            url = encodedDocPath.replace(encodedProjectPath, baseUrl);

        } else {
            var prefix = "file://";
    
            if (brackets.platform === "win") {
                // The path on Windows starts with a drive letter (e.g. "C:").
                // In order to make it a valid file: URL we need to add an
                // additional slash to the prefix.
                prefix += "/";
            }
    
            url = encodeURI(prefix + path);
        }

        return url;
    }

    /** Augments the given Brackets document with information that's useful for live development. */
    function _setDocInfo(doc) {

        var parentUrl,
            rootUrl,
            matches;

        // FUTURE: some of these things should just be moved into core Document; others should
        // be in a LiveDevelopment-specific object attached to the doc.
        matches = /^(.*\/)(.+\.([^.]+))$/.exec(doc.file.fullPath);
        if (!matches) {
            return;
        }

        doc.extension = matches[3];

        parentUrl = _pathToUrl(matches[1]);
        doc.url = parentUrl + encodeURI(matches[2]);

        // the root represents the document that should be displayed in the browser
        // for live development (the file for HTML files)
        // TODO: Issue #2033 Improve how default page is determined
        doc.root = { url: doc.url };
    }

    /** Get the current document from the document manager
     * _adds extension, url and root to the document
     */
    function _getCurrentDocument() {
        var doc = DocumentManager.getCurrentDocument();
        if (doc) {
            _setDocInfo(doc);
        }
        return doc;
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

        if (_isHtmlFileExt(doc.extension)) {
            return HTMLDocument;
        }

        return null;
    }

    function getLiveDocForPath(path) {
        var docsToSearch = [];
        if (_relatedDocuments) {
            docsToSearch = docsToSearch.concat(_relatedDocuments);
        }
        if (_liveDocument) {
            docsToSearch = docsToSearch.concat(_liveDocument);
        }
        var foundDoc;
        docsToSearch.some(function matchesPath(ele) {
            if (ele.doc.file.fullPath === path) {
                foundDoc = ele;
                return true;
            }
            return false;
        });

        return foundDoc;
    }
    
    function getLiveDocForEditor(editor) {
        if (!editor) {
            return null;
        }
        return getLiveDocForPath(editor.document.file.fullPath);
    }
    
    /**
     * Removes the given CSS/JSDocument from _relatedDocuments. Signals that the
     * given file is no longer associated with the HTML document that is live (e.g.
     * if the related file has been deleted on disk).
     */
    function _handleRelatedDocumentDeleted(event, liveDoc) {
        var index = _relatedDocuments.indexOf(liveDoc);
        if (index !== -1) {
            $(liveDoc).on("deleted", _handleRelatedDocumentDeleted);
            _relatedDocuments.splice(index, 1);
        }
    }

    /** Close a live document */
    function _closeDocument() {
        if (_liveDocument) {
            _liveDocument.close();
            _liveDocument = undefined;
        }
        
        if (_serverProvider) {
            // Stop listening for requests
            if (_serverProvider.setRequestFilterPaths) {
                _serverProvider.setRequestFilterPaths([]);
            }

            // Remove any "request" listeners that were added previously
            $(_serverProvider).off(".livedev");
        }
        
        if (_relatedDocuments) {
            _relatedDocuments.forEach(function (liveDoc) {
                liveDoc.close();
                $(liveDoc).off("deleted", _handleRelatedDocumentDeleted);
            });
            _relatedDocuments = undefined;
        }
    }

    /** Create a live version of a Brackets document */
    function _createDocument(doc, editor) {
        var DocClass = _classForDocument(doc);
        if (DocClass) {
            return new DocClass(doc, editor);
        } else {
            return null;
        }
    }

    /**
     * @private
     * Open a live document
     * @param {Document} source document to open
     */
    function _openDocument(doc, editor) {
        _closeDocument();
        _liveDocument = _createDocument(doc, editor);
        
        // Enable instrumentation
        if (_liveDocument && _liveDocument.setInstrumentationEnabled) {
            var enableInstrumentation = false;
            
            if (_serverProvider && _serverProvider.setRequestFilterPaths) {
                enableInstrumentation = true;
                
                _serverProvider.setRequestFilterPaths(
                    ["/" + encodeURI(ProjectManager.makeProjectRelativeIfPossible(doc.file.fullPath))]
                );
                
                // Send custom HTTP response for the current live document
                $(_serverProvider).on("request.livedev", function (event, request) {
                    // response can be null in which case the StaticServerDomain reverts to simple file serving.
                    var response = _liveDocument.getResponseData ? _liveDocument.getResponseData() : null;
                    request.send(response);
                });
            }
                
            _liveDocument.setInstrumentationEnabled(enableInstrumentation);
        }
    }
    
    /**
     * @private
     * Populate array of related documents reported by the browser agent(s)
     */
    function _getRelatedDocuments() {
        function createLiveStylesheet(url) {
            var stylesheetDeferred = $.Deferred();
                
            DocumentManager.getDocumentForPath(_urlToPath(url))
                .fail(function () {
                    // A failure to open a related file is benign
                    stylesheetDeferred.resolve();
                })
                .done(function (doc) {
                    // CSSAgent includes containing HTMLDocument in list returned
                    // from getStyleSheetURLS() (which could be useful for collecting
                    // embedded style sheets) but we need to filter doc out here.
                    if ((_classForDocument(doc) === CSSDocument) &&
                            (!_liveDocument || (doc !== _liveDocument.doc))) {
                        _setDocInfo(doc);
                        var liveDoc = _createDocument(doc);
                        if (liveDoc) {
                            _relatedDocuments.push(liveDoc);
                            $(liveDoc).on("deleted", _handleRelatedDocumentDeleted);
                        }
                    }
                    stylesheetDeferred.resolve();
                });
            return stylesheetDeferred.promise();
        }

        // Gather related CSS documents.
        // FUTURE: Gather related JS documents as well.
        _relatedDocuments = [];
        
        return Async.doInParallel(agents.css.getStylesheetURLs(),
                                  createLiveStylesheet,
                                  false); // don't fail fast
    }

    /** Unload the agents */
    function unloadAgents() {
        _loadedAgentNames.forEach(function (name) {
            agents[name].unload();
        });
        _loadedAgentNames = [];
    }

    /** Load the agents */
    function loadAgents() {
        var name, promises = [], agentsToLoad, promise;

        if (exports.config.experimental) {
            // load all agents
            agentsToLoad = agents;
        } else {
            // load only enabled agents
            agentsToLoad = _enabledAgentNames;
        }
        for (name in agentsToLoad) {
            if (agentsToLoad.hasOwnProperty(name) && agents[name] && agents[name].load) {
                promise = agents[name].load();

                if (promise) {
                    promises.push(promise);
                }

                _loadedAgentNames.push(name);
            }
        }
        return promises;
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

    /** Update the status
     * @param {integer} new status
     */
    function _setStatus(status) {
        // Don't send a notification when the status didn't actually change
        if (status === exports.status) {
            return;
        }
        
        exports.status = status;
        var reason = status === STATUS_INACTIVE ? _closeReason : null;
        $(exports).triggerHandler("statusChange", [status, reason]);
    }

    /** Triggered by Inspector.error */
    function _onError(event, error) {
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
        console.error(message, error);
        _setStatus(STATUS_ERROR);
    }

    /** Run when all agents are loaded */
    function _onLoad() {
        var doc = _getCurrentDocument();
        if (!doc) {
            return;
        }

        var status = STATUS_ACTIVE;

        // Note: the following promise is never explicitly rejected, so there
        // is no failure handler. If _getRelatedDocuments is changed so that rejection
        // is possible, failure should be managed accordingly.
        _getRelatedDocuments()
            .done(function () {
                if (doc.isDirty && _classForDocument(doc) !== CSSDocument) {
                    status = STATUS_OUT_OF_SYNC;
                }
                _setStatus(status);
            });
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
        if (url.match(/^file:\/\//i) || !_serverProvider) {
            return;
        }

        // Need base url to build reg exp
        baseUrl = _serverProvider.getBaseUrl();
        if (!baseUrl) {
            return;
        }

        // Test that url is within site
        baseUrlRegExp = new RegExp("^" + StringUtils.regexEscape(baseUrl), "i");
        if (!url.match(baseUrlRegExp)) {
            // No longer in site, so terminate live dev, but don't close browser window
            Inspector.disconnect();
            _closeReason = "navigated_away";
            _setStatus(STATUS_INACTIVE);
            _serverProvider = null;
        }
    }

    /** Triggered by Inspector.disconnect */
    function _onDisconnect(event) {
        $(Inspector.Inspector).off("detached.livedev");
        $(Inspector.Page).off("frameNavigated.livedev");

        unloadAgents();
        _closeDocument();
        _setStatus(STATUS_INACTIVE);
    }

    function _onDetached(event, res) {
        // If there already is a reason for closing the session, do not overwrite it
        if (!_closeReason && res && res.reason) {
            // Get the explanation from res.reason, e.g. "replaced_with_devtools", "target_closed", "canceled_by_user"
            // Examples taken from https://chromiumcodereview.appspot.com/10947037/patch/12001/13004
            // However, the link refers to the Chrome Extension API, it may not apply 100% to the Inspector API
            // Prefix with "detached_" to create a quasi-namespace for Chrome's reasons
            _closeReason = "detached_" + res.reason;
        }
    }

    function reconnect() {
        unloadAgents();
        
        _setStatus(STATUS_LOADING_AGENTS);
        var promises = loadAgents();
        $.when.apply(undefined, promises).done(_onLoad).fail(_onError);
    }

    /** Open the Connection and go live */
    function open() {
        var result = new $.Deferred(),
            promise = result.promise();
        var doc = _getCurrentDocument();
        var browserStarted = false;
        var retryCount = 0;

        _closeReason = null;

        function showWrongDocError() {
            Dialogs.showModalDialog(
                DefaultDialogs.DIALOG_ID_ERROR,
                Strings.LIVE_DEVELOPMENT_ERROR_TITLE,
                Strings.LIVE_DEV_NEED_HTML_MESSAGE
            );
            result.reject();
        }

        function showNeedBaseUrlError() {
            PreferencesDialogs.showProjectPreferencesDialog("", Strings.LIVE_DEV_NEED_BASEURL_MESSAGE)
                .done(function (id) {
                    if (id === Dialogs.DIALOG_BTN_OK && ProjectManager.getBaseUrl()) {
                        // If base url is specifed, then re-invoke open() to continue
                        open();
                        result.resolve();
                    } else {
                        result.reject();
                    }
                });
        }

        function showLiveDevServerNotReadyError() {
            Dialogs.showModalDialog(
                DefaultDialogs.DIALOG_ID_ERROR,
                Strings.LIVE_DEVELOPMENT_ERROR_TITLE,
                Strings.LIVE_DEV_SERVER_NOT_READY_MESSAGE
            );
            result.reject();
        }
        
        // helper function that actually does the launch once we are sure we have
        // a doc and the server for that doc is up and running.
        function doLaunchAfterServerReady() {
            _setStatus(STATUS_CONNECTING);
            
            _openDocument(doc, EditorManager.getCurrentFullEditor());

            Inspector.connectToURL(launcherUrl).done(result.resolve).fail(function onConnectFail(err) {
                if (err === "CANCEL") {
                    result.reject(err);
                    return;
                }
                if (retryCount > 6) {
                    _setStatus(STATUS_ERROR);
                    Dialogs.showModalDialog(
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
                    )
                        .done(function (id) {
                            if (id === Dialogs.DIALOG_BTN_OK) {
                                // User has chosen to reload Chrome, quit the running instance
                                _setStatus(STATUS_INACTIVE);
                                NativeApp.closeLiveBrowser()
                                    .done(function () {
                                        browserStarted = false;
                                        window.setTimeout(function () {
                                            open().done(result.resolve).fail(result.reject);
                                        });
                                    })
                                    .fail(function (err) {
                                        // Report error?
                                        _setStatus(STATUS_ERROR);
                                        browserStarted = false;
                                        result.reject("CLOSE_LIVE_BROWSER");
                                    });
                            } else {
                                result.reject("CANCEL");
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
                            if (err === NativeFileError.NOT_FOUND_ERR) {
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

                            result.reject("OPEN_LIVE_BROWSER");
                        });
                }
                    
                if (exports.status !== STATUS_ERROR) {
                    window.setTimeout(function retryConnect() {
                        Inspector.connectToURL(launcherUrl).done(result.resolve).fail(onConnectFail);
                    }, 500);
                }
            });
        }
        
        if (!doc || !doc.root) {
            showWrongDocError();
        } else {
            _serverProvider = LiveDevServerManager.getProvider(doc.file.fullPath);
            
            if (!exports.config.experimental && !_serverProvider) {
                if (FileUtils.isServerHtmlFileExt(doc.extension)) {
                    showNeedBaseUrlError();
                } else if (!FileUtils.isStaticHtmlFileExt(doc.extension)) {
                    showWrongDocError();
                } else {
                    doLaunchAfterServerReady();   // fall-back to file://
                }
            } else {
                var readyPromise = _serverProvider.readyToServe();
                if (!readyPromise) {
                    showLiveDevServerNotReadyError();
                } else {
                    readyPromise.then(
                        doLaunchAfterServerReady,
                        showLiveDevServerNotReadyError
                    );
                }
            }
        }

        return promise;
    }

    /**
     * Close the connection and the associated window asynchronously
     * 
     * @return {jQuery.Promise} Resolves once the connection is closed
     */
    function close() {
        _closeReason = "explicit_close";

        var deferred = $.Deferred();
            
        /*
         * Finish closing the live development connection, including setting
         * the status accordingly.
         */
        function cleanup() {
            _setStatus(STATUS_INACTIVE);
            _serverProvider = null;
            deferred.resolve();
        }
        
        if (Inspector.connected()) {
            var timer = window.setTimeout(cleanup, 5000); // 5 seconds
            Inspector.Runtime.evaluate("window.open('', '_self').close();", function (response) {
                Inspector.disconnect();
                window.clearTimeout(timer);
                cleanup();
            });
        } else {
            cleanup();
        }
        
        return deferred.promise();
    }
    
    /** Enable highlighting */
    function showHighlight() {
        var doc = getLiveDocForEditor(EditorManager.getActiveEditor());
        
        if (doc instanceof CSSDocument) {
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
    
    /** Triggered by Inspector.connect */
    function _onConnect(event) {
        
        /* 
         * Create a promise that resolves when the interstitial page has
         * finished loading.
         * 
         * @return {jQuery.Promise}
         */
        function waitForInterstitialPageLoad() {
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
        
        /*
         * Load agents and navigate to the target document once the 
         * interstitial page has finished loading.
         */
        function onInterstitialPageLoad() {
            // Page domain must be enabled first before loading other agents
            Inspector.Page.enable().done(function () {
                // Load the right document (some agents are waiting for the page's load event)
                var doc = _getCurrentDocument();
                if (doc) {
                    Inspector.Page.navigate(doc.root.url);
                } else {
                    close();
                }
            });

            // Load agents
            _setStatus(STATUS_LOADING_AGENTS);
            var promises = loadAgents();
            $.when.apply(undefined, promises).done(_onLoad).fail(_onError);
        }
        
        $(Inspector.Page).on("frameNavigated.livedev", _onFrameNavigated);
		
        waitForInterstitialPageLoad()
            .fail(function () {
                close();
                Dialogs.showModalDialog(
                    DefaultDialogs.DIALOG_ID_ERROR,
                    Strings.LIVE_DEVELOPMENT_ERROR_TITLE,
                    Strings.LIVE_DEV_LOADING_ERROR_MESSAGE
                );
            })
            .done(onInterstitialPageLoad);
    }

    /** Triggered by a document change from the DocumentManager */
    function _onDocumentChange() {
        var doc = _getCurrentDocument(),
            status = STATUS_ACTIVE,
            promise;
        
        if (!doc) {
            return;
        }

        if (Inspector.connected()) {
            hideHighlight();
            if (agents.network && agents.network.wasURLRequested(doc.url)) {
                _openDocument(doc, EditorManager.getCurrentFullEditor());
                
                promise = _getRelatedDocuments();
            } else {
                if (exports.config.experimental || _isHtmlFileExt(doc.extension)) {
                    promise = close().done(open);
                } else {
                    promise = $.Deferred().resolve();
                }
            }
            
            promise
                .fail(close)
                .done(function () {
                    if (doc.isDirty && _classForDocument(doc) !== CSSDocument) {
                        status = STATUS_OUT_OF_SYNC;
                    }
                    _setStatus(status);
                });
        }
    }

    /** Triggered by a document saved from the DocumentManager */
    function _onDocumentSaved(event, doc) {
        if (doc && Inspector.connected() && _classForDocument(doc) !== CSSDocument &&
                agents.network && agents.network.wasURLRequested(doc.url)) {
            // Unload and reload agents before reloading the page
            reconnect();

            // Reload HTML page
            Inspector.Page.reload();
        }
    }

    /** Triggered by a change in dirty flag from the DocumentManager */
    function _onDirtyFlagChange(event, doc) {
        if (doc && Inspector.connected() && _classForDocument(doc) !== CSSDocument &&
                agents.network && agents.network.wasURLRequested(doc.url)) {
            // Set status to out of sync if dirty. Otherwise, set it to active status.
            _setStatus(doc.isDirty ? STATUS_OUT_OF_SYNC : STATUS_ACTIVE);
        }
    }

    /**
     * @constructor
     *
     * LiveDevServerProvider for user specified server as defined with Live Preview Base Url
     * Project setting. In a clean installation of Brackets, this is the highest priority
     * server provider, if defined.
     */
    function UserServerProvider() {}

    /**
     * Determines whether we can serve local file.
     * @param {String} localPath A local path to file being served.
     * @return {Boolean} true for yes, otherwise false.
     */
    UserServerProvider.prototype.canServe = function (localPath) {
        var baseUrl = ProjectManager.getBaseUrl();
        if (!baseUrl) {
            return false;
        }

        if (!ProjectManager.isWithinProject(localPath)) {
            return false;
        }

        return _isHtmlFileExt(localPath);
    };

    /**
     * Returns a base url for current project.
     * @return {String}  Base url for current project.
     */
    UserServerProvider.prototype.getBaseUrl = function () {
        return ProjectManager.getBaseUrl();
    };

    /**
     * # LiveDevServerProvider.readyToServe()
     *
     * Used to check if the server has finished launching after opening
     * the project. User is required to make sure their external sever
     * is ready, so indicate that we're always ready.
     *
     * @return {jQuery.Promise} Promise that is already resolved
     */
    UserServerProvider.prototype.readyToServe = function () {
        return $.Deferred().resolve().promise();
    };

    /** Initialize the LiveDevelopment Session */
    function init(theConfig) {
        exports.config = theConfig;
        $(Inspector).on("connect", _onConnect)
            .on("disconnect", _onDisconnect)
            .on("error", _onError);
        $(Inspector.Inspector).on("detached", _onDetached);
        $(DocumentManager).on("currentDocumentChange", _onDocumentChange)
            .on("documentSaved", _onDocumentSaved)
            .on("dirtyFlagChange", _onDirtyFlagChange);
        $(ProjectManager).on("beforeProjectClose beforeAppClose", close);

        // Register user defined server provider
        var userServerProvider = new UserServerProvider();
        LiveDevServerManager.registerProvider(userServerProvider, 99);

        // Initialize exports.status
        _setStatus(STATUS_INACTIVE);
    }

    function _setServerProvider(serverProvider) {
        _serverProvider = serverProvider;
    }

    // For unit testing
    exports._pathToUrl          = _pathToUrl;
    exports._urlToPath          = _urlToPath;
    exports._setServerProvider  = _setServerProvider;
    exports.launcherUrl         = launcherUrl;

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
});