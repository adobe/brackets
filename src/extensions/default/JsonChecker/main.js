/*
 * Copyright (c) 2017 - present Adobe Systems Incorporated. All rights reserved.
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
    
    var FileSystem = brackets.getModule("filesystem/FileSystem"),
    FileUtils = brackets.getModule("file/FileUtils");

    function escapeCommentsChars(jsonString) {
        return jsonString.replace(/\/*/g, "\*")
        .replace(/\*\//g, "*/")
        .replace(/\/\//g, "//")
        .replace(/(\*)/g, "");
    }

    function getJsonFiles() {
        var jsonFiles = [];
        var path = require.toUrl("./watchList.json");
        var result = new $.Deferred();
        var file = FileSystem.getFileForPath(path);
        var promise = FileUtils.readAsText(file).then(function (text) {
            try{
                jsonFiles = JSON.parse(text);
                result.resolve(jsonFiles);
            } catch(e){
                console.warn("JsonChecker: "+ e);
                result.resolve();
            }


        }).fail(function () {
            result.reject();
        });

        return result.promise();
    }



    function jsonParse(path) {

        var result = new $.Deferred();
        var file = FileSystem.getFileForPath(path);
        var promise = FileUtils.readAsText(file).then(function (text) {
            try {
                JSON.parse(escapeCommentsChars(text));
                result.resolve();
            } catch (e) {
                console.warn("JsonChecker: " + path + e);
                result.resolve();
            }

        }).fail(function () {
            console.warn("JsonChecker: Error reading file " + path);
            result.reject();
        });

        return result.promise();
    }

    var path;
    var files = getJsonFiles().then(function(jsonFiles) {
        jsonFiles.forEach(function(file) {
            path = require.toUrl(file);
            jsonParse(path);
        });
    });


    var SETTINGS_FILENAME    = "defaultPreferences.json",
    STATE_FILENAME    = "state.json",
    PATH_BRACKETS_FILE = "../../../../.brackets.json",

    // User-level preferences
    userPrefFile = "" + brackets.app.getApplicationSupportDirectory() + "/" + SETTINGS_FILENAME,

    // User-level state
    userStateFile = "" + brackets.app.getApplicationSupportDirectory() + "/" + STATE_FILENAME;

    jsonParse(userPrefFile);
    jsonParse(userStateFile);
    jsonParse(require.toUrl(PATH_BRACKETS_FILE));

});