/*
 * Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
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
/*global require, define, window, brackets, navigator, jQuery */

/**
 * The bootstrapping module for brackets. This module sets up the require
 * configuration and loads the brackets module.
 */
require.config({
    paths: {
        "text"              : "thirdparty/text/text",
        "i18n"              : "thirdparty/i18n/i18n",

        // The file system implementation. Change this value to use different
        // implementations (e.g. cloud-based storage).
        "fileSystemImpl"    : "filesystem/impls/appshell/AppshellFileSystem"
    }
});

if (window.location.search.indexOf("testEnvironment") > -1) {
    require.config({
        paths: {
            "preferences/PreferencesImpl": "../test/TestPreferencesImpl"
        },
        locale: "en" // force English (US)
    });
} else {
    /**
     * hack for r.js optimization, move locale to another config call
     *
     * Use custom brackets property until CEF sets the correct navigator.language
     * NOTE: When we change to navigator.language here, we also should change to
     * navigator.language in ExtensionLoader (when making require contexts for each
     * extension).
     */
    require.config({
        locale: window.localStorage.getItem("locale") || (typeof (brackets) !== "undefined" ? brackets.app.language : navigator.language)
    });
}

// jQuery patch for event dispatchers
// TODO: once all core usages fixed, we can move this into brackets.js since only extensions will need it
(function () {
    "use strict";
    var DefaultCtor = jQuery.fn.init;

    jQuery.fn.init = function (firstArg, secondArg) {
        var jQObject = new DefaultCtor(firstArg, secondArg);
        
        // Is this a Brackets EventDispatcher object? (not a DOM node or other object)
        if (firstArg && firstArg._EventDispatcher) {
            // Patch the jQ wrapper object so it calls EventDispatcher's APIs instead of jQuery's
            jQObject.on  = firstArg.on.bind(firstArg);
            jQObject.one = firstArg.one.bind(firstArg);
            jQObject.off = firstArg.off.bind(firstArg);
            // We don't offer legacy support for trigger()/triggerHandler() on core model objects; extensions
            // shouldn't be doing that anyway since it's basically poking at private API
            
            // Console warning, since $() is deprecated for EventDispatcher objects
            // Check if this is an extension vs. core - 4th line of stack trace (3rd stack frame) is $()'s caller
            var stack = new Error().stack.split("\n");
            if (stack[3].indexOf("/dev/src/") !== -1 && stack[3].indexOf("/extensions/dev/") === -1) {
                // Report more agressively if core code is still using deprecated $(). This detection only
                // works in dev builds, since r.js-concatenated builds don't provide much path info in the
                // stack trace, and we don't want an overbroad check that would flag r.js extension code too.
                console.error("Core code should no longer be using $().on/off()!");
                console.assert();  // force dev tools to pause
                
            // TODO: Enable warnings for extensions once they've had some time to update (too much spam for now)
//            } else {
//                var stackStr = "\n" + stack.slice(1).join("\n");  // trim off "Error" prefix
//                console.warn("Deprecated: Do not use $().on/off() on Brackets modules and model objects. Call on()/off() directly.", stackStr);
            }
        }
        return jQObject;
    };
}());

define(function (require) {
    "use strict";

    // Load compatibility shims--these need to load early, be careful moving this
    require(["utils/Compatibility"], function () {
        // Load the brackets module. This is a self-running module that loads and runs the entire application.
        require(["brackets"]);
    });
});
