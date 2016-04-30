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


/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, describe, it, expect, beforeEach, afterEach */

define(function (require, exports, module) {
    "use strict";

    var TextRange = require("document/TextRange").TextRange,
        SpecRunnerUtils = require("spec/SpecRunnerUtils");

    var docText = "", i;
    for (i = 0; i < 10; i++) {
        docText += "line " + i + "\n";
    }

    describe("TextRange", function () {
        var doc,
            range,
            gotChange,
            gotContentChange,
            gotLostSync;

        beforeEach(function () {
            var result = SpecRunnerUtils.createMockEditor(docText);
            doc = result.doc;

            gotChange = false;
            gotContentChange = false;
            gotLostSync = false;

            range = new TextRange(doc, 4, 6);
            range.on("change.unittest", function () {
                expect(gotChange).toBe(false);
                gotChange = true;
            }).on("contentChange.unittest", function () {
                expect(gotContentChange).toBe(false);
                gotContentChange = true;
            }).on("lostSync.unittest", function () {
                expect(gotLostSync).toBe(false);
                gotLostSync = true;
            });
        });

        afterEach(function () {
            SpecRunnerUtils.destroyMockEditor(doc);
            doc = null;
            range.off(".unittest");
            range.dispose();
            range = null;
        });

        it("should not update or fire events for an edit before that doesn't change the number of lines", function () {
            doc.replaceRange("new line 2\nnew line 3", {line: 2, ch: 0}, {line: 3, ch: 6});
            expect(gotChange).toBe(false);
            expect(gotContentChange).toBe(false);
            expect(gotLostSync).toBe(false);
            expect(range.startLine).toBe(4);
            expect(range.endLine).toBe(6);
        });

        it("should update and fire a change, but not a contentChange, for an edit before that deletes a line", function () {
            doc.replaceRange("", {line: 2, ch: 0}, {line: 3, ch: 0});
            expect(gotChange).toBe(true);
            expect(gotContentChange).toBe(false);
            expect(gotLostSync).toBe(false);
            expect(range.startLine).toBe(3);
            expect(range.endLine).toBe(5);
        });

        it("should update and fire a change, but not a contentChange, for an edit before that inserts a line", function () {
            doc.replaceRange("new extra line\n", {line: 2, ch: 0});
            expect(gotChange).toBe(true);
            expect(gotContentChange).toBe(false);
            expect(gotLostSync).toBe(false);
            expect(range.startLine).toBe(5);
            expect(range.endLine).toBe(7);
        });

        it("should not update or fire events for an edit after even if it changes the number of lines", function () {
            doc.replaceRange("new extra line\n", {line: 8, ch: 0});
            expect(gotChange).toBe(false);
            expect(gotContentChange).toBe(false);
            expect(gotLostSync).toBe(false);
            expect(range.startLine).toBe(4);
            expect(range.endLine).toBe(6);
        });

        it("should lose sync if entire document is replaced", function () {
            doc.replaceRange("new content", {line: 0, ch: 0}, {line: 9, ch: 6});
            expect(gotChange).toBe(true);
            expect(gotContentChange).toBe(true);
            expect(gotLostSync).toBe(true);
            expect(range.startLine).toBe(null);
            expect(range.endLine).toBe(null);
        });

        it("should lose sync if entire range is replaced", function () {
            doc.replaceRange("new content", {line: 3, ch: 0}, {line: 7, ch: 6});
            expect(gotChange).toBe(true);
            expect(gotContentChange).toBe(true);
            expect(gotLostSync).toBe(true);
            expect(range.startLine).toBe(null);
            expect(range.endLine).toBe(null);
        });

        it("should lose sync if a change overlaps the beginning of the range", function () {
            doc.replaceRange("new content", {line: 3, ch: 0}, {line: 5, ch: 6});
            expect(gotChange).toBe(true);
            expect(gotContentChange).toBe(true);
            expect(gotLostSync).toBe(true);
            expect(range.startLine).toBe(null);
            expect(range.endLine).toBe(null);
        });

        it("should lose sync if a change overlaps the end of the range", function () {
            doc.replaceRange("new content", {line: 5, ch: 0}, {line: 7, ch: 6});
            expect(gotChange).toBe(true);
            expect(gotContentChange).toBe(true);
            expect(gotLostSync).toBe(true);
            expect(range.startLine).toBe(null);
            expect(range.endLine).toBe(null);
        });

        it("should not update or send a change, but should send contentChange, if a change occurs inside range without changing # of lines", function () {
            doc.replaceRange("new line 5", {line: 5, ch: 0}, {line: 5, ch: 6});
            expect(gotChange).toBe(false);
            expect(gotContentChange).toBe(true);
            expect(gotLostSync).toBe(false);
            expect(range.startLine).toBe(4);
            expect(range.endLine).toBe(6);
        });

        it("should update and send change/contentChange if a line is added inside range", function () {
            doc.replaceRange("new added line\n", {line: 5, ch: 0});
            expect(gotChange).toBe(true);
            expect(gotContentChange).toBe(true);
            expect(gotLostSync).toBe(false);
            expect(range.startLine).toBe(4);
            expect(range.endLine).toBe(7);
        });

        it("should update and send change/contentChange if a line is deleted inside range", function () {
            doc.replaceRange("", {line: 5, ch: 0}, {line: 6, ch: 0});
            expect(gotChange).toBe(true);
            expect(gotContentChange).toBe(true);
            expect(gotLostSync).toBe(false);
            expect(range.startLine).toBe(4);
            expect(range.endLine).toBe(5);
        });
    });
});
