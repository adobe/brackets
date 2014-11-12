/*
 * Copyright (c) 2014 Adobe Systems Incorporated. All rights reserved.
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
 */


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, jQuery */

/**
 * Implements a jQuery-like event dispatch pattern for non-DOM objects:
 *  - Listeners are attached via on() & detached via off()
 *  - Listeners can use namespaces for easy removal
 *  - Events are fired via trigger()
 * 
 * But it has some important differences from jQuery's non-DOM event mechanism:
 *  - More robust to listeners that throw exceptions
 *  - Events can be marked deprecated, causing on() to issue warnings
 *  - trigger() uses a simpler argument-list signature (like Promise APIs), rather than requiring
 *    an Array arg and ignoring additional args
 * 
 * For now, Brackets uses a jQuery patch to ensure $(obj).on() and obj.on() (etc.) are identical
 * for any obj that has the EventDispatcher pattern. In the future, this may be deprecated.
 * 
 * To add EventDispatcher methods to any object, call EventDispatcher.makeEventDispatcher(obj).
 */
define(function (require, exports, module) {
    "use strict";
    
    /** Return just the event name, sans any trailing ".namespace" part */
    function stripNs(eventName) {
        var dot = eventName.indexOf(".");
        return dot === -1 ? eventName : eventName.substring(0, dot);
    }
    
    
    // These functions are added as mixins to any object by makeEventDispatcher()
    
    var on = function (events, fn) {
        // Check for deprecation warnings
        if (this._deprecatedEvents) {
            var eventsList = events.split(/\s+/);
            var i;
            for (i = 0; i < eventsList.length; i++) {
                var eventName = stripNs(eventsList[i]);
                if (this._deprecatedEvents[eventName]) {
                    var message = "Registering for deprecated event '" + eventName + "'.";
                    if (typeof this._deprecatedEvents[eventName] === "string") {
                        message += " Use " + this._deprecatedEvents[eventName] + " instead.";
                    }
                    console.warn(message, new Error().stack);
                }
            }
        }
        
        // Attach listener
        var proxy = $(this._EventDispatcher);
        return proxy.on.apply(proxy, arguments);  // important to return value for chaining
    };
    
    var off = function (events, fn) {
        // Detach listener
        var proxy = $(this._EventDispatcher);
        return proxy.off.apply(proxy, arguments);  // important to return value for chaining
    };
    
    var trigger = function (event) {
        var proxy = $(this._EventDispatcher);
        try {
            // Convert from 'args...' to '[args]' format
            var eventArgs = Array.prototype.slice.call(arguments, 1);
            var applyArgs = [event, eventArgs]; // jQuery wants triggerHandler("eventName", [arg1, arg2, ...]), so we need a nested array for eventArgs
            
            // Dispatch event
            return proxy.triggerHandler.apply(proxy, applyArgs);
        } catch (err) {
            console.error("Exception in '" + event + "' listener on", this, String(err), err.stack);
        }
    };
    
    
    /**
     * @param {!Object} obj Object to add event-dispatch methods to
     */
    function makeEventDispatcher(obj) {
        $.extend(obj, {
            on: on,
            off: off,
            trigger: trigger,
            _EventDispatcher: {}
        });
    }
    
    /**
     * Mark a given event name as deprecated, such that on() will emit warnings when called with it.
     * May be called before makeEventDispatcher(). May be called on a prototype where makeEventDispatcher()
     * is called separately per instance (in the ctor).
     * @param {!Object} obj Event dispatcher object
     * @param {string} event Name of deprecated event
     * @param {string=} insteadStr Suggested thing to use instead
     */
    function markDeprecated(obj, event, insteadStr) {
        // Mark event as deprecated - on() will emit warnings when called with this event
        if (!obj._deprecatedEvents) {
            obj._deprecatedEvents = {};
        }
        obj._deprecatedEvents[event] = insteadStr || true;
    }
    
    
    exports.makeEventDispatcher = makeEventDispatcher;
    exports.markDeprecated      = markDeprecated;
});
