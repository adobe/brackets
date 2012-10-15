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
/*global define, describe, it, xit, expect, beforeEach, afterEach, waitsFor, waitsForDone, waits, runs, $*/

define(function (require, exports, module) {
    'use strict';

    var SpecRunnerUtils = require("spec/SpecRunnerUtils"),
        CommandManager,
        Commands,
        NativeApp,      //The following are all loaded from the test window
        LiveDevelopment,
        DOMAgent,
        Inspector,
        DocumentManager;
    
    var testPath = SpecRunnerUtils.getTestPath("/spec/LiveDevelopment-test-files"),
        userDataPath = SpecRunnerUtils.getTestPath("/spec/LiveDevelopment-chrome-user-data"),
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
        
        //verify we aren't currently connected
        expect(Inspector.connected()).toBeFalsy();
        
        runs(function () {
            waitsForDone(SpecRunnerUtils.openProjectFiles([htmlFile]), "SpecRunnerUtils.openProjectFiles");
        });
        
        //start the connection
        runs(function () {
            LiveDevelopment.open();
        });
        waitsFor(function () { return Inspector.connected(); }, "Waiting for browser", 10000);
        
        // Wait for the file and its stylesheets to fully load (and be communicated back).
        waits(1000);
        
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
            //expect(isOpenInBrowser(doc, LiveDevelopment.agents)).toBeTruthy();
        });
    }

    describe("Live Development", function () {
        
        beforeEach(function () {
            runs(function () {
                SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                    testWindow          = w;
                    LiveDevelopment     = testWindow.brackets.test.LiveDevelopment;
                    DOMAgent            = testWindow.brackets.test.DOMAgent;
                    Inspector           = testWindow.brackets.test.Inspector;
                    DocumentManager     = testWindow.brackets.test.DocumentManager;
                    CommandManager      = testWindow.brackets.test.CommandManager;
                    Commands            = testWindow.brackets.test.Commands;
                    NativeApp           = testWindow.brackets.test.NativeApp;
                    NativeApp._setLiveBrowserUserDataDir(userDataPath);
                });
                
                SpecRunnerUtils.loadProjectInTestWindow(testPath);
            });
        });
    
    
        afterEach(function () {
            runs(function () {
                LiveDevelopment.close();
            });
            waitsFor(function () { return !Inspector.connected(); }, "Waiting for to close inspector", 10000);
            waits(20);
            NativeApp._setLiveBrowserUserDataDir("");
            
            if (window.appshell) {
                runs(function () {
                    waitsForDone(NativeApp.closeAllLiveBrowsers(), "NativeApp.closeAllLiveBrowsers", 10000);
                });
            } else {
                // Remove this 'else' after migrating to brackets-shell.
                // brackets-app never resolves the promise for brackets.app.closeLiveBrowser.
                runs(function () {
                    NativeApp.closeAllLiveBrowsers();
                });
                waits(100);
            }

            SpecRunnerUtils.closeTestWindow();
        });
        
        describe("CSS Editing", function () {

            it("should establish a browser connection for an opened html file", function () {
                //verify we aren't currently connected
                expect(Inspector.connected()).toBeFalsy();
                
                //open a file
                runs(function () {
                    waitsForDone(SpecRunnerUtils.openProjectFiles(["simple1.html"]), "SpecRunnerUtils.openProjectFiles");
                });
                
                //start the connection
                runs(function () {
                    LiveDevelopment.open();
                });
                waitsFor(function () { return Inspector.connected(); }, "Waiting for browser", 10000);
 
                runs(function () {
                    expect(Inspector.connected()).toBeTruthy();
                    
                    var doc = DocumentManager.getOpenDocumentForPath(testPath + "/simple1.html");
                    //expect(isOpenInBrowser(doc, LiveDevelopment.agents)).toBeTruthy();
                });
                
                // Let things settle down before trying to close the connection.
                waits(1000);
            });
            
            it("should should not start a browser connection for an opened css file", function () {
                //verify we aren't currently connected
                expect(Inspector.connected()).toBeFalsy();
                
                //open a file
                runs(function () {
                    waitsForDone(SpecRunnerUtils.openProjectFiles(["simple1.css"]), "SpecRunnerUtils.openProjectFiles");
                });
                
                //start the connection
                runs(function () {
                    LiveDevelopment.open();
                });
                
                //we just need to wait an arbitrary time since we can't check for the connection to be true
                waits(1000);
 
                runs(function () {
                    expect(Inspector.connected()).toBeFalsy();

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
                
                //verify we aren't currently connected
                expect(Inspector.connected()).toBeFalsy();
                
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
                
                //start the connection
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
                
                //verify we aren't currently connected
                expect(Inspector.connected()).toBeFalsy();
                
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
                    waitsForDone(SpecRunnerUtils.openProjectFiles(["simple1.css", "simple1.html"]), "SpecRunnerUtils.openProjectFiles");
                });
                
                // Modify some text in test file before starting live connection
                runs(function () {
                    htmlDoc =  DocumentManager.getCurrentDocument();
                    origHtmlText = htmlDoc.getText();
                    updatedHtmlText = origHtmlText.replace("Brackets is", "Live Preview in Brackets is");
                    htmlDoc.setText(updatedHtmlText);
                });
                                
                //start the connection
                var liveDoc, liveHtmlDoc;
                runs(function () {
                    LiveDevelopment.open();
                });

                waits(2000);
                
                // Grab the node that we've just modified in Brackets.
                var originalNode;
                waitsFor(function () {
                    originalNode = DOMAgent.nodeAtLocation(230);
                    return !!originalNode;
                }, "getting original html content", 10000);
                
                // Verify that we get the original text and not modified text.
                runs(function () {
                    expect(originalNode.value).toBe("Brackets is awesome!");
                });

                // Save changes to the test file
                runs(function () {
                    var promise = CommandManager.execute(Commands.FILE_SAVE, {doc: htmlDoc});
                    waitsForDone(promise, "Saving modified html document");
                });

                waits(1000);
                
                waitsFor(function () {
                    liveDoc = LiveDevelopment.getLiveDocForPath(testPath + "/simple1.css");
                    return !!liveDoc;
                }, "Waiting for LiveDevelopment document", 10000);
                                                
                var doneSyncing = false;
                runs(function () {
                    liveDoc.getSourceFromBrowser().done(function (text) {
                        browserCssText = text;
                    }).always(function () {
                        doneSyncing = true;
                    });
                });
                waitsFor(function () { return doneSyncing; }, "Browser to sync changes", 10000);

                runs(function () {
                    expect(fixSpaces(browserCssText)).toBe(fixSpaces(localCssText));
                });

                // Grab the node that we've modified in Brackets. 
                // This time we should have modified text since the file has been saved in Brackets.
                var updatedNode;
                waitsFor(function () {
                    updatedNode = DOMAgent.nodeAtLocation(230);
                    return !!updatedNode;
                }, "getting modified html content", 10000);
                
                // Verify that we have modified text and then restore the original text for saving.
                runs(function () {
                    expect(updatedNode.value).toBe("Live Preview in Brackets is awesome!");
                    htmlDoc.setText(origHtmlText);
                });

                runs(function () {
                    var promise = CommandManager.execute(Commands.FILE_SAVE, {doc: htmlDoc});
                    waitsForDone(promise, "Restoring the original html content");
                });
            });
        });
    });
});
