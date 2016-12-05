/*
 * Copyright (c) 2015 - present Adobe Systems Incorporated. All rights reserved.
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

/*global describe, beforeEach, afterEach, it, expect */

define(function (require, exports, module) {
    "use strict";

    var SpecRunnerUtils = require("spec/SpecRunnerUtils"),
        XMLUtils        = require("language/XMLUtils");

    describe("XMLUtils", function () {
        var testContent, testDocument, testEditor;

        // SVG Content we will be using to run tests againts.
        testContent =   "<?xml version=\"1.0\" encoding=\"UTF-8\" ?>\n" +
                        "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\"\n" +
                        "     width=\"200\" height=\"200\" preserveAspectRatio=\"xMinYMin meet\">\n" +
                        "    <title>Brackets SVG Code Hints</title>\n" +
                        "    <rect width=\"200\" height=\"200\" baseline-shift=\"baseline\" alignment-baseline=\"alphabetic\" stroke-width=\"1\"></rect>\n" +
                        "    <rect width='160' height='160' x='20' y='20' baseline-shift='super' alignment-baseline='baseline' />\n" +
                        "    <g>\n" +
                        "        \n" +
                        "    </g>\n" +
                        "</svg>\n";

        beforeEach(function () {
            // Create a mock svg document to run tests against.
            var mockEditor = SpecRunnerUtils.createMockEditor(testContent, "svg", {
                startLine: 0,
                endLine: 10
            });
            testEditor = mockEditor.editor;
            testDocument = mockEditor.doc;
        });

        afterEach(function () {
            testEditor.destroy();
            testEditor = null;
        });

        // Verifies tagInfo
        function expectTagInfo(tagInfo, tokenType, offset, exclusionListLength) {
            expect(tagInfo.token).not.toBe(null);
            expect(tagInfo.tokenType).toBe(tokenType);
            expect(tagInfo.offset).toBe(offset);
            expect(tagInfo.exclusionList.length).toBe(exclusionListLength);
        }

        // Expect tagInfo in its default state.
        function expectNoTagInfo(tagInfo) {
            expect(tagInfo.token).toBe(null);
            expect(tagInfo.tokenType).toBe(null);
            expect(tagInfo.offset).toBe(0);
            expect(tagInfo.exclusionList.length).toBe(0);
        }

        it("should provide tag info when creating tag", function () {
            var tagInfo;

            // After < in <svg
            tagInfo = XMLUtils.getTagInfo(testEditor, {line: 1, ch: 1});
            expectTagInfo(tagInfo, XMLUtils.TOKEN_TAG, 0, 0);

            // After <s in <svg
            tagInfo = XMLUtils.getTagInfo(testEditor, {line: 1, ch: 2});
            expectTagInfo(tagInfo, XMLUtils.TOKEN_TAG, 1, 0);

            // After <svg
            tagInfo = XMLUtils.getTagInfo(testEditor, {line: 1, ch: 4});
            expectTagInfo(tagInfo, XMLUtils.TOKEN_TAG, 3, 0);

            // After <title
            tagInfo = XMLUtils.getTagInfo(testEditor, {line: 3, ch: 10});
            expectTagInfo(tagInfo, XMLUtils.TOKEN_TAG, 5, 0);
        });

        it("should provide tag info when creating attribute", function () {
            var tagInfo;

            // Before xmlns
            tagInfo = XMLUtils.getTagInfo(testEditor, {line: 1, ch: 5});
            expectTagInfo(tagInfo, XMLUtils.TOKEN_ATTR, 1, 5);
            expect(tagInfo.exclusionList[0]).toBe("xmlns");
            expect(tagInfo.exclusionList[1]).toBe("xmlns:xlink");
            expect(tagInfo.exclusionList[2]).toBe("width");
            expect(tagInfo.exclusionList[3]).toBe("height");
            expect(tagInfo.exclusionList[4]).toBe("preserveAspectRatio");

            // After x in xmlns
            tagInfo = XMLUtils.getTagInfo(testEditor, {line: 1, ch: 6});
            expectTagInfo(tagInfo, XMLUtils.TOKEN_ATTR, 1, 4);
            expect(tagInfo.exclusionList[0]).toBe("xmlns:xlink");
            expect(tagInfo.exclusionList[1]).toBe("width");
            expect(tagInfo.exclusionList[2]).toBe("height");
            expect(tagInfo.exclusionList[3]).toBe("preserveAspectRatio");

            // After xmlns
            tagInfo = XMLUtils.getTagInfo(testEditor, {line: 1, ch: 10});
            expectTagInfo(tagInfo, XMLUtils.TOKEN_ATTR, 5, 4);
            expect(tagInfo.exclusionList[0]).toBe("xmlns:xlink");
            expect(tagInfo.exclusionList[1]).toBe("width");
            expect(tagInfo.exclusionList[2]).toBe("height");
            expect(tagInfo.exclusionList[3]).toBe("preserveAspectRatio");

            // Before preserveAspectRatio
            tagInfo = XMLUtils.getTagInfo(testEditor, {line: 2, ch: 30});
            expectTagInfo(tagInfo, XMLUtils.TOKEN_ATTR, 1, 5);
            expect(tagInfo.exclusionList[0]).toBe("height");
            expect(tagInfo.exclusionList[1]).toBe("width");
            expect(tagInfo.exclusionList[2]).toBe("xmlns:xlink");
            expect(tagInfo.exclusionList[3]).toBe("xmlns");
            expect(tagInfo.exclusionList[4]).toBe("preserveAspectRatio");
        });

        it("should provide tag info when creating attribute value", function () {
            var tagInfo;

            // Before x in xMinYMin meet
            tagInfo = XMLUtils.getTagInfo(testEditor, {line: 2, ch: 51});
            expectTagInfo(tagInfo, XMLUtils.TOKEN_VALUE, 1, 2);
            expect(tagInfo.exclusionList[0]).toBe("xMinYMin");
            expect(tagInfo.exclusionList[1]).toBe("meet");

            // After x in xMinYMin meet
            tagInfo = XMLUtils.getTagInfo(testEditor, {line: 2, ch: 52});
            expectTagInfo(tagInfo, XMLUtils.TOKEN_VALUE, 2, 2);
            expect(tagInfo.exclusionList[0]).toBe("MinYMin");
            expect(tagInfo.exclusionList[1]).toBe("meet");

            // After xMinYMin
            tagInfo = XMLUtils.getTagInfo(testEditor, {line: 2, ch: 59});
            expectTagInfo(tagInfo, XMLUtils.TOKEN_VALUE, 9, 2);
            expect(tagInfo.exclusionList[0]).toBe("xMinYMin");
            expect(tagInfo.exclusionList[1]).toBe("meet");

            // Before m in xMinYMin meet
            tagInfo = XMLUtils.getTagInfo(testEditor, {line: 2, ch: 60});
            expectTagInfo(tagInfo, XMLUtils.TOKEN_VALUE, 10, 2);
            expect(tagInfo.exclusionList[0]).toBe("xMinYMin");
            expect(tagInfo.exclusionList[1]).toBe("meet");

            // After m in xMinYMin meet
            tagInfo = XMLUtils.getTagInfo(testEditor, {line: 2, ch: 61});
            expectTagInfo(tagInfo, XMLUtils.TOKEN_VALUE, 11, 2);
            expect(tagInfo.exclusionList[0]).toBe("xMinYMin");
            expect(tagInfo.exclusionList[1]).toBe("eet");

            // After meet
            tagInfo = XMLUtils.getTagInfo(testEditor, {line: 2, ch: 64});
            expectTagInfo(tagInfo, XMLUtils.TOKEN_VALUE, 14, 1);
            expect(tagInfo.exclusionList[0]).toBe("xMinYMin");
        });

        it("should NOT provide tag info inside XML declaration", function () {
            var tagInfo;

            // After < in <?xml.
            tagInfo = XMLUtils.getTagInfo(testEditor, {line: 0, ch: 1});
            expectNoTagInfo(tagInfo);

            // After <? in <?xml.
            tagInfo = XMLUtils.getTagInfo(testEditor, {line: 0, ch: 2});
            expectNoTagInfo(tagInfo);

            // After <?xml.
            tagInfo = XMLUtils.getTagInfo(testEditor, {line: 0, ch: 5});
            expectNoTagInfo(tagInfo);

            // First space after <?xml.
            tagInfo = XMLUtils.getTagInfo(testEditor, {line: 0, ch: 6});
            expectNoTagInfo(tagInfo);

            // After v in version.
            tagInfo = XMLUtils.getTagInfo(testEditor, {line: 0, ch: 7});
            expectNoTagInfo(tagInfo);
        });

        it("should NOT provide tag info inside tag content", function () {
            var tagInfo;

            // inside <g> and </g>
            tagInfo = XMLUtils.getTagInfo(testEditor, {line: 7, ch: 8});
            expectNoTagInfo(tagInfo);

            // Between stroke-width="1"> and </rect>
            tagInfo = XMLUtils.getTagInfo(testEditor, {line: 4, ch: 110});
            expectNoTagInfo(tagInfo);

            // Inside <title>
            tagInfo = XMLUtils.getTagInfo(testEditor, {line: 3, ch: 20});
            expectNoTagInfo(tagInfo);
        });

        it("should NOT provide tag info in closing tag", function () {
            var tagInfo;

            // Between < and /
            tagInfo = XMLUtils.getTagInfo(testEditor, {line: 3, ch: 35});
            expectNoTagInfo(tagInfo);

            // After </
            tagInfo = XMLUtils.getTagInfo(testEditor, {line: 3, ch: 35});
            expectNoTagInfo(tagInfo);
        });

        it("should NOT provide tag info after the attribute value quote", function () {
            var tagInfo;

            // After /svg"
            tagInfo = XMLUtils.getTagInfo(testEditor, {line: 1, ch: 39});
            expectNoTagInfo(tagInfo);

            // After xlink"
            tagInfo = XMLUtils.getTagInfo(testEditor, {line: 1, ch: 82});
            expectNoTagInfo(tagInfo);

            // After meet"
            tagInfo = XMLUtils.getTagInfo(testEditor, {line: 2, ch: 65});
            expectNoTagInfo(tagInfo);
        });

        it("should NOT provide tag info in case the cursor is between an attribute and =", function () {
            var tagInfo;

            testDocument.replaceRange("  ", {line: 1, ch: 51});
            tagInfo = XMLUtils.getTagInfo(testEditor, {line: 1, ch: 52});
            expectNoTagInfo(tagInfo);
        });

        it("should NOT provide tag info in case the cursor is between an equal sign (=) and an attribute value.", function () {
            var tagInfo;

            testDocument.replaceRange("  ", {line: 4, ch: 50});
            tagInfo = XMLUtils.getTagInfo(testEditor, {line: 4, ch: 51});
            expectNoTagInfo(tagInfo);
        });

        it("should provide query for first value", function () {
            var tagInfo;

            // After =
            tagInfo = XMLUtils.getTagInfo(testEditor, {line: 2, ch: 50});
            expect(XMLUtils.getValueQuery(tagInfo)).toBe("");

            // Afters ="
            tagInfo = XMLUtils.getTagInfo(testEditor, {line: 2, ch: 51});
            expect(XMLUtils.getValueQuery(tagInfo)).toBe("");

            // After ="x
            tagInfo = XMLUtils.getTagInfo(testEditor, {line: 2, ch: 52});
            expect(XMLUtils.getValueQuery(tagInfo)).toBe("x");

            // After ="xMin
            tagInfo = XMLUtils.getTagInfo(testEditor, {line: 2, ch: 55});
            expect(XMLUtils.getValueQuery(tagInfo)).toBe("xMin");

            // After ="xMinYMin
            tagInfo = XMLUtils.getTagInfo(testEditor, {line: 2, ch: 59});
            expect(XMLUtils.getValueQuery(tagInfo)).toBe("xMinYMin");
        });

        it("should provide query for second value", function () {
            var tagInfo;

            // Before meet"
            tagInfo = XMLUtils.getTagInfo(testEditor, {line: 2, ch: 60});
            expect(XMLUtils.getValueQuery(tagInfo)).toBe("");

            // After m in meet
            tagInfo = XMLUtils.getTagInfo(testEditor, {line: 2, ch: 61});
            expect(XMLUtils.getValueQuery(tagInfo)).toBe("m");

            // After meet and before "
            tagInfo = XMLUtils.getTagInfo(testEditor, {line: 2, ch: 64});
            expect(XMLUtils.getValueQuery(tagInfo)).toBe("meet");
        });

        it("should provide query for middle value", function () {
            var tagInfo;

            // between xMinYMin and meet
            testDocument.replaceRange(" ", {line: 2, ch: 59});
            tagInfo = XMLUtils.getTagInfo(testEditor, {line: 2, ch: 60});
            expect(XMLUtils.getValueQuery(tagInfo)).toBe("");

            // After x, between xMinYMin and meet
            testDocument.replaceRange("x", {line: 2, ch: 60});
            tagInfo = XMLUtils.getTagInfo(testEditor, {line: 2, ch: 61});
            expect(XMLUtils.getValueQuery(tagInfo)).toBe("x");

            // After xMax, between xMinYMin and meet
            testDocument.replaceRange("Max", {line: 2, ch: 61});
            tagInfo = XMLUtils.getTagInfo(testEditor, {line: 2, ch: 64});
            expect(XMLUtils.getValueQuery(tagInfo)).toBe("xMax");

            // After xMaxYMax, between xMinYMin and meet
            testDocument.replaceRange("YMax", {line: 2, ch: 64});
            tagInfo = XMLUtils.getTagInfo(testEditor, {line: 2, ch: 68});
            expect(XMLUtils.getValueQuery(tagInfo)).toBe("xMaxYMax");
        });
    });
});
