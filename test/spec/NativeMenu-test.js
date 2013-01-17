/*
 * Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
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
/*global define: false, describe: false, it: false, expect: false, beforeEach: false, afterEach: false, waitsFor: false, waitsForDone: false, runs: false, brackets: false */

define(function (require, exports, module) {
    'use strict';
    
    // Don't run tests when running in browser
    if (brackets.inBrowser) {
        return;
    }
    
    // These are tests for the low-level file io routines in brackets-app. Make sure
    // you have the latest brackets-app before running.

    describe("Native Menus", function () {

        var TEST_MENU_TITLE = "TEST",
            TEST_MENU_ID = "test",
            TEST_MENU_ITEM = "Item 1",
            TEST_MENU_ITEM_ID = "item1";
        
        it("should have a brackets.app namespace", function () {
            expect(brackets.app).toBeTruthy();
        });
    
        describe("addMenu", function () {
        
            it("should add a menu", function () {
                var complete = false,
                    error = 0,
                    title;
                
                // Make sure menu isn't present
                runs(function () {
                    brackets.app.getMenuTitle(TEST_MENU_ID, function (err) {
                        complete = true;
                        error = err;
                    });
                });
                
                waitsFor(function () { return complete; }, 1000);
                
                runs(function () {
                    expect(error).toBe(brackets.fs.ERR_NOT_FOUND);
                });
                
                // Add menu
                runs(function () {
                    complete = false;
                    brackets.app.addMenu(TEST_MENU_TITLE, TEST_MENU_ID, "", "", function (err) {
                        complete = true;
                        error = err;
                    });
                });
                
                waitsFor(function () { return complete; }, 1000);
                
                runs(function () {
                    expect(error).toBe(0);
                });
                
                // Verify menu is found
                runs(function () {
                    complete = false;
                    brackets.app.getMenuTitle(TEST_MENU_ID, function (err, titleStr) {
                        complete = true;
                        error = err;
                        title = titleStr;
                    });
                });
                
                waitsFor(function () { return complete; }, 1000);
                
                runs(function () {
                    expect(error).toBe(0);
                    expect(title).toBe(TEST_MENU_TITLE);
                    
                    // Remove menu
                    brackets.app.removeMenu(TEST_MENU_ID, function (err) {
                        // Ignore error
                    });
                });
            });
		
            it("should return an error if invalid parameters are passed", function () {
                var complete = false,
                    error = 0;
                
                runs(function () {
                    brackets.app.addMenu(TEST_MENU_TITLE, TEST_MENU_ID, 42, "", function (err) {
                        complete = true;
                        error = err;
                    });
                });
                
                waitsFor(function () { return complete; }, 1000);
                
                runs(function () {
                    expect(error).toBe(brackets.fs.ERR_INVALID_PARAMS);
                });
            });

        }); // describe("addMenu")
        
        describe("addMenuItem", function () {
            var complete = false,
                error = 0,
                title;
            
            beforeEach(function () {
                runs(function () {
                    brackets.app.addMenu(TEST_MENU_TITLE, TEST_MENU_ID, "", "", function (err) {
                        complete = true;
                        error = err;
                    });
                });
                
                waitsFor(function () { return complete; });
                
                runs(function () {
                    expect(error).toBe(0);
                });
            });
            
            afterEach(function () {
                runs(function () {
                    complete = false;
                    brackets.app.removeMenu(TEST_MENU_ID, function (err) {
                        complete = true;
                        error = err;
                    });
                });
                
                waitsFor(function () { return complete; });
                
                runs(function () {
                    expect(error).toBe(0);
                });
            });
            
            it("should add a menu item", function () {
                runs(function () {
                    complete = false;
                    brackets.app.addMenuItem(TEST_MENU_ID, TEST_MENU_ITEM, TEST_MENU_ITEM_ID, "", "", "", function (err) {
                        complete = true;
                        error = err;
                    });
                });
                
                waitsFor(function () { return complete; }, 1000);
                
                runs(function () {
                    expect(error).toBe(0);
                });
                
                // Verify item
                runs(function () {
                    complete = false;
                    brackets.app.getMenuTitle(TEST_MENU_ITEM_ID, function (err, titleStr) {
                        complete = true;
                        error = err;
                        title = titleStr;
                    });
                });
                
                waitsFor(function () { return complete; }, 1000);
                
                runs(function () {
                    expect(error).toBe(0);
                    expect(title).toBe(TEST_MENU_ITEM);
                    brackets.app.removeMenuItem(TEST_MENU_ITEM_ID, function (err) {
                    });
                });
            });
            it("should return an error if invalid parameters are passed", function () {
                runs(function () {
                    complete = false;
                    brackets.app.addMenuItem(TEST_MENU_ID, TEST_MENU_ITEM, TEST_MENU_ITEM_ID, "", 42, "", function (err) {
                        complete = true;
                        error = err;
                    });
                });
                
                waitsFor(function () { return complete; }, 1000);
                
                runs(function () {
                    expect(error).toBe(brackets.fs.ERR_INVALID_PARAMS);
                });
            });
        });
        
        describe("removeMenu", function () {
            var complete = false,
                error = 0;
            
            it("should remove a menu", function () {
                runs(function () {
                    brackets.app.addMenu(TEST_MENU_TITLE, TEST_MENU_ID, "", "", function (err) {
                        complete = true;
                        error = err;
                    });
                });
                
                waitsFor(function () { return complete; }, 1000);
                
                runs(function () {
                    expect(error).toBe(0);
                });
                
                runs(function () {
                    complete = false;
                    brackets.app.removeMenu(TEST_MENU_ID, function (err) {
                        complete = true;
                        error = err;
                    });
                });
                
                waitsFor(function () { return complete; }, 1000);
                
                runs(function () {
                    expect(error).toBe(0);
                });
            });
            it("should return an error if invalid parameters are passed", function () {
                complete = false;
                
                runs(function () {
                    brackets.app.removeMenu(42, function (err) {
                        complete = true;
                        error = err;
                    });
                });
                
                waitsFor(function () { return complete; }, 1000);
                
                runs(function () {
                    expect(error).toBe(brackets.fs.ERR_INVALID_PARAMS);
                });
            });
            it("should return an error if the menu can't be found", function () {
                complete = false;
                
                runs(function () {
                    brackets.app.removeMenu(TEST_MENU_ID, function (err) {
                        complete = true;
                        error = err;
                    });
                });
                
                waitsFor(function () { return complete; }, 1000);
                
                runs(function () {
                    expect(error).toBe(brackets.fs.ERR_NOT_FOUND);
                });
            });
        });
        
        describe("removeMenuItem", function () {
            var ITEM_ID = TEST_MENU_ITEM_ID + "1";
            
            beforeEach(function () {
                var complete = false,
                    error = 0;
                
                runs(function () {
                    brackets.app.addMenu(TEST_MENU_TITLE, TEST_MENU_ID, "", "", function (err) {
                        if (err) {
                            complete = true;
                            error = err;
                        } else {
                            brackets.app.addMenuItem(TEST_MENU_ID, TEST_MENU_ITEM, ITEM_ID, "", "", "", function (err) {
                                complete = true;
                                error = err;
                            });
                        }
                    });
                });
                
                waitsFor(function () { return complete; }, 1000);
                
                runs(function () {
                    expect(error).toBe(0);
                });
            });
            
            afterEach(function () {
                var complete = false,
                    error = 0;
                
                runs(function () {
                    brackets.app.removeMenuItem(ITEM_ID, function (err) {
                        // Ignore the error from removeMenuItem(). The item may have
                        // already been removed by the test.
                        brackets.app.removeMenu(TEST_MENU_ID, function (err) {
                            complete = true;
                            error = err;
                        });
                    });
                });
                
                waitsFor(function () { return complete; }, 1000);
                
                runs(function () {
                    expect(error).toBe(0);
                });
            });
            
            it("should remove a menu item", function () {
                var complete = false,
                    error = 0;
                                                
                runs(function () {
                    brackets.app.removeMenuItem(ITEM_ID, function (err) {
                        complete = true;
                        error = err;
                    });
                });
                
                waitsFor(function () { return complete; }, "calling removeMenuItem", 1000);
                
                runs(function () {
                    expect(error).toBe(0);
                });
                
                // Make sure it's gone
                runs(function () {
                    complete = false;
                    brackets.app.getMenuTitle(ITEM_ID, function (err, titleStr) {
                        complete = true;
                        error = err;
                    });
                });
                
                waitsFor(function () { return complete; }, "calling getMenuTitle", 1000);
                
                runs(function () {
                    expect(error).toBe(brackets.fs.ERR_NOT_FOUND);
                });
            });
            it("should return an error if invalid parameters are passed", function () {
                var complete = false,
                    error = 0;
                                                
                runs(function () {
                    brackets.app.removeMenuItem(42, function (err) {
                        complete = true;
                        error = err;
                    });
                });
                
                waitsFor(function () { return complete; }, "calling removeMenuItem", 1000);
                
                runs(function () {
                    expect(error).toBe(brackets.fs.ERR_INVALID_PARAMS);
                });
            });
            it("should return an error if the menu item can't be found", function () {
                var complete = false,
                    error = 0;
                                                
                runs(function () {
                    brackets.app.removeMenuItem(ITEM_ID + "foo", function (err) {
                        complete = true;
                        error = err;
                    });
                });
                
                waitsFor(function () { return complete; }, "calling removeMenuItem", 1000);
                
                runs(function () {
                    expect(error).toBe(brackets.fs.ERR_NOT_FOUND);
                });
            });
        });
        
        describe("getMenuItemState setMenuItemState", function () {
            var ITEM_ID = TEST_MENU_ITEM_ID + "2";
            
            beforeEach(function () {
                var complete = false,
                    error = 0;
                
                runs(function () {
                    brackets.app.addMenu(TEST_MENU_TITLE, TEST_MENU_ID, "", "", function (err) {
                        if (err) {
                            complete = true;
                            error = err;
                        } else {
                            brackets.app.addMenuItem(TEST_MENU_ID, TEST_MENU_ITEM, ITEM_ID, "", "", "", function (err) {
                                complete = true;
                                error = err;
                            });
                        }
                    });
                });
                
                waitsFor(function () { return complete; }, 1000);
                
                runs(function () {
                    expect(error).toBe(0);
                });
            });
            
            afterEach(function () {
                var complete = false,
                    error = 0;
                
                runs(function () {
                    brackets.app.removeMenuItem(ITEM_ID, function (err) {
                        // Ignore errors from removeMenuItem() and always remove
                        // the menu too. This is cleanup time so it's okay if
                        // an error gets missed here.
                        brackets.app.removeMenu(TEST_MENU_ID, function (err) {
                            complete = true;
                            error = err;
                        });
                    });
                });
                
                waitsFor(function () { return complete; }, 1000);
                
                runs(function () {
                    expect(error).toBe(0);
                });
            });
            it("should be able to set enabled state", function () {
                var complete = false,
                    enabled = false,
                    error = 0;
                
                // Should start out enabled
                runs(function () {
                    brackets.app.getMenuItemState(ITEM_ID, function (err, bEnabled, bChecked) {
                        complete = true;
                        enabled = bEnabled;
                        error = err;
                    });
                });
                
                waitsFor(function () { return complete; }, 1000);
                
                runs(function () {
                    expect(error).toBe(0);
                    expect(enabled).toBe(true);
                });
                
                // Enable it
                runs(function () {
                    complete = false;
                    brackets.app.setMenuItemState(ITEM_ID, false, false, function (err) {
                        complete = true;
                        error = err;
                    });
                });
                
                waitsFor(function () { return complete; }, 1000);
                
                runs(function () {
                    expect(error).toBe(0);
                });

                // Make sure it is enabled
                runs(function () {
                    complete = false;
                    brackets.app.getMenuItemState(ITEM_ID, function (err, bEnabled, bChecked) {
                        complete = true;
                        enabled = bEnabled;
                        error = err;
                    });
                });
                
                waitsFor(function () { return complete; }, 1000);
                
                runs(function () {
                    expect(error).toBe(0);
                    expect(enabled).toBe(false);
                });
            });
            it("should be able to set checked state", function () {
                var complete = false,
                    checked = false,
                    error = 0;
                
                // Should start out unchecked
                runs(function () {
                    brackets.app.getMenuItemState(ITEM_ID, function (err, bEnabled, bChecked) {
                        complete = true;
                        checked = bChecked;
                        error = err;
                    });
                });
                
                waitsFor(function () { return complete; }, 1000);
                
                runs(function () {
                    expect(error).toBe(0);
                    expect(checked).toBe(false);
                });
                
                // Enable it
                runs(function () {
                    complete = false;
                    brackets.app.setMenuItemState(ITEM_ID, true, true, function (err) {
                        complete = true;
                        error = err;
                    });
                });
                
                waitsFor(function () { return complete; }, 1000);
                
                runs(function () {
                    expect(error).toBe(0);
                });

                // Make sure it is enabled
                runs(function () {
                    complete = false;
                    brackets.app.getMenuItemState(ITEM_ID, function (err, bEnabled, bChecked) {
                        complete = true;
                        checked = bChecked;
                        error = err;
                    });
                });
                
                waitsFor(function () { return complete; }, 1000);
                
                runs(function () {
                    expect(error).toBe(0);
                    expect(checked).toBe(true);
                });
            });
            it("should return an error if invalid parameters are passed", function () {
                var complete = false,
                    error = 0;
                
                runs(function () {
                    brackets.app.setMenuItemState(ITEM_ID, "hello", "world", function (err) {
                        complete = true;
                        error = err;
                    });
                });
                
                waitsFor(function () { return complete; }, 1000);
                
                runs(function () {
                    expect(error).toBe(brackets.fs.ERR_INVALID_PARAMS);
                });
            });
        });
                
        describe("getMenuTitle setMenuTitle", function () {
            beforeEach(function () {
                var complete = false,
                    error = 0;
                
                runs(function () {
                    brackets.app.addMenu(TEST_MENU_TITLE, TEST_MENU_ID, "", "", function (err) {
                        if (err) {
                            complete = true;
                            error = err;
                        } else {
                            brackets.app.addMenuItem(TEST_MENU_ID, TEST_MENU_ITEM, TEST_MENU_ITEM_ID, "", "", "", function (err) {
                                complete = true;
                                error = err;
                            });
                        }
                    });
                });
                
                waitsFor(function () { return complete; }, 1000);
                
                runs(function () {
                    expect(error).toBe(0);
                });
            });
            
            afterEach(function () {
                var complete = false,
                    error = 0;
                
                runs(function () {
                    brackets.app.removeMenuItem(TEST_MENU_ITEM_ID, function (err) {
                        if (err) {
                            complete = true;
                            error = err;
                        } else {
                            brackets.app.removeMenu(TEST_MENU_ID, function (err) {
                                complete = true;
                                error = err;
                            });
                        }
                    });
                });
                
                waitsFor(function () { return complete; }, 1000);
                
                runs(function () {
                    expect(error).toBe(0);
                });
            });
            it("should be able to set menu title", function () {
                var NEW_TITLE = "New Title";
                
                var complete = false,
                    error = 0,
                    title;
                
                runs(function () {
                    brackets.app.getMenuTitle(TEST_MENU_ID, function (err, titleStr) {
                        complete = true;
                        title = titleStr;
                        error = err;
                    });
                });
                
                waitsFor(function () { return complete; }, 1000);
                
                runs(function () {
                    expect(error).toBe(0);
                    expect(title).toBe(TEST_MENU_TITLE);
                });
                
                // Change title
                runs(function () {
                    complete = false;
                    brackets.app.setMenuTitle(TEST_MENU_ID, NEW_TITLE, function (err) {
                        complete = true;
                        error = err;
                    });
                });
                
                waitsFor(function () { return complete; }, 1000);
                
                runs(function () {
                    expect(error).toBe(0);
                });

                // Make sure it is set
                runs(function () {
                    complete = false;
                    brackets.app.getMenuTitle(TEST_MENU_ID, function (err, titleStr) {
                        complete = true;
                        title = titleStr;
                        error = err;
                    });
                });
                
                waitsFor(function () { return complete; }, 1000);
                
                runs(function () {
                    expect(error).toBe(0);
                    expect(title).toBe(NEW_TITLE);
                });
            });
            it("should be able to set menu item title", function () {
                var NEW_TITLE = "New Item Title";
                
                var complete = false,
                    error = 0,
                    title;
                
                runs(function () {
                    brackets.app.getMenuTitle(TEST_MENU_ITEM_ID, function (err, titleStr) {
                        complete = true;
                        title = titleStr;
                        error = err;
                    });
                });
                
                waitsFor(function () { return complete; }, 1000);
                
                runs(function () {
                    expect(error).toBe(0);
                    expect(title).toBe(TEST_MENU_ITEM);
                });
                
                // Change title
                runs(function () {
                    complete = false;
                    brackets.app.setMenuTitle(TEST_MENU_ITEM_ID, NEW_TITLE, function (err) {
                        complete = true;
                        error = err;
                    });
                });
                
                waitsFor(function () { return complete; }, 1000);
                
                runs(function () {
                    expect(error).toBe(0);
                });

                // Make sure it is set
                runs(function () {
                    complete = false;
                    brackets.app.getMenuTitle(TEST_MENU_ITEM_ID, function (err, titleStr) {
                        complete = true;
                        title = titleStr;
                        error = err;
                    });
                });
                
                waitsFor(function () { return complete; }, 1000);
                
                runs(function () {
                    expect(error).toBe(0);
                    expect(title).toBe(NEW_TITLE);
                });
            });
            it("should return an error if invalid parameters are passed", function () {
                var complete = false,
                    error = 0;
                
                runs(function () {
                    brackets.app.setMenuTitle(TEST_MENU_ITEM_ID, 42, function (err) {
                        complete = true;
                        error = err;
                    });
                });
                
                waitsFor(function () { return complete; }, 1000);
                
                runs(function () {
                    expect(error).toBe(brackets.fs.ERR_INVALID_PARAMS);
                });
            });
        });
        
    }); // describe("Native Menus")
});
