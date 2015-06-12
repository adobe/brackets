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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4,
maxerr: 50, node: true */
/*global */

(function () {
    "use strict";
    
    var os = require("os");
    
//    function doSearchInFiles(fileList, searchString, queryExpr) {
//            
//            if (fileList.length === 0) {
//                console.log('no files found');
//                return;
//
//            } else {
//                var numCompleted = 0;
//                var hasFailed = false;
//
//                fileList.forEach(function (filePath, i) {
//                    _doSearchInOneFile(filePath, queryExpr);
//                });
//            }
//        };
//    
    function doSearch(fileList) {
        console.log(fileList.length);
        return fileList.length;
    };
    
    /**
     * Initializes the test domain with several test commands.
     * @param {DomainManager} domainManager The DomainManager for the server
     */
    function init(domainManager) {
        if (!domainManager.hasDomain("FindInFiles")) {
            domainManager.registerDomain("FindInFiles", {major: 0, minor: 1});
        }
       domainManager.registerCommand(
            "FindInFiles",       // domain name
            "doSearch",    // command name
            doSearch,   // command handler function
            false,          // this command is synchronous in Node
            "Searches in project files and returns matches",
            [{name: "fileList", // parameters
                type: "Array",
                description: "List of files"}],
            [{name: "temp", // return values
                type: "number",
                description: "don't know yet"}]
        );
    }
    
    exports.init = init;
    
}());
