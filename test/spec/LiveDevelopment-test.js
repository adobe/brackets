/*
 * Copyright (c) 2012 - present Adobe Systems Incorporated. All rights reserved.
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

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global brackets, $, define, describe, it, xit, expect, beforeEach, afterEach, waitsFor, waitsForDone, waitsForFail, runs, spyOn, jasmine, beforeFirst, afterLast */

define(function (require, exports, module) {
    'use strict';

    var SpecRunnerUtils         = require("spec/SpecRunnerUtils"),
        Async                   = require("utils/Async"),
        PreferencesDialogs      = require("preferences/PreferencesDialogs"),
        Strings                 = require("strings"),
        StringUtils             = require("utils/StringUtils"),
        FileSystem              = require("filesystem/FileSystem"),
        FileUtils               = require("file/FileUtils"),
        DefaultDialogs          = require("widgets/DefaultDialogs"),
        FileServer              = require("LiveDevelopment/Servers/FileServer").FileServer,
        UserServer              = require("LiveDevelopment/Servers/UserServer").UserServer;

    // The following are all loaded from the test window
    var CommandManager,
        Commands,
        Dialogs,
        NativeApp,
        LiveDevelopment,
        Inspector,
        DOMAgent,
        DocumentManager,
        ProjectManager;

    // Used as mocks
    require("LiveDevelopment/main");
    var CommandsModule                = require("command/Commands"),
        CommandsManagerModule         = require("command/CommandManager"),
        LiveDevelopmentModule         = require("LiveDevelopment/LiveDevelopment"),
        InspectorModule               = require("LiveDevelopment/Inspector/Inspector"),
        CSSDocumentModule             = require("LiveDevelopment/Documents/CSSDocument"),
        CSSAgentModule                = require("LiveDevelopment/Agents/CSSAgent"),
        HighlightAgentModule          = require("LiveDevelopment/Agents/HighlightAgent"),
        HTMLDocumentModule            = require("LiveDevelopment/Documents/HTMLDocument"),
        HTMLInstrumentationModule     = require("language/HTMLInstrumentation"),
        NativeAppModule               = require("utils/NativeApp"),
        CSSPreprocessorDocumentModule = require("LiveDevelopment/Documents/CSSPreprocessorDocument");

    var testPath    = SpecRunnerUtils.getTestPath("/spec/LiveDevelopment-test-files"),
        tempDir     = SpecRunnerUtils.getTempDirectory(),
        testWindow,
        allSpacesRE = /\s+/gi;

    function fixSpaces(str) {
        return str.replace(allSpacesRE, " ");
    }

    function isOpenInBrowser(doc, agents) {
        return (doc && doc.url && agents && agents.network && agents.network.wasURLRequested(doc.url));
    }

    function openLiveDevelopmentAndWait() {
        // start live dev
        runs(function () {
            waitsForDone(LiveDevelopment.open(), "LiveDevelopment.open()", 15000);
        });
    }

    function saveAndWaitForLoadEvent(doc) {
        var deferred = new $.Deferred();

        // documentSaved is fired async after the FILE_SAVE command completes.
        // Instead of waiting for the FILE_SAVE promise, we listen to the
        // inspector connection to confirm that the page reload occurred
        Inspector.Page.on("loadEventFired", deferred.resolve);

        // remove event listener after timeout fires
        deferred.always(function () {
            Inspector.Page.off("loadEventFired", deferred.resolve);
        });

        // save the file
        var fileSavePromise = CommandManager.execute(Commands.FILE_SAVE, {doc: doc});
        waitsForDone(fileSavePromise, "FILE_SAVE", 1000);

        // wrap with a timeout to indicate loadEventFired was not fired
        return Async.withTimeout(deferred.promise(), 2000);
    }

    function waitForLiveDoc(path, callback) {
        var liveDoc;

        waitsFor(function () {
            liveDoc = LiveDevelopment.getLiveDocForPath(path);
            return !!liveDoc;
        }, "Waiting for LiveDevelopment document", 10000);

        runs(function () {
            callback(liveDoc);
        });
    }

    function doOneTest(htmlFile, cssFile) {
        var localText,
            browserText,
            loadEventPromise,
            curDoc;

        runs(function () {
            spyOn(Inspector.Page, "reload");
            waitsForDone(SpecRunnerUtils.openProjectFiles([htmlFile]), "SpecRunnerUtils.openProjectFiles " + htmlFile, 1000);
        });

        openLiveDevelopmentAndWait();

        runs(function () {
            waitsForDone(SpecRunnerUtils.openProjectFiles([cssFile]), "SpecRunnerUtils.openProjectFiles " + cssFile, 1000);
        });

        runs(function () {
            curDoc =  DocumentManager.getCurrentDocument();
            localText = curDoc.getText();
            localText += "\n .testClass { background-color:#090; }\n";
            curDoc.setText(localText);
        });

        var liveDoc;
        waitForLiveDoc(tempDir + "/" + cssFile, function (doc) { liveDoc = doc; });

        var doneSyncing = false;
        runs(function () {
            liveDoc.getSourceFromBrowser().done(function (text) {
                browserText = text;
            }).always(function () {
                doneSyncing = true;
            });
        });
        waitsFor(function () { return doneSyncing; }, "Browser to sync changes", 10000);

        runs(function () {
            expect(fixSpaces(browserText)).toBe(fixSpaces(localText));

            var doc = DocumentManager.getOpenDocumentForPath(tempDir + "/" + htmlFile);
            expect(isOpenInBrowser(doc, LiveDevelopment.agents)).toBeTruthy();

            // Save the CSS file
            loadEventPromise = saveAndWaitForLoadEvent(doc);
        });

        runs(function () {
            waitsForFail(loadEventPromise, "loadEventFired", 3000);
        });

        runs(function () {
            expect(Inspector.Page.reload).not.toHaveBeenCalled();
        });
    }

    function enableAgent(liveDevModule, name) {
        liveDevModule.enableAgent(name);
    }

    describe("Inspector", function () {

        this.category = "livepreview";

        it("should return a ready socket on Inspector.connect and close the socket on Inspector.disconnect", function () {
            var id  = Math.floor(Math.random() * 100000),
                url = LiveDevelopmentModule.launcherUrl + "?id=" + id,
                connected = false,
                failed = false;

            runs(function () {
                waitsForDone(
                    NativeAppModule.openLiveBrowser(url, true),
                    "NativeApp.openLiveBrowser",
                    5000
                );
            });

            runs(function () {
                var retries = 0;
                function tryConnect() {
                    if (retries < 10) {
                        retries++;
                        InspectorModule.connectToURL(url)
                            .done(function () {
                                connected = true;
                            })
                            .fail(function () {
                                window.setTimeout(tryConnect, 500);
                            });
                    } else {
                        failed = true;
                    }
                }
                tryConnect();
            });

            waitsFor(function () { return connected || failed; }, "LiveDevelopmentModule.launcherUrl", 10000);

            runs(function () {
                expect(failed).toBe(false);
                expect(InspectorModule.connected()).toBeTruthy();
            });

            runs(function () {
                var promise = InspectorModule.Runtime.evaluate("window.open('', '_self').close()");
                waitsForDone(promise, "Inspector.Runtime.evaluate", 5000);
            });

            waitsFor(function () { return !InspectorModule.connected(); }, "!InspectorModule.connected()", 10000);
        });
    });

    describe("URL Mapping", function () {

        this.category = "livepreview";

        it("should validate base urls", function () {
            expect(PreferencesDialogs._validateBaseUrl("http://localhost"))
                .toBe("");

            expect(PreferencesDialogs._validateBaseUrl("https://localhost:8080/sub%20folder"))
                .toBe("");

            expect(PreferencesDialogs._validateBaseUrl("ftp://localhost"))
                .toBe(StringUtils.format(Strings.BASEURL_ERROR_INVALID_PROTOCOL, "ftp:"));

            expect(PreferencesDialogs._validateBaseUrl("localhost"))
                .toBe(StringUtils.format(Strings.BASEURL_ERROR_INVALID_PROTOCOL, ""));

            expect(PreferencesDialogs._validateBaseUrl("http://localhost/?id=123"))
                .toBe(StringUtils.format(Strings.BASEURL_ERROR_SEARCH_DISALLOWED, "?id=123"));

            expect(PreferencesDialogs._validateBaseUrl("http://localhost/#anchor1"))
                .toBe(StringUtils.format(Strings.BASEURL_ERROR_HASH_DISALLOWED, "#anchor1"));

            expect(PreferencesDialogs._validateBaseUrl("http://localhost/abc<123"))
                .toBe(StringUtils.format(Strings.BASEURL_ERROR_INVALID_CHAR, "<"));

            expect(PreferencesDialogs._validateBaseUrl("http://localhost/?"))
                .toBe(StringUtils.format(Strings.BASEURL_ERROR_INVALID_CHAR, "?"));

            expect(PreferencesDialogs._validateBaseUrl("http://localhost/sub dir"))
                .toBe(StringUtils.format(Strings.BASEURL_ERROR_INVALID_CHAR, " "));
        });
    });

    describe("HighlightAgent", function () {

        this.category = "livepreview";

        describe("Highlighting elements in browser from a CSS rule", function () {

            var testDocument,
                testEditor,
                testCSSDoc,
                liveDevelopmentConfig,
                inspectorConfig;

            beforeEach(function () {
                // save original configs
                liveDevelopmentConfig = LiveDevelopmentModule.config;
                inspectorConfig = InspectorModule.config;

                // force init
                LiveDevelopmentModule.config = InspectorModule.config = {highlight: true};
                HighlightAgentModule.load();

                // module spies
                spyOn(CSSAgentModule, "styleForURL").andReturn([]);
                spyOn(CSSAgentModule, "reloadCSSForDocument").andCallFake(function () { return new $.Deferred().resolve(); });
                spyOn(HighlightAgentModule, "redraw").andCallFake(function () {});
                spyOn(HighlightAgentModule, "rule").andCallFake(function () {});
                InspectorModule.CSS = {
                    getStyleSheet   : jasmine.createSpy("getStyleSheet")
                };
                spyOn(LiveDevelopmentModule, "showHighlight").andCallFake(function () {});
                spyOn(LiveDevelopmentModule, "hideHighlight").andCallFake(function () {});

                // document spies
                var mock = SpecRunnerUtils.createMockEditor("p {}\n\ndiv {}", "css");
                testDocument = mock.doc;
                testEditor = mock.editor;
                testCSSDoc = new CSSDocumentModule(testDocument, testEditor);

            });

            afterEach(function () {
                LiveDevelopmentModule.config = liveDevelopmentConfig;
                InspectorModule.config = inspectorConfig;

                SpecRunnerUtils.destroyMockEditor(testDocument);
                testDocument = null;
                testEditor = null;
                testCSSDoc = null;
            });

            it("should toggle the highlight via a command", function () {
                var cmd = CommandsManagerModule.get(CommandsModule.FILE_LIVE_HIGHLIGHT);
                cmd.setEnabled(true);

                // Run our tests in order depending on whether highlighting is on or off
                // presently. By setting the order like this, we'll also leave highlighting
                // in the state we found it in.
                if (cmd.getChecked()) {
                    CommandsManagerModule.execute(CommandsModule.FILE_LIVE_HIGHLIGHT);
                    expect(LiveDevelopmentModule.hideHighlight).toHaveBeenCalled();

                    CommandsManagerModule.execute(CommandsModule.FILE_LIVE_HIGHLIGHT);
                    expect(LiveDevelopmentModule.showHighlight).toHaveBeenCalled();
                } else {
                    CommandsManagerModule.execute(CommandsModule.FILE_LIVE_HIGHLIGHT);
                    expect(LiveDevelopmentModule.showHighlight).toHaveBeenCalled();

                    CommandsManagerModule.execute(CommandsModule.FILE_LIVE_HIGHLIGHT);
                    expect(LiveDevelopmentModule.hideHighlight).toHaveBeenCalled();
                }
            });

            it("should redraw highlights when the document changes", function () {
                testDocument.setText("body {}");
                expect(HighlightAgentModule.redraw).toHaveBeenCalled();
            });

            it("should redraw highlights when the cursor moves", function () {
                testEditor.setCursorPos(0, 3);
                expect(HighlightAgentModule.rule).toHaveBeenCalled();
                expect(HighlightAgentModule.rule.mostRecentCall.args[0]).toEqual("p");

                testEditor.setCursorPos(2, 0);
                expect(HighlightAgentModule.rule.calls.length).toEqual(3);
                expect(HighlightAgentModule.rule.mostRecentCall.args[0]).toEqual("div");
            });
        });

        describe("Highlighting elements in browser from a rule in scss", function () {

            var testDocument,
                testEditor,
                testCSSDoc,
                liveDevelopmentConfig,
                inspectorConfig,
                fileContent = "div[role='main'] {\n" +
                              "  @include background-image(linear-gradient(lighten($color1, 30%), lighten($color2, 30%)));\n" +
                              "  ul {\n    padding-top:14px;\n" +  // line 2 and 3
                              "    li {\n" +
                              "      a { }\n" +
                              "      @media (max-width: 480px) {\n" +
                              "        a {\n" +
                              "          &:hover { }\n" +
                              "          width: auto;\n" +
                              "        }\n" +
                              "      }\n" +
                              "    }\n" +
                              "  }\n" +
                              "}\n";

            beforeEach(function () {
                // save original configs
                liveDevelopmentConfig = LiveDevelopmentModule.config;
                inspectorConfig = InspectorModule.config;

                // force init
                LiveDevelopmentModule.config = InspectorModule.config = {highlight: true};
                HighlightAgentModule.load();

                // module spies
                spyOn(CSSAgentModule, "styleForURL").andReturn([]);
                spyOn(CSSAgentModule, "reloadCSSForDocument").andCallFake(function () { return new $.Deferred().resolve(); });
                spyOn(HighlightAgentModule, "redraw").andCallFake(function () {});
                spyOn(HighlightAgentModule, "rule").andCallFake(function () {});
                spyOn(LiveDevelopmentModule, "showHighlight").andCallFake(function () {});
                spyOn(LiveDevelopmentModule, "hideHighlight").andCallFake(function () {});

                var mock = SpecRunnerUtils.createMockEditor(fileContent, "scss");
                testDocument = mock.doc;
                testEditor = mock.editor;
                testCSSDoc = new CSSPreprocessorDocumentModule(testDocument, testEditor);
            });

            afterEach(function () {
                LiveDevelopmentModule.config = liveDevelopmentConfig;
                InspectorModule.config = inspectorConfig;

                SpecRunnerUtils.destroyMockEditor(testDocument);
                testDocument = null;
                testEditor = null;
                testCSSDoc = null;
            });

            it("should toggle the highlight via a command", function () {
                var cmd = CommandsManagerModule.get(CommandsModule.FILE_LIVE_HIGHLIGHT);
                cmd.setEnabled(true);

                // Run our tests in order depending on whether highlighting is on or off
                // presently. By setting the order like this, we'll also leave highlighting
                // in the state we found it in.
                if (cmd.getChecked()) {
                    CommandsManagerModule.execute(CommandsModule.FILE_LIVE_HIGHLIGHT);
                    expect(LiveDevelopmentModule.hideHighlight).toHaveBeenCalled();

                    CommandsManagerModule.execute(CommandsModule.FILE_LIVE_HIGHLIGHT);
                    expect(LiveDevelopmentModule.showHighlight).toHaveBeenCalled();
                } else {
                    CommandsManagerModule.execute(CommandsModule.FILE_LIVE_HIGHLIGHT);
                    expect(LiveDevelopmentModule.showHighlight).toHaveBeenCalled();

                    CommandsManagerModule.execute(CommandsModule.FILE_LIVE_HIGHLIGHT);
                    expect(LiveDevelopmentModule.hideHighlight).toHaveBeenCalled();
                }
            });

            it("should redraw highlights when the cursor moves", function () {
                testEditor.setCursorPos(0, 9);  // after = sign in "div[role='main']" selector
                expect(HighlightAgentModule.rule).toHaveBeenCalled();
                expect(HighlightAgentModule.rule.mostRecentCall.args[0]).toEqual("div[role='main']");

                testEditor.setCursorPos(3, 12); // after - in "padding-top:14px;" on line 3
                expect(HighlightAgentModule.rule.calls.length).toEqual(3);
                expect(HighlightAgentModule.rule.mostRecentCall.args[0]).toEqual("div[role='main'] ul");

                testEditor.setCursorPos(5, 6);  // right before "a" tag selector on line 5
                expect(HighlightAgentModule.rule.calls.length).toEqual(4);
                expect(HighlightAgentModule.rule.mostRecentCall.args[0]).toEqual("div[role='main'] ul li a");

                testEditor.setCursorPos(6, 25); // after "@media (max-width: " on line 6
                expect(HighlightAgentModule.rule.calls.length).toEqual(5);
                expect(HighlightAgentModule.rule.mostRecentCall.args[0]).toEqual("div[role='main'] ul li");

                testEditor.setCursorPos(8, 19); // after "&:hover {" on line 8
                expect(HighlightAgentModule.rule.calls.length).toEqual(6);
                expect(HighlightAgentModule.rule.mostRecentCall.args[0]).toEqual("div[role='main'] ul li a:hover");
            });
        });

        describe("Highlighting elements in browser from a rule in LESS", function () {

            var testDocument,
                testEditor,
                testCSSDoc,
                liveDevelopmentConfig,
                inspectorConfig,
                fileContent = "@navbar-height: 50px;\n" +
                              ".navbar-collapse {\n" +
                              "  &.in {\n \n}\n" +  // line 2, 3 and 4
                              "  @media (min-width: @grid-float-breakpoint) {\n" +
                              "    width: auto;\n" +
                              "    &.collapse { } \n" +
                              "    &.in { } \n" +
                              "  }\n}\n" +                                       // line 9 and 10
                              "@text-color:@gray-dark;\n" +
                              ".container,\n.container-fluid {\n" +             // line 12 and 13
                              "  > .navbar-header,\n  > .navbar-collapse {\n" + // line 14 and 15
                              "    a, img { }\n" +
                              "  }\n" +
                              "}";

            beforeEach(function () {
                // save original configs
                liveDevelopmentConfig = LiveDevelopmentModule.config;
                inspectorConfig = InspectorModule.config;

                // force init
                LiveDevelopmentModule.config = InspectorModule.config = {highlight: true};
                HighlightAgentModule.load();

                // module spies
                spyOn(CSSAgentModule, "styleForURL").andReturn([]);
                spyOn(CSSAgentModule, "reloadCSSForDocument").andCallFake(function () { return new $.Deferred().resolve(); });
                spyOn(HighlightAgentModule, "redraw").andCallFake(function () {});
                spyOn(HighlightAgentModule, "rule").andCallFake(function () {});
                spyOn(LiveDevelopmentModule, "showHighlight").andCallFake(function () {});
                spyOn(LiveDevelopmentModule, "hideHighlight").andCallFake(function () {});

                // TODO: Due to https://github.com/adobe/brackets/issues/8837, we are
                // using "scss" as language id instead of "less".
                var mock = SpecRunnerUtils.createMockEditor(fileContent, "scss");
                testDocument = mock.doc;
                testEditor = mock.editor;
                testCSSDoc = new CSSPreprocessorDocumentModule(testDocument, testEditor);
            });

            afterEach(function () {
                LiveDevelopmentModule.config = liveDevelopmentConfig;
                InspectorModule.config = inspectorConfig;

                SpecRunnerUtils.destroyMockEditor(testDocument);
                testDocument = null;
                testEditor = null;
                testCSSDoc = null;
            });

            it("should toggle the highlight via a command", function () {
                var cmd = CommandsManagerModule.get(CommandsModule.FILE_LIVE_HIGHLIGHT);
                cmd.setEnabled(true);

                // Run our tests in order depending on whether highlighting is on or off
                // presently. By setting the order like this, we'll also leave highlighting
                // in the state we found it in.
                if (cmd.getChecked()) {
                    CommandsManagerModule.execute(CommandsModule.FILE_LIVE_HIGHLIGHT);
                    expect(LiveDevelopmentModule.hideHighlight).toHaveBeenCalled();

                    CommandsManagerModule.execute(CommandsModule.FILE_LIVE_HIGHLIGHT);
                    expect(LiveDevelopmentModule.showHighlight).toHaveBeenCalled();
                } else {
                    CommandsManagerModule.execute(CommandsModule.FILE_LIVE_HIGHLIGHT);
                    expect(LiveDevelopmentModule.showHighlight).toHaveBeenCalled();

                    CommandsManagerModule.execute(CommandsModule.FILE_LIVE_HIGHLIGHT);
                    expect(LiveDevelopmentModule.hideHighlight).toHaveBeenCalled();
                }
            });

            it("should not update any highlights when the cursor is in a LESS variable definition", function () {
                testEditor.setCursorPos(0, 3);
                expect(HighlightAgentModule.rule.calls.length).toEqual(0);

                testEditor.setCursorPos(11, 10);
                expect(HighlightAgentModule.rule.calls.length).toEqual(0);
            });

            it("should redraw highlights when the cursor moves", function () {
                testEditor.setCursorPos(1, 0);  // before .navbar-collapse on line 1
                expect(HighlightAgentModule.rule).toHaveBeenCalled();
                expect(HighlightAgentModule.rule.mostRecentCall.args[0]).toEqual(".navbar-collapse");

                testEditor.setCursorPos(4, 0);  // before } of &.in rule that starts on line 2
                expect(HighlightAgentModule.rule.calls.length).toEqual(2);
                expect(HighlightAgentModule.rule.mostRecentCall.args[0]).toEqual(".navbar-collapse.in");

                testEditor.setCursorPos(7, 15);  // before { of &.collapse rule on line 7
                expect(HighlightAgentModule.rule.calls.length).toEqual(3);
                expect(HighlightAgentModule.rule.mostRecentCall.args[0]).toEqual(".navbar-collapse.collapse");

                testEditor.setCursorPos(8, 5);  // after & of &.in rule on line 8
                expect(HighlightAgentModule.rule.calls.length).toEqual(4);
                expect(HighlightAgentModule.rule.mostRecentCall.args[0]).toEqual(".navbar-collapse.in");
            });

            it("should redraw highlights on elements that have nested rules with group selectors", function () {
                testEditor.setCursorPos(12, 11);  // at the end of line 12 (ie. after .container,)
                expect(HighlightAgentModule.rule).toHaveBeenCalled();
                expect(HighlightAgentModule.rule.mostRecentCall.args[0]).toEqual(".container, .container-fluid");

                testEditor.setCursorPos(14, 22);  // after "> .navbar-header,\n  >" on line 14
                expect(HighlightAgentModule.rule.calls.length).toEqual(2);
                expect(HighlightAgentModule.rule.mostRecentCall.args[0]).toEqual(".container > .navbar-header, .container-fluid > .navbar-header, .container > .navbar-collapse, .container-fluid > .navbar-collapse");

                testEditor.setCursorPos(16, 7);  // right before img tag in "a, img { }" on line 16
                expect(HighlightAgentModule.rule.calls.length).toEqual(3);
                expect(HighlightAgentModule.rule.mostRecentCall.args[0]).toEqual(".container > .navbar-header a, .container-fluid > .navbar-header a, .container > .navbar-collapse a, .container-fluid > .navbar-collapse a, .container > .navbar-header img, .container-fluid > .navbar-header img, .container > .navbar-collapse img, .container-fluid > .navbar-collapse img");
            });
        });

        describe("Highlighting elements in browser from cursor positions in HTML page", function () {

            var testDocument,
                testEditor,
                testHTMLDoc,
                liveDevelopmentConfig,
                inspectorConfig,
                fileContent = null,
                instrumentedHtml = "",
                elementIds = {},
                testPath = SpecRunnerUtils.getTestPath("/spec/HTMLInstrumentation-test-files"),
                WellFormedFileEntry = FileSystem.getFileForPath(testPath + "/wellformed.html");

            function init(fileEntry) {
                if (fileEntry) {
                    runs(function () {
                        FileUtils.readAsText(fileEntry)
                            .done(function (text) {
                                fileContent = text;
                            });
                    });

                    waitsFor(function () { return (fileContent !== null); }, "Load fileContent", 1000);
                }
            }

            function createIdToTagMap(html) {
                var elementIdRegEx = /<(\w+?)\s+(?:[^<]*?\s)*?data-brackets-id='(\S+?)'/gi,
                    match,
                    tagID,
                    tagName;

                elementIds = {};
                do {
                    match = elementIdRegEx.exec(html);
                    if (match) {
                        tagID = match[2];
                        tagName = match[1];

                        // Verify that the newly found ID is unique.
                        expect(elementIds[tagID]).toBeUndefined();

                        elementIds[tagID] = tagName.toLowerCase();
                    }
                } while (match);
            }

            function verifyTagWithId(line, ch, tag) {
                testEditor.setCursorPos(line, ch);
                var id = HighlightAgentModule.domElement.mostRecentCall.args[0];
                expect(elementIds[id]).toEqual(tag);
            }

            beforeEach(function () {
                if (!fileContent) {
                    init(WellFormedFileEntry);
                }

                runs(function () {
                    // save original configs
                    liveDevelopmentConfig = LiveDevelopmentModule.config;
                    inspectorConfig = InspectorModule.config;

                    // force init
                    LiveDevelopmentModule.config = InspectorModule.config = {highlight: true};
                    HighlightAgentModule.load();

                    // module spies -- used to mock actual API calls so that we can test those
                    // APIs without having to actually launch the browser.
                    spyOn(HighlightAgentModule, "hide").andCallFake(function () {});
                    spyOn(HighlightAgentModule, "domElement").andCallFake(function () {});

                    var mock = SpecRunnerUtils.createMockEditor(fileContent, "html");
                    testDocument = mock.doc;
                    testEditor = mock.editor;

                    instrumentedHtml = HTMLInstrumentationModule.generateInstrumentedHTML(testEditor);
                    createIdToTagMap(instrumentedHtml);
                    testHTMLDoc = new HTMLDocumentModule(testDocument, testEditor);
                    testHTMLDoc.setInstrumentationEnabled(true);
                });
            });

            afterEach(function () {
                LiveDevelopmentModule.config = liveDevelopmentConfig;
                InspectorModule.config = inspectorConfig;

                SpecRunnerUtils.destroyMockEditor(testDocument);
                testDocument = null;
                testEditor = null;
                testHTMLDoc = null;
                instrumentedHtml = "";
                elementIds = {};
            });

            it("should highlight the image for cursor positions inside img tag.", function () {
                verifyTagWithId(37, 4, "img");  // before <img
                verifyTagWithId(37, 95, "img"); // after />
                verifyTagWithId(37, 65, "img"); // inside src attribute value

            });

            it("should highlight the parent link element for cursor positions between 'img' and its parent 'a' tag.", function () {
                verifyTagWithId(37, 1, "a");  // before "   <img"
                verifyTagWithId(38, 0, "a");  // before </a>
            });

            it("No highlight when the cursor position is outside of the 'html' tag", function () {
                var count = HighlightAgentModule.hide.callCount;

                testEditor.setCursorPos(0, 5);  // inside 'doctype' tag
                expect(HighlightAgentModule.hide).toHaveBeenCalled();
                expect(HighlightAgentModule.hide.callCount).toBe(count + 1);
                expect(HighlightAgentModule.domElement).not.toHaveBeenCalled();

                testEditor.setCursorPos(147, 5);  // after </html>
                expect(HighlightAgentModule.hide.callCount).toBe(count + 2);
                expect(HighlightAgentModule.domElement).not.toHaveBeenCalled();
            });

            it("Should highlight the entire body for all cursor positions inside an html comment", function () {
                verifyTagWithId(15, 1, "body");  // cursor between < and ! in the comment start
                verifyTagWithId(16, 15, "body");
                verifyTagWithId(17, 3, "body");  // cursor after -->
            });

            it("should highlight 'meta/link' tag for cursor positions in meta/link tags, not 'head' tag", function () {
                verifyTagWithId(5, 60, "meta");
                verifyTagWithId(8, 12, "link");
            });

            it("Should highlight 'title' tag at cursor positions (either in the content or begin/end tag)", function () {
                verifyTagWithId(6, 11, "title");  // inside the begin tag
                verifyTagWithId(6, 30, "title");  // in the content
                verifyTagWithId(6, 50, "title");  // inside the end tag
            });

            it("Should get 'h2' tag at cursor positions (either in the content or begin or end tag)", function () {
                verifyTagWithId(13, 1, "h2");  // inside the begin tag
                verifyTagWithId(13, 20, "h2"); // in the content
                verifyTagWithId(13, 27, "h2"); // inside the end tag
            });
        });

    });

    describe("Live Development", function () {

        this.category = "livepreview";

        beforeFirst(function () {
            SpecRunnerUtils.createTempDirectory();

            SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                testWindow           = w;
                Dialogs              = testWindow.brackets.test.Dialogs;
                LiveDevelopment      = testWindow.brackets.test.LiveDevelopment;
                Inspector            = testWindow.brackets.test.Inspector;
                DOMAgent             = testWindow.brackets.test.DOMAgent;
                DocumentManager      = testWindow.brackets.test.DocumentManager;
                CommandManager       = testWindow.brackets.test.CommandManager;
                Commands             = testWindow.brackets.test.Commands;
                NativeApp            = testWindow.brackets.test.NativeApp;
                ProjectManager       = testWindow.brackets.test.ProjectManager;
            });
        });

        afterLast(function () {
            runs(function () {
                testWindow           = null;
                Dialogs              = null;
                LiveDevelopment      = null;
                Inspector            = null;
                DOMAgent             = null;
                DocumentManager      = null;
                CommandManager       = null;
                Commands             = null;
                NativeApp            = null;
                ProjectManager       = null;
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

        describe("CSS Editing", function () {

            it("should establish a browser connection for an opened html file", function () {
                //open a file
                runs(function () {
                    waitsForDone(SpecRunnerUtils.openProjectFiles(["simple1.html"]), "SpecRunnerUtils.openProjectFiles simple1.html", 1000);
                });

                openLiveDevelopmentAndWait();

                runs(function () {
                    expect(LiveDevelopment.status).toBe(LiveDevelopment.STATUS_ACTIVE);

                    var doc = DocumentManager.getOpenDocumentForPath(tempDir + "/simple1.html");
                    expect(isOpenInBrowser(doc, LiveDevelopment.agents)).toBeTruthy();
                });
            });

            it("should establish a browser connection for an opened xhtml file", function () {
                //open a file
                runs(function () {
                    waitsForDone(SpecRunnerUtils.openProjectFiles(["test.xhtml"]), "SpecRunnerUtils.openProjectFiles test.xhtml", 1000);
                });

                openLiveDevelopmentAndWait();

                runs(function () {
                    expect(LiveDevelopment.status).toBe(LiveDevelopment.STATUS_ACTIVE);

                    var doc = DocumentManager.getOpenDocumentForPath(tempDir + "/test.xhtml");
                    expect(isOpenInBrowser(doc, LiveDevelopment.agents)).toBeTruthy();
                });
            });

            it("should should not start a browser connection for an opened css file", function () {
                //open a file
                runs(function () {
                    waitsForDone(SpecRunnerUtils.openProjectFiles(["simple1.css"]), "SpecRunnerUtils.openProjectFiles simple1.css", 1000);
                });

                //start live dev
                runs(function () {
                    waitsForFail(LiveDevelopment.open(), "LiveDevelopment.open()", 10000);
                });

                runs(function () {
                    // close the error dialog
                    Dialogs.cancelModalDialogIfOpen(DefaultDialogs.DIALOG_ID_ERROR);

                    expect(LiveDevelopment.status).toBe(LiveDevelopment.STATUS_INACTIVE);

                    var doc = DocumentManager.getOpenDocumentForPath(tempDir + "/simple1.css");
                    expect(isOpenInBrowser(doc, LiveDevelopment.agents)).toBeFalsy();
                });
            });

            it("should push changes through the browser connection", function () {
                doOneTest("simple1.html", "simple1.css");
            });

            it("should ignore query strings in linked CSS file hrefs", function () {
                doOneTest("simple1Query.html", "simple1.css");
            });

            it("should push changes after loading an iframe", function () {
                doOneTest("simple1iframe.html", "simple1.css");
            });

            it("should push in memory css changes made before the session starts", function () {
                var localText,
                    browserText;

                runs(function () {
                    waitsForDone(SpecRunnerUtils.openProjectFiles(["simple1.css"]), "SpecRunnerUtils.openProjectFiles simple1.css", 1000);
                });

                runs(function () {
                    var curDoc =  DocumentManager.getCurrentDocument();
                    localText = curDoc.getText();
                    localText += "\n .testClass { background-color:#090; }\n";
                    curDoc.setText(localText);

                    // Document should not be marked dirty
                    expect(LiveDevelopment.status).not.toBe(LiveDevelopment.STATUS_OUT_OF_SYNC);
                });

                runs(function () {
                    waitsForDone(SpecRunnerUtils.openProjectFiles(["simple1.html"]), "SpecRunnerUtils.openProjectFiles simple1.html", 1000);
                });

                openLiveDevelopmentAndWait();

                var liveDoc, doneSyncing = false;
                waitForLiveDoc(tempDir + "/simple1.css", function (doc) { liveDoc = doc; });

                runs(function () {
                    liveDoc.getSourceFromBrowser().done(function (text) {
                        browserText = text;
                    }).always(function () {
                        doneSyncing = true;
                    });
                });
                waitsFor(function () { return doneSyncing; }, "Browser to sync changes", 10000);

                runs(function () {
                    expect(fixSpaces(browserText)).toBe(fixSpaces(localText));
                });
            });

            it("should reapply in-memory css changes after saving changes in html document", function () {
                var localCssText,
                    browserCssText,
                    origHtmlText,
                    updatedHtmlText,
                    htmlDoc,
                    loadEventPromise;

                runs(function () {
                    spyOn(Inspector.Page, "reload").andCallThrough();
                    enableAgent(LiveDevelopment, "dom");

                    waitsForDone(SpecRunnerUtils.openProjectFiles(["simple1.css"]), "SpecRunnerUtils.openProjectFiles simple1.css", 1000);
                });

                runs(function () {
                    var curDoc =  DocumentManager.getCurrentDocument();
                    localCssText = curDoc.getText();
                    localCssText += "\n .testClass { background-color:#090; }\n";
                    curDoc.setText(localCssText);

                    // Document should not be marked dirty
                    expect(LiveDevelopment.status).not.toBe(LiveDevelopment.STATUS_OUT_OF_SYNC);
                });

                runs(function () {
                    waitsForDone(SpecRunnerUtils.openProjectFiles(["simple1.html"]), "SpecRunnerUtils.openProjectFiles simple1.html", 1000);
                });

                // Modify some text in test file before starting live dev
                runs(function () {
                    htmlDoc =  DocumentManager.getCurrentDocument();
                    origHtmlText = htmlDoc.getText();
                    updatedHtmlText = origHtmlText.replace("Brackets is", "Live Preview in Brackets is");
                    htmlDoc.setText(updatedHtmlText);
                });

                openLiveDevelopmentAndWait();

                waitsFor(function () {
                    return (LiveDevelopment.status === LiveDevelopment.STATUS_OUT_OF_SYNC ||
                            LiveDevelopment.status === LiveDevelopment.STATUS_ACTIVE) &&
                            (DOMAgent.root);
                }, "LiveDevelopment STATUS_OUT_OF_SYNC or STATUS_ACTIVE and DOMAgent.root", 10000);

                // Grab the node that we've just modified in Brackets.
                // Verify that we get the modified text in memory and not the original text on disk.
                var originalNode;
                runs(function () {
                    originalNode = DOMAgent.nodeAtLocation(501);
                    expect(originalNode.value).toBe("Live Preview in Brackets is awesome!");

                    loadEventPromise = saveAndWaitForLoadEvent(htmlDoc);
                });

                runs(function () {
                    // Browser should not reload for live HTML docs
                    waitsForFail(loadEventPromise, "loadEventFired", 3000);
                });

                // Grab the node that we've modified in Brackets.
                var liveDoc, updatedNode, doneSyncing = false;
                waitForLiveDoc(tempDir + "/simple1.css", function (doc) { liveDoc = doc; });

                runs(function () {
                    // Inpsector.Page.reload should not be called when saving an HTML file
                    expect(Inspector.Page.reload).not.toHaveBeenCalled();
                    updatedNode = DOMAgent.nodeAtLocation(501);

                    liveDoc.getSourceFromBrowser().done(function (text) {
                        browserCssText = text;
                        doneSyncing = true;
                    });
                });
                waitsFor(function () { return doneSyncing; }, "Browser to sync changes", 10000);

                runs(function () {
                    expect(fixSpaces(browserCssText)).toBe(fixSpaces(localCssText));

                    // Verify that we still have modified text
                    expect(updatedNode.value).toBe("Live Preview in Brackets is awesome!");
                });
            });

            it("should push changes to the iframes' css file", function () {
                doOneTest("simple1iframe.html", "iframe.css");
            });
        });

        describe("HTML Editing", function () {

            function _openSimpleHTML() {
                runs(function () {
                    waitsForDone(SpecRunnerUtils.openProjectFiles(["simple1.html"]), "SpecRunnerUtils.openProjectFiles simple1.html", 1000);
                });

                openLiveDevelopmentAndWait();
            }

            function _setTextAndCheckStatus(doc, op, expectedStatus, errorLineNum) {
                var spy = jasmine.createSpy();

                runs(function () {
                    // Install statusChange callback
                    LiveDevelopment.one("statusChange", spy);
                    op.call();
                });

                waitsFor(function () { return spy.callCount > 0; }, "statusChange callback", 2000);

                runs(function () {
                    // Verify expected status
                    expect(spy.argsForCall[0][1]).toEqual(expectedStatus);

                    // Check for gutter style
                    var syncErrorDOM    = testWindow.$(".live-preview-sync-error"),
                        lineNumStr      = $(syncErrorDOM).find(".CodeMirror-linenumber").text(),
                        lineNum         = (typeof lineNumStr === "string") ? parseInt(lineNumStr, 10) : -1;

                    if (expectedStatus === LiveDevelopmentModule.STATUS_SYNC_ERROR) {
                        expect(syncErrorDOM.length).toEqual(1);
                        expect(lineNum).toEqual(errorLineNum);
                    } else {
                        expect(syncErrorDOM.length).toEqual(0);
                    }
                });
            }

            xit("should report STATUS_SYNC_ERROR when HTML syntax is invalid", function () {
                var doc;

                _openSimpleHTML();

                runs(function () {
                    // Create syntax errors
                    doc =  DocumentManager.getCurrentDocument();
                    _setTextAndCheckStatus(doc, function () {
                        doc.replaceRange("<", { line: 10, ch: 2});
                    }, LiveDevelopmentModule.STATUS_SYNC_ERROR, 11);
                });

                runs(function () {
                    // Undo syntax errors
                    _setTextAndCheckStatus(doc, function () {
                        testWindow.executeCommand(Commands.EDIT_UNDO);
                    }, LiveDevelopmentModule.STATUS_ACTIVE);
                });
            });

            it("should send edits to the live browser", function () {
                var doc;

                _openSimpleHTML();

                runs(function () {
                    // Spy on RemoteAgent
                    spyOn(testWindow.brackets.test.RemoteAgent, "call").andCallThrough();

                    // Edit text
                    doc =  DocumentManager.getCurrentDocument();
                    doc.replaceRange("Live Preview in ", {line: 11, ch: 33});

                    // Document should not be marked dirty
                    expect(LiveDevelopment.status).not.toBe(LiveDevelopment.STATUS_OUT_OF_SYNC);
                });

                runs(function () {
                    var spy = testWindow.brackets.test.RemoteAgent.call,
                        args = spy.callCount ? spy.argsForCall[0] : [],
                        edit = args[1] && args[1][0];

                    expect(spy.callCount).toBe(1);
                    expect(args[0]).toEqual("applyDOMEdits");
                    expect(edit.type).toEqual("textReplace");
                    expect(edit.content).toEqual("Live Preview in Brackets is awesome!");
                });
            });

            it("should not reparse page on save (#5279)", function () {
                var doc, saveDeferred = new $.Deferred();

                _openSimpleHTML();

                runs(function () {
                    // Make an edit.
                    doc = DocumentManager.getCurrentDocument();
                    doc.replaceRange("Live Preview in ", {line: 11, ch: 33});

                    // Document should not be marked dirty
                    expect(LiveDevelopment.status).not.toBe(LiveDevelopment.STATUS_OUT_OF_SYNC);

                    // Save the document and see if "scanDocument" (which reparses the page) is called.
                    spyOn(testWindow.brackets.test.HTMLInstrumentation, "scanDocument").andCallThrough();
                    DocumentManager.one("documentSaved", function (e, savedDoc) {
                        expect(savedDoc === doc);
                        saveDeferred.resolve();
                    });
                    CommandManager.execute(Commands.FILE_SAVE, { doc: doc });
                    waitsForDone(saveDeferred.promise(), "file finished saving");
                });

                runs(function () {
                    expect(testWindow.brackets.test.HTMLInstrumentation.scanDocument.callCount).toBe(0);
                });
            });

        });


        describe("JS Editing", function () {

            it("should reload the page when editing a non-live document", function () {
                var promise,
                    jsdoc,
                    loadEventPromise;

                runs(function () {
                    // Setup reload spy
                    spyOn(Inspector.Page, "reload").andCallThrough();

                    promise = SpecRunnerUtils.openProjectFiles(["simple1.html"]);
                    waitsForDone(promise, "SpecRunnerUtils.openProjectFiles simple1.html", 1000);
                });

                openLiveDevelopmentAndWait();

                runs(function () {
                    promise = SpecRunnerUtils.openProjectFiles(["simple1.js"]);
                    promise.done(function (openDocs) {
                        jsdoc = openDocs["simple1.js"];
                    });

                    waitsForDone(promise, "SpecRunnerUtils.openProjectFiles simple1.js", 1000);
                });

                runs(function () {
                    // Edit a JavaScript doc
                    jsdoc.setText("window.onload = function () {document.getElementById('testId').style.backgroundColor = '#090'}");

                    // Make sure the live development dirty dot shows
                    expect(LiveDevelopment.status).toBe(LiveDevelopment.STATUS_OUT_OF_SYNC);

                    // Save changes to the test file
                    loadEventPromise = saveAndWaitForLoadEvent(jsdoc);
                });

                runs(function () {
                    // Browser should reload when saving non-live files like JavaScript
                    waitsForDone(loadEventPromise, "loadEventFired", 3000);
                });

                runs(function () {
                    expect(Inspector.Page.reload.callCount).toEqual(1);

                    // Edit the file again
                    jsdoc.setText("window.onload = function () {document.body.style.backgroundColor = '#090'}");

                    // Save changes to the test file...again
                    loadEventPromise = saveAndWaitForLoadEvent(jsdoc);
                });

                runs(function () {
                    // Browser should reload again
                    waitsForDone(loadEventPromise, "loadEventFired", 3000);
                });

                runs(function () {
                    expect(Inspector.Page.reload.callCount).toEqual(2);
                });
            });

        });
    });

    describe("Servers", function () {

        this.category = "livepreview";

        // Define testing parameters, files do not need to exist on disk
        // File paths used in tests:
        //  * file1 - file inside  project
        //  * file2 - file outside project
        // Encode the URLs
        var projectPath     = testPath + "/",
            outsidePath     = testPath.substr(0, testPath.lastIndexOf("/") + 1),
            fileProtocol    = (brackets.platform === "win") ? "file:///" : "file://",
            fileRelPath     = "/subdir/index.html",
            file1Path       = projectPath + fileRelPath,
            file2Path       = outsidePath + fileRelPath,
            file1FileUrl    = encodeURI(fileProtocol + projectPath + fileRelPath),
            file2FileUrl    = encodeURI(fileProtocol + outsidePath + fileRelPath),
            file1ServerUrl;

        function createPathResolver(root) {
            return function (path) {
                if (path.indexOf(root) === 0) {
                    return path.slice(root.length);
                }

                return path;
            };
        }

        describe("UserServer", function () {

            it("should translate local paths to server paths", function () {
                var config = { baseUrl: "http://localhost/", root: projectPath, pathResolver: createPathResolver(projectPath) },
                    server = new UserServer(config);

                file1ServerUrl  = config.baseUrl + encodeURI(fileRelPath);

                // Should use server url with base url
                expect(server.pathToUrl(file1Path)).toBe(file1ServerUrl);
                expect(server.urlToPath(file1ServerUrl)).toBe(file1Path);

                // File outside project should still use file url
                expect(server.pathToUrl(file2Path)).toBe(null);
                expect(server.urlToPath(file2FileUrl)).toBe(null);
            });

        });

        describe("FileServer", function () {

            it("should translate local paths to file: URLs", function () {
                var config = { baseUrl: "", root: projectPath, pathResolver: createPathResolver(projectPath) },
                    server = new FileServer(config);

                expect(server.pathToUrl(file1Path)).toBe(file1FileUrl);
                expect(server.urlToPath(file1FileUrl)).toBe(file1Path);
                expect(server.pathToUrl(file2Path)).toBe(file2FileUrl);
                expect(server.urlToPath(file2FileUrl)).toBe(file2Path);
            });

        });
    });

    describe("Default HTML Document", function () {

        this.category = "livepreview";

        var brackets,
            LiveDevelopment,
            ProjectManager,
            testWindow;

        beforeFirst(function () {
            runs(function () {
                SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                    testWindow = w;
                    // Load module instances from brackets.test
                    brackets = testWindow.brackets;
                    LiveDevelopment = brackets.test.LiveDevelopment;
                    ProjectManager = brackets.test.ProjectManager;
                });
            });
        });

        afterLast(function () {
            brackets         = null;
            LiveDevelopment  = null;
            ProjectManager   = null;
            testWindow       = null;

            SpecRunnerUtils.closeTestWindow();
        });

        function loadFile(fileToLoadIntoEditor) {
            runs(function () {
                waitsForDone(SpecRunnerUtils.openProjectFiles([fileToLoadIntoEditor]), "SpecRunnerUtils.openProjectFiles " + fileToLoadIntoEditor);
            });
        }

        describe("Find static page for Live Development", function () {

            it("should return the same HTML document like the currently open document", function () {
                var promise,
                    document,
                    indexFile = "sub/sub2/index.html";

                SpecRunnerUtils.loadProjectInTestWindow(testPath + "/static-project-1");

                runs(function () {
                    waitsForDone(SpecRunnerUtils.openProjectFiles([indexFile]), "SpecRunnerUtils.openProjectFiles " + indexFile);
                });

                runs(function () {
                    promise = LiveDevelopment._getInitialDocFromCurrent();

                    promise.done(function (doc) {
                        document = doc;
                    });

                    waitsForDone(promise);
                });

                runs(function () {
                    expect(document.file.fullPath).toBe(testPath + "/static-project-1/" + indexFile);
                });
            });

            it("should find the HTML page in the same directory like the current document", function () {
                var promise,
                    document,
                    cssFile = "sub/sub2/test.css",
                    indexFile = "sub/sub2/index.html";

                SpecRunnerUtils.loadProjectInTestWindow(testPath + "/static-project-1");
                loadFile(cssFile);

                runs(function () {
                    promise = LiveDevelopment._getInitialDocFromCurrent();

                    promise.done(function (doc) {
                        document = doc;
                    });

                    waitsForDone(promise);
                });

                runs(function () {
                    expect(document.file.fullPath).toBe(testPath + "/static-project-1/" + indexFile);
                });
            });

            it("should find the HTML page one directory level up", function () {
                var promise,
                    document;
                var cssFile = "sub/sub2/test.css",
                    indexFile = "sub/index.html";

                SpecRunnerUtils.loadProjectInTestWindow(testPath + "/static-project-2");

                loadFile(cssFile);

                runs(function () {
                    promise = LiveDevelopment._getInitialDocFromCurrent();

                    promise.done(function (doc) {
                        document = doc;
                    });

                    waitsForDone(promise);
                });

                runs(function () {
                    expect(document.file.fullPath).toBe(testPath + "/static-project-2/" + indexFile);
                });
            });

            it("should find the HTML page in the project root directory for the current document", function () {
                var promise,
                    document;
                var cssFile = "sub/sub2/test.css",
                    indexFile = "index.html";

                SpecRunnerUtils.loadProjectInTestWindow(testPath + "/static-project-3");
                loadFile(cssFile);

                runs(function () {
                    promise = LiveDevelopment._getInitialDocFromCurrent();

                    promise.done(function (doc) {
                        document = doc;
                    });

                    waitsForDone(promise);
                });

                runs(function () {
                    expect(document.file.fullPath).toBe(testPath + "/static-project-3/" + indexFile);
                });
            });

            it("should find the closest HTML page in the project tree", function () {
                var promise,
                    document;
                var cssFile = "sub/sub2/test.css",
                    indexFile = "sub/sub2/index.html";

                SpecRunnerUtils.loadProjectInTestWindow(testPath + "/static-project-4");
                loadFile(cssFile);

                runs(function () {
                    promise = LiveDevelopment._getInitialDocFromCurrent();

                    promise.done(function (doc) {
                        document = doc;
                    });

                    waitsForDone(promise);
                });

                runs(function () {
                    expect(document.file.fullPath).toBe(testPath + "/static-project-4/" + indexFile);
                });
            });

            it("should find the HTML page in the same directory", function () {
                var promise,
                    document;
                var cssFile = "sub/test.css",
                    indexFile = "sub/index.html";

                SpecRunnerUtils.loadProjectInTestWindow(testPath + "/static-project-5");
                loadFile(cssFile);

                runs(function () {
                    promise = LiveDevelopment._getInitialDocFromCurrent();

                    promise.done(function (doc) {
                        document = doc;
                    });

                    waitsForDone(promise);
                });

                runs(function () {
                    expect(document.file.fullPath).toBe(testPath + "/static-project-5/" + indexFile);
                });
            });

            it("should not find any HTML page", function () {
                var promise,
                    document;
                var cssFile = "top2/test.css";

                SpecRunnerUtils.loadProjectInTestWindow(testPath + "/static-project-6");
                loadFile(cssFile);

                runs(function () {
                    promise = LiveDevelopment._getInitialDocFromCurrent();

                    promise.done(function (doc) {
                        document = doc;
                    });

                    waitsForDone(promise);
                });

                runs(function () {
                    expect(document).toBe(null);
                });
            });
        });

        describe("Find dynamic page for Live Development", function () {

            it("should return the same index.php document like the currently opened document", function () {
                var promise,
                    document,
                    indexFile = "sub/sub2/index.php";

                SpecRunnerUtils.loadProjectInTestWindow(testPath + "/dynamic-project-1");

                runs(function () {
                    waitsForDone(SpecRunnerUtils.openProjectFiles([indexFile]), "SpecRunnerUtils.openProjectFiles " + indexFile);
                });

                runs(function () {
                    promise = LiveDevelopment._getInitialDocFromCurrent();

                    promise.done(function (doc) {
                        document = doc;
                    });

                    waitsForDone(promise);
                });

                runs(function () {
                    expect(document.file.fullPath).toBe(testPath + "/dynamic-project-1/" + indexFile);
                });
            });

            it("should find the index.php page in the same directory like the current document", function () {
                var promise,
                    document,
                    cssFile = "sub/sub2/test.css",
                    indexFile = "sub/sub2/index.php";

                SpecRunnerUtils.loadProjectInTestWindow(testPath + "/dynamic-project-1");
                loadFile(cssFile);

                runs(function () {
                    ProjectManager.setBaseUrl("http://localhost:1111/");
                    promise = LiveDevelopment._getInitialDocFromCurrent();

                    promise.done(function (doc) {
                        document = doc;
                    });

                    waitsForDone(promise);
                });

                runs(function () {
                    expect(document.file.fullPath).toBe(testPath + "/dynamic-project-1/" + indexFile);
                });
            });

            it("should find the index.php page one directory level up", function () {
                var promise,
                    document,
                    cssFile = "sub/sub2/test.css",
                    indexFile = "sub/index.php";

                SpecRunnerUtils.loadProjectInTestWindow(testPath + "/dynamic-project-2");
                loadFile(cssFile);

                runs(function () {
                    ProjectManager.setBaseUrl("http://localhost:2222/");
                    promise = LiveDevelopment._getInitialDocFromCurrent();

                    promise.done(function (doc) {
                        document = doc;
                    });

                    waitsForDone(promise);
                });

                runs(function () {
                    expect(document.file.fullPath).toBe(testPath + "/dynamic-project-2/" + indexFile);
                });
            });

            it("should find the index.php page in the project root", function () {
                var promise,
                    document,
                    cssFile = "sub/sub2/test.css",
                    indexFile = "index.php";

                SpecRunnerUtils.loadProjectInTestWindow(testPath + "/dynamic-project-3");
                loadFile(cssFile);

                runs(function () {
                    ProjectManager.setBaseUrl("http://localhost:3333/");
                    promise = LiveDevelopment._getInitialDocFromCurrent();

                    promise.done(function (doc) {
                        document = doc;
                    });

                    waitsForDone(promise);
                });

                runs(function () {
                    expect(document.file.fullPath).toBe(testPath + "/dynamic-project-3/" + indexFile);
                });
            });

            it("should find the HTML page in the same directory", function () {
                var promise,
                    document;
                var cssFile = "sub/test.css",
                    indexFile = "sub/index.php";

                SpecRunnerUtils.loadProjectInTestWindow(testPath + "/dynamic-project-5");
                loadFile(cssFile);

                runs(function () {
                    ProjectManager.setBaseUrl("http://localhost:5555/");
                    promise = LiveDevelopment._getInitialDocFromCurrent();

                    promise.done(function (doc) {
                        document = doc;
                    });

                    waitsForDone(promise);
                });

                runs(function () {
                    expect(document.file.fullPath).toBe(testPath + "/dynamic-project-5/" + indexFile);
                });
            });

            it("should not find any HTML page", function () {
                var promise,
                    document;
                var cssFile = "top2/test.css";

                SpecRunnerUtils.loadProjectInTestWindow(testPath + "/dynamic-project-6");
                loadFile(cssFile);

                runs(function () {
                    ProjectManager.setBaseUrl("http://localhost:6666/");
                    promise = LiveDevelopment._getInitialDocFromCurrent();

                    promise.done(function (doc) {
                        document = doc;
                    });

                    waitsForDone(promise);
                });

                runs(function () {
                    expect(document).toBe(null);
                });
            });
        });
    });
});
