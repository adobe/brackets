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
 * Defines events to assist with module initialization.
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

    exports.ready = ready;
    exports.htmlContentLoadComplete = htmlContentLoadComplete;
    
    exports.HTML_CONTENT_LOAD_COMPLETE = HTML_CONTENT_LOAD_COMPLETE;
    exports.READY = READY;

    // internal use only
    exports._dispatchEvent = _dispatchEvent;
});