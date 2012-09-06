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


/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50, regexp: true */
/*global define, $, brackets, describe, it, expect, beforeEach, afterEach, waitsFor, waits, waitsForDone, runs */
define(function (require, exports, module) {
    'use strict';
    
    var NativeFileSystem    = require("file/NativeFileSystem").NativeFileSystem,
        Commands            = require("command/Commands"),
        FileUtils           = require("file/FileUtils"),
        Async               = require("utils/Async"),
        DocumentManager     = require("document/DocumentManager"),
        UrlParams           = require("utils/UrlParams").UrlParams;
    
    var TEST_PREFERENCES_KEY    = "com.adobe.brackets.test.preferences",
        OPEN_TAG                = "{{",
        CLOSE_TAG               = "}}",
        RE_MARKER               = /[^\\]?\{\{(\d+)[^\\]?\}\}/g,
        _testWindow,
        _doLoadExtensions;
    
    function getTestRoot() {
        // /path/to/brackets/test/SpecRunner.html
        var path = window.location.pathname;
        path = path.substr(0, path.lastIndexOf("/"));
        path = FileUtils.convertToNativePath(path);
        return path;
    }
    
    function getTestPath(path) {
        return getTestRoot() + path;
    }
    
    function getBracketsSourceRoot() {
        var path = window.location.pathname;
        path = path.split("/");
        path = path.slice(0, path.length - 2);
        path.push("src");
        return path.join("/");
    }
    
    /**
     * Utility for tests that wait on a Promise to complete. Placed in the global namespace so it can be used
     * similarly to the standards Jasmine waitsFor(). Unlike waitsFor(), must be called from INSIDE
     * the runs() that generates the promise.
     * @param {$.Promise} promise
     * @param {string} operationName  Name used for timeout error message
     */
    window.waitsForDone = function (promise, operationName, timeout) {
        timeout = timeout || 1000;
        expect(promise).toBeTruthy();
        waitsFor(function () {
            return promise.state() === "resolved";
        }, "success " + operationName, timeout);
    };
    
    /**
     * Utility for tests that waits on a Promise to fail. Placed in the global namespace so it can be used
     * similarly to the standards Jasmine waitsFor(). Unlike waitsFor(), must be called from INSIDE
     * the runs() that generates the promise.
     * @param {$.Promise} promise
     * @param {string} operationName  Name used for timeout error message
     */
    window.waitsForFail = function (promise, operationName) {
        expect(promise).toBeTruthy();
        waitsFor(function () {
            return promise.state() === "rejected";
        }, "failure " + operationName, 1000);
    };
    
    
    /**
     * Returns a Document suitable for use with an Editor in isolation: i.e., a Document that will
     * never be set as the currentDocument or added to the working set.
     */
    function createMockDocument(initialContent) {
        // Use unique filename to avoid collissions in open documents list
        var dummyFile = new NativeFileSystem.FileEntry("_unitTestDummyFile_.js");
        
        var docToShim = new DocumentManager.Document(dummyFile, new Date(), initialContent);
        
        // Prevent adding doc to global 'open docs' list; prevents leaks or collisions if a test
        // fails to clean up properly (if test fails, or due to an apparent bug with afterEach())
        docToShim.addRef = function () {};
        docToShim.releaseRef = function () {};
        
        // Prevent adding doc to working set
        docToShim._handleEditorChange = function (event, editor, changeList) {
            this.isDirty = true;
                    
            // TODO: This needs to be kept in sync with Document._handleEditorChange(). In the
            // future, we should fix things so that we either don't need mock documents or that this
            // is factored so it will just run in both.
            $(this).triggerHandler("change", [this, changeList]);
        };
        docToShim.notifySaved = function () {
            throw new Error("Cannot notifySaved() a unit-test dummy Document");
        };
        return docToShim;
    }

    function createTestWindowAndRun(spec, callback) {
        runs(function () {
            // Position popup windows in the lower right so they're out of the way
            var testWindowWid = 1000,
                testWindowHt  =  700,
                testWindowX   = window.screen.availWidth - testWindowWid,
                testWindowY   = window.screen.availHeight - testWindowHt,
                optionsStr    = "left=" + testWindowX + ",top=" + testWindowY +
                                ",width=" + testWindowWid + ",height=" + testWindowHt;
            
            var params = new UrlParams();
            
            // setup extension loading in the test window
            params.put("extensions", _doLoadExtensions ? "default,user" : "default");
            
            // disable update check in test windows
            params.put("skipUpdateCheck", true);
            
            // disable loading of sample project
            params.put("skipSampleProjectLoad", true);
            
            // disable initial dialog for live development
            params.put("skipLiveDevelopmentInfo", true);
            
            _testWindow = window.open(getBracketsSourceRoot() + "/index.html?" + params.toString(), "_blank", optionsStr);
            
            _testWindow.executeCommand = function executeCommand(cmd, args) {
                return _testWindow.brackets.test.CommandManager.execute(cmd, args);
            };
        });

        // FIXME (issue #249): Need an event or something a little more reliable...
        waitsFor(
            function isBracketsDoneLoading() {
                return _testWindow.brackets && _testWindow.brackets.test && _testWindow.brackets.test.doneLoading;
            },
            10000
        );

        runs(function () {
            // callback allows specs to query the testWindow before they run
            callback.call(spec, _testWindow);
        });
    }

    function closeTestWindow() {
        // debug-only to see testWindow state before closing
        // waits(500);

        runs(function () {
            //we need to mark the documents as not dirty before we close
            //or the window will stay open prompting to save
            var openDocs = _testWindow.brackets.test.DocumentManager.getAllOpenDocuments();
            openDocs.forEach(function resetDoc(doc) {
                if (doc.isDirty) {
                    //just refresh it back to it's current text. This will mark it
                    //clean to save
                    doc.refreshText(doc.getText(), doc.diskTimestamp);
                }
            });
            _testWindow.close();
        });
    }
    
    
    /**
     * Dismiss the currently open dialog as if the user had chosen the given button. Dialogs close
     * asynchronously; after calling this, you need to start a new runs() block before testing the
     * outcome. Also, in cases where asynchronous tasks are performed after the dialog closes,
     * clients must also wait for any additional promises.
     * @param {string} buttonId  One of the Dialogs.DIALOG_BTN_* symbolic constants.
     */
    function clickDialogButton(buttonId) {
        // Make sure there's one and only one dialog open
        var $dlg = _testWindow.$(".modal.instance"),
            promise = $dlg.data("promise");
        
        expect($dlg.length).toBe(1);
        
        // Make sure desired button exists
        var dismissButton = $dlg.find(".dialog-button[data-button-id='" + buttonId + "']");
        expect(dismissButton.length).toBe(1);
        
        // Click the button
        dismissButton.click();

        // Dialog should resolve/reject the promise
        waitsForDone(promise);
    }
    
    
    function loadProjectInTestWindow(path) {
        var isReady = false;

        runs(function () {
            // begin loading project path
            var result = _testWindow.brackets.test.ProjectManager.openProject(path);
            result.done(function () {
                isReady = true;
            });
        });

        // wait for file system to finish loading
        waitsFor(function () { return isReady; }, "openProject() timeout", 1000);
    }
    
    /**
     * Parses offsets from text offset markup (e.g. "{{1}}" for offset 1).
     * @param {!string} text Text to parse
     * @return {!{offsets:!Array.<{line:number, ch:number}>, text:!string, original:!string}} 
     */
    function parseOffsetsFromText(text) {
        var offsets = [],
            output  = [],
            i       = 0,
            line    = 0,
            char    = 0,
            ch      = 0,
            length  = text.length,
            exec    = null,
            found   = false;
        
        while (i < length) {
            found = false;
            
            if (text.slice(i, i + OPEN_TAG.length) === OPEN_TAG) {
                // find "{{[0-9]+}}"
                RE_MARKER.lastIndex = i;
                exec = RE_MARKER.exec(text);
                found = (exec !== null);
                
                if (found) {
                    // record offset info
                    offsets[exec[1]] = {line: line, ch: ch};
                    
                    // advance
                    i += exec[0].length;
                }
            }
            
            if (!found) {
                char = text.substr(i, 1);
                output.push(char);
                
                if (char === '\n') {
                    line++;
                    ch = 0;
                } else {
                    ch++;
                }
                
                i++;
            }
        }
        
        return {offsets: offsets, text: output.join(""), original: text};
    }
    
    /**
     * Creates absolute paths based on the test window's current project
     * @param {!Array.<string>|string} paths Project relative file path(s) to convert. May pass a single string path or array.
     * @return {!Array.<string>|string} Absolute file path(s)
     */
    function makeAbsolute(paths) {
        var fullPath = _testWindow.brackets.test.ProjectManager.getProjectRoot().fullPath;
        
        function prefixProjectPath(path) {
            if (path.indexOf(fullPath) === 0) {
                return path;
            }
            
            return fullPath + path;
        }
        
        if (Array.isArray(paths)) {
            return paths.map(prefixProjectPath);
        } else {
            return prefixProjectPath(paths);
        }
    }
    
    /**
     * Creates relative paths based on the test window's current project. Any paths,
     * outside the project are included in the result, but left as absolute paths.
     * @param {!Array.<string>|string} paths Absolute file path(s) to convert. May pass a single string path or array.
     * @return {!Array.<string>|string} Relative file path(s)
     */
    function makeRelative(paths) {
        var fullPath = _testWindow.brackets.test.ProjectManager.getProjectRoot().fullPath,
            fullPathLength = fullPath.length;
        
        function removeProjectPath(path) {
            if (path.indexOf(fullPath) === 0) {
                return path.substring(fullPathLength);
            }
            
            return path;
        }
        
        if (Array.isArray(paths)) {
            return paths.map(removeProjectPath);
        } else {
            return removeProjectPath(paths);
        }
    }
    
    function makeArray(arg) {
        if (!Array.isArray(arg)) {
            return [arg];
        }
        
        return arg;
    }
    
    /**
     * Parses offsets from a file using offset markup (e.g. "{{1}}" for offset 1).
     * @param {!FileEntry} entry File to open
     * @return {$.Promise} A promise resolved with a record that contains parsed offsets, 
     *  the file text without offset markup, the original file content, and the corresponding
     *  file entry.
     */
    function parseOffsetsFromFile(entry) {
        var result = new $.Deferred();
        
        FileUtils.readAsText(entry).done(function (text) {
            var info = parseOffsetsFromText(text);
            info.fileEntry = entry;
            
            result.resolve(info);
        }).fail(function (err) {
            result.reject(err);
        });
        
        return result.promise();
    }
    
    /**
     * Opens project relative file paths in the test window
     * @param {!(Array.<string>|string)} paths Project relative file path(s) to open
     * @return {!$.Promise} A promise resolved with a mapping of project-relative path
     *  keys to a corresponding Document
     */
    function openProjectFiles(paths) {
        var result = new $.Deferred(),
            fullpaths = makeArray(makeAbsolute(paths)),
            keys = makeArray(makeRelative(paths)),
            docs = {},
            FileViewController = _testWindow.brackets.test.FileViewController;
        
        Async.doSequentially(fullpaths, function (path, i) {
            var one = new $.Deferred();
            
            FileViewController.addToWorkingSetAndSelect(path).done(function (doc) {
                docs[keys[i]] = doc;
                one.resolve();
            }).fail(function () {
                one.reject();
            });
            
            return one.promise();
        }, false).done(function () {
            result.resolve(docs);
        }).fail(function () {
            result.reject();
        });
        
        return result.promise();
    }
    
    /**
     * Opens a file path, parses offset markup then saves the results to the original file.
     * @param {!string} path Project relative file path to open
     * @return {$.Promise} A promise resolved with the offset information results of parseOffsetsFromFile.
     */
    function saveFileWithoutOffsets(path) {
        var result = new $.Deferred(),
            fileEntry = new NativeFileSystem.FileEntry(path);
        
        parseOffsetsFromFile(fileEntry).done(function (info) {
            // rewrite file without offset markup
            FileUtils.writeText(fileEntry, info.text).done(function () {
                result.resolve(info);
            }).fail(function () {
                result.reject();
            });
        }).fail(function () {
            result.reject();
        });
        
        return result.promise();
    }
    
    
    /**
     * Opens an array of file paths, parses offset markup then saves the results to each original file.
     * @param {!Array.<string>|string} paths Project relative or absolute file paths to open. May pass a single string path or array.
     * @return {!$.Promise} A promised resolved with a map of offset information indexed by project-relative file path.
     */
    function saveFilesWithoutOffsets(paths) {
        var result = new $.Deferred(),
            infos  = {},
            fullpaths = makeArray(makeAbsolute(paths)),
            keys = makeArray(makeRelative(paths));
        
        var parallel = Async.doSequentially(fullpaths, function (path, i) {
            var one = new $.Deferred();
        
            saveFileWithoutOffsets(path).done(function (info) {
                infos[keys[i]] = info;
                one.resolve();
            }).fail(function () {
                one.reject();
            });
        
            return one.promise();
        }, false);
        
        parallel.done(function () {
            result.resolve(infos);
        }).fail(function () {
            result.reject();
        });
        
        return result.promise();
    }
    
    /**
     * Restore file content with offset markup. When using saveFileWithoutOffsets(), 
     * remember to call this function during spec teardown (after()).
     * @param {$.Promise} A promise resolved when all files are re-written to their original content.
     */
    function saveFilesWithOffsets(infos) {
        var arr = [];
        $.each(infos, function (index, value) {
            arr.push(value);
        });
        
        return Async.doInParallel(arr, function (info) {
            return FileUtils.writeText(info.fileEntry, info.original);
        }, false);
    }
    
    /**
     * Set editor cursor position to the given offset then activate an inline editor.
     * @param {!Editor} editor
     * @param {!{line:number, ch:number}} offset
     * @return {$.Promise} a promise that will be resolved when an inline 
     *  editor is created or rejected when no inline editors are available.
     */
    function toggleQuickEditAtOffset(editor, offset) {
        editor.setCursorPos(offset.line, offset.ch);
        
        return _testWindow.executeCommand(Commands.TOGGLE_QUICK_EDIT);
    }
    
    /**
     * @param {string} fullPath
     * @return {$.Promise} Resolved when deletion complete, or rejected if an error occurs
     */
    function deleteFile(fullPath) {
        var result = new $.Deferred();
        brackets.fs.unlink(fullPath, function (err) {
            if (err) {
                result.reject(err);
            } else {
                result.resolve();
            }
        });
        return result.promise();
    }

    /**
     * Simulate key event. Found this code here:
     * http://stackoverflow.com/questions/10455626/keydown-simulation-in-chrome-fires-normally-but-not-the-correct-key
     *
     * TODO: need parameter(s) for modifier keys
     *
     * @param {Number} key Key code
     * @param (String) event Key event to simulate
     * @param {HTMLElement} element Element to receive event
     */
    function simulateKeyEvent(key, event, element) {
        var doc = element.ownerDocument,
            oEvent = doc.createEvent('KeyboardEvent');

        if (event !== "keydown" && event !== "keyup" && event !== "keypress") {
            console.log("SpecRunnerUtils.simulateKeyEvent() - unsupported keyevent: " + event);
            return;
        }

        // Chromium Hack: need to override the 'which' property.
        // Note: this code is not designed to work in IE, Safari,
        // or other browsers. Well, maybe with Firefox. YMMV.
        Object.defineProperty(oEvent, 'keyCode', {
            get: function () {
                return this.keyCodeVal;
            }
        });
        Object.defineProperty(oEvent, 'which', {
            get: function () {
                return this.keyCodeVal;
            }
        });

        if (oEvent.initKeyboardEvent) {
            oEvent.initKeyboardEvent(event, true, true, doc.defaultView, false, false, false, false, key, key);
        } else {
            oEvent.initKeyEvent(event, true, true, doc.defaultView, false, false, false, false, key, 0);
        }

        oEvent.keyCodeVal = key;
        if (oEvent.keyCode !== key) {
            console.log("keyCode mismatch " + oEvent.keyCode + "(" + oEvent.which + ")");
        }

        element.dispatchEvent(oEvent);
    }

    function getTestWindow() {
        return _testWindow;
    }
    
    function setLoadExtensionsInTestWindow(doLoadExtensions) {
        _doLoadExtensions = doLoadExtensions;
    }

    exports.TEST_PREFERENCES_KEY    = TEST_PREFERENCES_KEY;
    
    exports.getTestRoot                     = getTestRoot;
    exports.getTestPath                     = getTestPath;
    exports.getBracketsSourceRoot           = getBracketsSourceRoot;
    exports.makeAbsolute                    = makeAbsolute;
    exports.createMockDocument              = createMockDocument;
    exports.createTestWindowAndRun          = createTestWindowAndRun;
    exports.closeTestWindow                 = closeTestWindow;
    exports.clickDialogButton               = clickDialogButton;
    exports.loadProjectInTestWindow         = loadProjectInTestWindow;
    exports.openProjectFiles                = openProjectFiles;
    exports.toggleQuickEditAtOffset         = toggleQuickEditAtOffset;
    exports.saveFilesWithOffsets            = saveFilesWithOffsets;
    exports.saveFilesWithoutOffsets         = saveFilesWithoutOffsets;
    exports.saveFileWithoutOffsets          = saveFileWithoutOffsets;
    exports.deleteFile                      = deleteFile;
    exports.getTestWindow                   = getTestWindow;
    exports.simulateKeyEvent                = simulateKeyEvent;
    exports.setLoadExtensionsInTestWindow   = setLoadExtensionsInTestWindow;
});
