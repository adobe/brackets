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
        Editor              = require("editor/Editor").Editor,
        EditorManager       = require("editor/EditorManager"),
        ExtensionLoader     = require("utils/ExtensionLoader"),
        UrlParams           = require("utils/UrlParams").UrlParams,
        LanguageManager     = require("language/LanguageManager");
    
    var TEST_PREFERENCES_KEY    = "com.adobe.brackets.test.preferences",
        OPEN_TAG                = "{{",
        CLOSE_TAG               = "}}",
        RE_MARKER               = /\{\{(\d+)\}\}/g,
        _testWindow,
        _doLoadExtensions,
        nfs;
    
    /**
     * Resolves a path string to a FileEntry or DirectoryEntry
     * @param {!string} path Path to a file or directory
     * @return {$.Promise} A promise resolved when the file/directory is found or
     *     rejected when any error occurs.
     */
    function resolveNativeFileSystemPath(path) {
        var deferred = new $.Deferred();
        
        NativeFileSystem.resolveNativeFileSystemPath(
            path,
            function success(entry) {
                deferred.resolve(entry);
            },
            function error(domError) {
                deferred.reject();
            }
        );
        
        return deferred.promise();
    }
    
    /**
     * Get or create a NativeFileSystem rooted at the system root.
     * @return {$.Promise} A promise resolved when the native file system is found or rejected when an error occurs.
     */
    function getRoot() {
        var deferred = new $.Deferred();
        
        if (nfs) {
            deferred.resolve(nfs.root);
        }
        
        resolveNativeFileSystemPath("/").pipe(deferred.resolve, deferred.reject);
        
        return deferred.promise();
    }
    
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

    /**
     * Get the temporary unit test project path. Use this path for unit tests that need to modify files on disk.
     * @return {$.string} Path to the temporary unit test project
     */
    function getTempDirectory() {
        return getTestPath("/temp");
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
     * similarly to the standard Jasmine waitsFor(). Unlike waitsFor(), must be called from INSIDE
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
    function createMockDocument(initialContent, languageId) {
        var language = LanguageManager.getLanguage(languageId) || LanguageManager.getLanguage("javascript");
        
        // Use unique filename to avoid collissions in open documents list
        var dummyFile = new NativeFileSystem.FileEntry("_unitTestDummyFile_." + language._fileExtensions[0]);
        
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
    
    /**
     * Returns a Document and Editor suitable for use with an Editor in
     * isolation: i.e., a Document that will never be set as the
     * currentDocument or added to the working set.
     * @return {!{doc:{Document}, editor:{Editor}}}
     */
    function createMockEditor(initialContent, languageId, visibleRange) {
        // Initialize EditorManager
        var $editorHolder = $("<div id='mock-editor-holder'/>");
        EditorManager.setEditorHolder($editorHolder);
        EditorManager._init();
        $("body").append($editorHolder);
        
        // create dummy Document for the Editor
        var doc = createMockDocument(initialContent, languageId);
        
        // create Editor instance
        var editor = new Editor(doc, true, $editorHolder.get(0), visibleRange);
        
        return { doc: doc, editor: editor };
    }
    
    /**
     * Destroy the Editor instance for a given mock Document.
     * @param {!Document} doc
     */
    function destroyMockEditor(doc) {
        EditorManager._destroyEditorIfUnneeded(doc);

        // Clear editor holder so EditorManager doesn't try to resize destroyed object
        EditorManager.setEditorHolder(null);
        $("#mock-editor-holder").remove();
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
            params.put("extensions", _doLoadExtensions ?
                        "default,dev," + ExtensionLoader.getUserExtensionPath() :
                        "default");
            
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
            charAt  = 0,
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
                found = (exec !== null && exec.index === i);
                
                if (found) {
                    // record offset info
                    offsets[exec[1]] = {line: line, ch: ch};
                    
                    // advance
                    i += exec[0].length;
                }
            }
            
            if (!found) {
                charAt = text.substr(i, 1);
                output.push(charAt);
                
                if (charAt === '\n') {
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
     * Create or overwrite a text file
     * @param {!string} path Path for a file to be created/overwritten
     * @param {!string} text Text content for the new file
     * @return {$.Promise} A promise resolved when the file is written or rejected when an error occurs.
     */
    function createTextFile(path, text) {
        var deferred = new $.Deferred();

        getRoot().done(function (nfs) {
            // create the new FileEntry
            nfs.getFile(path, { create: true }, function success(entry) {
                // write text this new FileEntry 
                FileUtils.writeText(entry, text).done(function () {
                    deferred.resolve(entry);
                }).fail(function () {
                    deferred.reject();
                });
            }, function error() {
                deferred.reject();
            });
        });

        return deferred.promise();
    }
    
    /**
     * Copy a file source path to a destination
     * @param {!FileEntry} source Entry for the source file to copy
     * @param {!string} destination Destination path to copy the source file
     * @param {?{parseOffsets:boolean}} options parseOffsets allows optional
     *     offset markup parsing. File is written to the destination path
     *     without offsets. Offset data is passed to the doneCallbacks of the
     *     promise.
     * @return {$.Promise} A promise resolved when the file is copied to the
     *     destination.
     */
    function copyFileEntry(source, destination, options) {
        options = options || {};
        
        var deferred = new $.Deferred();
        
        // read the source file
        FileUtils.readAsText(source).done(function (text, modificationTime) {
            getRoot().done(function (nfs) {
                var offsets;
                
                // optionally parse offsets
                if (options.parseOffsets) {
                    var parseInfo = parseOffsetsFromText(text);
                    text = parseInfo.text;
                    offsets = parseInfo.offsets;
                }
                
                // create the new FileEntry
                createTextFile(destination, text).done(function (entry) {
                    deferred.resolve(entry, offsets, text);
                }).fail(function () {
                    deferred.reject();
                });
            });
        }).fail(function () {
            deferred.reject();
        });
        
        return deferred.promise();
    }
    
    /**
     * Copy a directory source to a destination
     * @param {!DirectoryEntry} source Entry for the source directory to copy
     * @param {!string} destination Destination path to copy the source directory
     * @param {?{parseOffsets:boolean, infos:Object, removePrefix:boolean}}} options
     *     parseOffsets - allows optional offset markup parsing. File is written to the
     *       destination path without offsets. Offset data is passed to the
     *       doneCallbacks of the promise.
     *     infos - an optional Object used when parseOffsets is true. Offset
     *       information is attached here, indexed by the file destination path.
     *     removePrefix - When parseOffsets is true, set removePrefix true
     *       to add a new key to the infos array that drops the destination
     *       path root.
     * @return {$.Promise} A promise resolved when the directory and all it's
     *     contents are copied to the destination or rejected immediately
     *     upon the first error.
     */
    function copyDirectoryEntry(source, destination, options) {
        options = options || {};
        options.infos = options.infos || {};
        
        var parseOffsets    = options.parseOffsets || false,
            removePrefix    = options.removePrefix || true,
            deferred        = new $.Deferred();
        
        // create the destination folder
        brackets.fs.makedir(destination, parseInt("644", 8), function callback(err) {
            if (err && err !== brackets.fs.ERR_FILE_EXISTS) {
                deferred.reject();
                return;
            }
            
            source.createReader().readEntries(function handleEntries(entries) {
                if (entries.length === 0) {
                    deferred.resolve();
                    return;
                }

                // copy all children of this directory
                var copyChildrenPromise = Async.doInParallel(
                    entries,
                    function copyChild(child) {
                        var childDestination = destination + "/" + child.name,
                            promise;
                        
                        if (child.isDirectory) {
                            promise = copyDirectoryEntry(child, childDestination, options);
                        } else {
                            promise = copyFileEntry(child, childDestination, options);
                            
                            if (parseOffsets) {
                                // save offset data for each file path
                                promise.done(function (destinationEntry, offsets, text) {
                                    options.infos[childDestination] = {
                                        offsets     : offsets,
                                        fileEntry   : destinationEntry,
                                        text        : text
                                    };
                                });
                            }
                        }
                        
                        return promise;
                    },
                    true
                );
                
                copyChildrenPromise.pipe(deferred.resolve, deferred.reject);
            });
        });

        deferred.always(function () {
            // remove destination path prefix
            if (removePrefix && options.infos) {
                var shortKey;
                Object.keys(options.infos).forEach(function (key) {
                    shortKey = key.substr(destination.length + 1);
                    options.infos[shortKey] = options.infos[key];
                });
            }
        });
        
        return deferred.promise();
    }
    
    /**
     * Copy a file or directory source path to a destination
     * @param {!string} source Path for the source file or directory to copy
     * @param {!string} destination Destination path to copy the source file or directory
     * @param {?{parseOffsets:boolean, infos:Object, removePrefix:boolean}}} options
     *     parseOffsets - allows optional offset markup parsing. File is written to the
     *       destination path without offsets. Offset data is passed to the
     *       doneCallbacks of the promise.
     *     infos - an optional Object used when parseOffsets is true. Offset
     *       information is attached here, indexed by the file destination path.
     *     removePrefix - When parseOffsets is true, set removePrefix true
     *       to add a new key to the infos array that drops the destination
     *       path root.
     * @return {$.Promise} A promise resolved when the directory and all it's
     *     contents are copied to the destination or rejected immediately
     *     upon the first error.
     */
    function copyPath(source, destination, options) {
        var deferred = new $.Deferred();
        
        resolveNativeFileSystemPath(source).done(function (entry) {
            var promise;
            
            if (entry.isDirectory) {
                promise = copyDirectoryEntry(entry, destination, options);
            } else {
                promise = copyFileEntry(entry, destination, options);
            }
            
            promise.pipe(deferred.resolve, deferred.reject);
        }).fail(function () {
            deferred.reject();
        });
        
        return deferred.promise();
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
    function deletePath(fullPath) {
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
    
    /**
     * Extracts the jasmine.log() and/or jasmine.expect() messages from the given result,
     * including stack traces if available.
     * @param {Object} result A jasmine result item (from results.getItems()).
     * @return {string} the error message from that item.
     */
    function getResultMessage(result) {
        var message;
        if (result.type === 'log') {
            message = result.toString();
        } else if (result.type === 'expect' && result.passed && !result.passed()) {
            message = result.message;
            
            if (result.trace.stack) {
                message = result.trace.stack;
            }
        }
        return message;
    }

    /**
     * Set permissions on a path
     * @param {!string} path Path to change permissions on
     * @param {!string} mode New mode as an octal string
     * @return {$.Promise} Resolved when permissions are set or rejected if an error occurs
     */
    function chmod(path, mode) {
        var deferred = new $.Deferred();

        brackets.fs.chmod(path, parseInt(mode, 8), function (err) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve();
            }
        });

        return deferred.promise();
    }
    
    beforeEach(function () {
        this.addMatchers({
            /**
             * Expects the given editor's selection to be a cursor at the given position (no range selected)
             */
            toHaveCursorPosition: function (line, ch) {
                var editor = this.actual;
                var selection = editor.getSelection();
                var notString = this.isNot ? "not " : "";
                
                var start = selection.start;
                var end = selection.end;
                var selectionMoreThanOneCharacter = start.line !== end.line || start.ch !== end.ch;
                
                this.message = function () {
                    var message = "Expected the cursor to " + notString + "be at (" + line + ", " + ch +
                        ") but it was actually at (" + start.line + ", " + start.ch + ")";
                    if (!this.isNot && selectionMoreThanOneCharacter) {
                        message += " and more than one character was selected.";
                    }
                    return message;
                };
                
                var positionsMatch = start.line === line && start.ch === ch;
                
                // when adding the not operator, it's confusing to check both the size of the
                // selection and the position. We just check the position in that case.
                if (this.isNot) {
                    return positionsMatch;
                } else {
                    return !selectionMoreThanOneCharacter && positionsMatch;
                }
            }
        });
    });
    
    exports.TEST_PREFERENCES_KEY    = TEST_PREFERENCES_KEY;
    
    exports.chmod                           = chmod;
    exports.getTestRoot                     = getTestRoot;
    exports.getTestPath                     = getTestPath;
    exports.getTempDirectory                = getTempDirectory;
    exports.getBracketsSourceRoot           = getBracketsSourceRoot;
    exports.makeAbsolute                    = makeAbsolute;
    exports.createMockDocument              = createMockDocument;
    exports.createMockEditor                = createMockEditor;
    exports.createTestWindowAndRun          = createTestWindowAndRun;
    exports.closeTestWindow                 = closeTestWindow;
    exports.clickDialogButton               = clickDialogButton;
    exports.destroyMockEditor               = destroyMockEditor;
    exports.loadProjectInTestWindow         = loadProjectInTestWindow;
    exports.openProjectFiles                = openProjectFiles;
    exports.toggleQuickEditAtOffset         = toggleQuickEditAtOffset;
    exports.createTextFile                  = createTextFile;
    exports.copyDirectoryEntry              = copyDirectoryEntry;
    exports.copyFileEntry                   = copyFileEntry;
    exports.copyPath                        = copyPath;
    exports.deletePath                      = deletePath;
    exports.getTestWindow                   = getTestWindow;
    exports.simulateKeyEvent                = simulateKeyEvent;
    exports.setLoadExtensionsInTestWindow   = setLoadExtensionsInTestWindow;
    exports.getResultMessage                = getResultMessage;
    exports.parseOffsetsFromText            = parseOffsetsFromText;
});
