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
 */
 define(function (require, exports, module) {
    "use strict";
    
    // Function to run when the menu item is clicked
    var FileSystem = brackets.getModule("filesystem/FileSystem");
    var FileUtils = brackets.getModule("file/FileUtils");

    //Main json files of Brackets
    var jsonFiles = [
    "../../../brackets.config.dev.json", 
    "../../../brackets.config.dist.json", 
    "../../../brackets.config.json", 
    "../../../config.json", 
    "../../../package.json", 
    "../../../supported-encodings.json",
    "../../../../npm-shrinkwrap.json",
    "../../../../build.json",
    "../../../../.brackets.json",
    "../../../../package.json"
    ];

   
    function jsonParse(path) {

        var result = new $.Deferred();
        var file = FileSystem.getFileForPath(path);
        var promise = FileUtils.readAsText(file).then(function (text) {
            try {
                JSON.parse(text);
                result.resolve();
            } catch (e) {
                console.log("JsonChecker: Error in " + path);
                result.resolve();
            }

        }).fail(function () {
            console.log("JsonChecker: Error reading file " + path);
            result.reject();
        });

   return result.promise();
  }


  var i = 0, path;
  while(i < jsonFiles.length) {
    path = require.toUrl(jsonFiles[i]);
    jsonParse(path).then(i++);  
    }

});