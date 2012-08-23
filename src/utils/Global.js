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
 * Initializes the global 'brackets' variable and it's properties.
 *
 * This module dispatches these events:
 *    - htmlContentLoadComplete - When the main application template is rendered
 *    - ready - When Brackets completes loading all modules and extensions
 *
 * These are *not* jQuery events. Each event has it's own event registration.
 * Each event is similar to $(document).ready in that it will call the handler
 * immediately if brackets is already done loading
 */
define(function (require, exports, module) {
    "use strict";
    
    // Fires when the base htmlContent/main-view.html is loaded
    var HTML_CONTENT_LOAD_COMPLETE  = "htmlContentLoadComplete";

    // Fires when all extensions are loaded
    var READY                       = "ready";

    var eventStatus                 = { HTML_CONTENT_LOAD_COMPLETE : false, READY : false },
        handlers                    = {};

    handlers[HTML_CONTENT_LOAD_COMPLETE] = [];
    handlers[READY] = [];

    function _callEventHandler(handler) {
        try {
            // TODO (issue 1034): We *could* use a $.Deferred for this, except deferred objects enter a broken
            // state if any resolution callback throws an exception. Since third parties (e.g. extensions) may
            // add callbacks to this, we need to be robust to exceptions
            handler();
        } catch (e) {
            console.log("Exception when calling a 'brackets done loading' handler");
            console.log(e);
        }
    }

    function _dispatchEvent(type) {
        var i,
            eventTypeHandlers = handlers[type];

        // mark this event type as fired
        eventStatus[type] = true;

        for (i = 0; i < eventTypeHandlers.length; i++) {
            _callEventHandler(eventTypeHandlers[i]);
        }

        // clear all handlers after being called
        eventTypeHandlers = [];
    }

    // WARNING: This event won't fire if ANY extension fails to load or throws an error during init.
    // To fix this, we need to make a change to _initExtensions (filed as issue 1029)
    function _addListener(type, handler) {
        if (eventStatus[type]) {
            _callEventHandler(handler);
        } else {
            handlers[type].push(handler);
        }
    }

    /**
     * Adds an event handler for the ready event. Handlers are called after
     * htmlContentLoadComplete, the initial project is loaded, and all
     * extensions are loaded.
     * @param {function} handler
     */
    function ready(handler) {
        _addListener(READY, handler);
    }

    /**
     * Adds an event handler for the htmlContentLoadComplete event. Handlers
      * are called after the main application html template is rendered.
     * @param {function} handler
     */
    function htmlContentLoadComplete(handler) {
        _addListener(HTML_CONTENT_LOAD_COMPLETE, handler);
    }
    
    // Define core brackets namespace if it isn't already defined
    //
    // We can't simply do 'brackets = {}' to define it in the global namespace because
    // we're in "use strict" mode. Most likely, 'window' will always point to the global
    // object when this code is running. However, in case it isn't (e.g. if we're running 
    // inside Node for CI testing) we use this trick to get the global object.
    //
    // Taken from:
    //   http://stackoverflow.com/questions/3277182/how-to-get-the-global-object-in-javascript
    var Fn = Function, global = (new Fn("return this"))();
    if (!global.brackets) {
        global.brackets = {};
    }
        
    // Uncomment the following line to force all low level file i/o routines to complete
    // asynchronously. This should only be done for testing/debugging.
    // NOTE: Make sure this line is commented out again before committing!
    //brackets.forceAsyncCallbacks = true;

    // Load native shell when brackets is run in a native shell rather than the browser
    // TODO: (issue #266) load conditionally
    global.brackets.shellAPI = require("utils/ShellAPI");
    
    global.brackets.inBrowser = !global.brackets.hasOwnProperty("fs");
    
    global.brackets.platform = (global.navigator.platform === "MacIntel" || global.navigator.platform === "MacPPC") ? "mac" : "win";
    
    // Loading extensions requires creating new require.js contexts, which
    // requires access to the global 'require' object that always gets hidden
    // by the 'require' in the AMD wrapper. We store this in the brackets
    // object here so that the ExtensionLoader doesn't have to have access to
    // the global object.
    global.brackets.libRequire = global.require;

    // Also store our current require.js context (the one that loads brackets
    // core modules) so that extensions can use it.
    // Note: we change the name to "getModule" because this won't do exactly
    // the same thing as 'require' in AMD-wrapped modules. The extension will
    // only be able to load modules that have already been loaded once.
    global.brackets.getModule = require;

    // Provide a way for anyone (including code not using require) to register
    // a handler for the brackets 'ready' and 'htmlContentLoadComplete' events
    global.brackets.ready = ready;
    global.brackets.htmlContentLoadComplete = htmlContentLoadComplete;

    exports.global = global;
    exports.HTML_CONTENT_LOAD_COMPLETE = HTML_CONTENT_LOAD_COMPLETE;
    exports.READY = READY;

    // internal use only
    exports._dispatchEvent = _dispatchEvent;
});