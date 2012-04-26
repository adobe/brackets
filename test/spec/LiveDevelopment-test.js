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
/*global define: false, describe: false, it: false, xit: false, expect: false, beforeEach: false, afterEach: false, waitsFor: false, waits: false, runs: false, $: false*/

define(function (require, exports, module) {
    'use strict';

    var SpecRunnerUtils = require("./SpecRunnerUtils.js"),
        NativeApp,      //The following are all loaded from the test window
        LiveDevelopment,
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
    

    describe("Live Development", function () {
        
        beforeEach(function () {
            runs(function () {
                SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                    testWindow          = w;
                    LiveDevelopment     = testWindow.brackets.test.LiveDevelopment;
                    Inspector           = testWindow.brackets.test.Inspector;
                    DocumentManager     = testWindow.brackets.test.DocumentManager;
                    NativeApp           = testWindow.brackets.test.NativeApp;
                    NativeApp._setLiveBrowserUserDataDir(userDataPath);
                });
                
                SpecRunnerUtils.loadProjectInTestWindow(testPath);
            });
        });
    
    
        afterEach(function () {
            var browserDone = false;
            runs(function () {
                LiveDevelopment.close();
            });
            waitsFor(function () { return !Inspector.connected(); }, "Waiting for to close inspector", 10000);
            waits(20);
            NativeApp._setLiveBrowserUserDataDir("");
            
            runs(function () {
                NativeApp.closeAllLiveBrowsers().always(function () {
                    browserDone = true;
                });
                SpecRunnerUtils.closeTestWindow();

            });
            waits(100);
            //waitsFor(function () { return browserDone; }, "closeLiveBrowser timeout", 10000);
        });
        
        describe("CSS Editing", function () {

            it("should establish a browser connection for an opened html file", function () {
                //verify we aren't currently connected
                expect(Inspector.connected()).toBeFalsy();
                
                //open a file
                var htmlOpened = false;
                runs(function () {
                    SpecRunnerUtils.openProjectFiles(["simple1.html"]).fail(function () {
                        expect("Failed To Open").toBe("simple1.html");
                    }).always(function () {
                        htmlOpened = true;
                    });
                });
                waitsFor(function () { return htmlOpened; }, "htmlOpened FILE_OPEN timeout", 1000);
                
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
                var opened = false;
                runs(function () {
                    SpecRunnerUtils.openProjectFiles(["simple1.css"]).fail(function () {
                        expect("Failed To Open").toBe("simple1.css");
                    }).always(function () {
                        opened = true;
                    });
                });
                waitsFor(function () { return opened; }, "FILE_OPEN timeout", 1000);
                
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
                var localText,
                    browserText;
                
                //verify we aren't currently connected
                expect(Inspector.connected()).toBeFalsy();
                
                var htmlOpened = false;
                runs(function () {
                    SpecRunnerUtils.openProjectFiles(["simple1.html"]).fail(function () {
                        expect("Failed To Open").toBe("simple1.html");
                    }).always(function () {
                        htmlOpened = true;
                    });
                });
                waitsFor(function () { return htmlOpened; }, "htmlOpened FILE_OPEN timeout", 1000);
                
                //start the connection
                runs(function () {
                    LiveDevelopment.open();
                });
                waitsFor(function () { return Inspector.connected(); }, "Waiting for browser", 10000);
                
                // Wait for the file and its stylesheets to fully load (and be communicated back).
                waits(1000);
                
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
                
                //add a wait for the change to get pushed, then wait to get the result
                waits(1000);
                
                var doneSyncing = false;
                runs(function () {
                    var liveDoc = LiveDevelopment.getLiveDocForPath(testPath + "/simple1.css");
                    liveDoc.getSourceFromBrowser().done(function (text) {
                        browserText = text;
                    }).always(function () {
                        doneSyncing = true;
                    });
                });
                waitsFor(function () { return doneSyncing; }, "Browser to sync changes", 10000);
                
                runs(function () {
                    expect(fixSpaces(browserText)).toBe(fixSpaces(localText));
                    
                    var doc = DocumentManager.getOpenDocumentForPath(testPath + "/simple1.html");
                    //expect(isOpenInBrowser(doc, LiveDevelopment.agents)).toBeTruthy();
                });
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
                
                var htmlOpened = false;
                runs(function () {
                    SpecRunnerUtils.openProjectFiles(["simple1.css", "simple1.html"]).fail(function () {
                        expect("Failed To Open").toBe("simple1.html");
                    }).always(function () {
                        htmlOpened = true;
                    });
                });
                waitsFor(function () { return htmlOpened; }, "htmlOpened FILE_OPEN timeout", 1000);
                
                //start the connection
                runs(function () {
                    LiveDevelopment.open();
                });
                waitsFor(function () { return Inspector.connected(); }, "Waiting for browser", 10000);
                
                //wait again for the final changes to load
                waits(350);
                
                var doneSyncing = false;
                runs(function () {
                    var liveDoc = LiveDevelopment.getLiveDocForPath(testPath + "/simple1.css");
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
        });
    });
});
