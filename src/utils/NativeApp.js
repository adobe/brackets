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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50*/
/*global $, define, brackets, FileError */

define(function (require, exports, module) {
    "use strict";
    
    var _                   = require("thirdparty/lodash"),
        Async               = require("utils/Async"),
        ChildProcess        = require("utils/ChildProcess"),
        FileSystemError     = require("filesystem/FileSystemError"),
        PreferencesManager  = require("preferences/PreferencesManager"),
        StringUtils         = require("utils/StringUtils");

    var browserProcess;

    var GOOGLE_CHROME_DEFAULT_ARGS  = [
            "--no-first-run",
            "--no-default-browser-check"
        ],
        GOOGLE_CHROME_DEBUG_ARGS    = [
            "--remote-debugging-port={PORT}",
            "--user-data-dir=\"{USER_DATA_DIR}\""
        ],
        GOOGLE_CHROME_URL_ARGS      = [
            "{URL}"
        ];

    var _appKeys = {},
        _browsers = {};

    // Initialize browser definitions
    _browsers.chrome = {
        name: "Google Chrome",
        defaultArgs: GOOGLE_CHROME_DEFAULT_ARGS,
        debugArgs: GOOGLE_CHROME_DEBUG_ARGS,
        urlArgs: GOOGLE_CHROME_URL_ARGS,
        port: 9222,
        isDefault: true
    };
    _browsers.chrome_canary = {
        name: "Google Chrome Canary",
        defaultArgs: GOOGLE_CHROME_DEFAULT_ARGS,
        debugArgs: GOOGLE_CHROME_DEBUG_ARGS,
        urlArgs: GOOGLE_CHROME_URL_ARGS,
        port: 9222,
        isDefault: false
    };
    _browsers.firefox_aurora = {
        name: "Firefox Aurora",
        debugArgs: [
            "-no-remote",
            "-profile \"{USER_DATA_DIR}\""
        ],  // Fake for demo
        urlArgs: ["-url {URL}"],
        port: 9222,
        prestart: "node --debug node/node_modules/remotedebug-firefox-bridge/bin/remotedebug-firefox-bridge.js",
        isDefault: false
    };

    // Initialize platform specific browser lookup
    if (brackets.platform === "mac") {
        _browsers.chrome.platformKey = "com.google.Chrome";
        _browsers.chrome_canary.platformKey = "com.google.Chrome.canary";
        _browsers.firefox_aurora.platformKey = "org.mozilla.aurora";
    } else if (brackets.platform === "win") {
        _browsers.chrome.platformKey = "chrome.exe";
        _browsers.firefox_aurora.platformKey = "firefox.exe";
    } else {
        _browsers.chrome.platformKey = "google-chrome";
        _browsers.chrome_canary.platformKey = "chromium";
        _browsers.firefox_aurora.platformKey = "firefox";
    }

    // Use ChildProcess.findAppByKey to find the absolute path to each browser executable
    var findAppsPromise = Async.doInParallel(Object.keys(_browsers), function (browserKey) {
        var deferred = new $.Deferred(),
            browserDef = _browsers[browserKey],
            platformKey = browserDef.platformKey;

        ChildProcess.findAppByKey(platformKey).done(function (path) {
            browserDef.path = path;
        }).always(function () {
            // always resolve, we clean up missing browsers later
            deferred.resolve();
        });

        return deferred.promise();
    }, false);

    // Delete any browsers that could not be found
    findAppsPromise.done(function () {
        _.each(Object.keys(_browsers), function (browserKey) {
            var browserDef = _browsers[browserKey];
            if (!browserDef.path) {
                delete _browsers[browserKey];
            }
        });
    });

    // Initialize default preferences
    PreferencesManager.definePreference("browsers", "object", _browsers);

    // TODO do *NOT* clobber user prefs if already set
    // Initialize user prefs to give end users a template for changing the path to chrome
    // PreferencesManager.set("browsers", _browsers, { location: { scope: "user" } });
    // PreferencesManager.save();

    function _keyToRegExp(key) {
        return new RegExp("{" + key + "}", "g");
    }

    function _evalArgs(argResultArray, argPatternArray, vars) {
        if (!Array.isArray(argPatternArray)) {
            return;
        }

        var arg;

        _.forEach(argPatternArray, function (originalArg) {
            arg = originalArg;

            _.forEach(vars, function (value, key) {
                arg = arg.replace(_keyToRegExp(key), value);
            });

            argResultArray.push(arg);
        });
    }

    function _getArgs(browserDefinition, url) {
        var argResultArray = [],
            vars = {};

        vars.URL = url;
        vars.PORT = browserDefinition.port;
        // Maybe USER_DATA_DIR shouldn't be a var?
        vars.USER_DATA_DIR = brackets.app.getApplicationSupportDirectory() + "/" + browserDefinition.name;

        // Inject variables in each arg
        _evalArgs(argResultArray, browserDefinition.defaultArgs, vars);
        _evalArgs(argResultArray, browserDefinition.debugArgs, vars);
        _evalArgs(argResultArray, browserDefinition.urlArgs, vars);

        return argResultArray;
    }

    /**
     * @private
     * Map an fs error code to a FileError.
     */
    function _browserErrToFileError(err) {
        if (err === brackets.fs.ERR_NOT_FOUND) {
            return FileSystemError.NOT_FOUND;
        }
        
        // All other errors are mapped to the generic "unknown" error
        return FileSystemError.UNKNOWN;
    }
    
    var liveBrowserOpenedPIDs = [];

    /** 
     * @private
     * Find the default debuggable browser. Return the first debuggable browser
     * if node default was set.
     * @return {Object} Broweser definition
     */
    function _getDebugBrowserDefinition() {
        var browsers = PreferencesManager.get("browsers"),
            debugBrowserKey = null;

        var defaultDebugBrowser = _.find(Object.keys(browsers), function (browserKey) {
            var browserDef = browsers[browserKey];

            if (!debugBrowserKey && browserDef.debugArgs) {
                debugBrowserKey = browserKey;
            }

            return !!browserDef.isDefault;
        });

        // return the default debug browser or the first debug browser
        return browsers[defaultDebugBrowser || debugBrowserKey];
    }

    /** openLiveBrowser
     * Open the given URL in the user's system browser, optionally enabling debugging.
     * @param {string} url The URL to open.
     * @param {boolean=} enableRemoteDebugging Whether to turn on remote debugging. Default false.
     * @return {$.Promise} 
     */
    function openLiveBrowser(url, enableRemoteDebugging) {
        var result = new $.Deferred(),
            browserDef = _getDebugBrowserDefinition();
        
        // brackets.app.openLiveBrowser(url, !!enableRemoteDebugging, function onRun(err, pid) {
        //     if (!err) {
        //         // Undefined ids never get removed from list, so don't push them on
        //         if (pid !== undefined) {
        //             liveBrowserOpenedPIDs.push(pid);
        //         }
        //         result.resolve(pid);
        //     } else {
        //         result.reject(_browserErrToFileError(err));
        //     }
        // });

        browserProcess = ChildProcess.exec(browserDef.path, _getArgs(browserDef, url));
        result.resolve(browserProcess);
        
        return result.promise();
    }
    
    /** closeLiveBrowser
     *
     * @return {$.Promise}
     */
    function closeLiveBrowser(pid) {
        var result = new $.Deferred();
        
        // if (isNaN(pid)) {
        //     pid = 0;
        // }
        // brackets.app.closeLiveBrowser(function (err) {
        //     if (!err) {
        //         var i = liveBrowserOpenedPIDs.indexOf(pid);
        //         if (i !== -1) {
        //             liveBrowserOpenedPIDs.splice(i, 1);
        //         }
        //         result.resolve();
        //     } else {
        //         result.reject(_browserErrToFileError(err));
        //     }
        // }, pid);

        if (browserProcess) {
            var timeout = window.setTimeout(function () {
                browserProcess = null;
                result.reject();
            }, 5000);

            $(browserProcess).one("exit", function (code, signal) {
                browserProcess = null;
                window.clearTimeout(timeout);
                result.resolve();
            });

            browserProcess.kill();
        }

        return result.promise();
    }
    
    /** closeAllLiveBrowsers
     * Closes all the browsers that were tracked on open
     * TODO: does not seem to work on Windows
     * @return {$.Promise}
     */
    function closeAllLiveBrowsers() {
        //make a copy incase the array is edited as we iterate
        var closeIDs = liveBrowserOpenedPIDs.concat();
        return Async.doSequentially(closeIDs, closeLiveBrowser, false);
    }
    
    /**
     * Opens a URL in the system default browser
     */
    function openURLInDefaultBrowser(url) {
        //brackets.app.openURLInDefaultBrowser(url);
        ChildProcess.exec("open " + url);
    }
    

    // Define public API
    exports.openLiveBrowser = openLiveBrowser;
    exports.closeLiveBrowser = closeLiveBrowser;
    exports.closeAllLiveBrowsers = closeAllLiveBrowsers;
    exports.openURLInDefaultBrowser = openURLInDefaultBrowser;
});
