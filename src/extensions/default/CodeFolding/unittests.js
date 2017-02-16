/**
 * Codefolding unit test files
 * @author Patrick Oladimeji
 * @date 01/08/2015 18:34
 */

/*global describe, beforeEach, afterEach, it, expect, runs, waitsForDone, waitsFor*/

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
            testDocumentDirectory = extensionPath + "/unittest-files/",
            // The line numbers referenced below are dependent on the files in /unittest-files directory.
            // Remember to update the numbers if the files change.
            testFilesSpec = {
                js: {
                    filePath: testDocumentDirectory + "test.js",
                    foldableLines: [1, 11, 17, 21, 25, 27, 30],
                    sameLevelFoldableLines: [17, 21],
                    firstSelection: {start: {line: 2, ch: 0}, end: {line: 10, ch: 0}},
                    secondSelection: {start: {line: 5, ch: 0}, end: {line: 8, ch: 4}}
                },
                html: {
                    filePath: testDocumentDirectory + "test.html",
                    foldableLines: [1, 2, 5, 7, 8, 12, 13, 14, 18, 19, 24, 27],
                    sameLevelFoldableLines: [8, 24],
                    firstSelection: {start: {line: 3, ch: 0}, end: {line: 10, ch: 0}},
                    secondSelection: {start: {line: 6, ch: 0}, end: {line: 17, ch: 4}}
                },
                hbs: {
                    filePath: testDocumentDirectory + "test.hbs",
                    foldableLines: [1, 7, 14, 16, 17, 21, 26, 28, 29, 32, 33, 38, 41],
                    sameLevelFoldableLines: [1, 7, 14],
                    firstSelection: {start: {line: 2, ch: 0}, end: {line: 10, ch: 0}},
                    secondSelection: {start: {line: 5, ch: 0}, end: {line: 8, ch: 4}}
                }
            },
            open = "open",
            folded = "folded";

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
                SpecRunnerUtils.loadProjectInTestWindow(testDocumentDirectory);
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
            cm.setCursor(line - 1);
            var promise = runCommand("codefolding.collapse");
            waitsForDone(promise, "Collapse code", 2000);
        }

        /**
         * Expands the code on the given line number
         * @param {Number} line The line number to fold
         */
        function expandCodeOnLine(line) {
            cm.setCursor(line - 1);
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
            if (!lineInfo || !lineInfo.gutterMarkers) {
                return;
            }
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
         * @returns {Array<object>} An array of objects containing the line and the type of marker.
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

        Object.keys(testFilesSpec).forEach(function (file) {
            var testFilePath = testFilesSpec[file].filePath;
            var foldableLines = testFilesSpec[file].foldableLines;
            var testFileSpec = testFilesSpec[file];
            describe(file + " - Editor/Gutter", function () {
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

                it("renders fold marks on startup", function () {
                    var marks = getGutterFoldMarks();
                    expect(marks.length).toBeGreaterThan(0);
                    marks.map(getLineNumber).forEach(function (line) {
                        expect(toZeroIndex(foldableLines)).toContain(line);
                    });
                });

                it("creates a folded region in editor when fold marker is clicked", function () {
                    var lineNumber = foldableLines[0];
                    runs(function () {
                        foldCodeOnLine(lineNumber);
                    });

                    runs(function () {
                        var marks = getEditorFoldMarks();
                        expect(marks.length).toEqual(1);
                        expect(marks[0].lines[0].lineNo()).toEqual(lineNumber - 1);
                    });
                });

                it("clears the folded region in editor when collapsed fold marker is clicked", function () {
                    var lineNumber = foldableLines[0];
                    runs(function () {
                        foldCodeOnLine(lineNumber);
                    });
                    runs(function () {
                        expandCodeOnLine(lineNumber);
                    });

                    runs(function () {
                        var marks = getEditorFoldMarks();
                        expect(marks.length).toEqual(0);
                    });
                });

                it("expands and updates the fold gutter when text marker for a folded region in editor is cleared", function () {
                    var lineNumber = foldableLines[0];
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

                it("renders folded marker in the gutter for folded code regions", function () {
                    var lineNumbers = testFilesSpec[file].sameLevelFoldableLines;
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

                it("indicates foldable lines in the gutter", function () {
                    var lineNumbers = foldableLines;
                    var marks = getGutterFoldMarks();
                    var gutterNumbers = marks.filter(filterOpen)
                        .map(getLineNumber);
                    expect(gutterNumbers).toEqual(toZeroIndex(lineNumbers));
                });

                describe("Preferences", function () {
                    it("persists fold states", function () {
                        var lineNumbers = testFileSpec.sameLevelFoldableLines;
                        runs(function () {
                            lineNumbers.forEach(function (line) {
                                foldCodeOnLine(line);
                            });
                        });
                        runs(function () {
                            testWindow.closeAllFiles();
                        });

                        runs(function () {
                            openTestFile(testFilePath);
                        });

                        runs(function () {
                            var marks = getEditorFoldMarks();
                            var gutterNumbers = marks.map(function (mark) {
                                return mark.lines[0].lineNo();
                            });
                            expect(gutterNumbers).toEqual(toZeroIndex(lineNumbers));
                        });
                    });

                    it("can be disable persistence of fold states", function () {
                        setPreference("saveFoldStates", false);
                        runs(function () {
                            foldCodeOnLine(foldableLines[0]);
                        });
                        runs(function () {
                            testWindow.closeAllFiles();
                        });

                        runs(function () {
                            openTestFile(testFilePath);
                        });

                        runs(function () {
                            var marks = getEditorFoldMarks();
                            expect(marks.length).toEqual(0);
                        });
                    });

                    it("can set the minimum fold size", function () {
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

                    it("can disable code folding", function () {
                        setPreference("enabled", false);
                        runs(function () {
                            var marks = getEditorFoldMarks();
                            expect(marks.length).toEqual(0);
                        });
                    });

                    describe("Fold selected region", function () {
                        it("can be enabled by setting `makeSelectionsFoldable' to true", function () {
                            var start = testFileSpec.firstSelection.start, end = testFileSpec.firstSelection.end;
                            setPreference("makeSelectionsFoldable", true);

                            selectTextInEditor(start, end);

                            runs(function () {
                                var marks = getGutterFoldMarks().filter(filterOpen).map(getLineNumber);
                                expect(marks).toContain(start.line);
                            });
                        });

                        it("can be disabled by setting `makeSelectionsFoldable' to false", function () {
                            setPreference("makeSelectionsFoldable", false);
                            var start = testFileSpec.firstSelection.start, end = testFileSpec.firstSelection.end;
                            selectTextInEditor(start, end);

                            runs(function () {
                                var marks = getGutterFoldMarks().filter(filterOpen)
                                    .map(getLineNumber).filter(function (d) {
                                        return d === start.line;
                                    });
                                expect(marks.length).toEqual(0);
                            });
                        });

                        it("shows fold ranges for only the most recent selection", function () {
                            var firstSelection = testFileSpec.firstSelection,
                                secondSelection = testFileSpec.secondSelection;

                            selectTextInEditor(firstSelection.start, firstSelection.end);

                            selectTextInEditor(secondSelection.start, secondSelection.end);

                            runs(function () {
                                var marks = getGutterFoldMarks().filter(filterOpen)
                                    .map(getLineNumber);
                                expect(marks).toContain(secondSelection.start.line);
                                expect(marks).not.toContain(firstSelection.start.line);
                            });
                        });
                    });

                });

                describe("Editor text changes", function () {
                    var foldableLine = foldableLines[1],
                        expandTimeoutElapsed = false;

                    // add a line after folding a region preserves the region and the region can be unfolded
                    it("can unfold a folded region after a line has been added above it", function () {
                        runs(function () {
                            foldCodeOnLine(foldableLine);
                            cm.replaceRange("\r\n", {line: foldableLine - 1, ch: 0});
                        });

                        runs(function () {
                            expandCodeOnLine(foldableLine + 1);
                            setTimeout(function () {
                                expandTimeoutElapsed = true;
                            }, 400);
                        });

                        waitsFor(function () {
                            return expandTimeoutElapsed;
                        }, "waiting a moment for gutter markerts to be re-rendered", 500);

                        runs(function () {
                            var marks = getGutterFoldMarks().filter(filterFolded);
                            expect(marks.length).toEqual(0);
                        });

                    });

                    it("can unfold a folded region even after a line has been removed above it", function () {
                        runs(function () {
                            foldCodeOnLine(foldableLine);
                            cm.replaceRange("", {line: foldableLine - 1, ch: 0}, {line: foldableLine, ch: 0});
                        });

                        runs(function () {
                            expandCodeOnLine(foldableLine - 1);
                            setTimeout(function () {
                                expandTimeoutElapsed = true;
                            }, 400);
                        });

                        waitsFor(function () {
                            return expandTimeoutElapsed;
                        }, "waiting a moment for gutter markerts to be re-rendered", 500);

                        runs(function () {
                            var marks = getGutterFoldMarks().filter(filterFolded);
                            expect(marks.length).toEqual(0);
                        });
                    });
                });
            });
        });
    });
});
