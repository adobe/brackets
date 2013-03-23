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

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global $, define, describe, it, xit, expect, beforeEach, afterEach, waitsFor, waitsForDone, waits, runs, spyOn, jasmine */

define(function (require, exports, module) {
    'use strict';

    var SpecRunnerUtils         = require("spec/SpecRunnerUtils"),
        PreferencesDialogs      = require("preferences/PreferencesDialogs"),
        Strings                 = require("strings"),
        StringUtils             = require("utils/StringUtils");

    // The following are all loaded from the test window
    var CommandManager,
        Commands,
        NativeApp,
        LiveDevelopment,
        LiveDevServerManager,
        Inspector,
        DOMAgent,
        DocumentManager,
        ProjectManager;
    
    // Used as mocks
    require("LiveDevelopment/main");
    var CommandsModule          = require("command/Commands"),
        CommandsManagerModule   = require("command/CommandManager"),
        LiveDevelopmentModule   = require("LiveDevelopment/LiveDevelopment"),
        InspectorModule         = require("LiveDevelopment/Inspector/Inspector"),
        CSSDocumentModule       = require("LiveDevelopment/Documents/CSSDocument"),
        CSSAgentModule          = require("LiveDevelopment/Agents/CSSAgent"),
        HighlightAgentModule    = require("LiveDevelopment/Agents/HighlightAgent");
    
    var testPath = SpecRunnerUtils.getTestPath("/spec/LiveDevelopment-test-files"),
        testWindow,
        allSpacesRE = /\s+/gi;
    
    function fixSpaces(str) {
        return str.replace(allSpacesRE, " ");
    }
    
    function isOpenInBrowser(doc, agents) {
        return (doc && doc.url && agents && agents.network && agents.network.wasURLRequested(doc.url));
    }
    
    function doOneTest(htmlFile, cssFile) {
        var localText,
            browserText;
        
        //verify live dev isn't currently active
        expect(LiveDevelopment.status).toBe(LiveDevelopment.STATUS_INACTIVE);
        
        runs(function () {
            waitsForDone(SpecRunnerUtils.openProjectFiles([htmlFile]), "SpecRunnerUtils.openProjectFiles");
        });
        
        //start live dev
        runs(function () {
            LiveDevelopment.open();
        });
        
        // Wait for the file and its stylesheets to fully load (and be communicated back).
        waitsFor(function () {
            return (LiveDevelopment.status === LiveDevelopment.STATUS_ACTIVE);
        }, "Waiting for browser to become active", 10000);
        
        runs(function () {
            waitsForDone(SpecRunnerUtils.openProjectFiles([cssFile]), "SpecRunnerUtils.openProjectFiles");
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

    describe("Live Development", function () {
        
        this.category = "integration";
        
        describe("Live Development startup and shutdown", function () {
            beforeEach(function () {
                runs(function () {
                    SpecRunnerUtils.createTestWindowAndRun(this, function (testWindow) {
                        LiveDevelopment      = testWindow.brackets.test.LiveDevelopment;
                        Inspector            = testWindow.brackets.test.Inspector;
                        NativeApp            = testWindow.brackets.test.NativeApp;
                    });

                    SpecRunnerUtils.loadProjectInTestWindow(testPath);
                });
            });
            
            afterEach(function () {
                runs(function () {
                    SpecRunnerUtils.closeTestWindow();
                });
            });
            
            it("should return a ready socket on Inspector.connect and close the socket on Inspector.disconnect", function () {
                var id  = Math.floor(Math.random() * 100000),
                    url = LiveDevelopment.launcherUrl + "?id=" + id;
                
                runs(function () {
                    waitsForDone(
                        NativeApp.openLiveBrowser(url, true),
                        "NativeApp.openLiveBrowser",
                        5000
                    );
                });
                   
                runs(function () {
                    waitsForDone(Inspector.connectToURL(url), "Inspector.connectToURL", 5000);
                });
                
                runs(function () {
                    expect(Inspector.connected()).toBeTruthy();
                });
                
                runs(function () {
                    var deferred = $.Deferred();
                    Inspector.Runtime.evaluate("window.open('', '_self').close()", function (response) {
                        Inspector.disconnect();
                        deferred.resolve();
                    });
                    waitsForDone(deferred.promise(), "Inspector.Runtime.evaluate");
                });
                
                runs(function () {
                    expect(Inspector.connected()).toBeFalsy();
                });
            });
        });

        describe("CSS Editing", function () {

            beforeEach(function () {
                runs(function () {
                    SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                        testWindow           = w;
                        LiveDevelopment      = testWindow.brackets.test.LiveDevelopment;
                        LiveDevServerManager = testWindow.brackets.test.LiveDevServerManager;
                        DOMAgent             = testWindow.brackets.test.DOMAgent;
                        DocumentManager      = testWindow.brackets.test.DocumentManager;
                        CommandManager       = testWindow.brackets.test.CommandManager;
                        Commands             = testWindow.brackets.test.Commands;
                        NativeApp            = testWindow.brackets.test.NativeApp;
                        ProjectManager       = testWindow.brackets.test.ProjectManager;
                    });

                    SpecRunnerUtils.loadProjectInTestWindow(testPath);
                });
            });

            afterEach(function () {
                runs(function () {
                    LiveDevelopment.close();
                });

                waitsFor(function () {
                    return (LiveDevelopment.status === LiveDevelopment.STATUS_INACTIVE);
                }, "Waiting for browser to become inactive", 10000);

                SpecRunnerUtils.closeTestWindow();
            });
            
            it("should establish a browser connection for an opened html file", function () {
                //verify live dev isn't currently active
                expect(LiveDevelopment.status).toBe(LiveDevelopment.STATUS_INACTIVE);
                
                //open a file
                runs(function () {
                    waitsForDone(SpecRunnerUtils.openProjectFiles(["simple1.html"]), "SpecRunnerUtils.openProjectFiles");
                });
                
                //start live dev
                runs(function () {
                    LiveDevelopment.open();
                });
                waitsFor(function () {
                    return (LiveDevelopment.status === LiveDevelopment.STATUS_ACTIVE);
                }, "Waiting for browser to become active", 10000);
 
                runs(function () {
                    expect(LiveDevelopment.status).toBe(LiveDevelopment.STATUS_ACTIVE);
                    
                    var doc = DocumentManager.getOpenDocumentForPath(testPath + "/simple1.html");
                    expect(isOpenInBrowser(doc, LiveDevelopment.agents)).toBeTruthy();
                });
                
                // Let things settle down before trying to stop live dev.
                waits(1000);
            });
            
            it("should should not start a browser connection for an opened css file", function () {
                //verify live dev isn't currently active
                expect(LiveDevelopment.status).toBe(LiveDevelopment.STATUS_INACTIVE);
                
                //open a file
                runs(function () {
                    waitsForDone(SpecRunnerUtils.openProjectFiles(["simple1.css"]), "SpecRunnerUtils.openProjectFiles");
                });
                
                //start live dev
                runs(function () {
                    LiveDevelopment.open();
                });
                
                //need to wait an arbitrary time since we can't check for live dev to be active
                waits(1000);
 
                runs(function () {
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
                
                //verify live dev isn't currently active
                expect(LiveDevelopment.status).toBe(LiveDevelopment.STATUS_INACTIVE);
                
                var cssOpened = false;
                runs(function () {
                    SpecRunnerUtils.openProjectFiles(["simple1.css"]).fail(function () {
                        expect("Failed To Open").toBe("simple1.css");
                    }).always(function () {
                        cssOpened = true;
                    });
                });
                waitsFor(function () { return cssOpened; }, "cssOpened FILE_OPEN timeout", 1000);
                
                runs(function () {
                    var curDoc =  DocumentManager.getCurrentDocument();
                    localText = curDoc.getText();
                    localText += "\n .testClass { color:#090; }\n";
                    curDoc.setText(localText);
                });
                
                runs(function () {
                    waitsForDone(SpecRunnerUtils.openProjectFiles(["simple1.css", "simple1.html"]), "SpecRunnerUtils.openProjectFiles");
                });
                
                //start live dev
                var liveDoc;
                runs(function () {
                    LiveDevelopment.open();
                });
                waitsFor(function () {
                    liveDoc = LiveDevelopment.getLiveDocForPath(testPath + "/simple1.css");
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
                });
            });

            it("should reapply in-memory css changes after saving changes in html document", function () {
                var localCssText,
                    browserCssText,
                    origHtmlText,
                    updatedHtmlText,
                    browserHtmlText,
                    htmlDoc;
                
                //verify live dev isn't currently active
                expect(LiveDevelopment.status).toBe(LiveDevelopment.STATUS_INACTIVE);
                
                var cssOpened = false;
                runs(function () {
                    SpecRunnerUtils.openProjectFiles(["simple1.css"]).fail(function () {
                        expect("Failed To Open").toBe("simple1.css");
                    }).always(function () {
                        cssOpened = true;
                    });
                });
                waitsFor(function () { return cssOpened; }, "cssOpened FILE_OPEN timeout", 1000);
                
                runs(function () {
                    var curDoc =  DocumentManager.getCurrentDocument();
                    localCssText = curDoc.getText();
                    localCssText += "\n .testClass { color:#090; }\n";
                    curDoc.setText(localCssText);
                });
                
                runs(function () {
                    waitsForDone(SpecRunnerUtils.openProjectFiles(["simple1.html"]), "SpecRunnerUtils.openProjectFiles");
                });
                
                // Modify some text in test file before starting live dev
                runs(function () {
                    htmlDoc =  DocumentManager.getCurrentDocument();
                    origHtmlText = htmlDoc.getText();
                    updatedHtmlText = origHtmlText.replace("Brackets is", "Live Preview in Brackets is");
                    htmlDoc.setText(updatedHtmlText);
                });
                                
                // start live dev
                var liveDoc, liveHtmlDoc;
                runs(function () {
                    waitsForDone(LiveDevelopment.open(), "LiveDevelopment.open()", 2000);
                });
                
                waitsFor(function () {
                    return (LiveDevelopment.status === LiveDevelopment.STATUS_OUT_OF_SYNC) &&
                        (DOMAgent.root);
                }, "LiveDevelopment STATUS_OUT_OF_SYNC and DOMAgent.root", 10000);
                
                // Grab the node that we've just modified in Brackets.
                // Verify that we get the original text and not modified text.
                var originalNode;
                runs(function () {
                    originalNode = DOMAgent.nodeAtLocation(230);
                    expect(originalNode.value).toBe("Brackets is awesome!");
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
                // This time we should have modified text since the file has been saved in Brackets.
                var updatedNode, doneSyncing = false;
                runs(function () {
                    testWindow.$(LiveDevelopment).off("statusChange", statusChangeHandler);
                    
                    updatedNode = DOMAgent.nodeAtLocation(230);
                    liveDoc = LiveDevelopment.getLiveDocForPath(testPath + "/simple1.css");
                    
                    liveDoc.getSourceFromBrowser().done(function (text) {
                        browserCssText = text;
                        doneSyncing = true;
                    });
                });
                waitsFor(function () { return doneSyncing; }, "Browser to sync changes", 10000);

                runs(function () {
                    expect(fixSpaces(browserCssText)).toBe(fixSpaces(localCssText));
                    
                    // Verify that we have modified text
                    expect(updatedNode.value).toBe("Live Preview in Brackets is awesome!");
                });
                    
                // Save original content back to the file after this test passes/fails
                runs(function () {
                    htmlDoc.setText(origHtmlText);
                    var promise = CommandManager.execute(Commands.FILE_SAVE, {doc: htmlDoc});
                    waitsForDone(promise, "Restoring the original html content");
                });
            });

            // This tests url mapping -- files do not need to exist on disk
            it("should translate urls to/from local paths", function () {
                // Define testing parameters
                var projectPath     = testPath + "/",
                    outsidePath     = testPath.substr(0, testPath.lastIndexOf("/") + 1),
                    fileProtocol    = (testWindow.brackets.platform === "win") ? "file:///" : "file://",
                    fileRelPath     = "subdir/index.html",
                    baseUrl,
                    provider;

                // File paths used in tests:
                //  * file1 - file inside  project
                //  * file2 - file outside project
                // Encode the URLs
                var file1Path       = projectPath + fileRelPath,
                    file2Path       = outsidePath + fileRelPath,
                    file1FileUrl    = encodeURI(fileProtocol + projectPath + fileRelPath),
                    file2FileUrl    = encodeURI(fileProtocol + outsidePath + fileRelPath),
                    file1ServerUrl;

                // Should use file url when no server provider
                runs(function () {
                    LiveDevelopment._setServerProvider(null);
                    expect(LiveDevelopment._pathToUrl(file1Path)).toBe(file1FileUrl);
                    expect(LiveDevelopment._urlToPath(file1FileUrl)).toBe(file1Path);
                    expect(LiveDevelopment._pathToUrl(file2Path)).toBe(file2FileUrl);
                    expect(LiveDevelopment._urlToPath(file2FileUrl)).toBe(file2Path);
                });


                // Set user defined base url, and then get provider
                runs(function () {
                    baseUrl         = "http://localhost/";
                    file1ServerUrl  = baseUrl + encodeURI(fileRelPath);
                    ProjectManager.setBaseUrl(baseUrl);
                    provider = LiveDevServerManager.getProvider(file1Path);
                    expect(provider).toBeTruthy();
                    LiveDevelopment._setServerProvider(provider);

                    // Should use server url with base url
                    expect(LiveDevelopment._pathToUrl(file1Path)).toBe(file1ServerUrl);
                    expect(LiveDevelopment._urlToPath(file1ServerUrl)).toBe(file1Path);

                    // File outside project should still use file url
                    expect(LiveDevelopment._pathToUrl(file2Path)).toBe(file2FileUrl);
                    expect(LiveDevelopment._urlToPath(file2FileUrl)).toBe(file2Path);

                    // Clear base url
                    LiveDevelopment._setServerProvider(null);
                    ProjectManager.setBaseUrl("");
                });
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
    });
});
