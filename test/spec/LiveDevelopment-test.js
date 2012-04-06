/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, describe: false, it: false, xit: false, expect: false, beforeEach: false, afterEach: false, waitsFor: false, waits: false, runs: false, $: false*/

define(function (require, exports, module) {
    'use strict';

    var SpecRunnerUtils = require("./SpecRunnerUtils.js"),
        NativeApp       = require("utils/NativeApp"),
        LiveDevelopment,    //The following are all loaded from the test window
        Inspector,
        DocumentManager;
    
    var testPath = SpecRunnerUtils.getTestPath("/spec/LiveDevelopment-test-files"),
        testWindow,
        initLiveDevelopmentWorkspace;
        
    
    var _initLiveDevelopmentWorkspace = function (openFile, workingSet) {
        var hostOpened = false,
            err = false;
        
        workingSet = workingSet || [];
        
        SpecRunnerUtils.loadProjectInTestWindow(testPath);
        
        runs(function () {
            workingSet.push(openFile);
            SpecRunnerUtils.openProjectFiles(workingSet).done(function (documents) {
                hostOpened = true;
            }).fail(function () {
                err = true;
            });
        });
        
        waitsFor(function () { return hostOpened && !err; }, "FILE_OPEN timeout", 1000);
        
        runs(function () {
            LiveDevelopment.open();
        });
        waitsFor(function () { return Inspector.connected(); }, "Waiting for browser", 10000);
    };
    
    var allSpacesRE = /\s+/gi;

    describe("Live Development", function () {
        
        beforeEach(function () {
            initLiveDevelopmentWorkspace = _initLiveDevelopmentWorkspace.bind(this);
            SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                testWindow          = w;
                LiveDevelopment     = testWindow.brackets.test.LiveDevelopment;
                Inspector           = testWindow.brackets.test.Inspector;
                DocumentManager     = testWindow.brackets.test.DocumentManager;
            });
        });
    
    
        afterEach(function () {
            LiveDevelopment.close();
            SpecRunnerUtils.closeTestWindow();
        });
        
        describe("CSS Editing", function () {

            it("should establish a browser connection when a file is opened", function () {
                runs(function () {
                    initLiveDevelopmentWorkspace("simple1.html");
                });
                waitsFor(function () {return Inspector.connected(); }, "Waiting for browser", 10000);
                
                runs(function () {
                    expect(Inspector.connected()).toBeTruthy();
                });
            });
            
            it("should push changes through the browser connection", function () {
                var doneOpening = false,
                    doneSyncing = false,
                    curDoc,
                    curText,
                    browserText;
                
                runs(function () {
                    initLiveDevelopmentWorkspace("simple1.html");
                });
                waitsFor(function () { return Inspector.connected(); }, "Waiting for browser", 10000);
                
                runs(function () {
                    SpecRunnerUtils.openProjectFiles(["simple1.css"]).fail(function () {
                        expect("Failed To Open File").toBe("opened");
                    }).always(function () {
                        doneOpening = true;
                    });
                });
            
                waitsFor(function () { return doneOpening; }, "FILE_OPEN timeout", 5000);
                
                runs(function () {
                    curDoc =  DocumentManager.getCurrentDocument();
                    curText = curDoc.getText();
                    curText += "\n .testClass { color:#090; }\n";
                    curDoc.setText(curText);
                });
                
                //add a wait for the change to get pushed, then wait to get the result
                waits(1000);
                
                runs(function () {
                    curDoc.liveDevelopment.liveDoc.getSourceFromBrowser().done(function (text) {
                        browserText = text;
                    }).always(function () {
                        doneSyncing = true;
                    });
                });
                
                waitsFor(function () { return doneSyncing; }, "Browser to sync changes", 10000);
                
                runs(function () {
                    expect(browserText.replace(allSpacesRE, " ")).toBe(curText.replace(allSpacesRE, " "));
                });
            });
        });
    });
});
