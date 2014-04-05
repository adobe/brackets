/*
 * Copyright (c) 2014 Adobe Systems Incorporated. All rights reserved.
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

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, describe, it, xit, expect, beforeEach, afterEach, waits, waitsFor, runs, $, brackets, waitsForDone, spyOn, beforeFirst, afterLast */

define(function (require, exports, module) {
    "use strict";

    // Modules from the SpecRunner window
    var SpecRunnerUtils             = brackets.getModule("spec/SpecRunnerUtils"),
        ExtensionUtils              = brackets.getModule("utils/ExtensionUtils"),
        testStyles                  = require("text!unittest-files/style.css"),
        testHTML                    = require("text!unittest-files/index.html"),
        testContentMatchPositive    = require("text!unittest-files/match-positive.css"),
        testContentMatchNegative    = require("text!unittest-files/match-negative.css"),
        testContentMatchEmbedded    = require("text!unittest-files/match-embedded.html"),
        LiveEditorLocalDriver       = require("LiveEditorLocalDriver"),
        Model                       = require("Model"),
        main                        = require("main");

    describe("CSS Shapes Editor", function () {
        var testDocument, testEditor;

        function constructModelAtPos(row, col) {
            testEditor.setCursorPos(row, col);
            // mutates main.model
            main._constructModel({ target: testEditor });
        }

        describe("Model", function () {
            var model,
                scope = {
                    onChange: function () {}
                };

            beforeEach(function () {
                model = new Model({key: "value"});
                spyOn(scope, "onChange");
                $(model).on("change", scope.onChange);
            });

            afterEach(function () {
                $(model).off("change", scope.onChange);
                model = null;
                // Jasmine spies are cleared automatically
            });

            it("should be defined", function () {
                expect(model).toBeDefined();
            });

            it("should have getter", function () {
                expect(model.get("key")).toEqual("value");
            });

            it("should add new key with setter", function () {
                function setter() {
                    model.set({"other": "value"});
                }
                expect(setter).not.toThrow();
                expect(model.get("other")).toEqual("value");
            });

            it("should update existing key", function () {
                model.set({"key": "new"});
                expect(model.get("key")).toEqual("new");
            });

            it("should throw change event on setter", function () {
                model.set({"other": "value"});
                expect(scope.onChange).toHaveBeenCalled();
            });

            it("should not throw change event when updated with duplicate", function () {
                model.set({"key": "value"});
                expect(scope.onChange).not.toHaveBeenCalled();
            });

            it("should not throw change event on setter if asked to be silent", function () {
                var silent = true;
                model.set({"other": "value"}, silent);

                expect(scope.onChange).not.toHaveBeenCalled();
            });

            it("should throw error if updated with string", function () {
                function setWithString() {
                    model.set("key", "value");
                }

                expect(setWithString).toThrow();
            });

            it("should throw error if updated with null", function () {
                function setWithNull() {
                    model.set(null);
                }

                expect(setWithNull).toThrow();
            });

            it("should reset model", function () {
                var orig = model.get("key");

                model.set({"key": "new"});
                expect(model.get("key")).toEqual("new");

                model.reset();
                expect(model.get("key")).toEqual(orig);
            });

            it("should throw change event on reset", function () {
                model.reset();
                expect(scope.onChange).toHaveBeenCalled();
            });

            it("should not throw change event on reset if asked to be silent", function () {
                model.reset(true);
                expect(scope.onChange).not.toHaveBeenCalled();
            });
        });

        describe("Get range for CSS value", function () {

            beforeEach(function () {
                var mock = SpecRunnerUtils.createMockEditor(testContentMatchPositive, "css");
                testDocument = mock.doc;
                testEditor = mock.editor;
            });

            afterEach(function () {
                SpecRunnerUtils.destroyMockEditor(testDocument);
                testEditor = null;
                testDocument = null;
            });

            function testGetRangeAt(pos, expected, trimWhitespace) {
                var range = main._getRangeForCSSValueAt(testEditor, pos, trimWhitespace || false);
                expect(range).toEqual(expected);
            }

            it("should get range for empty circle() starting at begining", function () {
                var pos =  {line: 6, ch: 19 };
                var expected = {
                    start: {line: 6, ch: 17 },
                    end:   {line: 6, ch: 27 }
                };

                testGetRangeAt(pos, expected);
            });

            it("should get range for empty circle() starting at end", function () {
                var pos =  {line: 6, ch: 27 };
                var expected = {
                    start: {line: 6, ch: 17 },
                    end:   {line: 6, ch: 27 }
                };

                testGetRangeAt(pos, expected);
            });

            it("should get range for empty circle() with trimmed whitespace", function () {
                var pos =  {line: 6, ch: 19 };
                var expected = {
                    start: {line: 6, ch: 18 },
                    end:   {line: 6, ch: 26 }
                };

                testGetRangeAt(pos, expected, true);
            });

            it("should get range for full-notation polygon() starting from arbitrary position", function () {
                var pos =  {line: 15, ch: 55 };
                var expected = {
                    start: {line: 15, ch: 17 },
                    end:   {line: 15, ch: 61 }
                };

                testGetRangeAt(pos, expected);
            });
        });

        /*
          Quick test for shape-like values in Brackets.

          Actual shape conformity is tested by the thirdparty CSSShapesEditor.js
          It will throw errors for invalid shapes; to be caught by the Brackets extension.
        */
        describe("Positive match CSS Shapes-like values", function () {

            beforeEach(function () {
                var mock = SpecRunnerUtils.createMockEditor(testContentMatchPositive, "css");
                testDocument = mock.doc;
                testEditor = mock.editor;
            });

            afterEach(function () {
                SpecRunnerUtils.destroyMockEditor(testDocument);
                testEditor = null;
                testDocument = null;
            });

            it("should have a default model", function () {
                expect(main.model).toBeDefined();
                expect(main.model.get("property")).toBe(null);
                expect(main.model.get("value")).toBe(null);
                expect(main.model.get("selector")).toBe(null);
            });

            it("should match shape-inside property", function () {
                constructModelAtPos(3, 20);
                expect(main.model.get("property")).toBe("shape-inside");
            });

            it("should not match property or value when cursor is after semicolon", function () {
                constructModelAtPos(3, 28);
                expect(main.model.get("property")).not.toBe("shape-inside");
                expect(main.model.get("value")).not.toBe("circle()");
            });

            it("should match shape-outside property", function () {
                constructModelAtPos(4, 21);
                expect(main.model.get("property")).toBe("shape-outside");
            });

            it("should match -webkit-clip-path property", function () {
                constructModelAtPos(5, 25);
                expect(main.model.get("property")).toBe("-webkit-clip-path");
            });

            it("should match empty circle() value", function () {
                constructModelAtPos(6, 20);
                expect(main.model.get("value")).toBe("circle()");
            });

            it("should match circle() value", function () {
                constructModelAtPos(7, 20);
                expect(main.model.get("value")).toBe("circle(0 at 0 0)");
            });

            it("should match circle() value when cursor is inside function", function () {
                constructModelAtPos(7, 27);
                expect(main.model.get("value")).toBe("circle(0 at 0 0)");
            });

            it("should match circle() value with pixel units", function () {
                constructModelAtPos(8, 27);
                expect(main.model.get("value")).toBe("circle(0px at 0px 0px)");
            });

            it("should match circle() value with mixed units", function () {
                constructModelAtPos(9, 27);
                expect(main.model.get("value")).toBe("circle(0px at 0 0%)");
            });

            it("should match empty ellipse() value", function () {
                constructModelAtPos(10, 27);
                expect(main.model.get("value")).toBe("ellipse()");
            });

            it("should match ellipse() value", function () {
                constructModelAtPos(11, 27);
                expect(main.model.get("value")).toBe("ellipse(0 0 at 0 0)");
            });

            // Incomplete values should not trip the Brackets side.
            // The in-browser CSS Shapes Editor must reject invalid values
            it("should match incomplete ellipse() value", function () {
                constructModelAtPos(12, 27);
                expect(main.model.get("value")).toBe("ellipse(0 0)");
            });

            it("should match empty polygon()", function () {
                constructModelAtPos(13, 27);
                expect(main.model.get("value")).toBe("polygon()");
            });

            it("should match polygon() value", function () {
                constructModelAtPos(14, 27);
                expect(main.model.get("value")).toBe("polygon(0 0, 100px 0, 100px 100px)");
            });

            it("should match polygon() value with fill-rule", function () {
                constructModelAtPos(15, 27);
                expect(main.model.get("value")).toBe("polygon(nonzero, 0 0, 100px 0, 100px 100px)");
            });
        });

        describe("Negative match CSS Shapes-like values", function () {

            beforeEach(function () {
                var mock = SpecRunnerUtils.createMockEditor(testContentMatchNegative, "css");
                testDocument = mock.doc;
                testEditor = mock.editor;
            });

            afterEach(function () {
                SpecRunnerUtils.destroyMockEditor(testDocument);
                testEditor = null;
                testDocument = null;
            });

            // clip-path applies to SVG only; this will change in the future
            it("should not match unprefixed clip-path property", function () {
                constructModelAtPos(1, 17);
                expect(main.model.get("property")).not.toBe("clip-path");
            });

            it("should not match commented-out shape-inside property", function () {
                constructModelAtPos(2, 20);
                expect(main.model.get("property")).not.toBe("shape-inside");
            });
        });

        describe("Find selector in embedded <style> blocks", function () {

            beforeEach(function () {
                var mock = SpecRunnerUtils.createMockEditor(testContentMatchEmbedded, "html");
                testDocument = mock.doc;
                testEditor = mock.editor;
            });

            afterEach(function () {
                SpecRunnerUtils.destroyMockEditor(testDocument);
                testEditor = null;
                testDocument = null;
            });

            it("should find first selector in head <style>", function () {
                constructModelAtPos(4, 20);
                expect(main.model.get("selector")).toBe("#content");
            });

            it("should find second selector in head <style>", function () {
                constructModelAtPos(8, 20);
                expect(main.model.get("selector")).toBe("div");
            });

            it("should find first selector in body <style>", function () {
                constructModelAtPos(15, 22);
                expect(main.model.get("selector")).toBe("#content");
            });

            it("should find first selector in scoped <style>", function () {
                constructModelAtPos(21, 22);
                expect(main.model.get("selector")).toBe("#content");
            });

        });

        describe("Update the code editor", function () {
            beforeEach(function () {
                var mock = SpecRunnerUtils.createMockEditor(testStyles, "css");
                testDocument = mock.doc;
                testEditor = mock.editor;

                // hijack current editor, which is normally setup by _onActiveEditorChange();
                // it is used inside _updateCodeEditor()
                main._setCurrentEditor(testEditor);
            });

            afterEach(function () {
                SpecRunnerUtils.destroyMockEditor(testDocument);
                testEditor = null;
                testDocument = null;
            });

            it("should update property value", function () {
                var origValue = "circle(100px at 0 0)";
                var newValue  = "circle(100px at 50% 50%)";
                spyOn(testDocument, "replaceRange").andCallThrough();

                constructModelAtPos(7, 18);
                expect(main.model.get("value")).toBe(origValue);

                // change the model and update the code editor with it
                main.model.set({"value": newValue });
                main._updateCodeEditor(main.model);

                constructModelAtPos(7, 18);
                expect(main.model.get("value")).toBe(newValue);
                expect(testDocument.replaceRange).toHaveBeenCalled();
            });

            it("should not update value if duplicate", function () {
                var origValue = "circle(100px at 0 0)";
                spyOn(testDocument, "replaceRange");

                constructModelAtPos(7, 18);
                expect(main.model.get("value")).toBe(origValue);

                main.model.set({"value": origValue });
                main._updateCodeEditor(main.model);

                expect(testDocument.replaceRange).not.toHaveBeenCalled();
            });

            it("should not update value if range is falsy", function () {
                spyOn(testDocument, "replaceRange");

                constructModelAtPos(7, 18);
                expect(main.model.get("range")).toBeDefined();

                main.model.set({"range": undefined });
                main._updateCodeEditor(main.model);

                expect(testDocument.replaceRange).not.toHaveBeenCalled();
            });
        });

        describe("LiveEditor Driver - Mock Workflow", function () {
            beforeEach(function () {
                var mock = SpecRunnerUtils.createMockEditor(testStyles, "css");
                testDocument = mock.doc;
                testEditor = mock.editor;

                // hijack current editor, which is normally setup by _onActiveEditorChange();
                // it is used inside _updateCodeEditor()
                main._setCurrentEditor(testEditor);
            });

            afterEach(function () {
                SpecRunnerUtils.destroyMockEditor(testDocument);
                testEditor = null;
                testDocument = null;
                main._teardown();
            });

            it("should call init() when LivePreview is turned on", function () {
                var deferred = $.Deferred();
                spyOn(LiveEditorLocalDriver, "init").andReturn(deferred.promise());

                main._setup();

                // expect to inject dependencies;
                expect(LiveEditorLocalDriver.init).toHaveBeenCalled();
            });

            it("should call remove() when LivePreview is turned off", function () {
                var deferred = $.Deferred();
                spyOn(LiveEditorLocalDriver, "remove").andReturn(deferred.promise());

                main._setup();
                main._teardown();

                expect(LiveEditorLocalDriver.remove).toHaveBeenCalled();
            });
        });

        describe("Live Preview Workflow", function () {

            // The following are all loaded from the test window
            var DocumentManager,
                EditorManager,
                Inspector,
                LiveDevelopment;

            var testPath    = ExtensionUtils.getModulePath(module, "unittest-files"),
                tempDir     = SpecRunnerUtils.getTempDirectory(),
                testWindow;


            function isOpenInBrowser(doc, agents) {
                return (doc && doc.url && agents && agents.network && agents.network.wasURLRequested(doc.url));
            }

            beforeFirst(function () {
                SpecRunnerUtils.createTempDirectory();

                SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                    testWindow      = w;
                    DocumentManager = testWindow.brackets.test.DocumentManager;
                    EditorManager   = testWindow.brackets.test.EditorManager;
                    Inspector       = testWindow.brackets.test.Inspector;
                    LiveDevelopment = testWindow.brackets.test.LiveDevelopment;
                });
            });

            afterLast(function () {
                runs(function () {
                    testWindow      = null;
                    LiveDevelopment = null;
                    // ProjectManager       = null;
                    SpecRunnerUtils.closeTestWindow();
                });

                SpecRunnerUtils.removeTempDirectory();
            });

            beforeEach(function () {
                // verify live dev isn't currently active
                expect(LiveDevelopment.status).toBe(LiveDevelopment.STATUS_INACTIVE);

                // copy files to temp directory
                runs(function () {
                    waitsForDone(SpecRunnerUtils.copyPath(testPath, tempDir), "copy temp files");
                });

                // open project
                runs(function () {
                    SpecRunnerUtils.loadProjectInTestWindow(tempDir);
                });
            });

            afterEach(function () {
                runs(function () {
                    waitsForDone(LiveDevelopment.close(), "Waiting for browser to become inactive", 10000);
                });

                testWindow.closeAllFiles();
            });

            it("should load shape editor dependencies into LivePreview", function () {

                // Spy on eval calls to Inspector; used to inject dependencies and setup/update/remove remote editor
                spyOn(testWindow.brackets.test.Inspector.Runtime, "evaluate").andCallThrough();

                //open project files
                runs(function () {
                    waitsForDone(SpecRunnerUtils.openProjectFiles(["index.html", "style.css"]), "SpecRunnerUtils.openProjectFiles index.html, style.css", 1000);
                });

                // start live dev
                runs(function () {
                    waitsForDone(LiveDevelopment.open(), "LiveDevelopment.open()", 15000);
                });

                runs(function () {
                    expect(LiveDevelopment.status).toBe(LiveDevelopment.STATUS_ACTIVE);

                    testWindow.brackets.test.Inspector.Runtime.evaluate("window._LD_CSS_EDITOR", function (resp) {
                        expect(resp.result.type).toBeDefined();
                    });
                });

                runs(function () {
                    testWindow.brackets.test.Inspector.Runtime.evaluate("window.CSSShapesEditor", function (resp) {
                        expect(resp.result.type).toBeDefined();
                    });
                });
            });

            xit("should setup and update remote editor", function () {

                spyOn(testWindow.brackets.test.Inspector.Runtime, "evaluate").andCallThrough();

                runs(function () {
                    waitsForDone(SpecRunnerUtils.openProjectFiles(["index.html"]), "SpecRunnerUtils.openProjectFiles index.html, style.css", 1000);
                });

                runs(function () {
                    waitsForDone(SpecRunnerUtils.openProjectFiles(["style.css"]), "SpecRunnerUtils.openProjectFiles index.html, style.css", 1000);
                });

                // start live dev
                runs(function () {
                    waitsForDone(LiveDevelopment.open(), "LiveDevelopment.open()", 15000);
                });

                runs(function () {
                    expect(LiveDevelopment.status).toBe(LiveDevelopment.STATUS_ACTIVE);

                    var editor = EditorManager.getCurrentFullEditor();
                    var range = editor.document.getRange({ line: 7, ch: 17}, { line: 7, ch: 37});

                    expect(range).toEqual("circle(100px at 0 0)");

                    testWindow.brackets.test.Inspector.Runtime.evaluate.reset();

                    // set the cursor on the property
                    editor.focus();
                    editor.setCursorPos(7, 20);
                    $(editor).triggerHandler("change");

                    // TODO: replace range and watch for window._LD_CSS_EDITOR.update()
                    // doc.replaceRange("Live Preview in ", {line: 11, ch: 33});

                    //TODO: figure out why jasmine doesn't see window._LD_CSS_EDITOR.setup() called
                    expect(testWindow.brackets.test.Inspector.Runtime.evaluate).toHaveBeenCalled();
                });
            });
        });
    });
});
