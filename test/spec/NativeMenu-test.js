/*
 * Copyright (c) 2013 - present Adobe Systems Incorporated. All rights reserved.
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

/*global describe, it, expect, beforeEach, afterEach, waitsFor, runs */

define(function (require, exports, module) {
    'use strict';

    require("utils/Global");

    // Don't run tests when running in browser or linux
    if (brackets.inBrowser || brackets.platform === "linux") {
        return;
    }

    // These are tests for the low-level file io routines in brackets-app. Make sure
    // you have the latest brackets-app before running.

    describe("Native Menus", function () {

        var PLACEHOLDER_MENU_ID     = "placeholder",
            PLACEHOLDER_MENU_TITLE  = "MENU",
            TEST_MENU_TITLE         = "TEST",
            TEST_MENU_ID            = "test",
            TEST_MENU_ITEM          = "Item 1",
            TEST_MENU_ITEM_ID       = "item1";

        it("should have a brackets.app namespace", function () {
            var complete = false,
                error = 0;

            expect(brackets.app).toBeTruthy();

            // Add an empty native menu so the menu bar doesn't keep flashing
            runs(function () {
                brackets.app.addMenu(PLACEHOLDER_MENU_TITLE, PLACEHOLDER_MENU_ID, "", "", function (err) {
                    complete = true;
                    error = err;
                });
            });

            waitsFor(function () { return complete; });

            expect(error).toBe(0);
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

                waitsFor(function () { return complete; });

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

                waitsFor(function () { return complete; });

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

                waitsFor(function () { return complete; });

                runs(function () {
                    expect(error).toBe(0);
                    expect(title).toBe(TEST_MENU_TITLE);
                });

                // Remove menu
                runs(function () {
                    complete = false;
                    brackets.app.removeMenu(TEST_MENU_ID, function (err) {
                        complete = true;
                        // Ignore error
                    });
                });
                waitsFor(function () { return complete; });
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

                waitsFor(function () { return complete; });

                runs(function () {
                    expect(error).toBe(brackets.fs.ERR_INVALID_PARAMS);
                });
            });
        }); // describe("addMenu")

        describe("addMenu (with reference)", function () {
            var complete = false,
                error = 0,
                parentId,
                position = -1;

            beforeEach(function () {
                runs(function () {
                    complete = false;
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

            it("should add new menu in last position of list", function () {
                error = 0;
                runs(function () {
                    complete = false;
                    brackets.app.addMenu("Custom1", "menu-unittest1", "", "", function (err) {
                        complete = true;
                        error = err;
                    });
                });

                waitsFor(function () { return complete; });

                runs(function () {
                    expect(error).toBe(0);
                });

                // Verify menu is found
                runs(function () {
                    complete = false;
                    parentId = null;
                    position = -1;
                    brackets.app.getMenuPosition("menu-unittest1", function (err, parent, index) {
                        complete = true;
                        error = err;
                        parentId = parent;
                        position = index;
                    });
                });

                waitsFor(function () { return complete; });

                runs(function () {
                    expect(error).toBe(0);
                    expect(parentId).toBe("");
                    expect(position).toBeGreaterThan(0);
                });

                // Remove menu
                runs(function () {
                    complete = false;
                    brackets.app.removeMenu("menu-unittest1", function (err) {
                        complete = true;
                        error = err;
                    });
                });
                waitsFor(function () { return complete; });

                runs(function () {
                    expect(error).toBe(0);
                });
            });

            it("should add new menu after reference menu", function () {
                var targetPos = -1;
                error = 0;

                runs(function () {
                    complete = false;
                    brackets.app.addMenu("CustomFirst", "menu-unittest-first", "first", "", function (err) {
                        complete = true;
                        error = err;
                    });
                });

                waitsFor(function () { return complete; });

                runs(function () {
                    expect(error).toBe(0);
                });

                runs(function () {
                    complete = false;
                    brackets.app.addMenu("CustomAfter", "menu-unittest-after", "after", "menu-unittest-first", function (err) {
                        complete = true;
                        error = err;
                    });
                });

                waitsFor(function () { return complete; });

                runs(function () {
                    expect(error).toBe(0);
                });

                // Verify menu is found
                runs(function () {
                    complete = false;
                    parentId = null;
                    position = -1;
                    targetPos = -1;
                    brackets.app.getMenuPosition("menu-unittest-first", function (err, parent, index) {
                        complete = true;
                        error = err;
                        parentId = parent;
                        position = index;
                        targetPos = position + 1;
                    });
                });

                waitsFor(function () { return complete; });

                runs(function () {
                    expect(error).toBe(0);
                    expect(parentId).toBe("");
                });

                // Verify menu is found
                runs(function () {
                    complete = false;
                    parentId = null;
                    position = -1;
                    brackets.app.getMenuPosition("menu-unittest-after", function (err, parent, index) {
                        complete = true;
                        error = err;
                        parentId = parent;
                        position = index;
                    });
                });

                waitsFor(function () { return complete; });

                runs(function () {
                    expect(error).toBe(0);
                    expect(parentId).toBe("");
                    expect(position).toBe(targetPos);
                });

                // Remove menu
                runs(function () {
                    complete = false;
                    brackets.app.removeMenu("menu-unittest-first", function (err) {
                        complete = true;
                        // Ignore error
                    });
                });
                waitsFor(function () { return complete; });

                runs(function () {
                    complete = false;
                    brackets.app.removeMenu("menu-unittest-after", function (err) {
                        complete = true;
                        // Ignore error
                    });
                });
                waitsFor(function () { return complete; });
            });

            it("should add new menu before reference menu", function () {
                var targetPos = -1;
                error = 0;

                runs(function () {
                    complete = false;
                    brackets.app.addMenu("CustomLast", "menu-unittest-last", "last", "", function (err) {
                        complete = true;
                        error = err;
                    });
                });

                waitsFor(function () { return complete; });

                runs(function () {
                    expect(error).toBe(0);
                });

                runs(function () {
                    complete = false;
                    brackets.app.addMenu("CustomBefore", "menu-unittest-before", "before", "menu-unittest-last", function (err) {
                        complete = true;
                        error = err;
                    });
                });

                waitsFor(function () { return complete; });

                runs(function () {
                    expect(error).toBe(0);
                });

                // Verify menu is found
                runs(function () {
                    complete = false;
                    parentId = null;
                    position = -1;
                    targetPos = -1;
                    brackets.app.getMenuPosition("menu-unittest-last", function (err, parent, index) {
                        complete = true;
                        error = err;
                        parentId = parent;
                        position = index;
                        targetPos = position - 1;
                    });
                });

                waitsFor(function () { return complete; });

                runs(function () {
                    expect(error).toBe(0);
                    expect(parentId).toBe("");
                });

                // Verify menu is found
                runs(function () {
                    complete = false;
                    parentId = null;
                    position = -1;
                    brackets.app.getMenuPosition("menu-unittest-before", function (err, parent, index) {
                        complete = true;
                        error = err;
                        parentId = parent;
                        position = index;
                    });
                });

                waitsFor(function () { return complete; });

                runs(function () {
                    expect(error).toBe(0);
                    expect(parentId).toBe("");
                    expect(position).toBe(targetPos);
                });

                // Remove menu
                runs(function () {
                    complete = false;
                    brackets.app.removeMenu("menu-unittest-last", function (err) {
                        complete = true;
                        // Ignore error
                    });
                });
                waitsFor(function () { return complete; });

                runs(function () {
                    complete = false;
                    brackets.app.removeMenu("menu-unittest-before", function (err) {
                        complete = true;
                        // Ignore error
                    });
                });
                waitsFor(function () { return complete; });
            });

            it("should add new menu at end of list when reference menu doesn't exist", function () {
                error = 0;
                runs(function () {
                    complete = false;
                    brackets.app.addMenu("Custom4", "menu-unittest4", "after", "NONEXISTANT", function (err) {
                        complete = true;
                        error = err;
                    });
                });

                waitsFor(function () { return complete; });

                runs(function () {
                    expect(error).toBe(brackets.fs.ERR_NOT_FOUND);
                });

                // Verify menu is found
                runs(function () {
                    complete = false;
                    parentId = null;
                    position = -1;
                    brackets.app.getMenuPosition("menu-unittest4", function (err, parent, index) {
                        complete = true;
                        error = err;
                        parentId = parent;
                        position = index;
                    });
                });

                waitsFor(function () { return complete; });

                runs(function () {
                    expect(error).toBe(0);
                    expect(parentId).toBe("");
                    expect(position).toBeGreaterThan(0);
                });

                // Remove menu
                runs(function () {
                    complete = false;
                    brackets.app.removeMenu("menu-unittest4", function (err) {
                        complete = true;
                        // Ignore error
                    });
                });
                waitsFor(function () { return complete; });
            });

        }); // describe("addMenu (with reference)")

        describe("addMenuItem", function () {
            var complete = false,
                error = 0,
                title;

            beforeEach(function () {
                runs(function () {
                    complete = false;
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
                error = 0;
                runs(function () {
                    complete = false;
                    brackets.app.addMenuItem(TEST_MENU_ID, TEST_MENU_ITEM, TEST_MENU_ITEM_ID, "", "", "", "", function (err) {
                        complete = true;
                        error = err;
                    });
                });

                waitsFor(function () { return complete; });

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

                waitsFor(function () { return complete; });

                runs(function () {
                    expect(error).toBe(0);
                    expect(title).toBe(TEST_MENU_ITEM);
                    complete = false;
                    brackets.app.removeMenuItem(TEST_MENU_ITEM_ID, function (err) {
                        complete = true;
                    });
                });

                waitsFor(function () { return complete; });
            });

            it("should return an error if invalid parameters are passed", function () {
                runs(function () {
                    error = 0;
                    complete = false;
                    brackets.app.addMenuItem(TEST_MENU_ID, TEST_MENU_ITEM, TEST_MENU_ITEM_ID, "", 42, "", "", function (err) {
                        complete = true;
                        error = err;
                    });
                });

                waitsFor(function () { return complete; });

                runs(function () {
                    expect(error).toBe(brackets.fs.ERR_INVALID_PARAMS);
                });
            });
        }); // describe("addMenuItem")

        describe("addMenuItem (with reference)", function () {
            var complete = false,
                error = 0,
                title,
                parentId = null,
                position = -1;

            beforeEach(function () {
                runs(function () {
                    complete = false;
                    brackets.app.addMenu(TEST_MENU_TITLE, TEST_MENU_ID, "", "", function (err) {
                        complete = true;
                        error = err;
                    });
                });

                waitsFor(function () { return complete; });

                runs(function () {
                    expect(error).toBe(0);
                });

                // Add a menu item into the empty menu
                runs(function () {
                    complete = false;
                    brackets.app.addMenuItem(TEST_MENU_ID, TEST_MENU_ITEM, TEST_MENU_ITEM_ID, "", "", "", "", function (err) {
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
                    brackets.app.removeMenuItem(TEST_MENU_ITEM_ID, function (err) {
                        complete = true;
                    });
                });
                waitsFor(function () { return complete; });

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

            it("should add a menu item in first position of menu", function () {
                error = 0;
                runs(function () {
                    complete = false;
                    brackets.app.addMenuItem(TEST_MENU_ID, "Brackets Test Command Custom 1", "Menu-test.command01", "", "", "first", "", function (err) {
                        complete = true;
                        error = err;
                    });
                });

                waitsFor(function () { return complete; });

                runs(function () {
                    expect(error).toBe(0);
                });

                // Verify item is found in the right position
                runs(function () {
                    complete = false;
                    parentId = null;
                    position = -1;
                    brackets.app.getMenuPosition("Menu-test.command01", function (err, parent, index) {
                        complete = true;
                        error = err;
                        parentId = parent;
                        position = index;
                    });
                });

                waitsFor(function () { return complete; });

                runs(function () {
                    expect(error).toBe(0);
                    expect(parentId).toBe(TEST_MENU_ID);
                    expect(position).toBe(0);
                });

                // Verify item
                runs(function () {
                    complete = false;
                    brackets.app.getMenuTitle("Menu-test.command01", function (err, titleStr) {
                        complete = true;
                        error = err;
                        title = titleStr;
                    });
                });

                waitsFor(function () { return complete; });

                runs(function () {
                    expect(error).toBe(0);
                    expect(title).toBe("Brackets Test Command Custom 1");
                });

                runs(function () {
                    complete = false;
                    brackets.app.removeMenuItem("Menu-test.command01", function (err) {
                        complete = true;
                    });
                });
                waitsFor(function () { return complete; });
            });

            it("should add a menu item in last position of menu", function () {
                error = 0;
                runs(function () {
                    complete = false;
                    brackets.app.addMenuItem(TEST_MENU_ID, "Brackets Test Command Custom 2", "Menu-test.command02", "", "", "last", "", function (err) {
                        complete = true;
                        error = err;
                    });
                });

                waitsFor(function () { return complete; });

                runs(function () {
                    expect(error).toBe(0);
                });

                // Verify item is found in the right position
                runs(function () {
                    complete = false;
                    parentId = null;
                    position = -1;
                    brackets.app.getMenuPosition("Menu-test.command02", function (err, parent, index) {
                        complete = true;
                        error = err;
                        parentId = parent;
                        position = index;
                    });
                });

                waitsFor(function () { return complete; });

                runs(function () {
                    expect(error).toBe(0);
                    expect(parentId).toBe(TEST_MENU_ID);
                    expect(position).toBe(1);
                });

                // Verify item
                runs(function () {
                    complete = false;
                    brackets.app.getMenuTitle("Menu-test.command02", function (err, titleStr) {
                        complete = true;
                        error = err;
                        title = titleStr;
                    });
                });

                waitsFor(function () { return complete; });

                runs(function () {
                    expect(error).toBe(0);
                    expect(title).toBe("Brackets Test Command Custom 2");
                });

                runs(function () {
                    complete = false;
                    brackets.app.removeMenuItem("Menu-test.command02", function (err) {
                        complete = true;
                    });
                });
                waitsFor(function () { return complete; });
            });


            it("should add a menu item after the referenced menu item", function () {
                error = 0;
                runs(function () {
                    complete = false;
                    brackets.app.addMenuItem(TEST_MENU_ID, "Brackets Test Command Custom 3", "Menu-test.command03", "", "", "after", TEST_MENU_ITEM_ID, function (err) {
                        complete = true;
                        error = err;
                    });
                });

                waitsFor(function () { return complete; });

                runs(function () {
                    expect(error).toBe(0);
                });

                // Verify item is found in the right position
                runs(function () {
                    complete = false;
                    parentId = null;
                    position = -1;
                    brackets.app.getMenuPosition("Menu-test.command03", function (err, parent, index) {
                        complete = true;
                        error = err;
                        parentId = parent;
                        position = index;
                    });
                });

                waitsFor(function () { return complete; });

                runs(function () {
                    expect(error).toBe(0);
                    expect(parentId).toBe(TEST_MENU_ID);
                    expect(position).toBe(1);
                });

                // Verify item
                runs(function () {
                    complete = false;
                    brackets.app.getMenuTitle("Menu-test.command03", function (err, titleStr) {
                        complete = true;
                        error = err;
                        title = titleStr;
                    });
                });

                waitsFor(function () { return complete; });

                runs(function () {
                    expect(error).toBe(0);
                    expect(title).toBe("Brackets Test Command Custom 3");
                });

                runs(function () {
                    complete = false;
                    brackets.app.removeMenuItem("Menu-test.command03", function (err) {
                        complete = true;
                    });
                });
                waitsFor(function () { return complete; });
            });

            it("should add a menu item before the referenced menu item", function () {
                error = 0;
                runs(function () {
                    complete = false;
                    brackets.app.addMenuItem(TEST_MENU_ID, "Brackets Test Command Custom 4", "Menu-test.command04", "", "", "before", TEST_MENU_ITEM_ID, function (err) {
                        complete = true;
                        error = err;
                    });
                });

                waitsFor(function () { return complete; });

                runs(function () {
                    expect(error).toBe(0);
                });

                // Verify item is found in the right position
                runs(function () {
                    complete = false;
                    parentId = null;
                    position = -1;
                    brackets.app.getMenuPosition("Menu-test.command04", function (err, parent, index) {
                        complete = true;
                        error = err;
                        parentId = parent;
                        position = index;
                    });
                });

                waitsFor(function () { return complete; });

                runs(function () {
                    expect(error).toBe(0);
                    expect(parentId).toBe(TEST_MENU_ID);
                    expect(position).toBe(0);
                });

                // Verify item
                runs(function () {
                    complete = false;
                    brackets.app.getMenuTitle("Menu-test.command04", function (err, titleStr) {
                        complete = true;
                        error = err;
                        title = titleStr;
                    });
                });

                waitsFor(function () { return complete; });

                runs(function () {
                    expect(error).toBe(0);
                    expect(title).toBe("Brackets Test Command Custom 4");
                });

                runs(function () {
                    complete = false;
                    brackets.app.removeMenuItem("Menu-test.command04", function (err) {
                        complete = true;
                    });
                });
                waitsFor(function () { return complete; });
            });

            it("should add a menu item at the end when reference menu item doesn't exist", function () {
                error = 0;
                runs(function () {
                    complete = false;
                    brackets.app.addMenuItem(TEST_MENU_ID, "Brackets Test Command Custom 5", "Menu-test.command05", "", "", "before", "NONEXISTANT", function (err) {
                        complete = true;
                        error = err;
                    });
                });

                waitsFor(function () { return complete; });

                runs(function () {
                    expect(error).toBe(brackets.fs.ERR_NOT_FOUND);
                });

                // Verify item is found in the right position
                runs(function () {
                    complete = false;
                    parentId = null;
                    position = -1;
                    brackets.app.getMenuPosition("Menu-test.command05", function (err, parent, index) {
                        complete = true;
                        error = err;
                        parentId = parent;
                        position = index;
                    });
                });

                waitsFor(function () { return complete; });

                runs(function () {
                    expect(error).toBe(0);
                    expect(parentId).toBe(TEST_MENU_ID);
                    expect(position).toBe(1);
                });

                // Verify item
                runs(function () {
                    complete = false;
                    brackets.app.getMenuTitle("Menu-test.command05", function (err, titleStr) {
                        complete = true;
                        error = err;
                        title = titleStr;
                    });
                });

                waitsFor(function () { return complete; });

                runs(function () {
                    expect(error).toBe(0);
                    expect(title).toBe("Brackets Test Command Custom 5");
                });

                runs(function () {
                    complete = false;
                    brackets.app.removeMenuItem("Menu-test.command05", function (err) {
                        complete = true;
                    });
                });
                waitsFor(function () { return complete; });
            });

            it("should add menu items to beginning and end of menu section", function () {
                var complete,
                    error,
                    index,
                    parent;

                // set up test menu and menu items
                var SECTION_MENU = "menuitem-sectiontest";
                runs(function () {
                    brackets.app.addMenu("Section Test", "menuitem-sectiontest", "", "", function (err) {});
                    brackets.app.addMenuItem(SECTION_MENU, "Command 10", "Menu-test.command10", "", "", "", "", function (err) {});
                    brackets.app.addMenuItem(SECTION_MENU, "Command 11", "Menu-test.command11", "", "", "", "", function (err) {});
                    brackets.app.addMenuItem(SECTION_MENU, "---", String(Date.now()), "", "", "", "", function (err) {});
                    brackets.app.addMenuItem(SECTION_MENU, "Command 12", "Menu-test.command12", "", "", "", "", function (err) {});
                    brackets.app.addMenuItem(SECTION_MENU, "Command 13", "Menu-test.command13", "", "", "", "", function (err) {});
                });

                // Add new menu to END of menuSectionCmd10
                runs(function () {
                    complete = false;
                    error = 0;
                    brackets.app.addMenuItem(SECTION_MENU, "Command 14", "Menu-test.command14", "", "", "lastInSection", "Menu-test.command10", function (err) {
                        complete = true;
                        error = err;
                    });
                });

                waitsFor(function () { return complete; });

                runs(function () {
                    complete = false;
                    error = 0;
                    brackets.app.getMenuPosition("Menu-test.command14", function (err, par, idx) {
                        complete = true;
                        error = err;
                        parent = par;
                        index = idx;
                    });
                });

                waitsFor(function () { return complete; });

                runs(function () {
                    expect(error).toBe(0);
                    expect(index).toBe(2);
                });

                // Add new menu to END of menuSectionCmd2
                runs(function () {
                    complete = false;
                    error = 0;
                    brackets.app.addMenuItem(SECTION_MENU, "Command 15", "Menu-test.command15", "", "", "lastInSection", "Menu-test.command13", function (err) {
                        complete = true;
                        error = err;
                    });
                });

                waitsFor(function () { return complete; });

                runs(function () {
                    complete = false;
                    error = 0;
                    brackets.app.getMenuPosition("Menu-test.command15", function (err, par, idx) {
                        complete = true;
                        error = err;
                        parent = par;
                        index = idx;
                    });
                });

                waitsFor(function () { return complete; });

                runs(function () {
                    expect(error).toBe(0);
                    expect(index).toBe(6);
                });

                // Add new menu to BEGINNING of menuSectionCmd0
                runs(function () {
                    complete = false;
                    error = 0;
                    brackets.app.addMenuItem(SECTION_MENU, "Command 16", "Menu-test.command16", "", "", "firstInSection", "Menu-test.command11", function (err) {
                        complete = true;
                        error = err;
                    });
                });

                waitsFor(function () { return complete; });

                runs(function () {
                    complete = false;
                    error = 0;
                    brackets.app.getMenuPosition("Menu-test.command16", function (err, par, idx) {
                        complete = true;
                        error = err;
                        parent = par;
                        index = idx;
                    });
                });

                waitsFor(function () { return complete; });

                runs(function () {
                    expect(error).toBe(0);
                    expect(index).toBe(0);
                });

                // Add new menu to BEGINNING of menuSectionCmd2
                runs(function () {
                    complete = false;
                    error = 0;
                    brackets.app.addMenuItem(SECTION_MENU, "Command 17", "Menu-test.command17", "", "", "firstInSection", "Menu-test.command12", function (err) {
                        complete = true;
                        error = err;
                    });
                });

                waitsFor(function () { return complete; });

                runs(function () {
                    complete = false;
                    error = 0;
                    brackets.app.getMenuPosition("Menu-test.command17", function (err, par, idx) {
                        complete = true;
                        error = err;
                        parent = par;
                        index = idx;
                    });
                });

                waitsFor(function () { return complete; });

                runs(function () {
                    expect(error).toBe(0);
                    expect(index).toBe(5);
                });
                runs(function () {
                    brackets.app.removeMenuItem("Menu-test.command10", function (err) {});
                    brackets.app.removeMenuItem("Menu-test.command11", function (err) {});
                    brackets.app.removeMenuItem("Menu-test.command12", function (err) {});
                    brackets.app.removeMenuItem("Menu-test.command13", function (err) {});
                    brackets.app.removeMenuItem("Menu-test.command14", function (err) {});
                    brackets.app.removeMenuItem("Menu-test.command15", function (err) {});
                    brackets.app.removeMenuItem("Menu-test.command16", function (err) {});
                    brackets.app.removeMenuItem("Menu-test.command17", function (err) {});
                    brackets.app.removeMenu(SECTION_MENU, function (err) {});
                });
            });
        });  // describe("addMenuItem (with reference)")

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

                waitsFor(function () { return complete; });

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

                waitsFor(function () { return complete; });

                runs(function () {
                    expect(error).toBe(0);
                });
            });

            it("should return an error if invalid parameters are passed", function () {
                complete = false;
                error = 0;

                runs(function () {
                    brackets.app.removeMenu(42, function (err) {
                        complete = true;
                        error = err;
                    });
                });

                waitsFor(function () { return complete; });

                runs(function () {
                    expect(error).toBe(brackets.fs.ERR_INVALID_PARAMS);
                });
            });

            it("should return an error if the menu can't be found", function () {
                complete = false;
                error = 0;

                runs(function () {
                    brackets.app.removeMenu(TEST_MENU_ID, function (err) {
                        complete = true;
                        error = err;
                    });
                });

                waitsFor(function () { return complete; });

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
                            brackets.app.addMenuItem(TEST_MENU_ID, TEST_MENU_ITEM, ITEM_ID, "", "", "", "", function (err) {
                                complete = true;
                                error = err;
                            });
                        }
                    });
                });

                waitsFor(function () { return complete; });

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

                waitsFor(function () { return complete; });

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

                waitsFor(function () { return complete; }, "calling removeMenuItem");

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

                waitsFor(function () { return complete; }, "calling getMenuTitle");

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

                waitsFor(function () { return complete; }, "calling removeMenuItem");

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

                waitsFor(function () { return complete; }, "calling removeMenuItem");

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
                            brackets.app.addMenuItem(TEST_MENU_ID, TEST_MENU_ITEM, ITEM_ID, "", "", "", "", function (err) {
                                complete = true;
                                error = err;
                            });
                        }
                    });
                });

                waitsFor(function () { return complete; });

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

                waitsFor(function () { return complete; });

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

                waitsFor(function () { return complete; });

                runs(function () {
                    expect(error).toBe(0);
//                    expect(enabled).toBe(true);
                });

                // Enable it
                runs(function () {
                    complete = false;
                    brackets.app.setMenuItemState(ITEM_ID, false, false, function (err) {
                        complete = true;
                        error = err;
                    });
                });

                waitsFor(function () { return complete; });

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

                waitsFor(function () { return complete; });

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

                waitsFor(function () { return complete; });

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

                waitsFor(function () { return complete; });

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

                waitsFor(function () { return complete; });

                runs(function () {
                    expect(error).toBe(0);
//                    expect(checked).toBe(true);
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

                waitsFor(function () { return complete; });

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
                            brackets.app.addMenuItem(TEST_MENU_ID, TEST_MENU_ITEM, TEST_MENU_ITEM_ID, "", "", "", "", function (err) {
                                complete = true;
                                error = err;
                            });
                        }
                    });
                });

                waitsFor(function () { return complete; });

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

                waitsFor(function () { return complete; });

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

                waitsFor(function () { return complete; });

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

                waitsFor(function () { return complete; });

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

                waitsFor(function () { return complete; });

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

                waitsFor(function () { return complete; });

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

                waitsFor(function () { return complete; });

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

                waitsFor(function () { return complete; });

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

                waitsFor(function () { return complete; });

                runs(function () {
                    expect(error).toBe(brackets.fs.ERR_INVALID_PARAMS);
                });
            });
        });

        it("should remove placeholder menu", function () {
            var complete = false,
                error = 0;

            runs(function () {
                brackets.app.removeMenu(PLACEHOLDER_MENU_ID, function (err) {
                    complete = true;
                    error = err;
                });
            });

            waitsFor(function () { return complete; });

            expect(error).toBe(0);
        });
    }); // describe("Native Menus")
});
