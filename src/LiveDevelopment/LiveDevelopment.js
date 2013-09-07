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
        FileServer           = require("LiveDevelopment/Servers/FileServer").FileServer,
        FileUtils            = require("file/FileUtils"),
        LiveDevServerManager = require("LiveDevelopment/LiveDevServerManager"),
        NativeFileError      = require("file/NativeFileError"),
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
    
    // TODO: Remove this temporary flag. Once we're certain that Live HTML is ready,
    // we can remove all traces of this flag.
    brackets.livehtml = true;

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

    var _liveDocument;        // the document open for live editing.
    var _relatedDocuments;    // CSS and JS documents that are used by the live HTML document
    var _server;              // current live dev server
    var _openDeferred;        // promise returned for each call to open()
    
    function _isHtmlFileExt(ext) {
        return (FileUtils.isStaticHtmlFileExt(ext) ||
                (ProjectManager.getBaseUrl() && FileUtils.isServerHtmlFileExt(ext)));
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

        if (_isHtmlFileExt(doc.file.fullPath)) {
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
            _relatedDocuments.splice(index, 1);
            
            if (_server) {
                _server.remove(liveDoc);
            }
        }
    }

    /**
     * @private
     * Close all live documents
     */
    function _closeDocuments() {
        if (_liveDocument) {
            _liveDocument.close();
            _liveDocument = undefined;
        }
        
        if (_relatedDocuments) {
            _relatedDocuments.forEach(function (liveDoc) {
                liveDoc.close();
                $(liveDoc).off(".livedev");
            });
            
            _relatedDocuments = undefined;
        }
        
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
        var DocClass = _classForDocument(doc);
        if (DocClass) {
            return new DocClass(doc, editor);
        } else {
            return null;
        }
    }
    
    /**
     * @private
     * Populate array of related documents reported by the browser agent(s)
     */
    function _getRelatedDocuments() {
        function createLiveStylesheet(url) {
            var stylesheetDeferred  = $.Deferred(),
                promise             = stylesheetDeferred.promise(),
                path                = _server && _server.urlToPath(url);

            // path may be null if loading an external stylesheet
            if (path) {
                DocumentManager.getDocumentForPath(path)
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
                            var liveDoc = _createDocument(doc);
                            if (liveDoc) {
                                _relatedDocuments.push(liveDoc);
                                _server.add(liveDoc);
                                
                                $(liveDoc).on("deleted.livedev", _handleRelatedDocumentDeleted);
                            }
                        }
                        stylesheetDeferred.resolve();
                    });
            } else {
                stylesheetDeferred.resolve();
            }

            return promise;
        }

        // Gather related CSS documents.
        // FUTURE: Gather related JS documents as well.
        _relatedDocuments = [];
        
        return Async.doInParallel(agents.css.getStylesheetURLs(),
                                  createLiveStylesheet,
                                  false); // don't fail fast
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

    /** Documents are considered to be out-of-sync if they are dirty and
     *  do not have "update while editing" support
     * @param {Document} doc
     */
    function _docIsOutOfSync(doc) {
        var docClass = _classForDocument(doc);
        return (doc.isDirty && docClass !== CSSDocument &&
                (!brackets.livehtml || docClass !== HTMLDocument));
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
        var result = new $.Deferred(),
            promises = [],
            enableAgentsPromise,
            allAgentsPromise;

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
            // After (1) the interstitial page loads, (2) then browser navigation
            // to the base URL is completed, and (3) the agents finish loading
            // gather related documents and finally set status to STATUS_ACTIVE.
            var doc = _getCurrentDocument();

            if (doc) {
                var status = STATUS_ACTIVE,
                    relatedDocumentsPromise;

                // Note: the following promise is never explicitly rejected, so there
                // is no failure handler. If _getRelatedDocuments is changed so that rejection
                // is possible, failure should be managed accordingly.
                relatedDocumentsPromise = Async.withTimeout(_getRelatedDocuments(), 5000);

                relatedDocumentsPromise
                    .done(function () {
                        if (_docIsOutOfSync(doc)) {
                            status = STATUS_OUT_OF_SYNC;
                        }
                        _setStatus(status);

                        result.resolve();
                    })
                    .fail(result.reject);
            } else {
                result.reject();
            }
        });

        allAgentsPromise.fail(result.reject);
        
        // show error loading live dev dialog
        result.fail(function () {
            _setStatus(STATUS_ERROR);

            Dialogs.showModalDialog(
                Dialogs.DIALOG_ID_ERROR,
                Strings.LIVE_DEVELOPMENT_ERROR_TITLE,
                Strings.LIVE_DEV_LOADING_ERROR_MESSAGE
            );
        });

        // resolve/reject the open() promise after agents complete
        result.then(_openDeferred.resolve, _openDeferred.reject);

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

        unloadAgents();
        
        // Close live documents 
        _closeDocuments();
        
        if (_server) {
            // Stop listening for requests when disconnected
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

        closePromise.done(function () {
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
     * @return {jQuery.Promise} Resolves once the connection is closed
     */
    function _close(doCloseWindow, reason) {
        var deferred = $.Deferred();

        /*
         * Finish closing the live development connection, including setting
         * the status accordingly.
         */
        function cleanup() {
            _setStatus(STATUS_INACTIVE, reason || "explicit_close");
            deferred.resolve();
        }

        if (_openDeferred) {
            _doInspectorDisconnect(doCloseWindow).done(cleanup);

            if (_openDeferred.state() === "pending") {
                _openDeferred.reject();
            }
        } else {
            // Deferred may not be created yet
            // We always close attempt to close the live dev connection on
            // ProjectManager beforeProjectClose and beforeAppClose events
            cleanup();
        }
        
        return deferred.promise();
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
     */
    function reconnect() {
        unloadAgents();
        loadAgents();
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
     * @return {jQuery.Promise}
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
            loadAgents();

            var doc = _getCurrentDocument();
            if (doc) {
                // Navigate from interstitial to the document
                // Fires a frameNavigated event
                Inspector.Page.navigate(doc.url);
            } else {
                // Unlikely that we would get to this state where
                // a connection is in process but there is no current
                // document
                close();
            }
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
        
        // Open the live browser if the connection fails, retry 6 times
        Inspector.connectToURL(launcherUrl).fail(function onConnectFail(err) {
            if (err === "CANCEL") {
                _openDeferred.reject(err);
                return;
            }

            if (retryCount > 6) {
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
                        NativeApp.closeLiveBrowser()
                            .done(function () {
                                browserStarted = false;
                                window.setTimeout(function () {
                                    // After browser closes, try to open the interstitial page again
                                    _openInterstitialPage();
                                });
                            })
                            .fail(function (err) {
                                // Report error?
                                _setStatus(STATUS_ERROR);
                                browserStarted = false;
                                _openDeferred.reject("CLOSE_LIVE_BROWSER");
                            });
                    } else {
                        _openDeferred.reject("CANCEL");
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

                        _openDeferred.reject("OPEN_LIVE_BROWSER");
                    });
            }
                
            if (exports.status !== STATUS_ERROR) {
                window.setTimeout(function retryConnect() {
                    Inspector.connectToURL(launcherUrl).fail(onConnectFail);
                }, 500);
            }
        });
    }
    
    // helper function that actually does the launch once we are sure we have
    // a doc and the server for that doc is up and running.
    function _doLaunchAfterServerReady() {
        // update status
        _setStatus(STATUS_CONNECTING);
        
        // create live document
        _liveDocument = _createDocument(_getCurrentDocument(), EditorManager.getCurrentFullEditor());

        // start listening for requests
        _server.add(_liveDocument);
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

    /** Open the Connection and go live */
    function open() {
        _openDeferred = new $.Deferred();

        var doc = _getCurrentDocument(),
            prepareServerPromise = (doc && _prepareServer(doc)) || new $.Deferred().reject();
        
        // wait for server (StaticServer, Base URL or file:)
        prepareServerPromise.done(_doLaunchAfterServerReady);
        prepareServerPromise.fail(function () {
            _showWrongDocError();
            _openDeferred.reject();
        });

        return _openDeferred.promise();
    }
    
    /** Enable highlighting */
    function showHighlight() {
        var doc = getLiveDocForEditor(EditorManager.getActiveEditor());
        
        if (doc.updateHighlight) {
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

        hideHighlight();
        
        // close the current session and begin a new session if the current
        // document changes to an HTML document that was not loaded yet
        var wasRequested = agents.network && agents.network.wasURLRequested(doc.url),
            isViewable = exports.config.experimental || (_server && _server.canServe(doc.file.fullPath));
        
        if (!wasRequested && isViewable) {
            // TODO (jasonsanjose): optimize this by reusing the same connection
            // no need to fully teardown.
            close().done(open);
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
        if (doc && Inspector.connected() &&
                agents.network && agents.network.wasURLRequested(doc.url)) {
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

    // For unit testing
    exports.launcherUrl         = launcherUrl;
    exports._getServer          = _getServer;

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
});