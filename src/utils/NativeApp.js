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
         * @param {function(...)} successCallback
         * @param {function(...)} errorCallback
         */
        openLiveBrowser: function (url, successCallback, errorCallback) {
            
            // Temporary workaround to avoid TypeError if the openLiveBrowser()
            // function isn't defined.
            // TODO: Remove this test once live browser hookup is complete.
            if (!brackets.app.openLiveBrowser) {
                if (errorCallback) {
                    errorCallback(-1);
                }
                return;
            }
            
            brackets.app.openLiveBrowser(url, function onRun(err) {
                if (!err) {
                    if (successCallback) {
                        successCallback();
                    }
                } else {
                    if (errorCallback) {
                        errorCallback(err);
                    }
                }
            });
        }

    };

    // Define public API
    exports.NativeApp = NativeApp;
});
