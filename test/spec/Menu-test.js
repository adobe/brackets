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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, describe, it, expect, beforeEach, afterEach, waitsFor, runs, $ */

define(function (require, exports, module) {
    'use strict';
    
    var Menus,
        SpecRunnerUtils         = require("./SpecRunnerUtils.js"),
        Strings                 = require("strings");

    describe("Menus", function () {

        describe("Add Menus", function () {

            var testWindow;
    
            beforeEach(function () {
                SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                    testWindow = w;
    
                    // Load module instances from brackets.test
                    Menus      = testWindow.brackets.test.Menus;
                });
            });
        
            afterEach(function () {
                SpecRunnerUtils.closeTestWindow();
            });

            it("should add new menu in last position of list", function () {
                runs(function () {
                    var $listItems = testWindow.$("#main-toolbar > ul.nav").children();
                    expect($listItems).toBeTruthy();
                    
                    var menuCountOriginal = $listItems.length;
                    var menu = Menus.addMenu("Custom", "menu-custom");
                    $listItems = testWindow.$("#main-toolbar > ul.nav").children(); // refresh
                    
                    expect($listItems.length).toBe(menuCountOriginal + 1);
                    expect($($listItems[menuCountOriginal]).attr("id")).toBe("menu-custom");
                });
            });

//            it("should add new menu after reference menu", function () {
//                runs(function () {
//                    var $listItems = testWindow.$("#main-toolbar > ul.nav").children();
//                    expect($listItems).toBeTruthy();
//                    
//                    var menuCountOriginal = $listItems.length;
//                    var menu = Menus.addMenu("Custom", "menu-custom", Menus.AFTER, Menus.AppMenuBar.FILE_MENU);
//                    $listItems = testWindow.$("#main-toolbar > ul.nav").children(); // refresh
//                    
//                    expect($listItems.length).toBe(menuCountOriginal + 1);
//                    expect($($listItems[0]).attr("id")).toBe("Strings.FILE_MENU");
//                    expect($($listItems[1]).attr("id")).toBe("menu-custom");
//                });
//            });


//            it("should add new menu at end of list when reference menu doesn't exist", function () {
//                runs(function () {
//                    var $listItems = testWindow.$("#main-toolbar > ul.nav").children();
//                    expect($listItems).toBeTruthy();
//                    
//                    var menuCountOriginal = $listItems.length;
//                    var menu = Menus.addMenu("Custom", "menu-custom", Menus.AFTER, "NONEXISTANT");
//                    $listItems = testWindow.$("#main-toolbar > ul.nav").children(); // refresh
//                    
//                    expect($listItems.length).toBe(menuCountOriginal + 1);
//                    expect($($listItems[menuCountOriginal]).attr("id")).toBe("menu-custom");
//                });
//            });
            
            
            it("should not add duplicate menu", function () {
                runs(function () {
                    var $listItems = testWindow.$("#main-toolbar > ul.nav").children();
                    expect($listItems).toBeTruthy();
                    
                    var menuCountOriginal = $listItems.length;
                    var menu;
                    
                    try {
                        menu = Menus.addMenu(Strings.FILE_MENU, Menus.AppMenuBar.FILE_MENU);
                    } catch (e) {
                        // catch exception and do nothing
                    }
                    
                    $listItems = testWindow.$("#main-toolbar > ul.nav").children(); // refresh
                    expect($listItems.length).toBe(menuCountOriginal);
                });
            });


        });

        describe("Add Menu Items", function () {
            
//            it("should add new menu item to empty menu", function () { });
//            it("should add new menu item in first position of menu", function () { });
//            it("should add new menu item in last position of menu", function () { });
//            it("should add new menu item in position before reference menu item", function () { });
//            it("should add new menu item in position after reference menu item", function () { });
//            it("should add new menu item in last position of menu if reference menu item doesn't exist", function () { });
//            it("should not add duplicate menu item", function () { });

//            it("should add new menu divider", function () { });
//            it("should add duplicate menu divider", function () { });

        });

        describe("Manipulate Menu Items", function () {
            
            // - verify with jQuery: see WorkingSetView-test.js
            
//            it("should enable a menu item", function () { });
//            it("should disable a menu item", function () { });
//            it("should check a menu item", function () { });
//            it("should uncheck a menu item", function () { });
            
        });


        
    });
});
