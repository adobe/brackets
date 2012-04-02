/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50*/
/*global $: false, define: false, brackets: false, FileError: false, InvalidateStateError: false */

define(function (require, exports, module) {
    'use strict';

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

    /** openLiveBrowser
     *
     * @param {string} url
     * @return {$.Promise} 
     */
    function openLiveBrowser(url, successCallback, errorCallback) {
        var result = new $.Deferred();
        
        brackets.app.openLiveBrowser(url, function onRun(err) {
            if (!err) {
                result.resolve();
            } else {
                result.reject(_browserErrToFileError(err));
            }
        });
        
        return result.promise();
    }
    
    /** closeLiveBrowser
     *
     * @return {$.Promise}
     */
    function closeLiveBrowser(successCallback, errorCallback) {
        var result = new $.Deferred();
        
        brackets.app.closeLiveBrowser(function (err) {
            if (!err) {
                result.resolve();
            } else {
                result.reject(_browserErrToFileError(err));
            }
        });
        
        return result.promise();
    }

    // Define public API
    exports.openLiveBrowser = openLiveBrowser;
    exports.closeLiveBrowser = closeLiveBrowser;
});
