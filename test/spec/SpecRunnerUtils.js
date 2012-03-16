/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50, regexp: true */
/*global define: false, $: false,  describe: false, it: false, expect: false, beforeEach: false, afterEach: false, waitsFor: false, runs: false */
define(function (require, exports, module) {
    'use strict';
    
    var NativeFileSystem    = require("NativeFileSystem").NativeFileSystem,
        Commands            = require("Commands"),
        FileUtils           = require("FileUtils"),
        Async               = require("Async"),
        DocumentManager    = require("DocumentManager");
    
    var TEST_PREFERENCES_KEY    = "com.adobe.brackets.test.preferences",
        OPEN_TAG                = "{{",
        CLOSE_TAG               = "}}",
        RE_MARKER               = /[^\\]?\{\{(\d+)[^\\]?\}\}/g,
        testWindow;
    
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
        docToShim._handleEditorChange = function () {
            this.isDirty = true;
            $(this).triggerHandler("change", [this]);
        };
        docToShim.notifySaved = function () {
            throw new Error("Cannot notifySaved() a unit-test dummy Document");
        };
        return docToShim;
    }

    function createTestWindowAndRun(spec, callback) {
        runs(function () {
            testWindow = window.open(getBracketsSourceRoot() + "/index.html", "_blank", "left=400,top=200,width=1000,height=700");
            
            testWindow.executeCommand = function executeCommand(cmd, args) {
                return testWindow.brackets.test.CommandManager.execute(cmd, args);
            };
        });

        // FIXME (issue #249): Need an event or something a little more reliable...
        waitsFor(
            function () {
                return testWindow.brackets && testWindow.brackets.test;
            },
            5000
        );

        runs(function () {
            // callback allows specs to query the testWindow before they run
            callback.call(spec, testWindow);
        });
    }

    function closeTestWindow() {
        // debug-only to see testWindow state before closing
        // waits(500);

        runs(function () {
            //we need to mark the documents as not dirty before we close
            //or the window will stay open prompting to save
            var workingSet = testWindow.brackets.test.DocumentManager.getAllOpenDocuments();
            workingSet.forEach(function resetDoc(ele, i, array) {
                if (ele.isDirty) {
                    //just refresh it back to it's current text. This will mark it
                    //clean to save
                    ele.refreshText(ele.getText(), ele.diskTimestamp);
                }
            });
            testWindow.close();
        });
    }

    function loadProjectInTestWindow(path) {
        var isReady = false;

        runs(function () {
            // begin loading project path
            var result = testWindow.brackets.test.ProjectManager.loadProject(path);
            result.done(function () {
                isReady = true;
            });
        });

        // wait for file system to finish loading
        waitsFor(function () { return isReady; }, "loadProject() timeout", 1000);
    }
    
    /**
     * Parses offsets from text offset markup (e.g. "{{1}}" for offset 1).
     * @param {!string} in Text to parse
     * @return {!{offsets:{!Array.<{line:number, ch:number}>}, text:string, original:string}} 
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
     * @param {!{Array.<string>}} paths Project relative file paths to convert
     * @return {!{Array.<string>}}
     */
    function makeAbsolute(paths) {
        var fullPath = testWindow.brackets.test.ProjectManager.getProjectRoot().fullPath;
        
        if (Array.isArray(paths)) {
            return paths.map(function (path) {
                return fullPath + path;
            });
        } else {
            return fullPath + paths;
        }
    }
    
    /**
     * Parses offsets from a file using offset markup (e.g. "{{1}}" for offset 1).
     * @param {!FileEntry} entry File to open
     * @return {!{offsets:{!Array.<{line:number, ch:number}>}, output:{!string}, original:{!string}, fileEntry:{!FileEntry}}} 
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
     * @param {!{Array.<string>}} paths Project relative file paths to open
     * @return {!{Array.<string>}}
     */
    function openProjectFiles(paths) {
        var result = new $.Deferred(),
            fullpaths = makeAbsolute(paths),
            docs = [];
        
        if (!Array.isArray(fullpaths)) {
            fullpaths = [fullpaths];
        }
        
        Async.doSequentially(fullpaths, function (path, i) {
            var one = new $.Deferred();
            
            testWindow.executeCommand(Commands.FILE_OPEN,  {fullPath: path}).done(function (doc) {
                docs[paths[i]] = docs[i] = doc;
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
     * @return {!{offsets:{!Array.<{line:number, ch:number}>}, output:{!string}, original:{!string}, fileEntry:{!FileEntry}}} 
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
     * @param {!Array.<string>} paths Project relative file paths to open
     * @return {!Array.<{offsets:{!Array.<{line:number, ch:number}>}, output:{!string}, original:{!string}, fileEntry:{!FileEntry}}>} 
     */
    function saveFilesWithoutOffsets(paths) {
        var result = new $.Deferred(),
            infos  = [],
            fullpaths = makeAbsolute(paths);
        
        if (!Array.isArray(fullpaths)) {
            fullpaths = [fullpaths];
        }
        
        var parallel = Async.doSequentially(fullpaths, function (path, i) {
            var one = new $.Deferred();
        
            saveFileWithoutOffsets(path).done(function (info) {
                infos[paths[i]] = infos[i] = info;
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
    
    function saveFilesWithOffsets(infos) {
        return Async.doInParallel(infos, function (info) {
            return FileUtils.writeText(info.fileEntry, info.original);
        }, false);
    }
    
    /**
     * Set editor cursor position to the given offset then activate an inline editor.
     * @param {!Editor} editor
     * @param {!{{line:number, ch:number}}} 
     */
    function openInlineEditorAtOffset(editor, offset) {
        editor.setCursorPos(offset.line, offset.ch);
        
        // TODO (jasonsj): refactor CMD+E as a Command instead of a CodeMirror key binding?
        testWindow.brackets.test.EditorManager._openInlineWidget(editor);
    }

    exports.TEST_PREFERENCES_KEY    = TEST_PREFERENCES_KEY;
    
    exports.getTestRoot                 = getTestRoot;
    exports.getTestPath                 = getTestPath;
    exports.getBracketsSourceRoot       = getBracketsSourceRoot;
    exports.createMockDocument          = createMockDocument;
    exports.createTestWindowAndRun      = createTestWindowAndRun;
    exports.closeTestWindow             = closeTestWindow;
    exports.loadProjectInTestWindow     = loadProjectInTestWindow;
    exports.openProjectFiles            = openProjectFiles;
    exports.openInlineEditorAtOffset    = openInlineEditorAtOffset;
    exports.saveFilesWithOffsets        = saveFilesWithOffsets;
    exports.saveFilesWithoutOffsets     = saveFilesWithoutOffsets;
    exports.saveFileWithoutOffsets      = saveFileWithoutOffsets;
});
