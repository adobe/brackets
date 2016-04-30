/*
 * Copyright (c) 2012 - present Adobe Systems Incorporated. All rights reserved.
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
/*global define, describe, beforeEach, afterEach, it, expect */

define(function (require, exports, module) {
    'use strict';

    // Load dependent modules
    var CommandManager = require("command/CommandManager");

    describe("CommandManager", function () {

        var commandID = "commandID";

        var executed;
        var testCommandFn = function () { executed = true; };

        beforeEach(function () {
            executed = false;
            CommandManager._testReset();
        });

        afterEach(function () {
            CommandManager._testRestore();
        });

        it("register and get a command and validate parameters", function () {
            var command = CommandManager.register("test command", commandID, testCommandFn);
            expect(command).toBeTruthy();
            expect(command.getName()).toBe("test command");
            expect(command.getID()).toBe(commandID);
            expect(command.getEnabled()).toBeTruthy();
            expect(command.getChecked()).toBe(undefined);
            expect(command._commandFn).toBe(testCommandFn);

            // duplicate command
            expect(CommandManager.register("test command", commandID, testCommandFn)).toBeFalsy();

            // missing arguments
            expect(CommandManager.register(null, "test-command-id2", testCommandFn)).toBe(null);
            expect(CommandManager.register("test command", null, testCommandFn)).toBe(null);
            expect(CommandManager.register("test command", "test-command-id2", null)).toBe(null);

        });

        it("execute a command", function () {
            var command = CommandManager.register("test command", commandID, testCommandFn);
            command.execute();
            expect(executed).toBeTruthy();
        });

        it("not execute a disabled command", function () {
            var command = CommandManager.register("test command", commandID, testCommandFn);
            command.setEnabled(false);
            command.execute();
            expect(executed).toBeFalsy();
        });

        it("set enabled state and trigger enabledStateChange", function () {
            var eventTriggered = false;
            var command = CommandManager.register("test command", commandID, testCommandFn);
            command.on("enabledStateChange", function () {
                eventTriggered = true;
            });
            command.setEnabled(false);
            expect(eventTriggered).toBeTruthy();
            expect(command.getEnabled()).toBeFalsy();
        });

        it("set checked state and trigger checkedStateChange", function () {
            var eventTriggered = false;
            var command = CommandManager.register("test command", commandID, testCommandFn);
            command.on("checkedStateChange", function () {
                eventTriggered = true;
            });
            command.setChecked(true);
            expect(eventTriggered).toBeTruthy();
            expect(command.getChecked()).toBeTruthy();
        });

        it("rename command trigger nameChange", function () {
            var eventTriggered = false;
            var command = CommandManager.register("test command", commandID, testCommandFn);
            command.on("nameChange", function () {
                eventTriggered = true;
            });
            command.setName("newName");
            expect(eventTriggered).toBeTruthy();
            expect(command.getName()).toBe("newName");
        });
    });
});
