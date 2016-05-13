/*
 * Copyright (c) 2013 - present Adobe Systems Incorporated. All rights reserved.
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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, evil:true */
/*global window, document */

/**
 * Check for missing dependencies
 */
window.setTimeout(function () {
    "use strict";

    var key, missingDeps = "";
    var deps = { "jQuery": window.$, "RequireJS": window.require };

    for (key in deps) {
        if (deps.hasOwnProperty(key) && !deps[key]) {
            missingDeps += "<li>" + key + "</li>";
        }
    }

    if (missingDeps.length > 0) {
        var str = "<h1>Missing libraries</h1>" +
                  "<p>Oops! One or more required libraries could not be found.</p>" +
                  "<ul>" + missingDeps + "</ul>" +
                  "<p>If you're running from a local copy of the Brackets source, please make sure submodules are updated by running:</p>" +
                  "<pre>git submodule update --init</pre>" +
                  "<p>If you're still having problems, please contact us via one of the channels mentioned at the bottom of the <a target=\"blank\" href=\"../README.md\">README</a>.</p>" +
                  "<p><a href=\"#\" onclick=\"window.location.reload()\">Reload Brackets</a></p>";

        document.write(str);
    }
}, 1000);
