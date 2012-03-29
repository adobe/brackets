/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50*/
/*global $: false, define: false, brackets: false, FileError: false, InvalidateStateError: false */

define(function (require, exports, module) {
    'use strict';

    var NativeApp = {

        /** openLiveBrowser
         *
         * @param {string} url
         * @return {$.Promise} 
         */
        openLiveBrowser: function (url, successCallback, errorCallback) {
            var result = new $.Deferred();
            
            brackets.app.openLiveBrowser(url, function onRun(err) {
                if (!err) {
                    result.resolve();
                } else {
                    result.fail(
                        err === brackets.fs.ERR_NOT_FOUND
                            ? FileError.NOT_FOUND_ERR
                            : FileError.SECURITY_ERR  // SECURITY_ERR is the catch-all
                    );
                }
            });
            
            return result.promise();
        }

    };

    // Define public API
    exports.NativeApp = NativeApp;
});
