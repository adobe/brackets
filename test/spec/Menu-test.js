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

            it("should add new menu in first position of list", function () {
                runs(function () {
                    var $listItems = testWindow.$("#main-toolbar > ul.nav").children();
                    expect($listItems.length).toBeGreaterThan(0);

                    var menuCountOriginal = $listItems.length;
                    var menu = Menus.addMenu("Custom", "menu-custom", Menus.FIRST);
                    expect(menu).not.toBeNull();
                    expect(menu).toBeDefined();

                    $listItems = testWindow.$("#main-toolbar > ul.nav").children();
                    expect($listItems.length).toBe(menuCountOriginal + 1);
                    expect($($listItems[0]).attr("id")).toBe("menu-custom");
                });
            });

            it("should add new menu after reference menu", function () {
                runs(function () {
                    var $listItems = testWindow.$("#main-toolbar > ul.nav").children();
                    expect($listItems.length).toBeGreaterThan(0);

                    var menuCountOriginal = $listItems.length;
                    var menu = Menus.addMenu("CustomFirst", "menu-custom-first", Menus.FIRST);
                    menu = Menus.addMenu("CustomAfter", "menu-custom-after", Menus.AFTER, "menu-custom-first");
                    expect(menu).not.toBeNull();
                    expect(menu).toBeDefined();

                    $listItems = testWindow.$("#main-toolbar > ul.nav").children();
                    expect($listItems.length).toBe(menuCountOriginal + 2);
                    expect($($listItems[0]).attr("id")).toBe("menu-custom-first");
                    expect($($listItems[1]).attr("id")).toBe("menu-custom-after");
                });
            });

            it("should add new menu before reference menu", function () {
                runs(function () {
                    var $listItems = testWindow.$("#main-toolbar > ul.nav").children();
                    expect($listItems.length).toBeGreaterThan(0);

                    var menuCountOriginal = $listItems.length;
                    var menu = Menus.addMenu("CustomLast", "menu-custom-last", Menus.LAST);
                    menu = Menus.addMenu("CustomBefore", "menu-custom-before", Menus.BEFORE, "menu-custom-last");
                    expect(menu).not.toBeNull();
                    expect(menu).toBeDefined();

                    $listItems = testWindow.$("#main-toolbar > ul.nav").children();
                    expect($listItems.length).toBe(menuCountOriginal + 2);
                    expect($($listItems[menuCountOriginal]).attr("id")).toBe("menu-custom-before");
                    expect($($listItems[menuCountOriginal + 1]).attr("id")).toBe("menu-custom-last");
                });
            });

            it("should add new menu at end of list when reference menu doesn't exist", function () {
                runs(function () {
                    var $listItems = testWindow.$("#main-toolbar > ul.nav").children();
                    expect($listItems.length).toBeGreaterThan(0);

                    var menuCountOriginal = $listItems.length;
                    var menu = Menus.addMenu("Custom", "menu-custom", Menus.AFTER, "NONEXISTANT");
                    expect(menu).not.toBeNull();
                    expect(menu).toBeDefined();

                    $listItems = testWindow.$("#main-toolbar > ul.nav").children();
                    expect($listItems.length).toBe(menuCountOriginal + 1);
                    expect($($listItems[menuCountOriginal]).attr("id")).toBe("menu-custom");
                });
            });

            it("should not add duplicate menu", function () {
                runs(function () {
                    var $listItems = testWindow.$("#main-toolbar > ul.nav").children();
                    expect($listItems.length).toBeGreaterThan(0);

                    var menuCountOriginal = $listItems.length;
                    var menu1 = Menus.addMenu("Custom", "menu-custom");
                    expect(menu1).not.toBeNull();

                    var menu2 = null;
                    var exceptionThrown = false;
                    try {
                        menu2 = Menus.addMenu("Custom", "menu-custom");
                    } catch (e) {
                        exceptionThrown = true;
                    }
                    expect(exceptionThrown).toBeTruthy();

                    $listItems = testWindow.$("#main-toolbar > ul.nav").children();
                    expect($listItems.length).toBe(menuCountOriginal + 1);
                    expect(menu2).toBeNull();
                });
            });
        });


        describe("Add Menu Items", function () {

            it("should add new menu item to empty menu", function () {
                runs(function () {
                    CommandManager.register("Command Custom", "custom.command", function () {});
                    var menu = Menus.addMenu("Custom", "menu-custom");
                    var $listItems = testWindow.$("#main-toolbar > ul.nav > li#menu-custom > ul").children();
                    expect($listItems.length).toBe(0);

                    // Re-use commands that are already registered
                    var menuItem = menu.addMenuItem("menuitem-custom", "custom.command");
                    expect(menuItem).not.toBeNull();
                    expect(menuItem).toBeDefined();

                    $listItems = testWindow.$("#main-toolbar > ul.nav > li#menu-custom > ul").children();
                    expect($listItems.length).toBe(1);
                    expect($($listItems[0]).length).toBe(1);
                    expect($($listItems[0]).find("a#menuitem-custom").length).toBe(1);
                });
            });

            it("should add new menu item in first position of menu", function () {
                runs(function () {
                    CommandManager.register("Command Custom 0", "custom.command0", function () {});
                    CommandManager.register("Command Custom 1", "custom.command1", function () {});
                    var menu = Menus.addMenu("Custom", "menu-custom");
                    var menuItem = menu.addMenuItem("menuitem-custom-0", "custom.command0");

                    var listSelector = "#main-toolbar > ul.nav > li#menu-custom > ul";
                    var $listItems = testWindow.$(listSelector).children();

                    menuItem = menu.addMenuItem("menuitem-custom-1", "custom.command1", "Ctrl-Alt-0", Menus.FIRST);
                    expect(menuItem).not.toBeNull();
                    expect(menuItem).toBeDefined();

                    $listItems = testWindow.$(listSelector).children();
                    expect($listItems.length).toBe(2);
                    expect($($listItems[0]).find("a#menuitem-custom-1").length).toBe(1);
                });
            });

            it("should add new menu item in last position of menu", function () {
                runs(function () {
                    CommandManager.register("Command Custom 0", "custom.command0", function () {});
                    CommandManager.register("Command Custom 1", "custom.command1", function () {});
                    var menu = Menus.addMenu("Custom", "menu-custom");
                    var menuItem = menu.addMenuItem("menuitem-custom-0", "custom.command0");

                    var listSelector = "#main-toolbar > ul.nav > li#menu-custom > ul";
                    var $listItems = testWindow.$(listSelector).children();

                    menuItem = menu.addMenuItem("menuitem-custom-1", "custom.command1", Menus.LAST);
                    expect(menuItem).not.toBeNull();
                    expect(menuItem).toBeDefined();

                    $listItems = testWindow.$(listSelector).children();
                    expect($listItems.length).toBe(2);
                    expect($($listItems[1]).find("a#menuitem-custom-1").length).toBe(1);
                });
            });

            it("should add new menu item in position after reference menu item", function () {
                runs(function () {
                    CommandManager.register("Command Custom 0", "custom.command0", function () {});
                    CommandManager.register("Command Custom 1", "custom.command1", function () {});
                    CommandManager.register("Command Custom 2", "custom.command2", function () {});
                    var menu = Menus.addMenu("Custom", "menu-custom");
                    var menuItem = menu.addMenuItem("menuitem-custom-0", "custom.command0", "Ctrl-Alt-0");
                    menuItem = menu.addMenuItem("menuitem-custom-1", "custom.command1", "Ctrl-Alt-1");

                    var listSelector = "#main-toolbar > ul.nav > li#menu-custom > ul";
                    var $listItems = testWindow.$(listSelector).children();

                    menuItem = menu.addMenuItem("menuitem-custom-2", "custom.command2", "Ctrl-Alt-2", Menus.AFTER, "menuitem-custom-0");
                    expect(menuItem).not.toBeNull();
                    expect(menuItem).toBeDefined();

                    $listItems = testWindow.$(listSelector).children();
                    expect($listItems.length).toBe(3);
                    expect($($listItems[1]).find("a#menuitem-custom-2").length).toBe(1);
                });
            });

            it("should add new menu item in position before reference menu item", function () {
                runs(function () {
                    CommandManager.register("Command Custom 0", "custom.command0", function () {});
                    CommandManager.register("Command Custom 1", "custom.command1", function () {});
                    CommandManager.register("Command Custom 2", "custom.command2", function () {});
                    var menu = Menus.addMenu("Custom", "menu-custom");
                    var menuItem = menu.addMenuItem("menuitem-custom-0", "custom.command0", "Ctrl-Alt-0");
                    menuItem = menu.addMenuItem("menuitem-custom-1", "custom.command1", "Ctrl-Alt-1");

                    var listSelector = "#main-toolbar > ul.nav > li#menu-custom > ul";
                    var $listItems = testWindow.$(listSelector).children();

                    menuItem = menu.addMenuItem("menuitem-custom-2", "custom.command2", "Ctrl-Alt-2", Menus.BEFORE, "menuitem-custom-1");
                    expect(menuItem).not.toBeNull();
                    expect(menuItem).toBeDefined();

                    $listItems = testWindow.$(listSelector).children();
                    expect($listItems.length).toBe(3);
                    expect($($listItems[1]).find("a#menuitem-custom-2").length).toBe(1);
                });
            });

            it("should add new menu item in last position of menu if reference menu item doesn't exist", function () {
                runs(function () {
                    CommandManager.register("Command Custom 0", "custom.command0", function () {});
                    CommandManager.register("Command Custom 1", "custom.command1", function () {});
                    CommandManager.register("Command Custom 2", "custom.command2", function () {});
                    var menu = Menus.addMenu("Custom", "menu-custom");
                    var menuItem = menu.addMenuItem("menuitem-custom-0", "custom.command0", "Ctrl-Alt-0");
                    menuItem = menu.addMenuItem("menuitem-custom-1", "custom.command1", "Ctrl-Alt-1");

                    var listSelector = "#main-toolbar > ul.nav > li#menu-custom > ul";
                    var $listItems = testWindow.$(listSelector).children();

                    menuItem = menu.addMenuItem("menuitem-custom-2", "custom.command2", "Ctrl-Alt-2", Menus.BEFORE, "NONEXISTANT");
                    expect(menuItem).not.toBeNull();
                    expect(menuItem).toBeDefined();

                    $listItems = testWindow.$(listSelector).children();
                    expect($listItems.length).toBe(3);
                    expect($($listItems[2]).find("a#menuitem-custom-2").length).toBe(1);
                });
            });

            it("should not add duplicate menu item", function () {
                runs(function () {
                    CommandManager.register("Command Custom 0", "custom.command0", function () {});
                    CommandManager.register("Command Custom 1", "custom.command1", function () {});
                    var menu = Menus.addMenu("Custom", "menu-custom");

                    var menuItem = menu.addMenuItem("menuitem-custom-0", "custom.command0");

                    var $listItems = testWindow.$("#main-toolbar > ul.nav > li#menu-custom > ul").children();
                    expect($listItems.length).toBe(1);

                    var exceptionThrown = false;
                    try {
                        menuItem = null;
                        menuItem = menu.addMenuItem("menuitem-custom-0", "custom.command1");
                    } catch (e) {
                        exceptionThrown = true;
                    }
                    expect(exceptionThrown).toBeTruthy();

                    $listItems = testWindow.$("#main-toolbar > ul.nav > li#menu-custom > ul").children();

                    expect($listItems.length).toBe(1);
                    expect(menuItem).toBeNull();
                });
            });

            it("should not add menu item with unregistered command", function () {
                runs(function () {
                    var menu = Menus.addMenu("Custom", "menu-custom");

                    var $listItems = testWindow.$("#main-toolbar > ul.nav > li#menu-custom > ul").children();
                    expect($listItems.length).toBe(0);

                    var menuItem = null;
                    var exceptionThrown = false;
                    try {
                        menuItem = menu.addMenuItem("menuitem-custom-0", "UNREGISTERED_COMMAND");
                    } catch (e) {
                        exceptionThrown = true;
                    }
                    expect(exceptionThrown).toBeTruthy();

                    $listItems = testWindow.$("#main-toolbar > ul.nav > li#menu-custom > ul").children();

                    expect($listItems.length).toBe(0);
                    expect(menuItem).toBeNull();
                });
            });

            it("should add new menu divider", function () {
                runs(function () {
                    CommandManager.register("Command Custom 0", "custom.command0", function () {});
                    CommandManager.register("Command Custom 1", "custom.command1", function () {});
                    var menu = Menus.addMenu("Custom", "menu-custom");

                    var menuItem = null;
                    menuItem = menu.addMenuItem("menuitem-custom-0", "custom.command0");
                    menuItem = menu.addMenuDivider();
                    menuItem = menu.addMenuItem("menuitem-custom-1", "custom.command1");

                    var $listItems = testWindow.$("#main-toolbar > ul.nav > li#menu-custom > ul").children();
                    expect($listItems.length).toBe(3);
                    expect($($listItems[1]).find("hr.divider").length).toBe(1);
                });
            });
        });

        describe("Menu Item synchronizing", function () {

            it("should have same checked state as command", function () {
                runs(function () {
                    var cmd = CommandManager.register("Command Custom 0", "custom.command0", function () {});
                    expect(cmd).not.toBeNull();
                    expect(cmd).toBeDefined();

                    var menu = Menus.addMenu("Custom", "menu-custom");
                    var menuItem = menu.addMenuItem("menuitem-custom-0", "custom.command0");
                    var menuSelector = "#main-toolbar > ul.nav > li#menu-custom > ul > li a#menuitem-custom-0";
                    
                    // Verify menu is synced with command
                    var $menuItem = testWindow.$(menuSelector);
                    expect($($menuItem).hasClass("checked")).toBeFalsy();
                    expect(cmd.getChecked()).toBeFalsy();
                    
                    // toggle command
                    cmd.setChecked(true);
                    expect(cmd.getChecked()).toBeTruthy();

                    // Verify menu gets synced with command
                    expect($($menuItem).hasClass("checked")).toBeTruthy();
                    
                    // toggle command back
                    cmd.setChecked(false);
                    expect(cmd.getChecked()).toBeFalsy();

                    // Verify menu gets synced with command
                    expect($($menuItem).hasClass("checked")).toBeFalsy();
                });
            });

            it("should have same enabled state as command", function () {
                runs(function () {
                    var cmd = CommandManager.register("Command Custom 0", "custom.command0", function () {});
                    expect(cmd).not.toBeNull();
                    expect(cmd).toBeDefined();

                    var menu = Menus.addMenu("Custom", "menu-custom");
                    var menuItem = menu.addMenuItem("menuitem-custom-0", "custom.command0");
                    var menuSelector = "#main-toolbar > ul.nav > li#menu-custom > ul > li a#menuitem-custom-0";
                    
                    // Verify menu is synced with command
                    var $menuItem = testWindow.$(menuSelector);
                    expect($($menuItem).hasClass("disabled")).toBeFalsy();
                    
                    // toggle command
                    cmd.setEnabled(false);
                    expect(cmd.getEnabled()).toBeFalsy();

                    // Verify menu gets synced with command
                    expect($($menuItem).hasClass("disabled")).toBeTruthy();
                    
                    // toggle command back
                    cmd.setEnabled(true);
                    expect(cmd.getEnabled()).toBeTruthy();

                    // Verify menu gets synced with command
                    expect($($menuItem).hasClass("disabled")).toBeFalsy();
                });
            });
        });
    });
});
