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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true */
/*global define */

define(function (require, exports, module) {
    "use strict";

    var FIF_PROJECT_INIT           = "Init Search for Project",
        FIF_SEARCH                 = "Do Search in Files",
        FIF_PROJECT_UPDATE         = "Update the Project Files",
        FIF_RESULTS_PREPARED       = "Send results back to Main Thread",
        FIF_WORKER_INITED          = "Worker init done";


    exports.FIF_PROJECT_INIT           = FIF_PROJECT_INIT;
    exports.FIF_SEARCH                 = FIF_SEARCH;
    exports.FIF_PROJECT_UPDATE         = FIF_PROJECT_UPDATE;
    exports.FIF_RESULTS_PREPARED       = FIF_RESULTS_PREPARED;
    exports.FIF_WORKER_INITED          = FIF_WORKER_INITED;
});


