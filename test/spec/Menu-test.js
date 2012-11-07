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
        KeyBindingManager,
        Menus,
        SpecRunnerUtils     = require("spec/SpecRunnerUtils"),
        StringsUtils        = require("utils/StringUtils"),
        Strings             = require("strings");



    describe("Menus", function () {

        var testWindow;

        beforeEach(function () {
            // Create a new window that will be shared by ALL tests in this spec. (We need the tests to
            // run in a real Brackets window since HTMLCodeHints requires various core modules (it can't
            // run 100% in isolation), but popping a new window per testcase is unneeded overhead).
            if (!testWindow) {
                SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                    testWindow = w;
    
                    // Load module instances from brackets.test
                    CommandManager      = testWindow.brackets.test.CommandManager;
                    Commands            = testWindow.brackets.test.Commands;
                    KeyBindingManager   = testWindow.brackets.test.KeyBindingManager;
                    Menus               = testWindow.brackets.test.Menus;
                });

                this.after(function () {
                    SpecRunnerUtils.closeTestWindow();
                });
            }
        });

        describe("Add Menus", function () {

            it("should add new menu in last position of list", function () {
                runs(function () {
                    var $listItems = testWindow.$("#main-toolbar > ul.nav").children();
                    expect($listItems.length).toBeGreaterThan(0);

                    var menuCountOriginal = $listItems.length;
                    var menu = Menus.addMenu("Custom1", "menu-unittest1");
                    expect(menu).not.toBeNull();
                    expect(menu).toBeDefined();

                    $listItems = testWindow.$("#main-toolbar > ul.nav").children(); // refresh
                    expect($listItems.length).toBe(menuCountOriginal + 1);
                    expect($($listItems[menuCountOriginal]).attr("id")).toBe("menu-unittest1");
                });
            });

            it("should add new menu in first position of list", function () {
                runs(function () {
                    var $listItems = testWindow.$("#main-toolbar > ul.nav").children();
                    expect($listItems.length).toBeGreaterThan(0);

                    var menuCountOriginal = $listItems.length;
                    var menu = Menus.addMenu("Custom2", "menu-unittest2", Menus.FIRST);
                    expect(menu).not.toBeNull();
                    expect(menu).toBeDefined();

                    $listItems = testWindow.$("#main-toolbar > ul.nav").children();
                    expect($listItems.length).toBe(menuCountOriginal + 1);
                    expect($($listItems[0]).attr("id")).toBe("menu-unittest2");
                });
            });

            it("should add new menu after reference menu", function () {
                runs(function () {
                    var $listItems = testWindow.$("#main-toolbar > ul.nav").children();
                    expect($listItems.length).toBeGreaterThan(0);

                    var menuCountOriginal = $listItems.length;
                    var menu = Menus.addMenu("CustomFirst", "menu-unittest3-first", Menus.FIRST);
                    menu = Menus.addMenu("CustomAfter", "menu-unittest3-after", Menus.AFTER, "menu-unittest3-first");
                    expect(menu).not.toBeNull();
                    expect(menu).toBeDefined();

                    $listItems = testWindow.$("#main-toolbar > ul.nav").children();
                    expect($listItems.length).toBe(menuCountOriginal + 2);
                    expect($($listItems[0]).attr("id")).toBe("menu-unittest3-first");
                    expect($($listItems[1]).attr("id")).toBe("menu-unittest3-after");
                });
            });

            it("should add new menu before reference menu", function () {
                runs(function () {
                    var $listItems = testWindow.$("#main-toolbar > ul.nav").children();
                    expect($listItems.length).toBeGreaterThan(0);

                    var menuCountOriginal = $listItems.length;
                    var menu = Menus.addMenu("CustomLast", "menu-unittest3-last", Menus.LAST);
                    menu = Menus.addMenu("CustomBefore", "menu-unittest3-before", Menus.BEFORE, "menu-unittest3-last");
                    expect(menu).not.toBeNull();
                    expect(menu).toBeDefined();

                    $listItems = testWindow.$("#main-toolbar > ul.nav").children();
                    expect($listItems.length).toBe(menuCountOriginal + 2);
                    expect($($listItems[menuCountOriginal]).attr("id")).toBe("menu-unittest3-before");
                    expect($($listItems[menuCountOriginal + 1]).attr("id")).toBe("menu-unittest3-last");
                });
            });

            it("should add new menu at end of list when reference menu doesn't exist", function () {
                runs(function () {
                    var $listItems = testWindow.$("#main-toolbar > ul.nav").children();
                    expect($listItems.length).toBeGreaterThan(0);

                    var menuCountOriginal = $listItems.length;
                    var menu = Menus.addMenu("Custom3", "menu-unittest4", Menus.AFTER, "NONEXISTANT");
                    expect(menu).not.toBeNull();
                    expect(menu).toBeDefined();

                    $listItems = testWindow.$("#main-toolbar > ul.nav").children();
                    expect($listItems.length).toBe(menuCountOriginal + 1);
                    expect($($listItems[menuCountOriginal]).attr("id")).toBe("menu-unittest4");
                });
            });

            it("should not add duplicate menu", function () {
                runs(function () {
                    var $listItems = testWindow.$("#main-toolbar > ul.nav").children();
                    expect($listItems.length).toBeGreaterThan(0);

                    var menuCountOriginal = $listItems.length;
                    var menu1 = Menus.addMenu("Custom5", "menu-unittest5");
                    expect(menu1).not.toBeNull();

                    var menu2 = null;
                    
                    menu2 = Menus.addMenu("Custom5", "menu-unittest5");
                    expect(menu2).toBeFalsy();

                    $listItems = testWindow.$("#main-toolbar > ul.nav").children();
                    expect($listItems.length).toBe(menuCountOriginal + 1);
                    expect(menu2).toBeNull();
                });
            });
        });


        describe("Add Menu Items", function () {

            it("should add new menu items", function () {
                runs(function () {
                    var menu = Menus.addMenu("MenuItem Menu 0", "menuitem-unittest0");
                    var listSelector = "#menuitem-unittest0 > ul";
                    var $listItems = testWindow.$(listSelector).children();
                    expect($listItems.length).toBe(0);


                    // add new menu item to empty menu
                    CommandManager.register("Brackets Test Command Custom 0", "Menu-test.command00", function () {});
                    var menuItem = menu.addMenuItem("Menu-test.command00");
                    expect(menuItem).not.toBeNull();
                    expect(menuItem).toBeDefined();

                    $listItems = testWindow.$(listSelector).children();
                    expect($listItems.length).toBe(1);
                    expect($($listItems[0]).length).toBe(1);
                    
                    // Periods (aka "dots") are allowed in HTML identifiers, but jQuery interprets
                    // them as the start of a class selector, so they need to be escaped
                    expect($($listItems[0]).find("a#menuitem-unittest0-Menu-test\\.command00").length).toBe(1);


                    // add new menu item in first position of menu
                    CommandManager.register("Brackets Test Command Custom 1", "Menu-test.command01", function () {});
                    menuItem = menu.addMenuItem("Menu-test.command01", "Ctrl-Alt-1", Menus.FIRST);
                    expect(menuItem).not.toBeNull();
                    expect(menuItem).toBeDefined();

                    $listItems = testWindow.$(listSelector).children();
                    expect($listItems.length).toBe(2);
                    expect($($listItems[0]).find("a#menuitem-unittest0-Menu-test\\.command01").length).toBe(1);


                    // add new menu item in last position of menu
                    CommandManager.register("Brackets Test Command Custom 2", "Menu-test.command02", function () {});
                    menuItem = menu.addMenuItem("Menu-test.command02", Menus.LAST);
                    expect(menuItem).not.toBeNull();
                    expect(menuItem).toBeDefined();

                    $listItems = testWindow.$(listSelector).children();
                    expect($listItems.length).toBe(3);
                    expect($($listItems[2]).find("a#menuitem-unittest0-Menu-test\\.command02").length).toBe(1);


                    // add new menu item in position after reference command
                    CommandManager.register("Brackets Test Command Custom 3", "Menu-test.command03", function () {});
                    menuItem = menu.addMenuItem("Menu-test.command03", "Ctrl-Alt-3", Menus.AFTER, "Menu-test.command01");
                    expect(menuItem).not.toBeNull();
                    expect(menuItem).toBeDefined();

                    $listItems = testWindow.$(listSelector).children();
                    expect($listItems.length).toBe(4);
                    expect($($listItems[1]).find("a#menuitem-unittest0-Menu-test\\.command03").length).toBe(1);


                    // add new menu item in position before reference command
                    CommandManager.register("Brackets Test Command Custom 4", "Menu-test.command04", function () {});
                    menuItem = menu.addMenuItem("Menu-test.command04", "Ctrl-Alt-4", Menus.BEFORE, "Menu-test.command01");
                    expect(menuItem).not.toBeNull();
                    expect(menuItem).toBeDefined();

                    $listItems = testWindow.$(listSelector).children();
                    expect($listItems.length).toBe(5);
                    expect($($listItems[0]).find("a#menuitem-unittest0-Menu-test\\.command04").length).toBe(1);


                    // add positioned divider
                    menu.addMenuDivider(Menus.AFTER, "Menu-test.command04");
                    $listItems = testWindow.$(listSelector).children();
                    expect($listItems.length).toBe(6);
                    expect($($listItems[1]).find("hr.divider").length).toBe(1);


                    // add divider to end
                    menu.addMenuDivider();
                    $listItems = testWindow.$(listSelector).children();
                    expect($listItems.length).toBe(7);
                    expect($($listItems[6]).find("hr.divider").length).toBe(1);
                });
            });

            it("should add menu items to beginnging and end of menu section", function () {
                // set up test menu and menu items
                CommandManager.register("Brackets Test Command Section 10", "Menu-test.command10", function () {});
                CommandManager.register("Brackets Test Command Section 11", "Menu-test.command11", function () {});
                CommandManager.register("Brackets Test Command Section 12", "Menu-test.command12", function () {});
                CommandManager.register("Brackets Test Command Section 13", "Menu-test.command13", function () {});
                CommandManager.register("Brackets Test Command Section 14", "Menu-test.command14", function () {});
                CommandManager.register("Brackets Test Command Section 15", "Menu-test.command15", function () {});
                CommandManager.register("Brackets Test Command Section 16", "Menu-test.command16", function () {});
                CommandManager.register("Brackets Test Command Section 17", "Menu-test.command17", function () {});
                CommandManager.register("Brackets Test Command Section 18", "Menu-test.command18", function () {});

                var menu = Menus.addMenu("Section Test", "menuitem-unittest1");
                menu.addMenuItem("Menu-test.command10");
                menu.addMenuItem("Menu-test.command11");
                menu.addMenuDivider();
                menu.addMenuItem("Menu-test.command12");
                menu.addMenuItem("Menu-test.command13");

                // create mock menu sections
                var menuSectionCmd0 = {sectionMarker: "Menu-test.command10"},
                    menuSectionCmd2 = {sectionMarker: "Menu-test.command12"};

                var listSelector = "#menuitem-unittest1 > ul";

                // Add new menu to END of menuSectionCmd0
                var menuItem = menu.addMenuItem("Menu-test.command14", null, Menus.LAST_IN_SECTION, menuSectionCmd0);
                var $listItems = testWindow.$(listSelector).children();
                expect($listItems.length).toBe(6);
                expect($($listItems[2]).find("a#menuitem-unittest1-Menu-test\\.command14").length).toBe(1);

                // Add new menu to END of menuSectionCmd2
                menuItem = menu.addMenuItem("Menu-test.command15", null, Menus.LAST_IN_SECTION, menuSectionCmd2);
                $listItems = testWindow.$(listSelector).children();
                expect($listItems.length).toBe(7);
                expect($($listItems[6]).find("a#menuitem-unittest1-Menu-test\\.command15").length).toBe(1);

                // Add new menu to BEGINNING of menuSectionCmd0
                menuItem = menu.addMenuItem("Menu-test.command16", null, Menus.FIRST_IN_SECTION, menuSectionCmd0);
                $listItems = testWindow.$(listSelector).children();
                expect($listItems.length).toBe(8);
                expect($($listItems[0]).find("a#menuitem-unittest1-Menu-test\\.command16").length).toBe(1);

                // Add new menu to BEGINNING of menuSectionCmd2
                menuItem = menu.addMenuItem("Menu-test.command17", null, Menus.FIRST_IN_SECTION, menuSectionCmd2);
                $listItems = testWindow.$(listSelector).children();
                expect($listItems.length).toBe(9);
                expect($($listItems[5]).find("a#menuitem-unittest1-Menu-test\\.command17").length).toBe(1);
            });

            it("should add new menu item in last position of menu if reference command isn't found in menu", function () {
                runs(function () {
                    CommandManager.register("Brackets Test Command Custom 20", "Menu-test.command20", function () {});
                    var menu = Menus.addMenu("Custom 2", "menuitem-unittest2");
                    menu.addMenuItem("Menu-test.command20", "Ctrl-Alt-0");
                    var listSelector = "#menuitem-unittest2 > ul";

                    // reference command doesn't exist
                    CommandManager.register("Brackets Test Command Custom 21", "Menu-test.command21", function () {});
                    var menuItem = menu.addMenuItem("Menu-test.command21", "Ctrl-Alt-2", Menus.BEFORE, "NONEXISTANT");
                    expect(menuItem).not.toBeNull();
                    expect(menuItem).toBeDefined();

                    var $listItems = testWindow.$(listSelector).children();
                    expect($listItems.length).toBe(2);
                    expect($($listItems[1]).find("a#menuitem-unittest2-Menu-test\\.command21").length).toBe(1);


                    // reference command is in different menu
                    CommandManager.register("Brackets Test Command Custom 22", "Menu-test.command22", function () {});
                    var menuOther = Menus.addMenu("Custom 2 Other", "menuitem-unittest2-other");
                    menuOther.addMenuItem("Menu-test.command22", "Ctrl-Alt-2");

                    CommandManager.register("Brackets Test Command Custom 23", "Menu-test.command23", function () {});
                    menuItem = menu.addMenuItem("Menu-test.command23", "Ctrl-Alt-3", Menus.BEFORE, "Menu-test.command22");
                    expect(menuItem).not.toBeNull();
                    expect(menuItem).toBeDefined();

                    $listItems = testWindow.$(listSelector).children();
                    expect($listItems.length).toBe(3);
                    expect($($listItems[2]).find("a#menuitem-unittest2-Menu-test\\.command23").length).toBe(1);


                    // reference command exists, but isn't in any menu
                    CommandManager.register("Brackets Test Command Custom 24", "Menu-test.command24", function () {});
                    CommandManager.register("Brackets Test Command Custom 25", "Menu-test.command25", function () {});

                    menuItem = menu.addMenuItem("Menu-test.command24", "Ctrl-Alt-1", Menus.BEFORE, "Menu-test.command25");
                    expect(menuItem).not.toBeNull();
                    expect(menuItem).toBeDefined();

                    $listItems = testWindow.$(listSelector).children();
                    expect($listItems.length).toBe(4);
                    expect($($listItems[3]).find("a#menuitem-unittest2-Menu-test\\.command24").length).toBe(1);
                });
            });

            it("should not add menu item for these cases", function () {
                runs(function () {
                    CommandManager.register("Brackets Test Command Custom 30", "Menu-test.command30", function () {});
                    var menu = Menus.addMenu("Custom 3", "menuitem-unittest3");
                    var listSelector = "#menuitem-unittest3 > ul";
                    var menuItem = menu.addMenuItem("Menu-test.command30");
                    expect(menuItem).toBeTruthy();
                    var $listItems = testWindow.$(listSelector).children();
                    expect($listItems.length).toBe(1);

                    // duplicate command in a menu
                    menuItem = menu.addMenuItem("Menu-test.command30");
                    expect(menuItem).toBeFalsy();
                    
                    $listItems = testWindow.$(listSelector).children();
                    expect($listItems.length).toBe(1);
                    expect(menuItem).toBeNull();


                    // unregistered command
                    menuItem = null;
                    var exceptionThrown = false;
                    try {
                        menuItem = menu.addMenuItem("UNREGISTERED_COMMAND");
                    } catch (e) {
                        exceptionThrown = true;
                    }
                    expect(exceptionThrown).toBeTruthy();

                    $listItems = testWindow.$(listSelector).children();
                    expect($listItems.length).toBe(1);
                    expect(menuItem).toBeNull();
                });
            });
        });


        describe("Remove Menu Items", function () {
            
            function menuDOMChildren(menuItemId) {
                return testWindow.$("#" + menuItemId + " > ul").children();
            }
            
            it("should add then remove new menu item to empty menu with a command id", function () {
                runs(function () {
                    var commandId = "Menu-test.removeMenuItem.command0";
                    var menuItemId = "menu-test-removeMenuItem0";
                    CommandManager.register("Brackets Test Command Custom", commandId, function () {});
                    var menu = Menus.addMenu("Custom", menuItemId);
                    var $listItems = menuDOMChildren(menuItemId);
                    expect($listItems.length).toBe(0);

                    // Re-use commands that are already registered
                    var menuItem = menu.addMenuItem(commandId);
                    expect(menuItem).not.toBeNull();
                    expect(menuItem).toBeDefined();

                    expect(typeof (commandId)).toBe("string");

                    $listItems = menuDOMChildren(menuItemId);
                    expect($listItems.length).toBe(1);

                    menu.removeMenuItem(commandId);
                    $listItems = menuDOMChildren(menuItemId);
                    expect($listItems.length).toBe(0);
                });
            });

            it("should add then remove new menu item to empty menu with a command", function () {
                runs(function () {
                    var commandId = "Menu-test.removeMenuItem.command1";
                    var menuItemId = "menu-test-removeMenuItem1";
                    CommandManager.register("Brackets Test Command Custom", commandId, function () {});
                    var menu = Menus.addMenu("Custom", menuItemId);
                    var $listItems = testWindow.$("#menu-custom > ul").children();
                    expect($listItems.length).toBe(0);

                    // Re-use commands that are already registered
                    var menuItem = menu.addMenuItem(commandId);
                    expect(menuItem).not.toBeNull();
                    expect(menuItem).toBeDefined();

                    $listItems = menuDOMChildren(menuItemId);
                    expect($listItems.length).toBe(1);

                    var command = CommandManager.get(commandId);
                    expect(typeof (command)).toBe("object");

                    menu.removeMenuItem(command);
                    $listItems = menuDOMChildren(menuItemId);
                    expect($listItems.length).toBe(0);
                });
            });

            it("should gracefully handle someone trying to delete a menu item that doesn't exist", function () {
                runs(function () {
                    var commandId = "Menu-test.removeMenuItem.command2";
                    var menuItemId = "menu-test-removeMenuItem2";
                    var menu = Menus.addMenu("Custom", menuItemId);

                    var exceptionThrown = false;
                    try {
                        menu.removeMenuItem(commandId);
                    } catch (e) {
                        exceptionThrown = true;
                    }
                    expect(exceptionThrown).toBeTruthy();
                });
            });

            it("should gracefully handle someone trying to delete nothing", function () {
                runs(function () {
                    var menuItemId = "menu-test-removeMenuItem3";
                    var menu = Menus.addMenu("Custom", menuItemId);

                    var exceptionThrown = false;
                    try {
                        menu.removeMenuItem();
                    } catch (e) {
                        exceptionThrown = true;
                    }
                    expect(exceptionThrown).toBeTruthy();
                });
            });
        });
        
        
        describe("Menu Item synchronizing", function () {

            it("should have same state as command", function () {
                runs(function () {

                    // checked state
                    var cmd = CommandManager.register("Brackets Test Command Custom 40", "Menu-test.command40", function () {});
                    expect(cmd).not.toBeNull();
                    expect(cmd).toBeDefined();

                    var menu = Menus.addMenu("Synchronizing Menu", "menuitem-unittest4");
                    menu.addMenuItem("Menu-test.command40");
                    var menuSelector = "#menuitem-unittest4-Menu-test\\.command40";
                    
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


                    // enabled state
                    $menuItem = testWindow.$(menuSelector);
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


                    // key bindings
                    CommandManager.register("Brackets Test Command Custom 41", "Menu-test.command41", function () {});
                    menu.addMenuItem("Menu-test.command41", "Ctrl-9");
                    menuSelector = "#menuitem-unittest4-Menu-test\\.command41";
                    
                    // Verify menu is synced with command
                    $menuItem = testWindow.$(menuSelector);
                    var $shortcut = $menuItem.find(".menu-shortcut");
                    
                    // verify key data instead of platform-specific labels
                    if (testWindow.brackets.platform === "win") {
                        expect($shortcut.data("key")).toBe("Ctrl-9");
                    } else if (testWindow.brackets.platform === "mac") {
                        expect($shortcut.data("key")).toBe("Cmd-9");
                    }
                    
                    // change keyboard shortcut
                    KeyBindingManager.addBinding("Menu-test.command41", "Alt-8");
                    
                    // verify updated keyboard shortcut
                    expect($shortcut.data("key")).toBe("Alt-8");
                });
            });
        });


        describe("Context Menus", function () {
            it("register a context menu", function () {
                var cmenu = Menus.registerContextMenu("test-cmenu50");

                // Add menu item via command id
                CommandManager.register("Brackets Test Command Custom 50", "Menu-test.command50", function () {});
                var menuItem = cmenu.addMenuItem("Menu-test.command50");
                expect(menuItem).toBeTruthy();
                expect(cmenu).toBeTruthy();

                // Add menu item via command object
                var command = CommandManager.register("Brackets Test Command Custom 51", "Menu-test.command51", function () {});
                menuItem = cmenu.addMenuItem(command);
                expect(menuItem).toBeTruthy();

                // add positioned divider
                menuItem = cmenu.addMenuDivider(Menus.BEFORE, "Menu-test.command51");
                var $listItems = testWindow.$("#test-cmenu50 > ul").children();
                expect($listItems.length).toBe(3);
                expect($($listItems[1]).find("hr.divider").length).toBe(1);

                // add divider to end
                menuItem = cmenu.addMenuDivider();
                $listItems = testWindow.$("#test-cmenu50 > ul").children();
                expect($listItems.length).toBe(4);
                expect($($listItems[3]).find("hr.divider").length).toBe(1);

                // duplicate command in Menu
                menuItem = cmenu.addMenuItem("Menu-test.command50");
                expect(menuItem).toBeFalsy();

                // duplicate ids
                var cmenu2 = Menus.registerContextMenu("test-cmenu50");
                expect(cmenu2).toBeFalsy();
            });

            it("open a context menu", function () {
                runs(function () {
                    var openEvent = false;
                    var cmenu = Menus.registerContextMenu("test-cmenu51");
                    CommandManager.register("Brackets Test Command Custom 51", "Menu-test.command51", function () {});
                    var menuItem = cmenu.addMenuItem("Menu-test.command51");

                    testWindow.$(cmenu).on("beforeContextMenuOpen", function () {
                        openEvent = true;
                    });

                    cmenu.open({pageX: 300, pageY: 250});
                    var $menu = testWindow.$(".dropdown.open > ul");

                    // all other drops downs should be closed
                    expect($menu.length).toBe(1);

                    // position is at correct location
                    expect($menu.offset().left).toBe(300);
                    expect($menu.offset().top).toBe(250);
                    expect(openEvent).toBeTruthy();
                });
            });

            function getBounds(object) {
                return {
                    left:   object.offset().left,
                    top:    object.offset().top,
                    right:  object.offset().left + object.width(),
                    bottom: object.offset().top + object.height()
                };
            }

            function boundsInsideWindow(object) {
                var bounds = getBounds(object);
                return bounds.left >= 0 &&
                       bounds.right <= $(testWindow).width() &&
                       bounds.top >= 0 &&
                       bounds.bottom <= $(testWindow).height();
            }
                
            it("context menu is not clipped", function () {
                runs(function () {
                    var cmenu = Menus.registerContextMenu("test-cmenu52");
                    CommandManager.register("Brackets Test Command Custom 52", "Menu-test.command52", function () {});
                    var menuItem = cmenu.addMenuItem("Menu-test.command52");
                    var winWidth = $(testWindow).width();
                    var winHeight = $(testWindow).height();
                    
                    cmenu.open({pageX: 0, pageY: 0});
                    var $menu = testWindow.$(".dropdown.open > ul");
                    expect(boundsInsideWindow($menu)).toBeTruthy();

                    cmenu.open({pageX: winHeight, pageY: winWidth});
                    $menu = testWindow.$(".dropdown.open > ul");
                    expect(boundsInsideWindow($menu)).toBeTruthy();

                    cmenu.open({pageX: 0, pageY: winWidth});
                    $menu = testWindow.$(".dropdown.open > ul");
                    expect(boundsInsideWindow($menu)).toBeTruthy();

                    cmenu.open({pageX: winHeight, pageY: 0});
                    $menu = testWindow.$(".dropdown.open > ul");
                    expect(boundsInsideWindow($menu)).toBeTruthy();
                });
            });

            it("close context menu", function () {
                var cmenu = Menus.registerContextMenu("test-cmenu53");
                CommandManager.register("Brackets Test Command Custom 53", "Menu-test.command53", function () {});
                var menuItem = cmenu.addMenuItem("Menu-test.command53");

                var closeEvent = false;
                testWindow.$(cmenu).on("contextMenuClose", function () {
                    closeEvent = true;
                });
                cmenu.open({pageX: 0, pageY: 0});
                
                // verify close event
                cmenu.close();
                expect(closeEvent).toBeTruthy();

                // verify all dropdowns are closed
                var $menus = testWindow.$(".dropdown.open");
                expect($menus.length).toBe(0);
            });

            it("close context menu using Esc key", function () {
                var cmenu = Menus.registerContextMenu("test-cmenu54");
                CommandManager.register("Brackets Test Command Custom 54", "Menu-test.command54", function () {});
                var menuItem = cmenu.addMenuItem("Menu-test.command54");

                var closeEvent = false;
                testWindow.$(cmenu).on("contextMenuClose", function () {
                    closeEvent = true;
                });
                cmenu.open({pageX: 0, pageY: 0});

                // verify dropdown is open
                var $menus = testWindow.$(".dropdown.open");
                expect($menus.length).toBe(1);

                // close the context menu by simulating Esc key
                var key = 27,   // Esc key
                    element = $menus[0];
                SpecRunnerUtils.simulateKeyEvent(key, "keydown", element);

                // verify close event
                expect(closeEvent).toBeTruthy();

                // verify all dropdowns are closed
                $menus = testWindow.$(".dropdown.open");
                expect($menus.length).toBe(0);
            });
        });
    });
});
