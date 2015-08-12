/**
 * Codefolding unit test files
 * @author Patrick Oladimeji
 * @date 01/08/2015 18:34
 */
/*global define, brackets, describe, beforeEach, afterEach, it, expect, runs, waitsForDone, waitsFor*/
define(function (require, exports, module) {
    "use strict";
    var SpecRunnerUtils = brackets.getModule("spec/SpecRunnerUtils"),
        FileUtils = brackets.getModule("file/FileUtils");

    describe("Code Folding", function () {
        var testWindow,
            testEditor,
            EditorManager,
            DocumentManager,
            CommandManager,
            PreferencesManager,
            prefs,
            cm,
            gutterName = "CodeMirror-foldgutter",
            foldMarkerOpen = gutterName + "-open",
            foldMarkerClosed = gutterName + "-folded";
        var extensionPath = FileUtils.getNativeModuleDirectoryPath(module),
            testDocPath = extensionPath + "/unittest-files/",
            testFilePath = testDocPath + "test.js";

        var open = "open", folded = "folded";

        /**
         * Utility to temporarily set preference values in the session scope
         */
        function setPreference(key, value) {
            prefs.set(key, value, {
                locations: {
                    scope: "session"
                }
            });
        }

        /**
         * Open a test file
         * @param {String} path The path to the file to open
         */
        function openTestFile(path) {
            var promise = SpecRunnerUtils.openProjectFiles([path]);
            promise.then(function () {
                testEditor = EditorManager.getCurrentFullEditor();
                cm = testEditor._codeMirror;
            });
            waitsForDone(promise, "Test file opened", 3000);
        }

        /**
         * Sets up the test window and loads the test project
         */
        function setup() {
            runs(function () {
                SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                    testWindow = w;
                    EditorManager = w.brackets.test.EditorManager;
                    DocumentManager = w.brackets.test.DocumentManager;
                    PreferencesManager = w.brackets.test.PreferencesManager;
                    CommandManager = w.brackets.test.CommandManager;

                    prefs = PreferencesManager.getExtensionPrefs("code-folding");
                }, {hasNativeMenus: true});
            });

            runs(function () {
                //setPreference("saveFoldStates", false);
                SpecRunnerUtils.loadProjectInTestWindow(testDocPath);
            });
        }

        /**
         * Closes the test window
         */
        function tearDown() {
            SpecRunnerUtils.closeTestWindow();
        }

        /**
         * Runs the specified command
         * @param   {String}  command The command to run
         * @returns {Promise} A promise that resolves after command execution is completed or failed
         */
        function runCommand(command) {
            return CommandManager.execute(command);
        }

        /**
         * Folds the code on the given line number
         * @param {Number} line The line number to fold
         */
        function foldCodeOnLine(line) {
            cm.setCursor(line);
            var promise = runCommand("codefolding.collapse");
            waitsForDone(promise, "Collapse code", 2000);
        }

        /**
         * Expands the code on the given line number
         * @param {Number} line The line number to fold
         */
        function expandCodeOnLine(line) {
            cm.setCursor(line);
            var promise = runCommand("codefolding.expand");
            waitsForDone(promise, "Expand code", 2000);
        }

        /**
         * Returns all the fold marks currently inside the editor
         * @returns {Array<TextMark>} The fold marks currently inside the editor
         */
        function getEditorFoldMarks() {
            testEditor = EditorManager.getCurrentFullEditor();
            cm = testEditor._codeMirror;

            var marks = cm.getAllMarks().filter(function (m) {
                return m.__isFold;
            });
            return marks;
        }

        /**
         * Gets information about the mark in the gutter specifically whether it is folded or open.
         * @param   {Object} lineInfo The CodeMirror lineInfo object
         * @returns {Object} an object with line and type property
         */
        function gutterMarkState(lineInfo) {
            var classes = lineInfo.gutterMarkers[gutterName].classList;
            if (classes && classes.contains(foldMarkerClosed)) {
                return {line: lineInfo.line, type: folded};
            } else if (classes && classes.contains(foldMarkerOpen)) {
                return {line: lineInfo.line, type: open};
            }
            return;
        }

        /**
         * Helper function to return the fold markers on the current codeMirror instance
         *
         * @returns {[[Type]]} [[Description]]
         */
        function getGutterFoldMarks() {
            testEditor = EditorManager.getCurrentFullEditor();
            cm = testEditor._codeMirror;
            var marks = [];
            cm.eachLine(function (lineHandle) {
                var lineInfo = cm.lineInfo(lineHandle);
                marks.push(gutterMarkState(lineInfo));
            });

            return marks.filter(function (m) { return m; });
        }

        /**
         * Helper function to filter out all open gutter markers
         * @param   {Object}  m the marker to filter
         * @returns {boolean} true if the marker is open or false otherwise
         */
        function filterOpen(m) {
            return m.type === open;
        }

        /**
         * Helper function to filter out all closed gutter markers.
         * @param   {Object}  m the marker to to filter
         * @returns {boolean} true if the marker is closed or false otherwise
         */
        function filterFolded(m) {
            return m.type === folded;
        }

        /*
         * Helper function to return the line number on a marker
         * @param   {Object} m the maker whose line number we want to retrieve
         * @returns {Number} the line number of the marker
         */
        function getLineNumber(m) {
            return m.line;
        }

        /**
         * Helper function to change the lines to zero-based index
         * @param   {Array<number>} lines the line numbers to change to zero base index
         * @returns {Array<number>} the zero-based index of the lines passed in
         */
        function toZeroIndex(lines) {
            return lines.map(function (l) {
                return l - 1;
            });
        }

        /**
         * Helper function to select a range of text in the editor
         * @param   {CodeMirror.Pos} start the start position of the selection
         * @param   {CodeMirror.Pos} end   the end position of the selection
         */
        function selectTextInEditor(start, end) {
            var marksVisible = false;
            runs(function () {
                cm.setSelection(start, end);
                setTimeout(function () {
                    //wait for foldmarks to be rendered
                    marksVisible = true;
                }, 410);
            });

            waitsFor(function () {
                return marksVisible;
            }, "Fold markers now visible in gutter", 500);
        }

        beforeEach(function () {
            setup();
        });

        afterEach(function () {
            testWindow.closeAllFiles();
            tearDown();
        });


        describe("Rendering folded regions and gutter markers", function () {
            beforeEach(function () {
                runs(function () {
                    openTestFile(testFilePath);
                });

                runs(function () {
                    testEditor = EditorManager.getCurrentFullEditor();
                    cm = testEditor._codeMirror;
                });
            });

            afterEach(function () {
                testWindow.closeAllFiles();
            });

            it("Gutter fold marks are rendered on startup", function () {
                var marks = getGutterFoldMarks();
                expect(marks.length).toBeGreaterThan(0);
            });

            it("Folding code creates a folded region in editor", function () {
                var lineNumber = 1;
                runs(function () {
                    foldCodeOnLine(lineNumber);
                });

                runs(function () {
                    var marks = getEditorFoldMarks();
                    expect(marks.length).toEqual(1);
                    expect(marks[0].lines[0].lineNo()).toEqual(lineNumber - 1);
                });
            });

            it("Expanding code clears the folded region in editor", function () {
                runs(function () {
                    foldCodeOnLine(1);
                });
                runs(function () {
                    expandCodeOnLine(1);
                });

                runs(function () {
                    var marks = getEditorFoldMarks();
                    expect(marks.length).toEqual(0);
                });
            });

            it("Clearing text marker on folded region in editor expands it and updates the fold gutter", function () {
                var lineNumber = 1;
                runs(function () {
                    foldCodeOnLine(lineNumber);
                });
                runs(function () {
                    var marks = getEditorFoldMarks().filter(function (m) {
                        var range = m.find();
                        return range ? range.from.line === lineNumber - 1 : false;
                    });
                    marks[0].clear();
                });

                runs(function () {
                    var marks = getEditorFoldMarks();
                    var gutterMark = getGutterFoldMarks().filter(function (m) {
                        return m.line === lineNumber - 1 && m.type === open;
                    });
                    expect(marks.length).toEqual(0);
                    expect(gutterMark.length).toEqual(1);

                });
            });

            it("Folded lines have a folded marker in the gutter", function () {
                var lineNumbers = [1, 9];
                runs(function () {
                    lineNumbers.forEach(function (l) {
                        foldCodeOnLine(l);
                    });
                });

                runs(function () {
                    var marks = getGutterFoldMarks().filter(filterFolded);
                    expect(marks.length).toEqual(lineNumbers.length);

                    var gutterNumbers = marks
                        .map(getLineNumber);
                    expect(gutterNumbers).toEqual(toZeroIndex(lineNumbers));
                });
            });

            it("Foldable lines have a foldable maker in the gutter", function () {
                var lineNumbers = [1, 9, 14, 18, 22, 24, 27];
                var marks = getGutterFoldMarks();
                var gutterNumbers = marks.filter(filterOpen)
                    .map(getLineNumber);
                expect(gutterNumbers).toEqual(toZeroIndex(lineNumbers));
            });

            describe("Preferences work as expected", function () {
                it("Persistence of fold states works as expected", function () {
                    runs(function () {
                        foldCodeOnLine(1);
                        foldCodeOnLine(14);
                        foldCodeOnLine(18);
                    });
                    runs(function () {
                        testWindow.closeAllFiles();
                    });

                    runs(function () {
                        openTestFile(testFilePath);
                    });

                    runs(function () {
                        //expect line 1 to be folded
                        var marks = getEditorFoldMarks();
                        expect(marks.length).toEqual(3);
                    });
                });

                it("Persistence of fold states can be disabled", function () {
                    setPreference("saveFoldStates", false);
                    runs(function () {
                        foldCodeOnLine(1);
                    });
                    runs(function () {
                        testWindow.closeAllFiles();
                    });

                    runs(function () {
                        openTestFile(testFilePath);
                    });

                    runs(function () {
                        //expect line 1 to be folded
                        var marks = getEditorFoldMarks();
                        expect(marks.length).toEqual(0);
                    });
                });

                it("Minimum fold size is obeyed", function () {
                    setPreference("minFoldSize", 20000);
                    runs(function () {
                        testWindow.closeAllFiles();
                    });

                    runs(function () {
                        openTestFile(testFilePath);
                    });

                    runs(function () {
                        var marks = getGutterFoldMarks();
                        expect(marks.length).toEqual(0);
                    });
                });

                it("Code folding can be disabled", function () {
                    setPreference("enabled", false);
                    runs(function () {
                        var marks = getEditorFoldMarks();
                        expect(marks.length).toEqual(0);
                    });
                });

                it("Selecting text triggers fold marks when `makeSelectionsFoldable' is enabled", function () {
                    var start = {line: 2, ch: 0}, end = {line: 6, ch: 0};
                    setPreference("makeSelectionsFoldable", true);

                    selectTextInEditor(start, end);

                    runs(function () {
                        var marks = getGutterFoldMarks().filter(filterOpen).map(getLineNumber);
                        expect(marks).toContain(start.line);
                    });
                });

                it("Selecting text does not trigger fold marks when `makeSelectionsFoldable' is disabled", function () {
                    setPreference("makeSelectionsFoldable", false);
                    var start = {line: 2, ch: 0}, end = {line: 6, ch: 0};
                    selectTextInEditor(start, end);

                    runs(function () {
                        var marks = getGutterFoldMarks().filter(filterOpen)
                            .map(getLineNumber).filter(function (d) {
                                return d === start.line;
                            });
                        expect(marks.length).toEqual(0);
                    });
                });

                it("Successively selecting text only triggers fold region for the last selection", function () {
                    var firstSel = {start: {line: 1, ch: 0}, end: {line: 10, ch: 0}},
                        secondSel = {start: {line: 3, ch: 0}, end: {line: 8, ch: 4}};

                    selectTextInEditor(firstSel.start, firstSel.end);

                    selectTextInEditor(secondSel.start, secondSel.end);

                    runs(function () {
                        var marks = getGutterFoldMarks().filter(filterOpen)
                            .map(getLineNumber);
                        expect(marks).toContain(secondSel.start.line);
                        expect(marks).not.toContain(firstSel.start.line);
                    });
                });
            });
        });
    });
});
