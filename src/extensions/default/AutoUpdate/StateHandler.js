/*
 * Copyright (c) 2018 - present Adobe Systems Incorporated. All rights reserved.
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

define(function (require, exports, module) {
    "use strict";

    var FileSystem = brackets.getModule("filesystem/FileSystem"),
        FileUtils = brackets.getModule("file/FileUtils");

    var FILE_NOT_FOUND = 0,
        FILE_NOT_READ = 1,
        FILE_PARSE_EXCEPTION = 2,
        FILE_READ_FAIL = 3;

    /**
     * @constructor
     * Creates a StateHandler object for a JSON file. It maintains the following :
     * path - path to the JSON file,
     * state - parsed content of the file
     * @param {string} path - path to the JSON file
     */
    var StateHandler = function (path) {
        this.path = path;
        this.state = null;
    };

    /**
     * Checks if the file exists
     * @returns {$.Deferred} - a jquery deferred promise,
     *                       that is resolved with existence or non-existence
     *                       of json file.
     */
    StateHandler.prototype.exists = function () {
        var result = $.Deferred(),
            _file = FileSystem.getFileForPath(this.path);

        _file.exists(function (err, exists) {
            if(err) {
                result.reject();
            } else if(exists) {
                result.resolve();
            } else {
                result.reject();
            }
        });

        return result.promise();
    };

    /**
     * Parses the JSON file, and maintains a state for the parsed data
     * @returns {$.Deferred} - a jquery deferred promise,
     *                       that is resolved with a parsing success or failure
     */
    StateHandler.prototype.parse = function () {
        var result = $.Deferred(),
            _file = FileSystem.getFileForPath(this.path);
        var self = this;

        this.exists()
            .done(function () {
                FileUtils.readAsText(_file)
                    .done(function (text) {
                        try {
                            if (text) {
                                self.state = JSON.parse(text);
                                result.resolve();
                            } else {
                                result.reject(FILE_READ_FAIL);
                            }
                        } catch (error) {
                            result.reject(FILE_PARSE_EXCEPTION);
                        }
                    })
                    .fail(function () {
                        result.reject(FILE_NOT_READ);
                    });

            })
            .fail(function () {
                result.reject(FILE_NOT_FOUND);
            });

        return result.promise();
    };

    /**
     * Sets the value of a key in a json file.
     * @param   {string} key  - key for which the value is to be set
     * @param   {string} value - the value to be set for the given key
     * @returns {$.Deferred} - a jquery deferred promise, that is resolved with a write success or failure
     */
    StateHandler.prototype.set = function (key, value) {
        this.state = this.state || {};
        this.state[key] = value;

        return this.write(true);
    };

    /**
     * Gets the value for a given key, from the in-memory state maintained for a json file.
     * @param   {string} key - key for which value is to be retrieved
     * @returns {string} value for the given key
     */
    StateHandler.prototype.get = function (key) {
        var retval = null;

        if (this.state && this.state[key]) {
            retval = this.state[key];
        }

        return retval;
    };


    /**
     * Performs the write of JSON object to a file.
     * @param   {string} filepath - path to JSON file
     * @param   {object} json  - JSON object to write
     * @returns {$.Deferred} - a jquery deferred promise,
     *                       that is resolved with the write success or failure
     */
    function _write(filePath, json) {
        var result = $.Deferred(),
            _file = FileSystem.getFileForPath(filePath);

        var content = JSON.stringify(json);
        FileUtils.writeText(_file, content, true)
            .done(function () {
                result.resolve();
            })
            .fail(function (err) {
                result.reject();
            });

        return result.promise();
    }
    /**
     * Writes content into a json file
     * @param   {boolean} overwrite  - true if file is to be overwritten, false otherwise
     * @param   {object} [content=this.state] - content to be written into the json file.
     * @returns {$.Deferred} - a jquery deferred promise, that is resolved with a write success or failure
     */
    StateHandler.prototype.write = function (overwrite) {
        var result = $.Deferred(),
            self = this;

        function writePromise(path, contentToWrite) {
            _write(path, contentToWrite)
                .done(function () {
                    result.resolve();
                })
                .fail(function (err) {
                    result.reject();
                });
        }

        var content = self.state;
        if (overwrite) {
            self.exists()
                .fail(function () {
                    writePromise(self.path, content);
                }).done(function (){
                    writePromise(self.path, content);
                });
        } else {
            //check for existence
            self.exists()
                .fail(function () {
                    writePromise(self.path, content);
                }).done(function (){
                    result.reject();
                });
        }

        return result.promise();
    };

    /**
     * Resets the content of the in-memory state
     */
    StateHandler.prototype.reset = function () {
        this.state = null;
    };

    exports.StateHandler = StateHandler;
    exports.MessageKeys = {
        FILE_NOT_FOUND: FILE_NOT_FOUND,
        FILE_NOT_READ: FILE_NOT_READ,
        FILE_PARSE_EXCEPTION: FILE_PARSE_EXCEPTION,
        FILE_READ_FAIL: FILE_READ_FAIL
    };
});
