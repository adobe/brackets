/**
 *
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

        function tearDown() {
            SpecRunnerUtils.closeTestWindow();
        }

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

        function filterOpen(m) {
            return m.type === open;
        }

        function filterFolded(m) {
            return m.type === folded;
        }

        function getLineNumbers(m) {
            return m.line;
        }

        function toZeroIndex(lines) {
            return lines.map(function (l) {
                return l - 1;
            });
        }

        beforeEach(function () {
            setup();
            runs(function () {
                openTestFile(testFilePath);
            });
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
            tearDown();
        });


        describe("", function () {
            it("gutter fold marks are rendered on startup", function () {
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
                    //marks[0].widgetNode.click();
                    marks[0].clear();
                });

                waitsFor(function () {
                    return true;
                }, "The fold mark should have been clicked", 500);

                runs(function () {
                    var marks = getEditorFoldMarks();
                    var gutterMark = getGutterFoldMarks().filter(function (m) {
                        return m.line === lineNumber - 1 && m.type === open;
                    });
                    expect(marks.length).toEqual(0);
                    expect(gutterMark.length).toEqual(1);

                });
            });

            it("folded lines have a folded marker in the gutter", function () {
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
                        .map(getLineNumbers);
                    expect(gutterNumbers).toEqual(toZeroIndex(lineNumbers));
                });
            });

            it("foldable lines have a foldable maker in the gutter", function () {
                var lineNumbers = [1, 9, 14, 18, 22, 24, 27];
                var marks = getGutterFoldMarks();
                var gutterNumbers = marks.filter(filterOpen)
                    .map(getLineNumbers);
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

            });

            describe("Line folds cache works as expected", function () {

            });
        });
    });
});
