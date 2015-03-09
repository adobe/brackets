/*
 * Copyright (c) 2015 Adobe Systems Incorporated. All rights reserved.
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
/*global define, $, brackets, console */

define(function (require, exports, module) {
    "use strict";
    
    var FileSystem = require("filesystem/FileSystem"),
        FileUtils  = require("file/FileUtils");
    
    function readHealthDataFile(healthDataFilePath) {
        var result = new $.Deferred();
        var healthDataFile = FileSystem.getFileForPath(healthDataFilePath);

        healthDataFile.read({}, function (err, text) {
            if (err) {
                console.error("Error in reading HealthData file " + healthDataFilePath);
                result.reject();
            }

            FileUtils.sniffLineEndings(text);

            // If the file is empty, turn it into an empty object
            if (/^\s*$/.test(text)) {
                result.resolve({});
            } else {
                try {
                    result.resolve(JSON.parse(text));
                } catch (e) {
                    console.error("Error in JSON parsing of file " + healthDataFilePath);
                    result.reject();
                }
            }
        });
        return result.promise();
    }

    function writeHealthDataFile(data, healthDataFilePath) {
        var result = new $.Deferred();
        var healthDataFile = FileSystem.getFileForPath(healthDataFilePath);
        try {
            var text = JSON.stringify(data, null, 4);

            healthDataFile.write(text, {}, function (err) {
                if (err) {
                    console.error("Error in saving HealthData Logs to file " + healthDataFilePath + " " + err);
                    result.reject();
                } else {
                    result.resolve();
                }
            });
        } catch (e) {
            console.error("Error in converting Health Data logs to JSON " + e.toString());
            result.reject();
        }
    }
	
	function createFileIfNotExists(healthDataFilePath) {
		var result = new $.Deferred();
		
		var file = FileSystem.getFileForPath(healthDataFilePath);
		
		file.exists(function (err, doesExist) {
            if (doesExist) {
                result.resolve();
            } else {
                FileUtils.writeText(file, "", true)
                    .done(function () {
                        result.resolve();
                    })
					.fail(function () {
						result.reject();
					});
            }
        });
		return result.promise();
	}
    
    exports.readHealthDataFile    = readHealthDataFile;
    exports.writeHealthDataFile   = writeHealthDataFile;
	exports.createFileIfNotExists = createFileIfNotExists;
});