/**
 *
 */
/*global define, brackets, describe, beforeEach, afterEach, it, expect, runs, waitsForDone*/
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
            foldMarkerClosed = gutterName + "-close";
        var extensionPath = FileUtils.getNativeModuleDirectoryPath(module),
            testDocPath = extensionPath + "/unittest-files/",
            testFilePath = testDocPath + "test.js";

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
                setPreference("saveFoldStates", false);
                SpecRunnerUtils.loadProjectInTestWindow(testDocPath);
            });

            runs(function () {
                openTestFile(testFilePath);
            });

            runs(function () {
                testEditor = EditorManager.getActiveEditor();
                cm = testEditor._codeMirror;
            });

        }

        function tearDown() {
            SpecRunnerUtils.closeTestWindow();
        }

        function runCommand(command) {
            return CommandManager.execute(command);
        }

        function foldCodeOnLine(line) {
            cm.setCursor(line);
            var promise = runCommand("codefolding.collapse");
            waitsForDone(promise, "Collapse code", 2000);
        }

        function expandCodeOnLine(line) {
            cm.setCursor(line);
            var promise = runCommand("codefolding.expand");
            waitsForDone(promise, "Expand code", 2000);
        }

        function getEditorFoldMarks() {
            var marks = cm.getAllMarks().filter(function (m) {
                return m.__isFold;
            });
            return marks;
        }

        function gutterMarkState(lineInfo) {
            var classes = lineInfo.gutterMarkers[gutterName].classList;
            if (classes && classes.contains(foldMarkerClosed)) {
                return "close";
            } else if (classes && classes.contains(foldMarkerOpen)) {
                return "open";
            }
            return;
        }

        function getGutterFoldMarks() {
            var marks = [];
            cm.eachLine(function (lineHandle) {
                var lineInfo = cm.lineInfo(lineHandle);
                marks.push(gutterMarkState(lineInfo));
            });

            return marks.filter(function (m) { return m; });
        }

        beforeEach(setup);
        afterEach(tearDown);

        it("gutter fold marks are rendered on startup", function () {
            var marks = getGutterFoldMarks();
            expect(marks.length).toBeGreaterThan(0);
        });

        it("Folding code creates a folded region in editor", function () {
            runs(function () {
                foldCodeOnLine(1);
            });

            runs(function () {
                var marks = getEditorFoldMarks();
                expect(marks.length).toEqual(1);
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

        describe("Preferences work as expected", function () {
            afterEach(function () {
                testEditor = null;
                cm = null;
            });
            it("Persistence of fold states works as expected", function () {
                setPreference("saveFoldStates", true);
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
                    expect(marks.length).toEqual(1);
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
        });

    });
});
