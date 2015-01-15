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
/*global define, describe, beforeEach, afterEach, it, expect, brackets, spyOn, runs, waits */
/*unittests: KeyBindingManager */

define(function (require, exports, module) {
    'use strict';
    
    require("utils/Global");

    // Load dependent modules
    var CommandManager      = require("command/CommandManager"),
        Dialogs             = require("widgets/Dialogs"),
        KeyBindingManager   = require("command/KeyBindingManager"),
        KeyEvent            = require("utils/KeyEvent"),
        SpecRunnerUtils     = require("spec/SpecRunnerUtils"),
        Strings             = require("strings"),
        _                   = require("thirdparty/lodash");
    
    var platform = brackets.platform;
        
    var testPath            = SpecRunnerUtils.getTestPath("/spec/KeyBindingManager-test-files");

    var executed,
        testCommandFn       = function () { executed = true; };
    
    var defaultKeyBindings = {
            "Ctrl-L": "edit.selectLine",
            "Ctrl-Alt-L": "edit.splitSelIntoLines",
            "Alt-Shift-Down": "edit.addCursorToNextLine",
            "Alt-Shift-Up": "edit.addCursorToPrevLine",
            "F8": "navigate.gotoFirstProblem",
            "Ctrl-Alt-O": "file.openFolder",
            "Ctrl-Alt-H": "view.hideSidebar",
            "Ctrl-Shift-O": "navigate.quickOpen",
            "Ctrl-T": "navigate.gotoDefinition"
        },
        macDefaultKeyBindings = {
            "Ctrl-L": "edit.selectLine",
            "Alt-Cmd-L": "edit.splitSelIntoLines",
            "Alt-Shift-Down": "edit.addCursorToNextLine",
            "Alt-Shift-Up": "edit.addCursorToPrevLine",
            "Cmd-'": "navigate.gotoFirstProblem",
            "Alt-Cmd-O": "file.openFolder",
            "Shift-Cmd-H": "view.hideSidebar",
            "Shift-Cmd-O": "navigate.quickOpen",
            "Cmd-T": "navigate.gotoDefinition"
        };

    
    function key(k, displayKey, explicitPlatform) {
        return {
            key                 : k,
            displayKey          : displayKey || k,
            explicitPlatform    : explicitPlatform
        };
    }
    
    function keyBinding(k, commandID, displayKey, explicitPlatform) {
        var obj = key(k, displayKey, explicitPlatform);
        obj.commandID = commandID;
        
        return obj;
    }
    
    function keyMap(keyBindings) {
        var map = {};
        
        keyBindings.forEach(function (k) {
            map[k.key] = k;
        });
        
        return map;
    }
    
    function populateDefaultKeyMap() {
        var defaults = (platform === "mac") ? macDefaultKeyBindings : defaultKeyBindings,
            index = 0;

        _.forEach(defaults, function (commandID, key) {
            ++index;
            CommandManager.register("test command" + index.toString(), commandID, testCommandFn);
        });
    }
    
    function getDefaultKeyMap() {
        var bindings = [],
            defaults = (platform === "mac") ? macDefaultKeyBindings : defaultKeyBindings,
            displayKey = "",
            explicitPlatform;
        
        _.forEach(defaults, function (commandID, key) {
            displayKey = KeyBindingManager._getDisplayKey(key);
            if (platform === "mac") {
                explicitPlatform = undefined;
                if (commandID === "edit.selectLine" || commandID === "view.hideSidebar" ||
                        commandID === "navigate.gotoFirstProblem") {
                    explicitPlatform = "mac";
                }
            }
            bindings.push(keyBinding(key, commandID, displayKey, explicitPlatform));
        });
        return keyMap(bindings);
    }
    
    describe("KeyBindingManager", function () {
        
        beforeEach(function () {
            CommandManager._testReset();
            KeyBindingManager._reset();
            brackets.platform = "test";
        });
        
        afterEach(function () {
            CommandManager._testRestore();
            brackets.platform = platform;
        });

        describe("addBinding", function () {
            
            it("should require command and key binding arguments", function () {
                KeyBindingManager.addBinding();
                expect(KeyBindingManager.getKeymap()).toEqual({});
                
                KeyBindingManager.addBinding("test.foo");
                expect(KeyBindingManager.getKeymap()).toEqual({});
                expect(KeyBindingManager.getKeyBindings("test.foo")).toEqual([]);
            });
            
            it("should ignore invalid bindings", function () {
                expect(KeyBindingManager.addBinding("test.foo", "Ktrl-Shift-A")).toBeNull();
                expect(KeyBindingManager.addBinding("test.foo", "Ctrl+R")).toBeNull();
                expect(KeyBindingManager.getKeymap()).toEqual({});
            });
            
            it("should add single bindings to the keymap", function () {
                var result = KeyBindingManager.addBinding("test.foo", "Ctrl-A"),
                    keyTest = key("Ctrl-A");
                
                expect(result).toEqual(keyTest);
                expect(KeyBindingManager.getKeyBindings("test.foo")).toEqual([keyTest]);
                
                result = KeyBindingManager.addBinding("test.bar", "Ctrl-B");
                keyTest = key("Ctrl-B");
                expect(result).toEqual(keyTest);
                expect(KeyBindingManager.getKeyBindings("test.bar")).toEqual([keyTest]);
                
                result = KeyBindingManager.addBinding("test.cat", "Ctrl-C", "bark");
                expect(result).toBeNull();
                
                result = KeyBindingManager.addBinding("test.dog", "Ctrl-D", "test");
                keyTest = key("Ctrl-D", null, "test");
                expect(result).toEqual(keyTest);
                expect(KeyBindingManager.getKeyBindings("test.dog")).toEqual([keyTest]);
                
                // only "test" platform bindings
                var expected = keyMap([
                    keyBinding("Ctrl-A", "test.foo"),
                    keyBinding("Ctrl-B", "test.bar"),
                    keyBinding("Ctrl-D", "test.dog", null, "test")
                ]);
                
                expect(KeyBindingManager.getKeymap()).toEqual(expected);
            });
            
            it("should use displayKey to override display of the shortcut", function () {
                KeyBindingManager.addBinding("test.foo", key("Ctrl-=", "Ctrl-+"));
                
                // only "test" platform bindings
                var expected = keyMap([
                    keyBinding("Ctrl-=", "test.foo", "Ctrl-+")
                ]);
                
                expect(KeyBindingManager.getKeymap()).toEqual(expected);
            });
            
            it("should add multiple bindings to the keymap", function () {
                // use a fake platform
                brackets.platform = "test1";
                
                var results = KeyBindingManager.addBinding(
                    "test.foo",
                    [ {key: "Ctrl-A", platform: "test1"}, {key: "Ctrl-1", platform: "all"} ]
                );
                expect(results).toEqual([
                    key("Ctrl-A", null, "test1"),
                    key("Ctrl-1", null, "all")
                ]);
                expect(KeyBindingManager.getKeyBindings("test.foo")).toEqual([
                    key("Ctrl-A", null, "test1"),
                    key("Ctrl-1", null, "all")
                ]);
                
                results = KeyBindingManager.addBinding("test.bar", [{key: "Ctrl-B"}, {key: "Ctrl-2", platform: "test2"}]);
                expect(results).toEqual([
                    key("Ctrl-B")
                ]);
                expect(KeyBindingManager.getKeyBindings("test.bar")).toEqual([
                    key("Ctrl-B")
                ]);
            
                // only "test1" platform and cross-platform bindings
                var expected = keyMap([
                    keyBinding("Ctrl-A", "test.foo", null, "test1"),
                    keyBinding("Ctrl-1", "test.foo", null, "all"),
                    keyBinding("Ctrl-B", "test.bar")
                ]);
                
                expect(KeyBindingManager.getKeymap()).toEqual(expected);
            });
            
            it("should allow the command argument to be a string or an object", function () {
                var result = KeyBindingManager.addBinding("test.foo", "Ctrl-A"),
                    keyTest = key("Ctrl-A");
                
                expect(result).toEqual(keyTest);
                expect(KeyBindingManager.getKeyBindings("test.foo")).toEqual([keyTest]);
                
                var commandObj = CommandManager.register("Bar", "test.bar", function () { return; });
                
                result = KeyBindingManager.addBinding(commandObj, "Ctrl-B");
                keyTest = key("Ctrl-B");
                
                expect(result).toEqual(keyTest);
                expect(KeyBindingManager.getKeyBindings("test.bar")).toEqual([keyTest]);
                
                // only "test" platform bindings
                var expected = keyMap([
                    keyBinding("Ctrl-A", "test.foo"),
                    keyBinding("Ctrl-B", "test.bar")
                ]);
                
                expect(KeyBindingManager.getKeymap()).toEqual(expected);
            });
            
            it("should not allow a generic key binding to be replaced with another generic binding", function () {
                KeyBindingManager.addBinding("test.foo", "Ctrl-A");
                KeyBindingManager.addBinding("test.bar", "Ctrl-A");
                
                var expected = keyMap([
                    keyBinding("Ctrl-A", "test.foo")
                ]);
                
                expect(KeyBindingManager.getKeymap()).toEqual(expected);
            });
            
            it("should allow a platform-specific key binding to override a generic binding", function () {
                KeyBindingManager.addBinding("test.foo", "Ctrl-A");
                KeyBindingManager.addBinding("test.bar", "Ctrl-A", "test");
                
                var expected = keyMap([
                    keyBinding("Ctrl-A", "test.bar", null, "test")
                ]);
                
                expect(KeyBindingManager.getKeymap()).toEqual(expected);
            });
            
            it("should keep a platform-specific key binding if a generic binding is added later", function () {
                KeyBindingManager.addBinding("test.foo", "Ctrl-A", "test");
                KeyBindingManager.addBinding("test.bar", "Ctrl-A");
                
                var expected = keyMap([
                    keyBinding("Ctrl-A", "test.foo", null, "test")
                ]);
                
                expect(KeyBindingManager.getKeymap()).toEqual(expected);
            });
            
            it("should allow a command to map to multiple key bindings", function () {
                KeyBindingManager.addBinding("test.foo", "Ctrl-A");
                KeyBindingManager.addBinding("test.foo", "Ctrl-B");
                
                // only "test1" platform and cross-platform bindings
                var expected = keyMap([
                    keyBinding("Ctrl-A", "test.foo"),
                    keyBinding("Ctrl-B", "test.foo")
                ]);
                
                expect(KeyBindingManager.getKeymap()).toEqual(expected);
            });
            
            it("should support the Ctrl key on mac", function () {
                brackets.platform = "mac";
                    
                KeyBindingManager.addBinding("test.cmd", "Cmd-A", "mac");
                KeyBindingManager.addBinding("test.ctrl", "Ctrl-A", "mac");
                KeyBindingManager.addBinding("test.ctrlAlt", "Ctrl-Alt-A", "mac");
                KeyBindingManager.addBinding("test.cmdCtrlAlt", "Cmd-Ctrl-A", "mac");
                
                var expected = keyMap([
                    keyBinding("Cmd-A", "test.cmd", null, "mac"),
                    keyBinding("Ctrl-A", "test.ctrl", null, "mac"),
                    keyBinding("Ctrl-Alt-A", "test.ctrlAlt", null, "mac"),
                    keyBinding("Ctrl-Cmd-A", "test.cmdCtrlAlt", null, "mac") // KeyBindingManager changes the order
                ]);
                
                expect(KeyBindingManager.getKeymap()).toEqual(expected);
            });
            
            it("should use windows key bindings on linux", function () {
                var original = KeyBindingManager.useWindowsCompatibleBindings;
                
                this.after(function () {
                    KeyBindingManager.useWindowsCompatibleBindings = original;
                });
                
                KeyBindingManager.useWindowsCompatibleBindings = true;
                brackets.platform = "linux";
                
                // create a windows-specific binding
                KeyBindingManager.addBinding("test.cmd", "Ctrl-A", "win");
                
                var expected = keyMap([
                    keyBinding("Ctrl-A", "test.cmd", null, "win")
                ]);
                
                expect(KeyBindingManager.getKeymap()).toEqual(expected);
                
                // create a generic binding to replace the windows binding
                KeyBindingManager.addBinding("test.cmd", "Ctrl-B");
                
                expected = keyMap([
                    keyBinding("Ctrl-B", "test.cmd", null)
                ]);
                
                expect(KeyBindingManager.getKeymap()).toEqual(expected);
            });
            
            it("should support windows compatible bindings", function () {
                var original = KeyBindingManager.useWindowsCompatibleBindings;
                
                this.after(function () {
                    KeyBindingManager.useWindowsCompatibleBindings = original;
                });
                
                KeyBindingManager.useWindowsCompatibleBindings = true;
                brackets.platform = "linux";
                
                // create a generic binding
                KeyBindingManager.addBinding("test.cmd", "Ctrl-A");
                
                var expected = keyMap([
                    keyBinding("Ctrl-A", "test.cmd")
                ]);
                
                expect(KeyBindingManager.getKeymap()).toEqual(expected);
                
                // create a linux-only binding to replace the windows binding
                KeyBindingManager.addBinding("test.cmd", "Ctrl-B", "linux");
                
                expected = keyMap([
                    keyBinding("Ctrl-B", "test.cmd", null, "linux")
                ]);
                
                expect(KeyBindingManager.getKeymap()).toEqual(expected);
            });
        });

        describe("removeBinding", function () {
            
            it("should handle an empty keymap gracefully", function () {
                KeyBindingManager.removeBinding("Ctrl-A");
                expect(KeyBindingManager.getKeymap()).toEqual({});
            });
            
            it("should require a key to remove", function () {
                KeyBindingManager.addBinding("test.foo", "Ctrl-A");
                KeyBindingManager.addBinding("test.bar", "Ctrl-B");
                
                // keymap should be unchanged
                var expected = keyMap([
                    keyBinding("Ctrl-A", "test.foo"),
                    keyBinding("Ctrl-B", "test.bar")
                ]);
                
                KeyBindingManager.removeBinding();
                
                expect(KeyBindingManager.getKeymap()).toEqual(expected);
            });
            
            it("should remove a key from the key map", function () {
                KeyBindingManager.addBinding("test.foo", "Ctrl-A");
                KeyBindingManager.addBinding("test.foo", "Ctrl-B");
                
                // Ctrl-A should be removed
                var expected = keyMap([
                    keyBinding("Ctrl-B", "test.foo")
                ]);
                
                KeyBindingManager.removeBinding("Ctrl-A");
                
                expect(KeyBindingManager.getKeymap()).toEqual(expected);
                expect(KeyBindingManager.getKeyBindings("test.foo")).toEqual([key("Ctrl-B")]);
                
                KeyBindingManager.removeBinding("Ctrl-B");
                expect(KeyBindingManager.getKeyBindings("test.foo")).toEqual([]);
            });
            
            it("should remove a key from the key map for the specified platform", function () {
                brackets.platform = "test1";
                
                KeyBindingManager.addBinding("test.foo", "Ctrl-A", "test1");
                
                // remove Ctrl-A, only for platform "test1"
                KeyBindingManager.removeBinding("Ctrl-A", "test1");
                expect(KeyBindingManager.getKeymap()).toEqual({});
            });
            
            it("should exclude a specified platform key binding for a cross-platform command", function () {
                brackets.platform = "test1";
                
                // all platforms
                KeyBindingManager.addBinding("test.foo", "Ctrl-B");
                
                var expected = keyMap([
                    keyBinding("Ctrl-B", "test.foo")
                ]);
                
                // remove Ctrl-B, only for platform "test2"
                KeyBindingManager.removeBinding("Ctrl-B", "test2");
                expect(KeyBindingManager.getKeymap()).toEqual(expected);
            });
            
        });

        describe("Load User Key Map", function () {
            
            it("should show an error when loading an image file as a user key map file", function () {
                runs(function () {
                    var imageTestFilesPath = SpecRunnerUtils.getTestPath("/spec/test-image-files");
                    KeyBindingManager._setUserKeyMapFilePath(imageTestFilesPath + "/eye.jpg");
                    KeyBindingManager._loadUserKeyMap();
                    waits(300);

                    spyOn(Dialogs, 'showModalDialog').andCallFake(function (dlgClass, title, message, buttons) {
                        expect(message).toEqual(Strings.ERROR_LOADING_KEYMAP);
                        return {done: function (callback) { callback(Dialogs.DIALOG_BTN_OK); } };
                    });
                });
                runs(function () {
                    expect(Dialogs.showModalDialog).toHaveBeenCalled();
                });
            });
            
            it("should show an error when loading a corrupted key map file", function () {
                runs(function () {
                    KeyBindingManager._setUserKeyMapFilePath(testPath + "/invalid.json");
                    KeyBindingManager._loadUserKeyMap();
                    waits(300);

                    spyOn(Dialogs, 'showModalDialog').andCallFake(function (dlgClass, title, message, buttons) {
                        expect(message).toEqual(Strings.ERROR_KEYMAP_CORRUPT);
                        return {done: function (callback) { callback(Dialogs.DIALOG_BTN_OK); } };
                    });
                });
                runs(function () {
                    expect(Dialogs.showModalDialog).toHaveBeenCalled();
                });
            });

            it("should show an error when loading a key map file with only whitespaces", function () {
                runs(function () {
                    KeyBindingManager._setUserKeyMapFilePath(testPath + "/whitespace.json");
                    KeyBindingManager._loadUserKeyMap();
                    waits(300);

                    spyOn(Dialogs, 'showModalDialog').andCallFake(function (dlgClass, title, message, buttons) {
                        expect(message).toEqual(Strings.ERROR_KEYMAP_CORRUPT);
                        return {done: function (callback) { callback(Dialogs.DIALOG_BTN_OK); } };
                    });
                });
                runs(function () {
                    expect(Dialogs.showModalDialog).toHaveBeenCalled();
                });
            });

            it("should NOT show any error when loading a user key map file with an empty object", function () {
                runs(function () {
                    KeyBindingManager._initCommandAndKeyMaps();
                    KeyBindingManager._setUserKeyMapFilePath(testPath + "/empty.json");
                    KeyBindingManager._loadUserKeyMap();
                    spyOn(Dialogs, 'showModalDialog').andCallFake(function (dlgClass, title, message, buttons) {
                        return {done: function (callback) { callback(Dialogs.DIALOG_BTN_OK); } };
                    });
                });
                runs(function () {
                    expect(Dialogs.showModalDialog).not.toHaveBeenCalled();
                });
            });

            it("should NOT show any error when loading a zero-byte user key map file", function () {
                runs(function () {
                    KeyBindingManager._initCommandAndKeyMaps();
                    KeyBindingManager._setUserKeyMapFilePath(testPath + "/blank.json");
                    KeyBindingManager._loadUserKeyMap();
                    spyOn(Dialogs, 'showModalDialog').andCallFake(function (dlgClass, title, message, buttons) {
                        return {done: function (callback) { callback(Dialogs.DIALOG_BTN_OK); } };
                    });
                });
                runs(function () {
                    expect(Dialogs.showModalDialog).not.toHaveBeenCalled();
                });
            });

            it("should show an error when attempting to reassign a special command", function () {
                runs(function () {
                    CommandManager.register("test copy command", "edit.copy", testCommandFn);
                    KeyBindingManager._initCommandAndKeyMaps();
                    KeyBindingManager._setUserKeyMapFilePath(testPath + "/reassignCopy.json");
                    KeyBindingManager._loadUserKeyMap();
                    waits(300);

                    spyOn(Dialogs, 'showModalDialog').andCallFake(function (dlgClass, title, message, buttons) {
                        var msgPrefix = Strings.ERROR_RESTRICTED_COMMANDS.replace("{0}", "");
                        expect(message).toMatch(msgPrefix);
                        expect(message).toMatch("edit.copy");
                        return {done: function (callback) { callback(Dialogs.DIALOG_BTN_OK); } };
                    });
                });
                runs(function () {
                    expect(Dialogs.showModalDialog).toHaveBeenCalled();
                });
            });

            it("should show an error when attempting to reassign a restricted shortcut (either bind to a special command or a mac system shortcut)", function () {
                var testFilePath = (platform === "mac") ? (testPath + "/macRestrictedShortcut.json") : (testPath + "/restrictedShortcut.json");
                runs(function () {
                    brackets.platform = platform;
                    populateDefaultKeyMap();
                    KeyBindingManager._initCommandAndKeyMaps();
                    KeyBindingManager._setUserKeyMapFilePath(testFilePath);
                    KeyBindingManager._loadUserKeyMap();
                    waits(300);

                    spyOn(Dialogs, 'showModalDialog').andCallFake(function (dlgClass, title, message, buttons) {
                        var msgPrefix = Strings.ERROR_RESTRICTED_SHORTCUTS.replace("{0}", "");
                        expect(message).toMatch(msgPrefix);
                        if (platform === "mac") {
                            expect(message).toMatch("cmd-z");
                            expect(message).toMatch("Cmd-m");
                            expect(message).toMatch("cmd-h");
                        } else {
                            expect(message).toMatch("ctrl-z");
                        }
                        return {done: function (callback) { callback(Dialogs.DIALOG_BTN_OK); } };
                    });
                });
                runs(function () {
                    expect(Dialogs.showModalDialog).toHaveBeenCalled();
                });
            });

            it("should show an error when attempting to assign multiple shortcuts to the same command", function () {
                runs(function () {
                    brackets.platform = platform;
                    populateDefaultKeyMap();
                    KeyBindingManager._initCommandAndKeyMaps();
                    KeyBindingManager._setUserKeyMapFilePath(testPath + "/multipleShortcuts.json");
                    KeyBindingManager._loadUserKeyMap();
                    waits(300);

                    spyOn(Dialogs, 'showModalDialog').andCallFake(function (dlgClass, title, message, buttons) {
                        var msgPrefix = Strings.ERROR_MULTIPLE_SHORTCUTS.replace("{0}", "");
                        expect(message).toMatch(msgPrefix);
                        expect(message).toMatch("file.openFolder");
                        expect(message).toMatch("view.hideSidebar");
                        return {done: function (callback) { callback(Dialogs.DIALOG_BTN_OK); } };
                    });
                });
                runs(function () {
                    expect(Dialogs.showModalDialog).toHaveBeenCalled();
                });
            });

            it("should show an error when attempting to set duplicate shortcuts", function () {
                runs(function () {
                    brackets.platform = platform;
                    populateDefaultKeyMap();
                    KeyBindingManager._setUserKeyMapFilePath(testPath + "/duplicateShortcuts.json");
                    KeyBindingManager._initCommandAndKeyMaps();
                    KeyBindingManager._loadUserKeyMap();
                    waits(300);

                    spyOn(Dialogs, 'showModalDialog').andCallFake(function (dlgClass, title, message, buttons) {
                        var msgPrefix = Strings.ERROR_DUPLICATE_SHORTCUTS.replace("{0}", "");
                        expect(message).toMatch(msgPrefix);
                        expect(message).toMatch("Ctrl-2");
                        expect(message).toMatch("Alt-Ctrl-4");
                        return {done: function (callback) { callback(Dialogs.DIALOG_BTN_OK); } };
                    });
                });
                runs(function () {
                    expect(Dialogs.showModalDialog).toHaveBeenCalled();
                });
            });
        
            it("should show an error when parsing invalid shortcuts", function () {
                runs(function () {
                    brackets.platform = platform;
                    populateDefaultKeyMap();
                    KeyBindingManager._initCommandAndKeyMaps();
                    KeyBindingManager._setUserKeyMapFilePath(testPath + "/invalidKeys.json");
                    KeyBindingManager._loadUserKeyMap();
                    waits(300);

                    spyOn(Dialogs, 'showModalDialog').andCallFake(function (dlgClass, title, message, buttons) {
                        var msgPrefix = Strings.ERROR_INVALID_SHORTCUTS.replace("{0}", "");
                        expect(message).toMatch(msgPrefix);
                        expect(message).toMatch("command-2");
                        expect(message).toMatch("Option-Cmd-Backspace");
                        expect(message).toMatch("ctrl-kk");
                        expect(message).toMatch("cmd-Del");
                        return {done: function (callback) { callback(Dialogs.DIALOG_BTN_OK); } };
                    });
                });
                runs(function () {
                    expect(Dialogs.showModalDialog).toHaveBeenCalled();
                });
            });
        
            it("should show an error when attempting to set shortcuts to non-existent commands", function () {
                runs(function () {
                    // The command map has to be empty for this test case. So we are intentionally NOT calling 
                    // populateDefaultKeyMap() before loading the user key map.
                    KeyBindingManager._initCommandAndKeyMaps();
                    KeyBindingManager._setUserKeyMapFilePath(testPath + "/keymap.json");
                    KeyBindingManager._loadUserKeyMap();
                    waits(300);

                    spyOn(Dialogs, 'showModalDialog').andCallFake(function (dlgClass, title, message, buttons) {
                        var msgPrefix = Strings.ERROR_NONEXISTENT_COMMANDS.replace("{0}", "");
                        expect(message).toMatch(msgPrefix);
                        expect(message).toMatch("file.openFolder");
                        expect(message).toMatch("view.hideSidebar");
                        return {done: function (callback) { callback(Dialogs.DIALOG_BTN_OK); } };
                    });
                });
                runs(function () {
                    expect(Dialogs.showModalDialog).toHaveBeenCalled();
                });
            });
        
            it("should update key map with the user specified key bindings", function () {
                var testFilePath = (platform === "mac") ? (testPath + "/macKeymap.json") : (testPath + "/keymap.json");
                runs(function () {
                    brackets.platform = platform;
                    var defKeyMap = getDefaultKeyMap();
                    populateDefaultKeyMap();
                    KeyBindingManager._initCommandAndKeyMaps();
                    expect(KeyBindingManager.getKeymap()).toEqual(defKeyMap);
                    KeyBindingManager._setUserKeyMapFilePath(testFilePath);
                    KeyBindingManager._loadUserKeyMap();
                    waits(300);

                    spyOn(Dialogs, 'showModalDialog').andCallFake(function (dlgClass, title, message, buttons) {
                        return {done: function (callback) { callback(Dialogs.DIALOG_BTN_OK); } };
                    });
                });
                runs(function () {
                    var keymap = KeyBindingManager.getKeymap(),
                        reassignedKey1 = (platform === "mac") ? "Alt-Cmd-Backspace" : "Ctrl-Alt-Backspace",
                        reassignedKey2 = (platform === "mac") ? "Cmd-T" : "Ctrl-T";
                    expect(Dialogs.showModalDialog).not.toHaveBeenCalled();
                    expect(keymap["Ctrl-2"].commandID).toEqual("file.openFolder");
                    expect(keymap["Alt-Cmd-O"]).toBeFalsy();
                    expect(keymap["Alt-Ctrl-O"]).toBeFalsy();

                    expect(keymap[reassignedKey1].commandID).toEqual("view.hideSidebar");
                    expect(keymap["Shift-Cmd-H"]).toBeFalsy();
                    expect(keymap["Alt-Ctrl-H"]).toBeFalsy();

                    expect(keymap["Ctrl-L"].commandID).toEqual("navigate.gotoDefinition");
                    expect(keymap[reassignedKey2]).toBeFalsy();
                    
                    expect(keymap["Alt-Cmd-L"]).toBeFalsy();
                    expect(keymap["Alt-Ctrl-L"]).toBeFalsy();
                });
            });

            it("should restore original key bindings when the user key map is updated", function () {
                var testFilePath1 = (platform === "mac") ? (testPath + "/macKeymap.json") : (testPath + "/keymap.json"),
                    testFilePath2 = (platform === "mac") ? (testPath + "/macKeymap1.json") : (testPath + "/keymap1.json");
                runs(function () {
                    brackets.platform = platform;
                    var defKeyMap = getDefaultKeyMap();
                    populateDefaultKeyMap();
                    KeyBindingManager._initCommandAndKeyMaps();
                    expect(KeyBindingManager.getKeymap()).toEqual(defKeyMap);
                    KeyBindingManager._setUserKeyMapFilePath(testFilePath1);
                    KeyBindingManager._loadUserKeyMap();
                    waits(300);

                    // Loading a different key map file to simulate the user updating an existing key map.
                    KeyBindingManager._setUserKeyMapFilePath(testFilePath2);
                    KeyBindingManager._loadUserKeyMap();
                    waits(300);

                    spyOn(Dialogs, 'showModalDialog').andCallFake(function (dlgClass, title, message, buttons) {
                        return {done: function (callback) { callback(Dialogs.DIALOG_BTN_OK); } };
                    });
                });
                runs(function () {
                    var keymap = KeyBindingManager.getKeymap(),
                        reassignedKey1 = (platform === "mac") ? "Alt-Cmd-Backspace" : "Ctrl-Alt-Backspace",
                        reassignedKey2 = (platform === "mac") ? "Alt-Cmd-O" : "Ctrl-Alt-O",
                        reassignedKey3 = (platform === "mac") ? "Cmd-T" : "Ctrl-T";

                    expect(Dialogs.showModalDialog).not.toHaveBeenCalled();
                    expect(keymap["Ctrl-2"].commandID).toEqual("view.hideSidebar");
                    
                    // Previous user key binding to "view.hideSidebar" is gone.
                    expect(keymap[reassignedKey1]).toBeFalsy();
                    
                    // Default key binding for "file.openFolder" is restored.
                    expect(keymap[reassignedKey2].commandID).toEqual("file.openFolder");
                    
                    expect(keymap["Ctrl-L"].commandID).toEqual("navigate.gotoDefinition");
                    expect(keymap[reassignedKey3]).toBeFalsy();
                });
            });
        });
        
        describe("handleKey", function () {
            
            it("should execute a command", function () {
                var fooCalled = false;
                CommandManager.register("Foo", "test.foo", function () {
                    fooCalled = true;
                });
                
                KeyBindingManager.addBinding("test.foo", "Ctrl-A");
                expect(fooCalled).toBe(false);
                
                KeyBindingManager._handleKey("Ctrl-A");
                expect(fooCalled).toBe(true);
            });
            
        });
        
        describe("handle AltGr key", function () {
            var commandCalled, ctrlAlt1Event, ctrlAltEvents;
            var ctrlEvent = {
                ctrlKey: true,
                keyIdentifier: "Control",
                keyCode: KeyEvent.DOM_VK_CONTROL,
                immediatePropagationStopped: false,
                propagationStopped: false,
                defaultPrevented: false,
                stopImmediatePropagation: function () {
                    this.immediatePropagationStopped = true;
                },
                stopPropagation: function () {
                    this.propagationStopped = true;
                },
                preventDefault: function () {
                    this.defaultPrevented = true;
                }
            };
            
            function makeCtrlAltKeyEvents() {
                var altGrEvents = [],
                    altEvent = _.cloneDeep(ctrlEvent);
                
                altEvent.keyIdentifier = "Alt";
                altEvent.altKey = true;
                altEvent.keyCode = KeyEvent.DOM_VK_ALT;
                
                altGrEvents.push(_.cloneDeep(ctrlEvent));
                altGrEvents.push(altEvent);
                
                return altGrEvents;
            }
            
            function makeCtrlAlt1KeyEvent() {
                return {
                    ctrlKey: true,
                    altKey: true,
                    keyCode: "1".charCodeAt(0),
                    immediatePropagationStopped: false,
                    propagationStopped: false,
                    defaultPrevented: false,
                    stopImmediatePropagation: function () {
                        this.immediatePropagationStopped = true;
                    },
                    stopPropagation: function () {
                        this.propagationStopped = true;
                    },
                    preventDefault: function () {
                        this.defaultPrevented = true;
                    }
                };
            }
            
            beforeEach(function () {
                commandCalled = false;
                ctrlAlt1Event = makeCtrlAlt1KeyEvent();
                ctrlAltEvents = makeCtrlAltKeyEvents();
                CommandManager.register("FakeUnitTestCommand", "unittest.fakeCommand", function () {
                    commandCalled = true;
                });
                KeyBindingManager.addBinding("unittest.fakeCommand", "Ctrl-Alt-1");

                // Modify platform to "win" since right Alt key detection is done only on Windows.
                brackets.platform = "win";
            });
            
            afterEach(function () {
                // Restore the platform.
                brackets.platform = "test";
            });
            
            it("should block command execution if right Alt key is pressed", function () {
                // Simulate a right Alt key down with the specific sequence of keydown events.
                ctrlAltEvents.forEach(function (e) {
                    e.timeStamp = new Date();
                    KeyBindingManager._handleKeyEvent(e);
                });
                
                // Simulate the command shortcut
                KeyBindingManager._handleKeyEvent(ctrlAlt1Event);
                expect(commandCalled).toBe(false);
                
                // In this case, the event should not have been stopped, because KBM didn't handle it.
                expect(ctrlAlt1Event.immediatePropagationStopped).toBe(false);
                expect(ctrlAlt1Event.propagationStopped).toBe(false);
                expect(ctrlAlt1Event.defaultPrevented).toBe(false);
                
                // Now explicitly remove the keyup event listener created by _detectAltGrKeyDown function.
                KeyBindingManager._onCtrlUp(ctrlEvent);
            });

            it("should block command execution when right Alt key is pressed following a Ctrl shortcut execution", function () {
                var ctrlEvent1 = _.cloneDeep(ctrlEvent);
                
                // Simulate holding down Ctrl key and execute a Ctrl shortcut in native shell code
                // No need to call the actual Ctrl shortcut since it is not handled in KBM anyway.
                KeyBindingManager._handleKeyEvent(ctrlEvent1);
                ctrlEvent1.repeat = true;
                KeyBindingManager._handleKeyEvent(ctrlEvent1);
                KeyBindingManager._handleKeyEvent(ctrlEvent1);
                
                // Simulate a right Alt key down with the specific sequence of keydown events.
                ctrlAltEvents.forEach(function (e) {
                    e.timeStamp = new Date();
                    e.repeat = false;
                    KeyBindingManager._handleKeyEvent(e);
                });
                
                // Simulate the command shortcut
                KeyBindingManager._handleKeyEvent(ctrlAlt1Event);
                expect(commandCalled).toBe(false);
                
                // In this case, the event should not have been stopped, because KBM didn't handle it.
                expect(ctrlAlt1Event.immediatePropagationStopped).toBe(false);
                expect(ctrlAlt1Event.propagationStopped).toBe(false);
                expect(ctrlAlt1Event.defaultPrevented).toBe(false);
                
                // Now explicitly remove the keyup event listener created by _detectAltGrKeyDown function.
                KeyBindingManager._onCtrlUp(ctrlEvent);
            });

            it("should not block command execution if interval between Ctrl & Alt events are more than 30 ms.", function () {
                var lastTS;

                // Simulate a Ctrl-Alt keys down with the specific sequence of keydown events.
                ctrlAltEvents.forEach(function (e) {
                    if (!lastTS) {
                        e.timeStamp = new Date();
                        lastTS = e.timeStamp;
                    } else {
                        e.timeStamp = lastTS + 50;
                    }
                    KeyBindingManager._handleKeyEvent(e);
                });
                
                // Simulate the command shortcut
                KeyBindingManager._handleKeyEvent(ctrlAlt1Event);
                expect(commandCalled).toBe(true);
                
                // In this case, the event should have been stopped (but not immediately) because
                // KBM handled it.
                expect(ctrlAlt1Event.immediatePropagationStopped).toBe(false);
                expect(ctrlAlt1Event.propagationStopped).toBe(true);
                expect(ctrlAlt1Event.defaultPrevented).toBe(true);
            });

            it("should not block command execution when the right Alt key is not used", function () {
                // Simulate the command shortcut
                KeyBindingManager._handleKeyEvent(ctrlAlt1Event);
                expect(commandCalled).toBe(true);

                // In this case, the event should have been stopped (but not immediately) because
                // KBM handled it.
                expect(ctrlAlt1Event.immediatePropagationStopped).toBe(false);
                expect(ctrlAlt1Event.propagationStopped).toBe(true);
                expect(ctrlAlt1Event.defaultPrevented).toBe(true);
            });
        });

        describe("global hooks", function () {
            var commandCalled, hook1Called, hook2Called, ctrlAEvent;
            
            function keydownHook1(event) {
                hook1Called = true;
                return true;
            }
            
            function keydownHook2(event) {
                hook2Called = true;
                return true;
            }
            
            function makeKeyEvent() {
                // We don't create a real native event object here--just a fake
                // object with enough info for the key translation to work
                // properly--since our mock hooks don't actually look at it
                // anyway.
                return {
                    ctrlKey: true,
                    keyCode: "A".charCodeAt(0),
                    immediatePropagationStopped: false,
                    propagationStopped: false,
                    defaultPrevented: false,
                    stopImmediatePropagation: function () {
                        this.immediatePropagationStopped = true;
                    },
                    stopPropagation: function () {
                        this.propagationStopped = true;
                    },
                    preventDefault: function () {
                        this.defaultPrevented = true;
                    }
                };
            }
            
            beforeEach(function () {
                commandCalled = false;
                hook1Called = false;
                hook2Called = false;
                ctrlAEvent = makeKeyEvent();
                CommandManager.register("FakeUnitTestCommand", "unittest.fakeCommand", function () {
                    commandCalled = true;
                });
                KeyBindingManager.addBinding("unittest.fakeCommand", "Ctrl-A");
            });
            
            it("should block command execution if a global hook is added that prevents it", function () {
                KeyBindingManager.addGlobalKeydownHook(keydownHook1);
                KeyBindingManager._handleKeyEvent(ctrlAEvent);
                expect(hook1Called).toBe(true);
                expect(commandCalled).toBe(false);
                
                // In this case, the event should not have been stopped, because our hook didn't stop it
                // and KBM didn't handle it.
                expect(ctrlAEvent.immediatePropagationStopped).toBe(false);
                expect(ctrlAEvent.propagationStopped).toBe(false);
                expect(ctrlAEvent.defaultPrevented).toBe(false);
            });
            
            it("should not block command execution if a global hook is added then removed", function () {
                KeyBindingManager.addGlobalKeydownHook(keydownHook1);
                KeyBindingManager.removeGlobalKeydownHook(keydownHook1);
                KeyBindingManager._handleKeyEvent(ctrlAEvent);
                expect(hook1Called).toBe(false);
                expect(commandCalled).toBe(true);

                // In this case, the event should have been stopped (but not immediately) because
                // KBM handled it.
                expect(ctrlAEvent.immediatePropagationStopped).toBe(false);
                expect(ctrlAEvent.propagationStopped).toBe(true);
                expect(ctrlAEvent.defaultPrevented).toBe(true);
            });
            
            it("should call the most recently added hook first", function () {
                KeyBindingManager.addGlobalKeydownHook(keydownHook1);
                KeyBindingManager.addGlobalKeydownHook(keydownHook2);
                KeyBindingManager._handleKeyEvent(ctrlAEvent);
                expect(hook2Called).toBe(true);
                expect(hook1Called).toBe(false);
                expect(commandCalled).toBe(false);

                // In this case, the event should not have been stopped, because our hook didn't stop it
                // and KBM didn't handle it.
                expect(ctrlAEvent.immediatePropagationStopped).toBe(false);
                expect(ctrlAEvent.propagationStopped).toBe(false);
                expect(ctrlAEvent.defaultPrevented).toBe(false);
            });
        });
        
    });
});
