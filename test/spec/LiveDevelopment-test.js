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

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global brackets, $, define, describe, it, xit, expect, beforeEach, afterEach, waitsFor, waitsForDone, waitsForFail, runs, spyOn, jasmine, beforeFirst, afterLast */

define(function (require, exports, module) {
    'use strict';

    var SpecRunnerUtils         = require("spec/SpecRunnerUtils"),
        PreferencesDialogs      = require("preferences/PreferencesDialogs"),
        Strings                 = require("strings"),
        StringUtils             = require("utils/StringUtils"),
        NativeFileSystem        = require("file/NativeFileSystem").NativeFileSystem,
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
        LiveDevServerManager,
        Inspector,
        DOMAgent,
        DocumentManager,
        ProjectManager;
    
    // Used as mocks
    require("LiveDevelopment/main");
    var CommandsModule            = require("command/Commands"),
        CommandsManagerModule     = require("command/CommandManager"),
        LiveDevelopmentModule     = require("LiveDevelopment/LiveDevelopment"),
        InspectorModule           = require("LiveDevelopment/Inspector/Inspector"),
        CSSDocumentModule         = require("LiveDevelopment/Documents/CSSDocument"),
        CSSAgentModule            = require("LiveDevelopment/Agents/CSSAgent"),
        HighlightAgentModule      = require("LiveDevelopment/Agents/HighlightAgent"),
        HTMLDocumentModule        = require("LiveDevelopment/Documents/HTMLDocument"),
        HTMLInstrumentationModule = require("language/HTMLInstrumentation"),
        NativeAppModule           = require("utils/NativeApp");
    
    var testPath = SpecRunnerUtils.getTestPath("/spec/LiveDevelopment-test-files"),
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
    
    function doOneTest(htmlFile, cssFile) {
        var localText,
            browserText;
        
        runs(function () {
            waitsForDone(SpecRunnerUtils.openProjectFiles([htmlFile]), "SpecRunnerUtils.openProjectFiles " + htmlFile, 1000);
        });

        openLiveDevelopmentAndWait();
        
        runs(function () {
            waitsForDone(SpecRunnerUtils.openProjectFiles([cssFile]), "SpecRunnerUtils.openProjectFiles " + cssFile, 1000);
        });
        
        runs(function () {
            var curDoc =  DocumentManager.getCurrentDocument();
            localText = curDoc.getText();
            localText += "\n .testClass { color:#090; }\n";
            curDoc.setText(localText);
        });

        var liveDoc;
        waitsFor(function () {
            liveDoc = LiveDevelopment.getLiveDocForPath(testPath + "/" + cssFile);
            return !!liveDoc;
        }, "Waiting for LiveDevelopment document", 10000);
        
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
            
            var doc = DocumentManager.getOpenDocumentForPath(testPath + "/" + htmlFile);
            expect(isOpenInBrowser(doc, LiveDevelopment.agents)).toBeTruthy();
        });
    }

    function enableAgent(liveDevModule, name) {
        liveDevModule.enableAgent(name);
    }
        
    describe("Inspector", function () {
        
        this.category = "integration";

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
            
            waitsFor(function () { return connected || failed; }, 10000);
            
            runs(function () {
                expect(failed).toBe(false);
                expect(InspectorModule.connected()).toBeTruthy();
            });
            
            runs(function () {
                var promise = InspectorModule.Runtime.evaluate("window.open('', '_self').close()");
                waitsForDone(promise, "Inspector.Runtime.evaluate", 5000);
            });
            
            waitsFor(function () { return !InspectorModule.connected(); }, 10000);
        });
    });

    describe("URL Mapping", function () {

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
                spyOn(CSSAgentModule, "styleForURL").andReturn("");
                spyOn(CSSAgentModule, "reloadCSSForDocument").andCallFake(function () {});
                spyOn(HighlightAgentModule, "redraw").andCallFake(function () {});
                spyOn(HighlightAgentModule, "rule").andCallFake(function () {});
                InspectorModule.CSS = {
                    getStyleSheet   : jasmine.createSpy("getStyleSheet")
                };
                spyOn(LiveDevelopmentModule, "showHighlight").andCallFake(function () {});
                spyOn(LiveDevelopmentModule, "hideHighlight").andCallFake(function () {});
                
                // document spies
                var deferred = new $.Deferred();
                spyOn(CSSDocumentModule.prototype, "getStyleSheetFromBrowser").andCallFake(function () {
                    return deferred.promise();
                });
                
                var mock = SpecRunnerUtils.createMockEditor("p {}\n\ndiv {}", "css");
                testDocument = mock.doc;
                testEditor = mock.editor;
                testCSSDoc = new CSSDocumentModule(testDocument, testEditor);
                
                // resolve reloadRules()
                deferred.resolve({rules: [
                    {
                        selectorText    : "p",
                        selectorRange   : {start: 0},
                        style           : {range: {end: 3}}
                    },
                    {
                        selectorText    : "div",
                        selectorRange   : {start: 6},
                        style           : {range: {end: 11}}
                    }
                ]});
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
                WellFormedFileEntry = new NativeFileSystem.FileEntry(testPath + "/wellformed.html");
          
            function init(fileEntry) {
                if (fileEntry) {
                    runs(function () {
                        FileUtils.readAsText(fileEntry)
                            .done(function (text) {
                                fileContent = text;
                            });
                    });
                    
                    waitsFor(function () { return (fileContent !== null); }, 1000);
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
        
        this.category = "integration";

        describe("CSS Editing", function () {

            beforeFirst(function () {
                SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                    testWindow           = w;
                    Dialogs              = testWindow.brackets.test.Dialogs;
                    LiveDevelopment      = testWindow.brackets.test.LiveDevelopment;
                    DOMAgent             = testWindow.brackets.test.DOMAgent;
                    DocumentManager      = testWindow.brackets.test.DocumentManager;
                    CommandManager       = testWindow.brackets.test.CommandManager;
                    Commands             = testWindow.brackets.test.Commands;
                    NativeApp            = testWindow.brackets.test.NativeApp;
                    ProjectManager       = testWindow.brackets.test.ProjectManager;
                });

                SpecRunnerUtils.loadProjectInTestWindow(testPath);
            });

            afterLast(function () {
                runs(function () {
                    testWindow           = null;
                    Dialogs              = null;
                    LiveDevelopment      = null;
                    DOMAgent             = null;
                    DocumentManager      = null;
                    CommandManager       = null;
                    Commands             = null;
                    NativeApp            = null;
                    ProjectManager       = null;
                    SpecRunnerUtils.closeTestWindow();
                });
            });
            
            beforeEach(function () {
                // verify live dev isn't currently active
                runs(function () {
                    expect(LiveDevelopment.status).toBe(LiveDevelopment.STATUS_INACTIVE);
                });
            });
            
            afterEach(function () {
                waitsForDone(LiveDevelopment.close(), "Waiting for browser to become inactive", 10000);
                testWindow.closeAllFiles();
            });
            
            it("should establish a browser connection for an opened html file", function () {
                //open a file
                runs(function () {
                    waitsForDone(SpecRunnerUtils.openProjectFiles(["simple1.html"]), "SpecRunnerUtils.openProjectFiles simple1.html", 1000);
                });

                openLiveDevelopmentAndWait();
 
                runs(function () {
                    expect(LiveDevelopment.status).toBe(LiveDevelopment.STATUS_ACTIVE);
                    
                    var doc = DocumentManager.getOpenDocumentForPath(testPath + "/simple1.html");
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

                    var doc = DocumentManager.getOpenDocumentForPath(testPath + "/simple1.css");
                    expect(isOpenInBrowser(doc, LiveDevelopment.agents)).toBeFalsy();
                });
            });
            
            it("should push changes through the browser connection", function () {
                doOneTest("simple1.html", "simple1.css");
            });
            
            it("should ignore query strings in linked CSS file hrefs", function () {
                doOneTest("simple1Query.html", "simple1.css");
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
                    localText += "\n .testClass { color:#090; }\n";
                    curDoc.setText(localText);
                });
                
                runs(function () {
                    waitsForDone(SpecRunnerUtils.openProjectFiles(["simple1.html"]), "SpecRunnerUtils.openProjectFiles simple1.html", 1000);
                });
                
                openLiveDevelopmentAndWait();
                
                var liveDoc, doneSyncing = false;
                runs(function () {
                    liveDoc = LiveDevelopment.getLiveDocForPath(testPath + "/simple1.css");
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
                    browserHtmlText,
                    htmlDoc;
                
                runs(function () {
                    enableAgent(LiveDevelopment, "dom");

                    waitsForDone(SpecRunnerUtils.openProjectFiles(["simple1.css"]), "SpecRunnerUtils.openProjectFiles simple1.css", 1000);
                });
                
                runs(function () {
                    var curDoc =  DocumentManager.getCurrentDocument();
                    localCssText = curDoc.getText();
                    localCssText += "\n .testClass { color:#090; }\n";
                    curDoc.setText(localCssText);
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
                    originalNode = DOMAgent.nodeAtLocation(396);
                    expect(originalNode.value).toBe("Live Preview in Brackets is awesome!");
                });
                
                // wait for LiveDevelopment to unload and reload agents after saving
                var loadingStatus = false,
                    activeStatus = false,
                    statusChangeHandler = function (event, status) {
                        // waits for loading agents status followed by active status
                        loadingStatus = loadingStatus || status === LiveDevelopment.STATUS_LOADING_AGENTS;
                        activeStatus = activeStatus || (loadingStatus && status === LiveDevelopment.STATUS_ACTIVE);
                    };
                
                runs(function () {
                    testWindow.$(LiveDevelopment).on("statusChange", statusChangeHandler);

                    // Save changes to the test file
                    var promise = CommandManager.execute(Commands.FILE_SAVE, {doc: htmlDoc});
                    waitsForDone(promise, "Saving modified html document");
                });
                
                waitsFor(function () {
                    return loadingStatus && activeStatus;
                }, "LiveDevelopment re-load and re-activate", 10000);
                
                // Grab the node that we've modified in Brackets. 
                var updatedNode, doneSyncing = false;
                runs(function () {
                    testWindow.$(LiveDevelopment).off("statusChange", statusChangeHandler);
                    
                    updatedNode = DOMAgent.nodeAtLocation(396);
                    var liveDoc = LiveDevelopment.getLiveDocForPath(testPath + "/simple1.css");
                    
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
                
                // Save original content back to the file after this test passes/fails
                runs(function () {
                    htmlDoc.setText(origHtmlText);
                    var promise = CommandManager.execute(Commands.FILE_SAVE, {doc: htmlDoc});
                    waitsForDone(promise, "Restoring the original html content");
                });
            });
        });
        
    });

    describe("Servers", function () {
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
});
