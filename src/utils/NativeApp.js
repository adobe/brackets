/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50*/
/*global $: false, define: false, brackets: false, FileError: false, InvalidateStateError: false */

define(function (require, exports, module) {
    'use strict';
    
    var Async = require("utils/Async");

    /**
     * @private
     * Map an fs error code to a FileError.
     */
    function _browserErrToFileError(err) {
        if (err === brackets.fs.ERR_NOT_FOUND) {
            return FileError.NOT_FOUND_ERR;
        }
        
        // All other errors are mapped to the generic "security" error
        return FileError.SECURITY_ERR;
    }
    
    var liveBrowserOpenedPIDs = [];
    var liveBrowserUserDataDir = "";

    /** openLiveBrowser
     *
     * @param {string} url
     * @return {$.Promise} 
     */
    function openLiveBrowser(url, enableRemoteDebugging, successCallback, errorCallback) {
        var result = new $.Deferred();
        
        brackets.app.openLiveBrowser(url, enableRemoteDebugging, function onRun(err) {
            if (!err) {
                liveBrowserOpenedPIDs.push(pid);
                result.resolve(pid);
            } else {
                result.reject(_browserErrToFileError(err));
            }
        }, liveBrowserUserDataDir);
        
        return result.promise();
    }
    
    /** closeLiveBrowser
     *
     * @return {$.Promise}
     */
    function closeLiveBrowser(pid) {
        var result = new $.Deferred();
        
        if (isNaN(pid)) {
            pid = 0;
        }
        console.log("calling to close: " + pid);
        brackets.app.closeLiveBrowser(function (err) {
            console.log("called closing: " + pid + " with err: " + err);
            if (!err) {
                var i = liveBrowserOpenedPIDs.indexOf(pid);
                if (i !== -1) {
                    liveBrowserOpenedPIDs.splice(i, 1);
                }
                result.resolve();
            } else {
                result.reject(_browserErrToFileError(err));
            }
        }, pid);
        
        return result.promise();
    }
    
    /** closeAllLiveBrowsers
     * Closes all the browsers that were tracked on open
     * @return {$.Promise}
     */
    function closeAllLiveBrowsers() {
        //make a copy incase the array is edited as we iterate
        var closeIDs = liveBrowserOpenedPIDs.concat();
        return Async.doInParallel(closeIDs, closeLiveBrowser, false);
    }
    
    /** _setLiveBrowserUserDataDir
     * For Unit Tests only, changes the default dir the browser use for it's user data
     * @return {$.Promise}
     */
    function _setLiveBrowserUserDataDir(path) {
        liveBrowserUserDataDir = path;
    }
    
    

    // Define public API
    exports.openLiveBrowser = openLiveBrowser;
    exports.closeLiveBrowser = closeLiveBrowser;
    exports.closeAllLiveBrowsers = closeAllLiveBrowsers;
    //API for Unit Tests
    exports._setLiveBrowserUserDataDir = _setLiveBrowserUserDataDir;
});
