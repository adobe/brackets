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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4,
maxerr: 50, node: true */
/*global */

(function () {
    "use strict";
    
    var Logger = require("./Logger"),
        Server = require("./Server"),
        os     = require("os");
    
    /** @define {boolean} Whether debugger should be enabled at launch
     *
     * If true, the debugger is enabled automatically, and the init function is
     * *not* called. This gives the user time to connect with the remote 
     * debugger and set breakpoints before running "launch" him/herself from the 
     * console. In this case, launch is run by calling the global function 
     * debugLaunch(), which only exists if DEBUG_ON_LAUNCH is set.
     *
     * NOTE: This is only useful for debugging the launch routine. If you 
     * want to simply debug some command module, enable the debugger by
     * sending the base.enableDebugger command and then connect to it.
     *
     * NOTE: On Mac, if you leave the debugger stopped at a breakpoint and then
     * exit Brackets, the node process will become abandoned. (Because it is
     * stopped, it will never check its stdin to see if it's closed, so it
     * won't know that it's parent process has died.)
     */
    var DEBUG_ON_LAUNCH = false;

    /** @define {?string} Filename to dump all log data to.
     * If not null, all log data is appended to the specified file.
     */
    var LOG_FILENAME_ON_LAUNCH = null;
    

    function exit() {
        if (Server) {
            Server.stop();
        }
        process.exit(0);
    }
    
    /**
     * Top-level handler for any uncaught exception. Attempts to log
     * the exception and shut down gracefully. (Though that may of course
     * fail depending on the exception.)
     *
     * TODO: Switch to using Node Domains once they're stable enough. In v0.8.x
     * Domains are "Stability: 1 - Experimental". What we really want to
     * do is run every connection in a separate Domain. Then, if an individual
     * connection has an uncaught exception, we can just close it and still
     * continue to run normally.
     */
    function uncaughtExceptionHandler() {
        var args = Array.prototype.slice.call(arguments, 0);
        args = args.map(function (arg) {
            return arg instanceof Error ? arg.stack : arg;
        });
        args.unshift("[Launcher] uncaught exception at top level, exiting.");
        Logger.error.apply(null, args);
//        exit();
    }

    /**
     * Setup the Logger and launch the server. If DEBUG_ON_LAUNCH is false,
     * this is called immediately on module load. If DEBUG_ON_LAUNCH is true,
     * this method can be called by calling the global debugLaunch function
     * from the console.
     */
    function launch() {
        process.on("uncaughtException", uncaughtExceptionHandler);
        if (LOG_FILENAME_ON_LAUNCH) {
            Logger.setLogFilename(LOG_FILENAME_ON_LAUNCH);
        }
        Logger.remapConsole();
        Server.on("end", function () {
            Server = null;
            Logger.info(
                "[Launcher] received Server \"end\" event, exiting process"
            );
            exit();
        });
        Server.start();
    }
    
    if (!DEBUG_ON_LAUNCH) {
        launch();
    } else {
        var noopTimer = setInterval(function () {
            // no-op so that we don't exit the process
        }, 100000);

        // Inject a global so that user can call launch from the console
        // The debugger won't stop at breakpoints if they're reached as a 
        // direct result of evaluation of the console. So, we call launch()
        // from a timer. This will allow hitting breakpoints set in launch()
        // and in the functions it calls.
        global.debugLaunch = function () {
            process.nextTick(function () {
                clearInterval(noopTimer);
                launch();
            });
        };
        process._debugProcess(process.pid);
    }

    // Set environment variable to use built-in Node.js API for temp directory
    if (!process.env["TMPDIR"] && !process.env["TMP"] && !process.env["TEMP"]) {
        process.env["TMPDIR"] = process.env["TMP"] = process.env["TEMP"] = os.tmpdir();
    }
    
    exports.launch = launch;
    exports.exit   = exit;
    
}());
