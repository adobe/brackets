/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, describe: false, it: false, xit: false, expect: false, beforeEach: false, afterEach: false, waitsFor: false, runs: false, $: false*/

define(function (require, exports, module) {
    'use strict';

    var SpecRunnerUtils = require("./SpecRunnerUtils.js"),
        LiveDevelopment, //Loaded from each test window
        Inspector; //Loaded from each test window
    
    var testPath = SpecRunnerUtils.getTestPath("/spec/LiveDevelopment-test-files"),
        testWindow,
        initLiveDevelopmentWorkspace;
        
    
    /**
   */
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

    describe("Live Development", function () {
        
        beforeEach(function () {
            initLiveDevelopmentWorkspace = _initLiveDevelopmentWorkspace.bind(this);
            SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                testWindow          = w;
                LiveDevelopment     = testWindow.brackets.test.LiveDevelopment;
                Inspector           = testWindow.brackets.test.Inspector;
            });
        });
    
    
        afterEach(function () {
            SpecRunnerUtils.closeTestWindow();
        });

        it("should establish a browser connection", function () {
            runs(function () {
                initLiveDevelopmentWorkspace("simple.html");
            });
            waitsFor(function () 
                     { 
                         return Inspector.connected(); 
                     }, "Waiting for browser", 10000);
            
            expect(Inspector.connected()).toBeTruthy();
        });
    });
});
