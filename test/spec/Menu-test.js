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

    var CommandManager,
        Commands,
        Menus,
        SpecRunnerUtils     = require("./SpecRunnerUtils.js"),
        Strings             = require("strings");

    describe("Menus", function () {

        var testWindow;

        beforeEach(function () {
            SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                testWindow = w;

                // Load module instances from brackets.test
                CommandManager  = testWindow.brackets.test.CommandManager;
                Commands        = testWindow.brackets.test.Commands;
                Menus           = testWindow.brackets.test.Menus;
            });
        });

        afterEach(function () {
            SpecRunnerUtils.closeTestWindow();
        });

        describe("Add Menus", function () {

            it("should add new menu in last position of list", function () {
                runs(function () {
                    var $listItems = testWindow.$("#main-toolbar > ul.nav").children();
                    expect($listItems.length).toBeGreaterThan(0);

                    var menuCountOriginal = $listItems.length;
                    var menu = Menus.addMenu("Custom", "menu-custom");
                    expect(menu).not.toBeNull();
                    expect(menu).toBeDefined();

                    $listItems = testWindow.$("#main-toolbar > ul.nav").children(); // refresh
                    expect($listItems.length).toBe(menuCountOriginal + 1);
                    expect($($listItems[menuCountOriginal]).attr("id")).toBe("menu-custom");
                });
            });

// Not yet implemented            
//            it("should add new menu after reference menu", function () {
//                runs(function () {
//                    var $listItems = testWindow.$("#main-toolbar > ul.nav").children();
//                    expect($listItems.length).toBeGreaterThan(0);
//
//                    var menuCountOriginal = $listItems.length;
//                    var menu = Menus.addMenu("Custom", "menu-custom", Menus.AFTER, Menus.AppMenuBar.FILE_MENU);
//                    expect(menu).not.toBeNull();
//                    expect(menu).toBeDefined();
//
//                    $listItems = testWindow.$("#main-toolbar > ul.nav").children();
//                    expect($listItems.length).toBe(menuCountOriginal + 1);
//                    expect($($listItems[0]).attr("id")).toBe("Strings.FILE_MENU");
//                    expect($($listItems[1]).attr("id")).toBe("menu-custom");
//                });
//            });

// Not yet implemented            
//            it("should add new menu at end of list when reference menu doesn't exist", function () {
//                runs(function () {
//                    var $listItems = testWindow.$("#main-toolbar > ul.nav").children();
//                    expect($listItems.length).toBeGreaterThan(0);
//
//                    var menuCountOriginal = $listItems.length;
//                    var menu = Menus.addMenu("Custom", "menu-custom", Menus.AFTER, "NONEXISTANT");
//                    expect(menu).not.toBeNull();
//                    expect(menu).toBeDefined();
//
//                    $listItems = testWindow.$("#main-toolbar > ul.nav").children();
//                    expect($listItems.length).toBe(menuCountOriginal + 1);
//                    expect($($listItems[menuCountOriginal]).attr("id")).toBe("menu-custom");
//                });
//            });

            it("should not add duplicate menu", function () {
                runs(function () {
                    var $listItems = testWindow.$("#main-toolbar > ul.nav").children();
                    expect($listItems.length).toBeGreaterThan(0);

                    var menuCountOriginal = $listItems.length;
                    var menu = null;

                    try {
                        menu = Menus.addMenu(Strings.FILE_MENU, Menus.AppMenuBar.FILE_MENU);
                    } catch (e) {
                        // catch exception and do nothing
                    }

                    $listItems = testWindow.$("#main-toolbar > ul.nav").children();
                    expect($listItems.length).toBe(menuCountOriginal);
                    expect(menu).toBeNull();
                });
            });
        });


        describe("Add Menu Items", function () {

            it("should add new menu item to empty menu", function () {
                runs(function () {
                    var menu = Menus.addMenu("Custom", "menu-custom");
                    expect(menu).not.toBeNull();
                    expect(menu).toBeDefined();

                    var $listItems = testWindow.$("#main-toolbar > ul.nav > li#menu-custom > ul").children();
                    expect($listItems.length).toBe(0);

                    // Re-use commands that are already registered
                    var menuItem = menu.addMenuItem("menuitem-custom-0", Commands.FILE_NEW);
                    expect(menuItem).not.toBeNull();
                    expect(menuItem).toBeDefined();

                    $listItems = testWindow.$("#main-toolbar > ul.nav > li#menu-custom > ul").children();
                    expect($listItems.length).toBe(1);
                    expect($($listItems[0]).length).toBe(1);
                    expect($($listItems[0]).find("a#menuitem-custom-0").length).toBe(1);
                });
            });

// Not yet implemented            
//            it("should add new menu item in first position of menu", function () {
//                runs(function () {
//                    // Add to existing file menu
//                    var menu = Menus.getMenu(Menus.AppMenuBar.FILE_MENU);
//                    expect(menu).not.toBeNull();
//                    expect(menu).toBeDefined();
//
//                    var listSelector = "#main-toolbar > ul.nav > li#" + Menus.AppMenuBar.FILE_MENU + " > ul";
//                    var $listItems = testWindow.$(listSelector).children();
//                    expect($listItems.length).toBeGreaterThan(0);
//                    var menuItemCountOriginal = $listItems.length;
//
//                    var menuItem = menu.addMenuItem("menuitem-custom-0", Commands.FILE_NEW, Menus.FIRST);
//                    expect(menuItem).not.toBeNull();
//                    expect(menuItem).toBeDefined();
//
//                    $listItems = testWindow.$(listSelector).children();
//                    expect($listItems.length).toBe(menuItemCountOriginal + 1);
//                    expect($($listItems[0]).find("a#menuitem-custom-0").length).toBe(1);
//                });
//            });

            it("should add new menu item in last position of menu", function () {
                runs(function () {
                    var menu = Menus.getMenu(Menus.AppMenuBar.FILE_MENU);
                    expect(menu).not.toBeNull();
                    expect(menu).toBeDefined();

                    var listSelector = "#main-toolbar > ul.nav > li#" + Menus.AppMenuBar.FILE_MENU + " > ul";
                    var $listItems = testWindow.$(listSelector).children();
                    expect($listItems.length).toBeGreaterThan(0);
                    var menuItemCountOriginal = $listItems.length;

                    // Use wacky key binding that's hopefully not used
                    var menuItem = menu.addMenuItem("menuitem-custom-0", Commands.FILE_NEW, "Ctrl-Alt-1", Menus.LAST);
                    expect(menuItem).not.toBeNull();
                    expect(menuItem).toBeDefined();

                    $listItems = testWindow.$(listSelector).children();
                    expect($listItems.length).toBe(menuItemCountOriginal + 1);
                    expect($($listItems[menuItemCountOriginal]).find("a#menuitem-custom-0").length).toBe(1);
                });
            });

// Not yet implemented            
//            it("should add new menu item in position after reference menu item", function () {
//                runs(function () {
//                    // Add to existing file menu
//                    var menu = Menus.getMenu(Menus.AppMenuBar.FILE_MENU);
//                    expect(menu).not.toBeNull();
//                    expect(menu).toBeDefined();
//
//                    var listSelector = "#main-toolbar > ul.nav > li#" + Menus.AppMenuBar.FILE_MENU + " > ul";
//                    var $listItems = testWindow.$(listSelector).children();
//                    expect($listItems.length).toBeGreaterThan(0);
//                    var menuItemCountOriginal = $listItems.length;
//                    menu.addMenuItem("menuitem-custom-0", Commands.FILE_NEW, "Ctrl-Alt-1", Menus.FIRST);
//
//                    // Insert new item after the one we just added in the first position
//                    var menuItem = menu.addMenuItem("menuitem-custom-1", Commands.FILE_NEW, "Ctrl-Alt-1", Menus.AFTER, "menuitem-custom-0");
//                    $listItems = testWindow.$(listSelector).children();
//                    expect($listItems.length).toBe(menuItemCountOriginal + 2);
//                    expect($($listItems[1]).find("a#menuitem-custom-1").length).toBe(1);
//                });
//            });

// Not yet implemented            
//            it("should add new menu item in position before reference menu item", function () {
//                runs(function () {
//                    // Add to existing file menu
//                    var menu = Menus.getMenu(Menus.AppMenuBar.FILE_MENU);
//                    expect(menu).not.toBeNull();
//                    expect(menu).toBeDefined();
//
//                    var listSelector = "#main-toolbar > ul.nav > li#" + Menus.AppMenuBar.FILE_MENU + " > ul";
//                    var $listItems = testWindow.$(listSelector).children();
//                    expect($listItems.length).toBeGreaterThan(0);
//                    var menuItemCountOriginal = $listItems.length;
//                    menuItem = menu.addMenuItem("menuitem-custom-0", Commands.FILE_NEW, "Ctrl-Alt-1", Menus.LAST);
//
//                    // Insert new item after the one we just added in the first position
//                    var menuItem = menu.addMenuItem("menuitem-custom-1", Commands.FILE_NEW, "Ctrl-Alt-1", Menus.BEFORE, "menuitem-custom-0");
//                    $listItems = testWindow.$(listSelector).children();
//                    expect($listItems.length).toBe(menuItemCountOriginal + 2);
//                    expect($($listItems[menuItemCountOriginal]).find("a#menuitem-custom-1").length).toBe(1);
//                });
//            });

            it("should add new menu item in last position of menu if reference menu item doesn't exist", function () {
                runs(function () {
                    var menu = Menus.getMenu(Menus.AppMenuBar.FILE_MENU);
                    expect(menu).not.toBeNull();
                    expect(menu).toBeDefined();

                    var listSelector = "#main-toolbar > ul.nav > li#" + Menus.AppMenuBar.FILE_MENU + " > ul";
                    var $listItems = testWindow.$(listSelector).children();
                    expect($listItems.length).toBeGreaterThan(0);
                    var menuItemCountOriginal = $listItems.length;

                    // Use wacky key binding that's hopefully not used
                    var menuItem = menu.addMenuItem("menuitem-custom-1", Commands.FILE_NEW, "Ctrl-Alt-1", Menus.AFTER, "NONEXISTANT-MENUITEM");
                    expect(menuItem).not.toBeNull();
                    expect(menuItem).toBeDefined();

                    $listItems = testWindow.$(listSelector).children();
                    expect($listItems.length).toBe(menuItemCountOriginal + 1);
                    expect($($listItems[menuItemCountOriginal]).find("a#menuitem-custom-1").length).toBe(1);
                });
            });

            it("should not add duplicate menu item", function () {
                runs(function () {
                    var menu = Menus.addMenu("Custom", "menu-custom");
                    expect(menu).not.toBeNull();
                    expect(menu).toBeDefined();

                    var menuItem = null;
                    menuItem = menu.addMenuItem("menuitem-custom-0", Commands.FILE_NEW);

                    var $listItems = testWindow.$("#main-toolbar > ul.nav > li#menu-custom > ul").children();
                    expect($listItems.length).toBe(1);
                    
                    try {
                        menuItem = null;
                        menuItem = menu.addMenuItem("menuitem-custom-0", Commands.FILE_NEW);
                    } catch (e) {
                        // catch exception and do nothing
                    }

                    $listItems = testWindow.$("#main-toolbar > ul.nav > li#menu-custom > ul").children();

                    expect($listItems.length).toBe(1);
                    expect(menuItem).toBeNull();
                });
            });

            it("should not add menu item with unregistered command", function () {
                runs(function () {
                    var menu = Menus.addMenu("Custom", "menu-custom");
                    expect(menu).not.toBeNull();
                    expect(menu).toBeDefined();

                    var $listItems = testWindow.$("#main-toolbar > ul.nav > li#menu-custom > ul").children();
                    expect($listItems.length).toBe(0);

                    var menuItem = null;

                    try {
                        menuItem = menu.addMenuItem("menuitem-custom-0", "UNREGISTERED_COMMAND");
                    } catch (e) {
                        // catch exception and do nothing
                    }

                    $listItems = testWindow.$("#main-toolbar > ul.nav > li#menu-custom > ul").children();

                    expect($listItems.length).toBe(0);
                    expect(menuItem).toBeNull();
                });
            });

            it("should add new menu divider", function () {
                runs(function () {
                    var menu = Menus.addMenu("Custom", "menu-custom");
                    expect(menu).not.toBeNull();
                    expect(menu).toBeDefined();

                    var menuItem = null;
                    menuItem = menu.addMenuItem("menuitem-custom-0", Commands.FILE_NEW);
                    menuItem = menu.addMenuDivider();
                    menuItem = menu.addMenuItem("menuitem-custom-1", Commands.FILE_NEW);

                    var $listItems = testWindow.$("#main-toolbar > ul.nav > li#menu-custom > ul").children();
                    expect($listItems.length).toBe(3);
                    expect($($listItems[1]).find("hr.divider").length).toBe(1);
                });
            });
        });

        describe("Menu Items synchronizing", function () {

            it("should have same checked state as command", function () {
                runs(function () {
                    var cmd = CommandManager.get(Commands.DEBUG_JSLINT);
                    expect(cmd).not.toBeNull();
                    expect(cmd).toBeDefined();

                    var menuSelector = "#main-toolbar > ul.nav > li#" +
                                       Menus.AppMenuBar.DEBUG_MENU +
                                       " > ul > li a#menu-debug-enable-jslint";
                    var isChecked = cmd.getChecked();
                    
                    // Verify menu is synced with command
                    var $menuItem = testWindow.$(menuSelector);
                    if (isChecked) {
                        expect($($menuItem).hasClass("checked")).toBeTruthy();
                    } else {
                        expect($($menuItem).hasClass("checked")).toBeFalsy();
                    }
                    
                    // toggle command
                    isChecked = !isChecked;
                    cmd.setChecked(isChecked);
                    expect(cmd.getChecked()).toBe(isChecked);

                    // Verify menu gets synced with command
                    $menuItem = testWindow.$(menuSelector);
                    if (isChecked) {
                        expect($($menuItem).hasClass("checked")).toBeTruthy();
                    } else {
                        expect($($menuItem).hasClass("checked")).toBeFalsy();
                    }
                    
                    // toggle command back
                    isChecked = !isChecked;
                    cmd.setChecked(isChecked);
                    expect(cmd.getChecked()).toBe(isChecked);

                    // Verify menu gets synced with command
                    $menuItem = testWindow.$(menuSelector);
                    if (isChecked) {
                        expect($($menuItem).hasClass("checked")).toBeTruthy();
                    } else {
                        expect($($menuItem).hasClass("checked")).toBeFalsy();
                    }
                });
            });

            it("should have same enabled state as command", function () {
                runs(function () {
                    var cmd = CommandManager.get(Commands.DEBUG_JSLINT);
                    expect(cmd).not.toBeNull();
                    expect(cmd).toBeDefined();

                    var menuSelector = "#main-toolbar > ul.nav > li#" +
                                       Menus.AppMenuBar.DEBUG_MENU +
                                       " > ul > li a#menu-debug-enable-jslint";
                    var isEnabled = cmd.getEnabled();
                    
                    // Verify menu is synced with command
                    var $menuItem = testWindow.$(menuSelector);
                    if (isEnabled) {
                        expect($($menuItem).hasClass("disabled")).toBeFalsy();
                    } else {
                        expect($($menuItem).hasClass("disabled")).toBeTruthy();
                    }
                    
                    // toggle command
                    isEnabled = !isEnabled;
                    cmd.setEnabled(isEnabled);
                    expect(cmd.getEnabled()).toBe(isEnabled);

                    // Verify menu gets synced with command
                    $menuItem = testWindow.$(menuSelector);
                    if (isEnabled) {
                        expect($($menuItem).hasClass("disabled")).toBeFalsy();
                    } else {
                        expect($($menuItem).hasClass("disabled")).toBeTruthy();
                    }
                    
                    // toggle command back
                    isEnabled = !isEnabled;
                    cmd.setEnabled(isEnabled);
                    expect(cmd.getEnabled()).toBe(isEnabled);

                    // Verify menu gets synced with command
                    $menuItem = testWindow.$(menuSelector);
                    if (isEnabled) {
                        expect($($menuItem).hasClass("disabled")).toBeFalsy();
                    } else {
                        expect($($menuItem).hasClass("disabled")).toBeTruthy();
                    }
                });
            });
        });
    });
});
