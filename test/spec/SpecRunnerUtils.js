/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50, regexp: true */
/*global define: false, $: false,  describe: false, it: false, expect: false, beforeEach: false, afterEach: false, waitsFor: false, runs: false */
define(function (require, exports, module) {
    'use strict';
    
    var NativeFileSystem    = require("NativeFileSystem").NativeFileSystem,
        Commands            = require("Commands"),
        FileUtils           = require("FileUtils");
    
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

    function createTestWindowAndRun(spec, callback) {
        runs(function () {
            testWindow = window.open(getBracketsSourceRoot() + "/index.html");
            
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
     * @return {!{offsets:{!Array.<{line:number, ch:number}>}, output:string}} 
     */
    function parseOffsetsFromText(text) {
        var offsets = [],
            output  = [],
            i       = 0,
            line    = 0,
            char    = 0,
            ch      = null,
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
     * Parses offsets from a file using offset markup (e.g. "{{1}}" for offset 1).
     * @param {!FileEntry} entry File to open
     * @return {!{offsets:{!Array.<{line:number, ch:number}>}, output:string}} 
     */
    function parseOffsetsFromFile(entry) {
        var result = new $.Deferred();
        
        FileUtils.readAsText(entry).done(function (text) {
            result.resolve(parseOffsetsFromText(text));
        }).fail(function (err) {
            result.reject(err);
        });
        
        return result.promise();
    }
    
    /**
     * Opens a file path in the test window and parses offset markup (e.g. "{{1}}" for offset 1).
     * @param {!string} text Text to parse
     * @return {!{offsets:{!Array.<{line:number, ch:number}>}, output:{!string}, document:{!Document}}} 
     */
    function openFileWithOffsets(path) {
        var result = new $.Deferred();
        
        var fileOpen = testWindow.executeCommand(Commands.FILE_OPEN,  {fullPath: path})
            .done(function (doc) {
                var text = doc.getText();
                
                // parse offset data
                var info = parseOffsetsFromText(text);
                
                // reset document to remove offset markup
                doc.editor.resetText(info.text);
                
                // return document with offset info
                info.document = doc;
                
                result.resolve(info);
            })
            .fail(function () {
                result.reject();
            });
        
        return result.promise();
    }
    
    function saveFileWithoutOffsets(path) {
        var result = new $.Deferred(),
            fileEntry = new NativeFileSystem.FileEntry(path);
        
        parseOffsetsFromFile(fileEntry).done(function (info) {
            // Write TODO
            result.resolve(info);
        });
        
        return result.promise();
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
    
    exports.getTestRoot             = getTestRoot;
    exports.getTestPath             = getTestPath;
    exports.getBracketsSourceRoot   = getBracketsSourceRoot;
    exports.createTestWindowAndRun  = createTestWindowAndRun;
    exports.closeTestWindow         = closeTestWindow;
    exports.loadProjectInTestWindow = loadProjectInTestWindow;
    exports.openFileWithOffsets     = openFileWithOffsets;
});
