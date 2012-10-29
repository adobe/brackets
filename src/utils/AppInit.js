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


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define */

/**
 * Defines hooks to assist with module initialization.
 *
 * This module defines 2 methods for client modules to attach callbacks:
 *    - htmlReady - When the main application template is rendered
 *    - appReady - When Brackets completes loading all modules and extensions
 *
 * These are *not* jQuery events. Each method is similar to $(document).ready
 * in that it will call the handler immediately if brackets is already done
 * loading.
 */
define(function (require, exports, module) {
    "use strict";
    
    // Fires when the base htmlContent/main-view.html is loaded
    var HTML_READY  = "htmlReady";

    // Fires when all extensions are loaded
    var APP_READY   = "appReady";

    var status      = { HTML_READY : false, APP_READY : false },
        callbacks   = {};

    callbacks[HTML_READY] = [];
    callbacks[APP_READY] = [];

    function _callHandler(handler) {
        try {
            // TODO (issue 1034): We *could* use a $.Deferred for this, except deferred objects enter a broken
            // state if any resolution callback throws an exception. Since third parties (e.g. extensions) may
            // add callbacks to this, we need to be robust to exceptions
            handler();
        } catch (e) {
            console.error("Exception when calling a 'brackets done loading' handler:");
            console.log(e.stack);
        }
    }

    function _dispatchReady(type) {
        var i,
            myHandlers = callbacks[type];

        // mark this status complete
        status[type] = true;

        for (i = 0; i < myHandlers.length; i++) {
            _callHandler(myHandlers[i]);
        }

        // clear all callbacks after being called
        callbacks[type] = [];
    }

    function _addListener(type, callback) {
        if (status[type]) {
            _callHandler(callback);
        } else {
            callbacks[type].push(callback);
        }
    }

    /**
     * Adds a callback for the ready hook. Handlers are called after
     * htmlReady is done, the initial project is loaded, and all extensions are
     * loaded.
     * @param {function} handler
     */
    function appReady(callback) {
        _addListener(APP_READY, callback);
    }

    /**
     * Adds a callback for the htmlReady hook. Handlers are called after the
     * main application html template is rendered.
     * @param {function} handler
     */
    function htmlReady(callback) {
        _addListener(HTML_READY, callback);
    }

    exports.appReady = appReady;
    exports.htmlReady = htmlReady;
    
    exports.HTML_READY = HTML_READY;
    exports.APP_READY = APP_READY;

    // internal use only
    exports._dispatchReady = _dispatchReady;
});