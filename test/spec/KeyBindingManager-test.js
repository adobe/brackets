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
/*global define, describe, beforeEach, afterEach, it, xit, runs, waitsFor, expect, brackets, $ */
/*unittests: KeyBindingManager */

define(function (require, exports, module) {
    'use strict';
    
    require("utils/Global");

    // Load dependent modules
    var CommandManager      = require("command/CommandManager"),
        KeyBindingManager   = require("command/KeyBindingManager");
    
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
    
    describe("KeyBindingManager", function () {
        
        var platform = brackets.platform;
        
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
                
                var results = KeyBindingManager.addBinding("test.foo", [{key: "Ctrl-A", platform: "test1"}, "Ctrl-1"]);
                expect(results).toEqual([
                    key("Ctrl-A", null, "test1"),
                    key("Ctrl-1")
                ]);
                expect(KeyBindingManager.getKeyBindings("test.foo")).toEqual([
                    key("Ctrl-A", null, "test1"),
                    key("Ctrl-1")
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
                    keyBinding("Ctrl-1", "test.foo"),
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