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

define(function (require, exports, module) {
    'use strict';
    
    // Load dependent modules
    var CommandManager      = require("command/CommandManager"),
        KeyBindingManager   = require("command/KeyBindingManager"),
        KeyMap              = require("command/KeyMap");
    
    function keymap(bindings, platform) {
        if (!$.isArray(bindings)) {
            bindings = [bindings];
        }
        
        return KeyMap.create({bindings: bindings, platform: platform}).map;
    }
    
    describe("KeyBindingManager", function () {
        
        var platform = brackets.platform;
        
        afterEach(function () {
            KeyBindingManager._reset();
            brackets.platform = platform;
        });

        describe("addBinding", function () {
            
            it("should require command and key binding arguments", function () {
                KeyBindingManager.addBinding();
                expect(KeyBindingManager.getKeymap()).toEqual({});
                
                KeyBindingManager.addBinding("test.foo");
                expect(KeyBindingManager.getKeymap()).toEqual({});
            });
            
            it("should ignore invalid bindings", function () {
                KeyBindingManager.addBinding("test.foo", "Ktrl-Shift-A");
                
                // TODO (issue #957): invalid key bindings are currently allowed
                var expected = keymap([
                    {"Ktrl-Shift-A": "test.foo"}
                ]);
                
                expect(KeyBindingManager.getKeymap()).toEqual(expected);
            });
            
            it("should add single bindings to the keymap", function () {
                // use a fake platform
                brackets.platform = "test";
                
                KeyBindingManager.addBinding("test.foo", "Ctrl-A");
                KeyBindingManager.addBinding("test.bar", "Ctrl-B");
                KeyBindingManager.addBinding("test.cat", "Ctrl-C", "bark");
                KeyBindingManager.addBinding("test.dog", "Ctrl-D", "test");
                
                // only "test" platform bindings
                var expected = keymap([
                    {"Ctrl-A": "test.foo"},
                    {"Ctrl-B": "test.bar"},
                    {"Ctrl-D": "test.dog"}
                ]);
                
                expect(KeyBindingManager.getKeymap()).toEqual(expected);
            });
            
            it("should add multiple bindings to the keymap", function () {
                // use a fake platform
                brackets.platform = "test1";
                
                KeyBindingManager.addBinding("test.foo", [{key: "Ctrl-A", platform: "test1"}, "Ctrl-1"]);
                KeyBindingManager.addBinding("test.bar", [{key: "Ctrl-B"}, {key: "Ctrl-2", platform: "test2"}]);
            
                // only "test1" platform and cross-platform bindings
                var expected = keymap([
                    {"Ctrl-A": "test.foo"},
                    {"Ctrl-1": "test.foo"},
                    {"Ctrl-B": "test.bar"}
                ]);
                
                expect(KeyBindingManager.getKeymap()).toEqual(expected);
            });
            
            it("should prevent a key binding from mapping to multiple commands", function () {
                KeyBindingManager.addBinding("test.foo", "Ctrl-A");
                KeyBindingManager.addBinding("test.bar", "Ctrl-A");
                
                var expected = keymap([
                    {"Ctrl-A": "test.foo"}
                ]);
                
                expect(KeyBindingManager.getKeymap()).toEqual(expected);
            });
            
            it("should allow a command to map to multiple key bindings", function () {
                KeyBindingManager.addBinding("test.foo", "Ctrl-A");
                KeyBindingManager.addBinding("test.foo", "Ctrl-B");
                
                // only "test1" platform and cross-platform bindings
                var expected = keymap([
                    {"Ctrl-A": "test.foo"},
                    {"Ctrl-B": "test.foo"}
                ]);
                
                expect(KeyBindingManager.getKeymap()).toEqual(expected);
            });
            
        });

        describe("removeBinding", function () {
            
            it("should handle an empty keymap gracefully", function () {
                KeyBindingManager.removeBinding("Ctrl-A");
                expect(KeyBindingManager.getKeymap()).toBeNull();
            });
            
            it("should require a key to remove", function () {
                KeyBindingManager.addBinding("test.foo", "Ctrl-A");
                KeyBindingManager.addBinding("test.bar", "Ctrl-B");
                
                // keymap should be unchanged
                var expected = keymap([
                    {"Ctrl-A": "test.foo"},
                    {"Ctrl-B": "test.bar"}
                ]);
                
                KeyBindingManager.removeBinding();
                
                expect(KeyBindingManager.getKeymap()).toEqual(expected);
            });
            
            it("should remove a key from the key map", function () {
                KeyBindingManager.addBinding("test.foo", "Ctrl-A");
                KeyBindingManager.addBinding("test.foo", "Ctrl-B");
                
                // Ctrl-A should be removed
                var expected = keymap([
                    {"Ctrl-B": "test.foo"}
                ]);
                
                KeyBindingManager.removeBinding("Ctrl-A");
                
                expect(KeyBindingManager.getKeymap()).toEqual(expected);
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
                
                var expected = keymap([
                    {"Ctrl-B": "test.foo"}
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
                
                KeyBindingManager.handleKey("Ctrl-A");
                expect(fooCalled).toBe(true);
            });
            
        });
        
    });
});
