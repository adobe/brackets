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
            SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                testWindow = w;

                // Load module instances from brackets.test
                CommandManager      = testWindow.brackets.test.CommandManager;
                Commands            = testWindow.brackets.test.Commands;
                KeyBindingManager   = testWindow.brackets.test.KeyBindingManager;
                Menus               = testWindow.brackets.test.Menus;
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

            it("it should add menu to beginnging and end of menu section", function () {
                // set up test menu and menu items
                CommandManager.register("Brackets Test Command Custom 0", "custom.command0", function () {});
                CommandManager.register("Brackets Test Command Custom 1", "custom.command1", function () {});
                CommandManager.register("Brackets Test Command Custom 2", "custom.command2", function () {});
                CommandManager.register("Brackets Test Command Custom 3", "custom.command3", function () {});
                CommandManager.register("Brackets Test Command Custom 4", "custom.command4", function () {});
                CommandManager.register("Brackets Test Command Custom 5", "custom.command5", function () {});
                CommandManager.register("Brackets Test Command Custom 6", "custom.command6", function () {});
                CommandManager.register("Brackets Test Command Custom 7", "custom.command7", function () {});
                CommandManager.register("Brackets Test Command Custom 8", "custom.command8", function () {});
                var menu = Menus.addMenu("Custom", "menu-custom");
                menu.addMenuItem("custom.command0");
                menu.addMenuItem("custom.command1");
                menu.addMenuDivider();
                menu.addMenuItem("custom.command2");
                menu.addMenuItem("custom.command3");

                // create mock menu sections
                var menuSectionCmd0 = {sectionMarker: "custom.command0"},
                    menuSectionCmd2 = {sectionMarker: "custom.command2"};

                var listSelector = "#menu-custom > ul";

                // Add new menu to END of menuSectionCmd0
                var menuItem = menu.addMenuItem("custom.command4", null, Menus.LAST_IN_SECTION, menuSectionCmd0);
                var $listItems = testWindow.$(listSelector).children();
                expect($listItems.length).toBe(6);
                expect($($listItems[2]).find("a#menu-custom-custom\\.command4").length).toBe(1);

                // Add new menu to END of menuSectionCmd2
                menuItem = menu.addMenuItem("custom.command5", null, Menus.LAST_IN_SECTION, menuSectionCmd2);
                $listItems = testWindow.$(listSelector).children();
                expect($($listItems[6]).find("a#menu-custom-custom\\.command5").length).toBe(1);

                // Add new menu to BEGINNING of menuSectionCmd0
                menuItem = menu.addMenuItem("custom.command6", null, Menus.FIRST_IN_SECTION, menuSectionCmd0);
                $listItems = testWindow.$(listSelector).children();
                expect($($listItems[0]).find("a#menu-custom-custom\\.command6").length).toBe(1);

                // Add new menu to BEGINNING of menuSectionCmd2
                menuItem = menu.addMenuItem("custom.command7", null, Menus.FIRST_IN_SECTION, menuSectionCmd2);
                $listItems = testWindow.$(listSelector).children();
                expect($($listItems[0]).find("a#menu-custom-custom\\.command6").length).toBe(1);

            });

            it("should not add duplicate menu", function () {
                runs(function () {
                    var $listItems = testWindow.$("#main-toolbar > ul.nav").children();
                    expect($listItems.length).toBeGreaterThan(0);

                    var menuCountOriginal = $listItems.length;
                    var menu1 = Menus.addMenu("Custom", "menu-custom");
                    expect(menu1).not.toBeNull();

                    var menu2 = null;
                    
                    menu2 = Menus.addMenu("Custom", "menu-custom");
                    expect(menu2).toBeFalsy();

                    $listItems = testWindow.$("#main-toolbar > ul.nav").children();
                    expect($listItems.length).toBe(menuCountOriginal + 1);
                    expect(menu2).toBeNull();
                });
            });
        });


        describe("Add Menu Items", function () {

            it("should add new menu item to empty menu", function () {
                runs(function () {
                    CommandManager.register("Brackets Test Command Custom", "custom.command", function () {});
                    var menu = Menus.addMenu("Custom", "menu-custom");
                    var $listItems = testWindow.$("#menu-custom > ul").children();
                    expect($listItems.length).toBe(0);

                    // Re-use commands that are already registered
                    var menuItem = menu.addMenuItem("custom.command");
                    expect(menuItem).not.toBeNull();
                    expect(menuItem).toBeDefined();

                    $listItems = testWindow.$("#menu-custom > ul").children();
                    expect($listItems.length).toBe(1);
                    expect($($listItems[0]).length).toBe(1);
                    
                    // Periods (aka "dots") are allowed in HTML identifiers, but jQuery interprets
                    // them as the start of a class selector, so they need to be escaped
                    expect($($listItems[0]).find("a#menu-custom-custom\\.command").length).toBe(1);
                });
            });

            it("should add new menu item in first position of menu", function () {
                runs(function () {
                    CommandManager.register("Brackets Test Command Custom 0", "custom.command0", function () {});
                    CommandManager.register("Brackets Test Command Custom 1", "custom.command1", function () {});
                    var menu = Menus.addMenu("Custom", "menu-custom");
                    var menuItem = menu.addMenuItem("custom.command0");

                    var listSelector = "#menu-custom > ul";
                    var $listItems = testWindow.$(listSelector).children();

                    menuItem = menu.addMenuItem("custom.command1", "Ctrl-Alt-0", Menus.FIRST);
                    expect(menuItem).not.toBeNull();
                    expect(menuItem).toBeDefined();

                    $listItems = testWindow.$(listSelector).children();
                    expect($listItems.length).toBe(2);
                    expect($($listItems[0]).find("a#menu-custom-custom\\.command1").length).toBe(1);
                });
            });

            it("should add new menu item in last position of menu", function () {
                runs(function () {
                    CommandManager.register("Brackets Test Command Custom 0", "custom.command0", function () {});
                    CommandManager.register("Brackets Test Command Custom 1", "custom.command1", function () {});
                    var menu = Menus.addMenu("Custom", "menu-custom");
                    var menuItem = menu.addMenuItem("custom.command0");

                    var listSelector = "#menu-custom > ul";
                    var $listItems = testWindow.$(listSelector).children();

                    menuItem = menu.addMenuItem("custom.command1", Menus.LAST);
                    expect(menuItem).not.toBeNull();
                    expect(menuItem).toBeDefined();

                    $listItems = testWindow.$(listSelector).children();
                    expect($listItems.length).toBe(2);
                    expect($($listItems[1]).find("a#menu-custom-custom\\.command1").length).toBe(1);
                });
            });

            it("should add new menu item in position after reference menu item", function () {
                runs(function () {
                    CommandManager.register("Brackets Test Command Custom 0", "custom.command0", function () {});
                    CommandManager.register("Brackets Test Command Custom 1", "custom.command1", function () {});
                    CommandManager.register("Brackets Test Command Custom 2", "custom.command2", function () {});
                    var menu = Menus.addMenu("Custom", "menu-custom");
                    var menuItem = menu.addMenuItem("custom.command0", "Ctrl-Alt-0");
                    menuItem = menu.addMenuItem("custom.command1", "Ctrl-Alt-1");

                    var listSelector = "#menu-custom > ul";
                    var $listItems = testWindow.$(listSelector).children();

                    menuItem = menu.addMenuItem("custom.command2", "Ctrl-Alt-2", Menus.AFTER, "custom.command0");
                    expect(menuItem).not.toBeNull();
                    expect(menuItem).toBeDefined();

                    $listItems = testWindow.$(listSelector).children();
                    expect($listItems.length).toBe(3);
                    expect($($listItems[1]).find("a#menu-custom-custom\\.command2").length).toBe(1);
                });
            });

            it("should add new menu item in position before reference menu item", function () {
                runs(function () {
                    CommandManager.register("Brackets Test Command Custom 0", "custom.command0", function () {});
                    CommandManager.register("Brackets Test Command Custom 1", "custom.command1", function () {});
                    CommandManager.register("Brackets Test Command Custom 2", "custom.command2", function () {});
                    var menu = Menus.addMenu("Custom", "menu-custom");
                    var menuItem = menu.addMenuItem("custom.command0", "Ctrl-Alt-0");
                    menuItem = menu.addMenuItem("custom.command1", "Ctrl-Alt-1");

                    var listSelector = "#menu-custom > ul";
                    var $listItems = testWindow.$(listSelector).children();

                    menuItem = menu.addMenuItem("custom.command2", "Ctrl-Alt-2", Menus.BEFORE, "custom.command1");
                    expect(menuItem).not.toBeNull();
                    expect(menuItem).toBeDefined();

                    $listItems = testWindow.$(listSelector).children();
                    expect($listItems.length).toBe(3);
                    expect($($listItems[1]).find("a#menu-custom-custom\\.command2").length).toBe(1);
                });
            });

            it("should add new menu item in last position of menu if reference menu item doesn't exist", function () {
                runs(function () {
                    CommandManager.register("Brackets Test Command Custom 0", "custom.command0", function () {});
                    CommandManager.register("Brackets Test Command Custom 1", "custom.command1", function () {});
                    CommandManager.register("Brackets Test Command Custom 2", "custom.command2", function () {});
                    var menu = Menus.addMenu("Custom", "menu-custom");
                    var menuItem = menu.addMenuItem("custom.command0", "Ctrl-Alt-0");
                    menuItem = menu.addMenuItem("custom.command1", "Ctrl-Alt-1");

                    var listSelector = "#menu-custom > ul";
                    var $listItems = testWindow.$(listSelector).children();

                    menuItem = menu.addMenuItem("custom.command2", "Ctrl-Alt-2", Menus.BEFORE, "NONEXISTANT");
                    expect(menuItem).not.toBeNull();
                    expect(menuItem).toBeDefined();

                    $listItems = testWindow.$(listSelector).children();
                    expect($listItems.length).toBe(3);
                    expect($($listItems[2]).find("a#menu-custom-custom\\.command2").length).toBe(1);
                });
            });

            it("should not add menu item for duplicate command in a menu", function () {
                runs(function () {
                    CommandManager.register("Brackets Test Command Custom 0", "custom.command0", function () {});
                    var menu = Menus.addMenu("Custom", "menu-custom");

                    var menuItem = menu.addMenuItem("custom.command0");

                    var $listItems = testWindow.$("#menu-custom > ul").children();
                    expect($listItems.length).toBe(1);

                    menuItem = menu.addMenuItem("custom.command0");
                    expect(menuItem).toBeFalsy();
                    

                    $listItems = testWindow.$("#menu-custom > ul").children();

                    expect($listItems.length).toBe(1);
                    expect(menuItem).toBeNull();
                });
            });

            it("should not add menu item with unregistered command", function () {
                runs(function () {
                    var menu = Menus.addMenu("Custom", "menu-custom");

                    var $listItems = testWindow.$("#menu-custom > ul").children();
                    expect($listItems.length).toBe(0);

                    var menuItem = null;
                    var exceptionThrown = false;
                    try {
                        menuItem = menu.addMenuItem("UNREGISTERED_COMMAND");
                    } catch (e) {
                        exceptionThrown = true;
                    }
                    expect(exceptionThrown).toBeTruthy();

                    $listItems = testWindow.$("#menu-custom > ul").children();

                    expect($listItems.length).toBe(0);
                    expect(menuItem).toBeNull();
                });
            });

            it("should add new menu divider", function () {
                runs(function () {
                    CommandManager.register("Brackets Test Command Custom 0", "custom.command0", function () {});
                    CommandManager.register("Brackets Test Command Custom 1", "custom.command1", function () {});
                    var menu = Menus.addMenu("Custom", "menu-custom");
                    menu.addMenuItem("custom.command0");
                    menu.addMenuItem("custom.command1");
                    
                    // add positioned divider
                    menu.addMenuDivider(Menus.AFTER, "custom.command0");
                    var $listItems = testWindow.$("#menu-custom > ul").children();
                    expect($listItems.length).toBe(3);
                    expect($($listItems[1]).find("hr.divider").length).toBe(1);

                    // add divider to end
                    menu.addMenuDivider();
                    $listItems = testWindow.$("#menu-custom > ul").children();
                    expect($listItems.length).toBe(4);
                    expect($($listItems[3]).find("hr.divider").length).toBe(1);
                });
            });
        });

        describe("Menu Item synchronizing", function () {

            it("should have same checked state as command", function () {
                runs(function () {
                    var cmd = CommandManager.register("Brackets Test Command Custom 0", "custom.command0", function () {});
                    expect(cmd).not.toBeNull();
                    expect(cmd).toBeDefined();

                    var menu = Menus.addMenu("Custom", "menu-custom");
                    menu.addMenuItem("custom.command0");
                    var menuSelector = "#menu-custom-custom\\.command0";
                    
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
                    var cmd = CommandManager.register("Brackets Test Command Custom 0", "custom.command0", function () {});
                    expect(cmd).not.toBeNull();
                    expect(cmd).toBeDefined();

                    var menu = Menus.addMenu("Custom", "menu-custom");
                    menu.addMenuItem("custom.command0");
                    var menuSelector = "#menu-custom-custom\\.command0";
                    
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

            it("should respond to key binding updates", function () {
                runs(function () {
                    CommandManager.register("Brackets Test Command Custom 0", "custom.command0", function () {});
                    var menu = Menus.addMenu("Custom", "menu-custom");
                    menu.addMenuItem("custom.command0", "Ctrl-9");
                    var menuSelector = "#menu-custom-custom\\.command0";
                    
                    // Verify menu is synced with command
                    var $menuItem = testWindow.$(menuSelector),
                        $shortcut = $menuItem.find(".menu-shortcut");
                    
                    // verify key data instead of platform-specific labels
                    if (testWindow.brackets.platform === "win") {
                        expect($shortcut.data("key")).toBe("Ctrl-9");
                    } else if (testWindow.brackets.platform === "mac") {
                        expect($shortcut.data("key")).toBe("Cmd-9");
                    }
                    
                    // change keyboard shortcut
                    KeyBindingManager.addBinding("custom.command0", "Alt-8");
                    
                    // verify updated keyboard shortcut
                    expect($shortcut.data("key")).toBe("Alt-8");
                });
            });
        });


        describe("Context Menus", function () {
            it("register a context menu", function () {
                var cmenu = Menus.registerContextMenu("test-cmenu");
                
                // Add menu item via command id
                CommandManager.register("Brackets Test Command Custom 1", "custom.command1", function () {});
                var menuItem = cmenu.addMenuItem("custom.command1");
                expect(menuItem).toBeTruthy();
                expect(cmenu).toBeTruthy();

                // Add menu item via command object
                var command = CommandManager.register("Brackets Test Command Custom 2", "custom.command2", function () {});
                menuItem = cmenu.addMenuItem(command);
                expect(menuItem).toBeTruthy();

                // add positioned divider
                menuItem = cmenu.addMenuDivider(Menus.BEFORE, "custom.command2");
                var $listItems = testWindow.$("#test-cmenu > ul").children();
                expect($listItems.length).toBe(3);
                expect($($listItems[1]).find("hr.divider").length).toBe(1);

                // add divider to end
                menuItem = cmenu.addMenuDivider();
                $listItems = testWindow.$("#test-cmenu > ul").children();
                expect($listItems.length).toBe(4);
                expect($($listItems[3]).find("hr.divider").length).toBe(1);

                // duplicate command in Menu
                menuItem = cmenu.addMenuItem("custom.command1");
                expect(menuItem).toBeFalsy();

                // duplicate ids
                var cmenu2 = Menus.registerContextMenu("test-cmenu");
                expect(cmenu2).toBeFalsy();
            });

            it("open a context menu", function () {
                runs(function () {
                    var openEvent = false;
                    CommandManager.register("Brackets Test Command Custom", "custom.command", function () {});
                    var cmenu = Menus.registerContextMenu("test-cmenu");
                    cmenu.addMenuItem("custom.command");

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
                    CommandManager.register("Brackets Test Command Custom", "custom.command", function () {});
                    var cmenu = Menus.registerContextMenu("test-cmenu");
                    cmenu.addMenuItem("custom.command");
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
                CommandManager.register("Brackets Test Command Custom", "custom.command", function () {});
                var cmenu = Menus.registerContextMenu("test-cmenu");
                cmenu.addMenuItem("custom.command");

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
                CommandManager.register("Brackets Test Command Custom", "custom.command", function () {});
                var cmenu = Menus.registerContextMenu("test-cmenu");
                cmenu.addMenuItem("custom.command");

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
