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
    
    var Async               = require("utils/Async"),
        ChildProcess        = require("utils/ChildProcess"),
        FileSystemError     = require("filesystem/FileSystemError"),
        PreferencesManager  = require("preferences/PreferencesManager"),
        StringUtils         = require("utils/StringUtils");

    var liveDevProfilePath = brackets.app.getApplicationSupportDirectory() + "/live-dev-profile",
        remoteDebuggingPort = 9222,
        browserProcess;

    var GOOGLE_CHROME           = "/Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome",
        GOOGLE_CHROME_CANARY    = "/Applications/Google\\ Chrome\\ Canary.app/Contents/MacOS/Google\\ Chrome\\ Canary",
        FIREFOX_AURORA          = "/Applications/FirefoxAurora.app/Contents/MacOS/firefox",
        GOOGLE_CHROME_ARGS      = [
            "--no-first-run",
            "--no-default-browser-check",
            StringUtils.format("--remote-debugging-port={0}", remoteDebuggingPort),
            StringUtils.format("--user-data-dir=\"{1}\"", remoteDebuggingPort, liveDevProfilePath)
        ];

    // TODO native search for path to chrome
    // WIN: REG QUERY "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe" /ve
    // MAC: mdfind "kMDItemCFBundleIdentifier == 'com.google.Chrome'"
    //      mdfind "kMDItemCFBundleIdentifier == 'com.google.Chrome.canary'"
    //      ... then to get the exectuable
    //      codesign --display /Applications/Google\ Chrome.app
    // LINUX: Assume it's in the $PATH???
    var chromeDefaultPref = {
        "Google Chrome": { path: GOOGLE_CHROME }
    };

    PreferencesManager.definePreference("browsers", "object", chromeDefaultPref);
    PreferencesManager.setValueAndSave("user", "browsers", chromeDefaultPref);

    function getChromeArgs(url) {
        var args = [];

        // add default args
        Array.prototype.push.apply(args, GOOGLE_CHROME_ARGS);

        // URL is the last arg
        args.push(url);

        return args;
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

    /** openLiveBrowser
     * Open the given URL in the user's system browser, optionally enabling debugging.
     * @param {string} url The URL to open.
     * @param {boolean=} enableRemoteDebugging Whether to turn on remote debugging. Default false.
     * @return {$.Promise} 
     */
    function openLiveBrowser(url, enableRemoteDebugging) {
        var result = new $.Deferred();
        
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

        browserProcess = ChildProcess.exec(GOOGLE_CHROME_CANARY, getChromeArgs(url));
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
