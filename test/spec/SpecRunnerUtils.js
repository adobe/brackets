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
/*global define, $, brackets, jasmine, expect, beforeEach, waitsFor, waitsForDone, runs, spyOn */
define(function (require, exports, module) {
    'use strict';
    
    var Commands            = require("command/Commands"),
        FileUtils           = require("file/FileUtils"),
        Async               = require("utils/Async"),
        DocumentManager     = require("document/DocumentManager"),
        Editor              = require("editor/Editor").Editor,
        EditorManager       = require("editor/EditorManager"),
        MainViewManager     = require("view/MainViewManager"),
        FileSystemError     = require("filesystem/FileSystemError"),
        FileSystem          = require("filesystem/FileSystem"),
        WorkspaceManager    = require("view/WorkspaceManager"),
        ExtensionLoader     = require("utils/ExtensionLoader"),
        UrlParams           = require("utils/UrlParams").UrlParams,
        LanguageManager     = require("language/LanguageManager");
    
    var TEST_PREFERENCES_KEY    = "com.adobe.brackets.test.preferences",
        EDITOR_USE_TABS         = false,
        EDITOR_SPACE_UNITS      = 4,
        OPEN_TAG                = "{{",
        RE_MARKER               = /\{\{(\d+)\}\}/g,
        absPathPrefix           = (brackets.platform === "win" ? "c:/" : "/"),
        _testSuites             = {},
        _testWindow,
        _doLoadExtensions,
        _rootSuite              = { id: "__brackets__" },
        _unitTestReporter;
    
    MainViewManager._initialize($("#mock-main-view"));
    
    function _getFileSystem() {
        return _testWindow ? _testWindow.brackets.test.FileSystem : FileSystem;
    }
    
    /**
     * Delete a path
     * @param {string} fullPath
     * @param {boolean=} silent Defaults to false. When true, ignores ERR_NOT_FOUND when deleting path.
     * @return {$.Promise} Resolved when deletion complete, or rejected if an error occurs
     */
    function deletePath(fullPath, silent) {
        var result = new $.Deferred();
        _getFileSystem().resolve(fullPath, function (err, item) {
            if (!err) {
                item.unlink(function (err) {
                    if (!err) {
                        result.resolve();
                    } else {
                        if (err === FileSystemError.NOT_FOUND && silent) {
                            result.resolve();
                        } else {
                            console.error("Unable to remove " + fullPath, err);
                            result.reject(err);
                        }
                    }
                });
            } else {
                if (err === FileSystemError.NOT_FOUND && silent) {
                    result.resolve();
                } else {
                    console.error("Unable to remove " + fullPath, err);
                    result.reject(err);
                }
            }
        });
        return result.promise();
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
    
    function testDomain() {
        return brackets.testing.nodeConnection.domains.testing;
    }
    
    /**
     * Remove a directory (recursively) or file
     *
     * @param {!string} path Path to remove
     * @return {$.Promise} Resolved when the path is removed, rejected if there was a problem
     */
    function remove(path) {
        return testDomain().remove(path);
    }
    
    /**
     * Copy a directory (recursively) or file
     *
     * @param {!string}     src     Path to copy
     * @param {!string}     dest    Destination directory
     * @return {$.Promise} Resolved when the path is copied, rejected if there was a problem
     */
    function copy(src, dest) {
        return testDomain().copy(src, dest);
    }
    
    /**
     * Resolves a path string to a File or Directory
     * @param {!string} path Path to a file or directory
     * @return {$.Promise} A promise resolved when the file/directory is found or
     *     rejected when any error occurs.
     */
    function resolveNativeFileSystemPath(path) {
        var result = new $.Deferred();
        
        _getFileSystem().resolve(path, function (err, item) {
            if (!err) {
                result.resolve(item);
            } else {
                result.reject(err);
            }
        });
        
        return result.promise();
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
        promise.fail(function (err) {
            expect("[" + operationName + "] promise rejected with: " + err).toBe("(expected resolved instead)");
        });
        waitsFor(function () {
            return promise.state() === "resolved";
        }, "success [" + operationName + "]", timeout);
    };

    /**
     * Utility for tests that waits on a Promise to fail. Placed in the global namespace so it can be used
     * similarly to the standards Jasmine waitsFor(). Unlike waitsFor(), must be called from INSIDE
     * the runs() that generates the promise.
     * @param {$.Promise} promise
     * @param {string} operationName  Name used for timeout error message
     */
    window.waitsForFail = function (promise, operationName, timeout) {
        timeout = timeout || 1000;
        expect(promise).toBeTruthy();
        promise.done(function (result) {
            expect("[" + operationName + "] promise resolved with: " + result).toBe("(expected rejected instead)");
        });
        waitsFor(function () {
            return promise.state() === "rejected";
        }, "failure " + operationName, timeout);
    };
    
    /**
     * Get or create a NativeFileSystem rooted at the system root.
     * @return {$.Promise} A promise resolved when the native file system is found or rejected when an error occurs.
     */
    function getRoot() {
        var deferred = new $.Deferred();
        
        resolveNativeFileSystemPath("/").then(deferred.resolve, deferred.reject);
        
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

    /**
     * Create the temporary unit test project directory.
     */
    function createTempDirectory() {
        var deferred = new $.Deferred();

        runs(function () {
            _getFileSystem().getDirectoryForPath(getTempDirectory()).create(function (err) {
                if (err && err !== FileSystemError.ALREADY_EXISTS) {
                    deferred.reject(err);
                } else {
                    deferred.resolve();
                }
            });
        });

        waitsForDone(deferred, "Create temp directory", 500);
    }
    
    function _resetPermissionsOnSpecialTempFolders() {
        var folders = [],
            baseDir = getTempDirectory(),
            promise;
        
        folders.push(baseDir + "/cant_read_here");
        folders.push(baseDir + "/cant_write_here");
        
        promise = Async.doSequentially(folders, function (folder) {
            var deferred = new $.Deferred();
            
            _getFileSystem().resolve(folder, function (err, entry) {
                if (!err) {
                    // Change permissions if the directory exists
                    chmod(folder, "777").then(deferred.resolve, deferred.reject);
                } else {
                    if (err === FileSystemError.NOT_FOUND) {
                        // Resolve the promise since the folder to reset doesn't exist
                        deferred.resolve();
                    } else {
                        deferred.reject();
                    }
                }
            });
            
            return deferred.promise();
        }, true);
        
        return promise;
    }
    
    /**
     * Remove temp folder used for temporary unit tests files
     */
    function removeTempDirectory() {
        var deferred    = new $.Deferred(),
            baseDir     = getTempDirectory();
        
        runs(function () {
            _resetPermissionsOnSpecialTempFolders().done(function () {
                deletePath(baseDir, true).then(deferred.resolve, deferred.reject);
            }).fail(function () {
                deferred.reject();
            });

            deferred.fail(function (err) {
                console.log("boo");
            });
        
            waitsForDone(deferred.promise(), "removeTempDirectory", 2000);
        });
    }
    
    function getBracketsSourceRoot() {
        var path = window.location.pathname;
        path = path.split("/");
        path = path.slice(0, path.length - 2);
        path.push("src");
        return path.join("/");
    }

    /**
     * Returns a Document suitable for use with an Editor in isolation, but that can be registered with
     * DocumentManager via addRef() so it is maintained for global updates like name and language changes.
     * 
     * Like a normal Document, if you cause an addRef() on this you MUST call releaseRef() later.
     * 
     * @param {!{language:?string, filename:?string, content:?string }} options
     * Language defaults to JavaScript, filename defaults to a placeholder name, and
     * content defaults to "".
     */
    function createMockActiveDocument(options) {
        var language    = options.language || LanguageManager.getLanguage("javascript"),
            filename    = options.filename || (absPathPrefix + "_unitTestDummyPath_/_dummyFile_" + Date.now() + "." + language._fileExtensions[0]),
            content     = options.content || "";
        
        // Use unique filename to avoid collissions in open documents list
        var dummyFile = _getFileSystem().getFileForPath(filename);
        var docToShim = new DocumentManager.Document(dummyFile, new Date(), content);
        
        // Prevent adding doc to working set by not dispatching "dirtyFlagChange".
        // TODO: Other functionality here needs to be kept in sync with Document._handleEditorChange(). In the
        // future, we should fix things so that we either don't need mock documents or that this
        // is factored so it will just run in both.
        docToShim._handleEditorChange = function (event, editor, changeList) {
            this.isDirty = !editor._codeMirror.isClean();
            this._notifyDocumentChange(changeList);
        };
        docToShim.notifySaved = function () {
            throw new Error("Cannot notifySaved() a unit-test dummy Document");
        };
        
        return docToShim;
    }
    
    /**
     * Returns a Document suitable for use with an Editor in isolation: i.e., a Document that will
     * never be set as the currentDocument or added to the working set.
     * 
     * Unlike a real Document, does NOT need to be explicitly cleaned up.
     * 
     * @param {?string} initialContent  Defaults to ""
     * @param {?string} languageId      Defaults to JavaScript
     * @param {?string} filename        Defaults to an auto-generated filename with the language's extension
     */
    function createMockDocument(initialContent, languageId, filename) {
        var language    = LanguageManager.getLanguage(languageId) || LanguageManager.getLanguage("javascript"),
            options     = { language: language, content: initialContent, filename: filename },
            docToShim   = createMockActiveDocument(options);
        
        // Prevent adding doc to global 'open docs' list; prevents leaks or collisions if a test
        // fails to clean up properly (if test fails, or due to an apparent bug with afterEach())
        docToShim.addRef = function () {};
        docToShim.releaseRef = function () {};
        docToShim._ensureMasterEditor = function () {
            if (!this._masterEditor) {
                // Don't let Document create an Editor itself via EditorManager; the unit test can't clean that up
                throw new Error("Use create/destroyMockEditor() to test edit operations");
            }
        };
        
        return docToShim;
    }
    
    /**
     * Returns a mock element (in the test runner window) that's offscreen, for
     * parenting UI you want to unit-test. When done, make sure to delete it with
     * remove().
     * @return {jQueryObject} a jQuery object for an offscreen div
     */
    function createMockElement() {
        return $("<div/>")
            .css({
                position: "absolute",
                left: "-10000px",
                top: "-10000px"
            })
            .appendTo($("body"));
    }

    function createEditorInstance(doc, $editorHolder, visibleRange) {
        var editor = new Editor(doc, true, $editorHolder.get(0), visibleRange);
        
        Editor.setUseTabChar(EDITOR_USE_TABS);
        Editor.setSpaceUnits(EDITOR_SPACE_UNITS);
        EditorManager._notifyActiveEditorChanged(editor);
        
        return editor;
    }
    
    /**
     * Returns an Editor tied to the given Document, but suitable for use in isolation
     * (without being placed inside the surrounding Brackets UI). The Editor *will* be
     * reported as the "active editor" by EditorManager.
     * 
     * Must be cleaned up by calling destroyMockEditor(document) later.
     * 
     * @param {!Document} doc
     * @param {{startLine: number, endLine: number}=} visibleRange
     * @return {!Editor}
     */
    function createMockEditorForDocument(doc, visibleRange) {
        // Initialize EditorManager/WorkspaceManager and position the editor-holder offscreen
        // (".content" may not exist, but that's ok for headless tests where editor height doesn't matter)
        var $editorHolder = createMockElement().css("width", "1000px").attr("id", "hidden-editors");
        WorkspaceManager._setMockDOM($(".content"), $editorHolder);
        
        // create Editor instance
        return createEditorInstance(doc, $editorHolder, visibleRange);
    }
    
    /**
     * Returns a Document and Editor suitable for use in isolation: the Document
     * will never be set as the currentDocument or added to the working set and the
     * Editor does not live inside a full-blown Brackets UI layout. The Editor *will* be
     * reported as the "active editor" by EditorManager, however.
     * 
     * Must be cleaned up by calling destroyMockEditor(document) later.
     * 
     * @param {string=} initialContent
     * @param {string=} languageId
     * @param {{startLine: number, endLine: number}=} visibleRange
     * @return {!{doc:!Document, editor:!Editor}}
     */
    function createMockEditor(initialContent, languageId, visibleRange) {
        // create dummy Document, then Editor tied to it
        var doc = createMockDocument(initialContent, languageId);
        return { doc: doc, editor: createMockEditorForDocument(doc, visibleRange) };
    }
    
    function createMockPane($el) {
        createMockElement()
            .attr("class", "pane-header")
            .appendTo($el);
        var $fakeContent = createMockElement()
            .attr("class", "pane-content")
            .appendTo($el);
        
        return {
            $el: $el,
            $content: $fakeContent,
            addView: function (path, editor) {
            },
            showView: function (editor) {
            }
        };
    }
    
    /**
     * Destroy the Editor instance for a given mock Document.
     * @param {!Document} doc  Document whose master editor to destroy
     */
    function destroyMockEditor(doc) {
        EditorManager._notifyActiveEditorChanged(null);
        MainViewManager._destroyEditorIfNotNeeded(doc);

        // Clear editor holder so EditorManager doesn't try to resize destroyed object
        $("#hidden-editors").remove();
    }
    
    /**
     * Dismiss the currently open dialog as if the user had chosen the given button. Dialogs close
     * asynchronously; after calling this, you need to start a new runs() block before testing the
     * outcome. Also, in cases where asynchronous tasks are performed after the dialog closes,
     * clients must also wait for any additional promises.
     * @param {string} buttonId  One of the Dialogs.DIALOG_BTN_* symbolic constants.
     * @param {boolean=} enableFirst  If true, then enable the button before clicking.
     */
    function clickDialogButton(buttonId, enableFirst) {
        // Make sure there's one and only one dialog open
        var $dlg = _testWindow.$(".modal.instance"),
            promise = $dlg.data("promise");
        
        expect($dlg.length).toBe(1);
        
        // Make sure desired button exists
        var $dismissButton = $dlg.find(".dialog-button[data-button-id='" + buttonId + "']");
        expect($dismissButton.length).toBe(1);
        
        if (enableFirst) {
            // Remove the disabled prop.
            $dismissButton.prop("disabled", false);
        }
        
        // Click the button
        $dismissButton.click();

        // Dialog should resolve/reject the promise
        waitsForDone(promise, "dismiss dialog");
    }
    
    function createTestWindowAndRun(spec, callback, options) {
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
            
            // signals that main.js should configure RequireJS for tests
            params.put("testEnvironment", true);

            if (options) {
                // option to set the params
                if (options.hasOwnProperty("params")) {
                    var paramObject = options.params || {};
                    var obj;
                    for (obj in paramObject) {
                        if (paramObject.hasOwnProperty(obj)) {
                            params.put(obj, paramObject[obj]);
                        }
                    }
                }
            
                // option to launch test window with either native or HTML menus
                if (options.hasOwnProperty("hasNativeMenus")) {
                    params.put("hasNativeMenus", (options.hasNativeMenus ? "true" : "false"));
                }
            }
            
            _testWindow = window.open(getBracketsSourceRoot() + "/index.html?" + params.toString(), "_blank", optionsStr);
            
            // Displays the primary console messages from the test window in the the
            // test runner's console as well.
            ["debug", "log", "info", "warn", "error"].forEach(function (method) {
                var originalMethod = _testWindow.console[method];
                _testWindow.console[method] = function () {
                    var log = ["[testWindow] "].concat(Array.prototype.slice.call(arguments, 0));
                    console[method].apply(console, log);
                    originalMethod.apply(_testWindow.console, arguments);
                };
            });
            
            _testWindow.isBracketsTestWindow = true;
            
            _testWindow.executeCommand = function executeCommand(cmd, args) {
                return _testWindow.brackets.test.CommandManager.execute(cmd, args);
            };
            
            _testWindow.closeAllFiles = function closeAllFiles() {
                runs(function () {
                    var promise = _testWindow.executeCommand(_testWindow.brackets.test.Commands.FILE_CLOSE_ALL);
                    
                    _testWindow.brackets.test.Dialogs.cancelModalDialogIfOpen(
                        _testWindow.brackets.test.DefaultDialogs.DIALOG_ID_SAVE_CLOSE,
                        _testWindow.brackets.test.DefaultDialogs.DIALOG_BTN_DONTSAVE
                    );

                    waitsForDone(promise, "Close all open files in working set");
                });
            };
        });
        
        // FIXME (issue #249): Need an event or something a little more reliable...
        waitsFor(
            function isBracketsDoneLoading() {
                return _testWindow.brackets && _testWindow.brackets.test && _testWindow.brackets.test.doneLoading;
            },
            "brackets.test.doneLoading",
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
            _testWindow.executeCommand = null;
            _testWindow = null;
        });
    }
    
    
    function loadProjectInTestWindow(path) {
        runs(function () {
            // begin loading project path
            var result = _testWindow.brackets.test.ProjectManager.openProject(path);
            
            // wait for file system to finish loading
            waitsForDone(result, "ProjectManager.openProject()", 10000);
        });
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
            FileViewController = _testWindow.brackets.test.FileViewController,
            DocumentManager = _testWindow.brackets.test.DocumentManager;
        
        Async.doSequentially(fullpaths, function (path, i) {
            var one = new $.Deferred();
            
            FileViewController.openFileAndAddToWorkingSet(path).done(function (file) {
                docs[keys[i]] = DocumentManager.getOpenDocumentForPath(file.fullPath);
                one.resolve();
            }).fail(function (err) {
                one.reject(err);
            });
            
            return one.promise();
        }, false).done(function () {
            result.resolve(docs);
        }).fail(function (err) {
            result.reject(err);
        }).always(function () {
            docs = null;
            FileViewController = null;
        });
        
        return result.promise();
    }

    /**
     * Create or overwrite a text file
     * @param {!string} path Path for a file to be created/overwritten
     * @param {!string} text Text content for the new file
     * @param {!FileSystem} fileSystem FileSystem instance to use. Normally, use the instance from
     *      testWindow so the test copy of Brackets is aware of the newly-created file.
     * @return {$.Promise} A promise resolved when the file is written or rejected when an error occurs.
     */
    function createTextFile(path, text, fileSystem) {
        var deferred = new $.Deferred(),
            file = fileSystem.getFileForPath(path),
            options = {
                blind: true // overwriting previous files is OK
            };
        
        file.write(text, options, function (err) {
            if (!err) {
                deferred.resolve(file);
            } else {
                deferred.reject(err);
            }
        });

        return deferred.promise();
    }
    
    /**
     * Copy a file source path to a destination
     * @param {!File} source Entry for the source file to copy
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
                
                // create the new File
                createTextFile(destination, text, _getFileSystem()).done(function (entry) {
                    deferred.resolve(entry, offsets, text);
                }).fail(function (err) {
                    deferred.reject(err);
                });
            });
        }).fail(function (err) {
            deferred.reject(err);
        });
        
        return deferred.promise();
    }
    
    /**
     * Copy a directory source to a destination
     * @param {!Directory} source Directory to copy
     * @param {!string} destination Destination path to copy the source directory to
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
            deferred        = new $.Deferred(),
            destDir         = _getFileSystem().getDirectoryForPath(destination);
        
        // create the destination folder
        destDir.create(function (err) {
            if (err && err !== FileSystemError.ALREADY_EXISTS) {
                deferred.reject();
                return;
            }
            
            source.getContents(function (err, contents) {
                if (!err) {
                    // copy all children of this directory
                    var copyChildrenPromise = Async.doInParallel(
                        contents,
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
                        }
                    );
                    
                    copyChildrenPromise.then(deferred.resolve, deferred.reject);
                } else {
                    deferred.reject(err);
                }
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
            
            promise.then(deferred.resolve, function (err) {
                console.error(destination);
                deferred.reject();
            });
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
        Object.defineProperty(oEvent, 'charCode', {
            get: function () {
                return this.keyCodeVal;
            }
        });

        if (oEvent.initKeyboardEvent) {
            oEvent.initKeyboardEvent(event, true, true, doc.defaultView, key, 0, false, false, false, false);
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
     * Change the size of an editor. The window size is not affected by this function.
     * CodeMirror will change it's size withing Brackets.
     *
     * @param {!Editor} editor - instance of Editor
     * @param {?number} width - the new width of the editor in pixel
     * @param {?number} height - the new height of the editor in pixel
     */
    function resizeEditor(editor, width, height) {
        var oldSize = {};

        if (editor) {
            var jquery = editor.getRootElement().ownerDocument.defaultView.$,
                $editorHolder = jquery('#editor-holder'),
                $content = jquery('.content');

            // preserve old size
            oldSize.width = $editorHolder.width();
            oldSize.height = $editorHolder.height();

            if (width) {
                $content.width(width);
                $editorHolder.width(width);
                editor.setSize(width, null); // Update CM size
            }

            if (height) {
                $content.height(height);
                $editorHolder.height(height);
                editor.setSize(null, height); // Update CM size
            }

            editor.refreshAll(true); // update CM
        }

        return oldSize;
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
     * Searches the DOM tree for text containing the given content. Useful for verifying
     * that data you expect to show up in the UI somewhere is actually there.
     *
     * @param {jQueryObject|Node} root The root element to search from. Can be either a jQuery object
     *     or a raw DOM node.
     * @param {string} content The content to find.
     * @param {boolean} asLink If true, find the content in the href of an <a> tag, otherwise find it in text nodes.
     * @return true if content was found
     */
    function findDOMText(root, content, asLink) {
        // Unfortunately, we can't just use jQuery's :contains() selector, because it appears that
        // you can't escape quotes in it.
        var i;
        if (root.jquery) {
            root = root.get(0);
        }
        if (!root) {
            return false;
        } else if (!asLink && root.nodeType === 3) { // text node
            return root.textContent.indexOf(content) !== -1;
        } else {
            if (asLink && root.nodeType === 1 && root.tagName.toLowerCase() === "a" && root.getAttribute("href") === content) {
                return true;
            }
            var children = root.childNodes;
            for (i = 0; i < children.length; i++) {
                if (findDOMText(children[i], content, asLink)) {
                    return true;
                }
            }
            return false;
        }
    }

    
    /**
     * Patches ProjectManager.getAllFiles() in the given test window (for just the current it() block) so that it
     * includes one extra file in its results. The file need not actually exist on disk.
     * @param {!Window} testWindow  Brackets popup window
     * @param {string} extraFilePath  Absolute path for the extra result file
     */
    function injectIntoGetAllFiles(testWindow, extraFilePath) {
        var ProjectManager  = testWindow.brackets.test.ProjectManager,
            FileSystem      = testWindow.brackets.test.FileSystem,
            origGetAllFiles = ProjectManager.getAllFiles;
        
        spyOn(ProjectManager, "getAllFiles").andCallFake(function () {
            var testResult = new testWindow.$.Deferred();
            origGetAllFiles.apply(ProjectManager, arguments).done(function (result) {
                var dummyFile = FileSystem.getFileForPath(extraFilePath);
                var newResult = result.concat([dummyFile]);
                testResult.resolve(newResult);
            }).fail(function (error) {
                testResult.reject(error);
            });
            return testResult;
        });
    }
    
    
    /**
     * Counts the number of active specs in the current suite. Includes all
     * descendants.
     * @param {(jasmine.Suite|jasmine.Spec)} suiteOrSpec
     * @return {number}
     */
    function countSpecs(suiteOrSpec) {
        var children = suiteOrSpec.children && typeof suiteOrSpec.children === "function" && suiteOrSpec.children();

        if (Array.isArray(children)) {
            var childCount = 0;

            children.forEach(function (child) {
                childCount += countSpecs(child);
            });

            return childCount;
        }

        if (jasmine.getEnv().specFilter(suiteOrSpec)) {
            return 1;
        }

        return 0;
    }
    
    
    /**
     * @private
     * Adds a new before all or after all function to the current suite. If requires it creates a new
     * object to store the before all and after all functions and a spec counter for the current suite.
     * @param {string} type  "beforeFirst" or "afterLast"
     * @param {function} func  The function to store
     */
    function _addSuiteFunction(type, func) {
        var suiteId = (jasmine.getEnv().currentSuite || _rootSuite).id;
        if (!_testSuites[suiteId]) {
            _testSuites[suiteId] = {
                beforeFirst : [],
                afterLast   : [],
                specCounter : null
            };
        }
        _testSuites[suiteId][type].push(func);
    }
    
    /**
     * Utility for tests that need to open a window or do something before every test in a suite
     * @param {function} func
     */
    window.beforeFirst = function (func) {
        _addSuiteFunction("beforeFirst", func);
    };
    
    /**
     * Utility for tests that need to close a window or do something after every test in a suite
     * @param {function} func
     */
    window.afterLast = function (func) {
        _addSuiteFunction("afterLast", func);
    };
    
    /**
     * @private
     * Returns an array with the parent suites of the current spec with the top most suite last
     * @return {Array.<jasmine.Suite>}
     */
    function _getParentSuites() {
        var suite  = jasmine.getEnv().currentSpec.suite,
            suites = [];
        
        while (suite) {
            suites.push(suite);
            suite = suite.parentSuite;
        }
        
        return suites;
    }

    /**
     * @private
     * Calls each function in the given array of functions
     * @param {Array.<function>} functions
     */
    function _callFunctions(functions) {
        var spec = jasmine.getEnv().currentSpec;
        functions.forEach(function (func) {
            func.apply(spec);
        });
    }
    
    /**
     * Calls the before first functions for the parent suites of the current spec when is the first spec of the suite.
     */
    function runBeforeFirst() {
        var suites = _getParentSuites().reverse();
        
        // SpecRunner-scoped beforeFirst
        if (_testSuites[_rootSuite.id].beforeFirst) {
            _callFunctions(_testSuites[_rootSuite.id].beforeFirst);
            _testSuites[_rootSuite.id].beforeFirst = null;
        }
        
        // Iterate through all the parent suites of the current spec
        suites.forEach(function (suite) {
            // If we have functions for this suite and it was never called, initialize the spec counter
            if (_testSuites[suite.id] && _testSuites[suite.id].specCounter === null) {
                _callFunctions(_testSuites[suite.id].beforeFirst);
                _testSuites[suite.id].specCounter = countSpecs(suite);
            }
        });
    }
    
    /**
     * @private
     * @return {boolean} True if the current spect is the last spec to be run
     */
    function _isLastSpec() {
        return _unitTestReporter.activeSpecCompleteCount === _unitTestReporter.activeSpecCount - 1;
    }
    
    /**
     * Calls the after last functions for the parent suites of the current spec when is the last spec of the suite.
     */
    function runAfterLast() {
        var suites = _getParentSuites();
        
        // Iterate throught all the parent suites of the current spec
        suites.forEach(function (suite) {
            // If we have functions for this suite, reduce the spec counter
            if (_testSuites[suite.id] && _testSuites[suite.id].specCounter > 0) {
                _testSuites[suite.id].specCounter--;
                
                // If this was the last spec of the suite run the after last functions and remove it
                if (_testSuites[suite.id].specCounter === 0) {
                    _callFunctions(_testSuites[suite.id].afterLast);
                    delete _testSuites[suite.id];
                }
            }
        });
        
        // SpecRunner-scoped afterLast
        if (_testSuites[_rootSuite.id].afterLast && _isLastSpec()) {
            _callFunctions(_testSuites[_rootSuite.id].afterLast);
            _testSuites[_rootSuite.id].afterLast = null;
        }
    }
    
    // "global" custom matchers
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
    
    function setUnitTestReporter(reporter) {
        _unitTestReporter = reporter;
    }
    
    exports.TEST_PREFERENCES_KEY            = TEST_PREFERENCES_KEY;
    exports.EDITOR_USE_TABS                 = EDITOR_USE_TABS;
    exports.EDITOR_SPACE_UNITS              = EDITOR_SPACE_UNITS;

    exports.chmod                           = chmod;
    exports.remove                          = remove;
    exports.copy                            = copy;
    exports.getTestRoot                     = getTestRoot;
    exports.getTestPath                     = getTestPath;
    exports.getTempDirectory                = getTempDirectory;
    exports.createTempDirectory             = createTempDirectory;
    exports.getBracketsSourceRoot           = getBracketsSourceRoot;
    exports.makeAbsolute                    = makeAbsolute;
    exports.resolveNativeFileSystemPath     = resolveNativeFileSystemPath;
    exports.createEditorInstance            = createEditorInstance;
    exports.createMockDocument              = createMockDocument;
    exports.createMockActiveDocument        = createMockActiveDocument;
    exports.createMockElement               = createMockElement;
    exports.createMockEditorForDocument     = createMockEditorForDocument;
    exports.createMockEditor                = createMockEditor;
    exports.createMockPane                  = createMockPane;
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
    exports.findDOMText                     = findDOMText;
    exports.injectIntoGetAllFiles           = injectIntoGetAllFiles;
    exports.countSpecs                      = countSpecs;
    exports.runBeforeFirst                  = runBeforeFirst;
    exports.runAfterLast                    = runAfterLast;
    exports.removeTempDirectory             = removeTempDirectory;
    exports.setUnitTestReporter             = setUnitTestReporter;
    exports.resizeEditor                    = resizeEditor;
});
