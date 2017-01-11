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

/*jslint evil: true */
/*global describe, it, xit, expect, beforeEach, afterEach */

define(function (require, exports, module) {
    'use strict';

    var RemoteFunctions = require("text!LiveDevelopment/Agents/RemoteFunctions.js");

    // "load" RemoteFunctions
    RemoteFunctions = eval("(" + RemoteFunctions.trim() + ")()");

    // test cases
    // empty element
    var EMPTY_ELEMENT = '<div data-brackets-id="10"/>';

    // one child
    var ONE_CHILD_ELEMENT = '<div data-brackets-id="20"><div data-brackets-id="21"></div></div>';

    // two children
    var TWO_CHILD_ELEMENTS = '<div data-brackets-id="30"><div data-brackets-id="31"></div><div data-brackets-id="32"></div></div>';

    // text node
    var ONE_TEXT_NODE = '<div data-brackets-id="40">foo</div>';

    // comment node
    var ONE_COMMENT_NODE = '<div data-brackets-id="41"><!-- foo --></div>';

    // mixed text and comment nodes
    var MIXED_COMMENT_FIRST  = '<div data-brackets-id="50"><!--code--> the web</div>';
    var MIXED_COMMENT_SECOND = '<div data-brackets-id="51">code <!--the--> web</div>';
    var MIXED_COMMENT_THIRD  = '<div data-brackets-id="52">code the <!--web--></div>';

    // mixed text and element nodes
    var MIXED_ELEMENT_FIRST  = '<div data-brackets-id="60"><em data-brackets-id="61">code</em> the web</div>';
    var MIXED_ELEMENT_SECOND = '<div data-brackets-id="62">code <em data-brackets-id="63">the</em> web</div>';
    var MIXED_ELEMENT_THIRD  = '<div data-brackets-id="64">code the <em data-brackets-id="65">web</em></div>';
    var MIXED_ELEMENT_BEFORE_AFTER = '<div data-brackets-id="66"><em data-brackets-id="67">c</em>ode <em data-brackets-id="68">t</em>he <em data-brackets-id="69">w</em>eb</div>';

    // empty table
    var TABLE_EMPTY = '<table data-brackets-id="70"/>';

    // table with implicit tbody
    var TABLE_IMPLICIT_TBODY = '<table data-brackets-id="80"><tr data-brackets-id="81"><td data-brackets-id="82">foo</td></tr></table>';

    // table with explicit tbody
    var TABLE_EXPLICIT_TBODY = '<table data-brackets-id="90"><tbody data-brackets-id="91"><tr data-brackets-id="92"><td data-brackets-id="93">foo</td></tr></tbody></table>';

    // tag with extra Brackets highlighting nodes injected (this isn't realistic since they
    // will usually be directly inside <body>)
    var CHILD_WITH_HIGHLIGHT_AND_TEXT_BEFORE = '<div data-brackets-id="201">text<div class="__brackets-ld-highlight"></div></div>';
    var CHILD_WITH_HIGHLIGHT_AND_TEXT_AFTER = '<div data-brackets-id="202"><div class="__brackets-ld-highlight"></div>text</div>';
    var CHILD_WITH_HIGHLIGHT_AND_TEXT_BOTH = '<div data-brackets-id="203">before<div class="__brackets-ld-highlight"></div>after</div>';
    var CHILD_WITH_HIGHLIGHT_AND_TEXT_BEFORE_TAG = '<div data-brackets-id="204">text<div class="__brackets-ld-highlight"></div><img data-brackets-id="304"></div>';
    var CHILD_WITH_HIGHLIGHT_AND_TEXT_AFTER_TAG = '<div data-brackets-id="205"><img data-brackets-id="305"><div class="__brackets-ld-highlight"></div>text</div>';
    var CHILD_WITH_HIGHLIGHT_AND_TEXT_BOTH_TAG_AFTER = '<div data-brackets-id="206">before<div class="__brackets-ld-highlight"></div>after<img data-brackets-id="306"></div>';
    var CHILD_WITH_HIGHLIGHT_AND_TEXT_BOTH_TAG_BEFORE = '<div data-brackets-id="207"><img data-brackets-id="307">before<div class="__brackets-ld-highlight"></div>after</div>';

    // script and style tags
    var SCRIPT_TAG = '<script data-brackets-id="401"></script>';
    var STYLE_TAG = '<style data-brackets-id="402"></style>';
    var SCRIPT_TAG_WITH_TEXT = '<script data-brackets-id="403">old text</script>';
    var STYLE_TAG_WITH_TEXT = '<style data-brackets-id="404">old text</style>';

    // attr
    var ATTR_SIMPLE = '<div data-brackets-id="100" class="foo"></div>';

    describe("RemoteFunctions", function () {

        describe("DOMEditHandler", function () {

            var htmlDocument,
                editHandler,
                tagID = 1000;

            function queryBracketsID(id) {
                if (!id) {
                    return null;
                }

                var result = htmlDocument.querySelectorAll("[data-brackets-id=\"" + id + "\"]");
                return result && result[0];
            }

            function getTargetElement(edit) {
                var targetID = edit.type.match(/textReplace|textDelete|textInsert|elementInsert/) ? edit.parentID : edit.tagID;
                return queryBracketsID(targetID);
            }

            beforeEach(function () {
                htmlDocument = window.document.implementation.createHTMLDocument();
                editHandler = new RemoteFunctions.DOMEditHandler(htmlDocument);

                this.addMatchers({
                    toHaveEdit: function (edit, parentClone, ignoreParent) {
                        var msgArray    = [],
                            target      = getTargetElement(edit),
                            child,
                            before      = queryBracketsID(edit.beforeID),
                            after       = queryBracketsID(edit.afterID);

                        this.message = function () {
                            return msgArray.toString();
                        };


                        function checkAttributes(target, attrs) {
                            Object.keys(attrs).forEach(function (attr) {
                                if (target.getAttribute(attr) !== attrs[attr]) {
                                    msgArray.push("Expected attribute \"" + attr + "\" to have value: \"" + attrs[attr] + "\"");
                                }
                            });
                        }

                        if (edit.type === "elementInsert") {
                            // elementInsert tagID assignment
                            child = queryBracketsID(edit.tagID);

                            if (!child) {
                                msgArray.push("Could not find new child element \"" + edit.tag + "\" of parentID " + edit.parentID);
                            } else if (!ignoreParent &&
                                       (child.parentNode !== target ||
                                        (edit._isImplicit && child.parentNode.parentNode !== target))) {
                                msgArray.push("New child element \"" + edit.tag + "\" was not under parentID " + edit.parentID);
                            }

                            checkAttributes(child, edit._attributesExpected || edit.attributes);
                        } else if (edit.type.match(/textReplace|textInsert/)) {
                            // text node content
                            child = (edit.firstChild && target.firstChild) ||
                                (edit.lastChild && target.lastChild) ||
                                (before && before.previousSibling) ||
                                (after && after.nextSibling) ||
                                (!edit.lastChild && target.lastChild);

                            if ((edit._contentExpected && child.nodeValue !== edit._contentExpected) ||
                                    (!edit._contentExpected && child.nodeValue !== edit.content)) {
                                msgArray.push("Expected text node \"" + child.nodeValue + "\" to have content: \"" + (edit._contentExpected || edit.content) + "\"");
                            }
                        } else if (edit.type.match(/attrAdd|attrChange/)) {
                            child = queryBracketsID(edit.tagID);
                            var attrs = {};
                            attrs[edit.attribute] = edit._valueExpected || edit.value;
                            checkAttributes(child, attrs);
                        }

                        // FIXME implicit open tag
//                        if (edit.type.match(/textDelete|elementDelete/)) {
//                            // childNodes count delete
//                            if (target.childNodes.length !== parentClone.childNodes.length - 1) {
//                                msgArray.push("Expected childNodes to decrement by 1");
//                            }
//                        } else if (edit.type.match(/elementInsert|textInsert/)) {
//                            // childNodes count insert
//                            if (target.childNodes.length !== parentClone.childNodes.length + 1) {
//                                msgArray.push("Expected childNodes to increment by 1");
//                            }
//                        }

                        if (edit.type.match(/elementInsert|textInsert|textReplace/)) {
                            // child position
                            if (edit.firstChild && target.firstChild !== child) {
                                msgArray.push("expected new node as firstChild");
                            }

                            if (edit.lastChild && target.lastChild !== child) {
                                msgArray.push("elementInsert expected new node as lastChild");
                            }

                            if (edit.beforeID && before.previousSibling !== child) {
                                msgArray.push("elementInsert expected new node before beforeID=" + edit.beforeID);
                            }

                            if (edit.afterID && after.nextSibling !== child) {
                                msgArray.push("elementInsert expected new node after afterID=" + edit.afterID);
                            }
                        }

                        return msgArray.length === 0;
                    }
                });
            });

            afterEach(function () {
                htmlDocument = null;
                editHandler = null;
            });

            function applyEdit(fixtureHTML, edit, expected, targetElement, ignoreParent) {
                var parent,
                    parentClone,
                    fixture = fixtureHTML && $(fixtureHTML)[0];

                // add content to document body
                if (fixture) {
                    htmlDocument.body.appendChild(fixture);
                }

                if (edit.type === "elementInsert") {
                    edit.tagID = tagID;
                }

                edit.attributes = edit.attributes || {};

                // clone the parent before making changes to compare
                if (edit.parentID) {
                    parent = queryBracketsID(edit.parentID);

                    if (parent) {
                        parentClone = $(parent).clone()[0];
                    }
                }

                // DOM element compare
                if (!targetElement) {
                    targetElement = getTargetElement(edit);
                }

                if (edit.type === "elementDelete") {
                    targetElement = targetElement.parentNode;
                }

                editHandler.apply([edit]);
                expect(htmlDocument).toHaveEdit(edit, parentClone, ignoreParent);

                if (expected) {
                    expect(targetElement.outerHTML).toBe(expected);
                }

                if (fixture) {
                    fixture.remove();
                }
            }

            describe("Element edits", function () {

                it("should support elementInsert", function () {
                    /* empty parent */
                    applyEdit(EMPTY_ELEMENT, {
                        parentID: 10,
                        type: "elementInsert",
                        tag:  "span"
                    }, '<div data-brackets-id="10"><span data-brackets-id="1000"></span></div>');

                    /* firstChild */
                    applyEdit(ONE_CHILD_ELEMENT, {
                        parentID: 20,
                        type: "elementInsert",
                        tag:  "span",
                        firstChild: true
                    }, '<div data-brackets-id="20"><span data-brackets-id="1000"></span><div data-brackets-id="21"></div></div>');

                    /* lastChild */
                    applyEdit(ONE_CHILD_ELEMENT, {
                        parentID: 20,
                        type: "elementInsert",
                        tag:  "span",
                        lastChild: true,
                        attributes: []
                    }, '<div data-brackets-id="20"><div data-brackets-id="21"></div><span data-brackets-id="1000"></span></div>');

                    /* beforeID */
                    applyEdit(TWO_CHILD_ELEMENTS, {
                        parentID: 30,
                        beforeID: 32,
                        type: "elementInsert",
                        tag:  "span"
                    }, '<div data-brackets-id="30"><div data-brackets-id="31"></div><span data-brackets-id="1000"></span><div data-brackets-id="32"></div></div>');

                    /* afterID */
                    applyEdit(MIXED_ELEMENT_FIRST, {
                        parentID: 60,
                        afterID: 61,
                        type: "elementInsert",
                        tag:  "span"
                    }, '<div data-brackets-id="60"><em data-brackets-id="61">code</em><span data-brackets-id="1000"></span> the web</div>');
                });

                it("should parse entities in attribute values when inserting an element", function () {
                    /* empty parent */
                    applyEdit(EMPTY_ELEMENT, {
                        parentID: 10,
                        type: "elementInsert",
                        tag:  "span",
                        attributes: { "class": "And: &amp;, em-dash: &mdash;, heart: &#10084;" },
                        _attributesExpected: { "class": "And: &, em-dash: —, heart: ❤" }
                    });
                });

                it("should handle an elementInsert for an <html> tag when one already exists by just setting its id", function () {
                    applyEdit(null, {
                        type: "elementInsert",
                        tag: "html",
                        parentID: null
                    }, '<html data-brackets-id="1000"><head></head><body></body></html>', htmlDocument.documentElement, true);
                });
                it("should handle an elementInsert for a <head> tag when one already exists by just setting its id", function () {
                    applyEdit(null, {
                        type: "elementInsert",
                        tag: "head",
                        parentID: 999 // this should be ignored
                    }, '<html><head data-brackets-id="1000"></head><body></body></html>', htmlDocument.documentElement, true);
                });
                it("should handle an elementInsert for a <body> tag when one already exists by just setting its id", function () {
                    applyEdit(null, {
                        type: "elementInsert",
                        tag: "body",
                        parentID: 999 // this should be ignored
                    }, '<html><head></head><body data-brackets-id="1000"></body></html>', htmlDocument.documentElement, true);
                });

                // FIXME lastChild might need afterID instead for implicit open?
                xit("should support elementInsert when the implicit tag and children both do not exist", function () {
                    /* empty table */
                    applyEdit(TABLE_EMPTY, {
                        parentID: 70,
                        type: "elementInsert",
                        tag:  "tr",
                        firstChild: true
                    }, '<table data-brackets-id="70"><tr data-brackets-id="1000"></tr></table>');
                });

                // FIXME lastChild might need afterID instead for implicit open?
                xit("should support elementInsert when the implicit tag is hidden but a child exists", function () {
                    /* implicit tbody */
                    applyEdit(TABLE_IMPLICIT_TBODY, {
                        parentID: 80,
                        type: "elementInsert",
                        tag:  "tr",
                        lastChild: true,
                        _isImplicit: true
                    }, '<table data-brackets-id="80"><tbody><tr data-brackets-id="81"><td data-brackets-id="82">foo</td></tr><tr data-brackets-id="1000"></tr></tbody></table>');
                });

                it("should support elementInsert for implicit open tags that appear in the DOM", function () {
                    /* explicit tbody */
                    applyEdit(TABLE_EXPLICIT_TBODY, {
                        parentID: 91,
                        type: "elementInsert",
                        tag:  "tr",
                        lastChild: true
                    }, '<tbody data-brackets-id="91"><tr data-brackets-id="92"><td data-brackets-id="93">foo</td></tr><tr data-brackets-id="1000"></tr></tbody>');
                });

                it("should support elementDelete", function () {
                    /* mixed content, element-text */
                    applyEdit(MIXED_ELEMENT_FIRST, {
                        tagID: 61,
                        type: "elementDelete"
                    }, '<div data-brackets-id="60"> the web</div>');

                    /* mixed content, text-element-text */
                    applyEdit(MIXED_ELEMENT_SECOND, {
                        tagID: 63,
                        type: "elementDelete"
                    }, '<div data-brackets-id="62">code  web</div>');

                    /* mixed content, text-element */
                    applyEdit(MIXED_ELEMENT_THIRD, {
                        tagID: 65,
                        type: "elementDelete"
                    }, '<div data-brackets-id="64">code the </div>');
                });

            });

            describe("Attribute edits", function () {

                it("should support attrAdd", function () {
                    applyEdit(EMPTY_ELEMENT, {
                        type: "attrAdd",
                        tagID: 10,
                        attribute: "class",
                        value: "foo"
                    }, '<div data-brackets-id="10" class="foo"></div>');
                });

                it("should support attrChange", function () {
                    applyEdit(ATTR_SIMPLE, {
                        type: "attrChange",
                        tagID: 100,
                        attribute: "class",
                        value: "bar"
                    }, '<div data-brackets-id="100" class="bar"></div>');
                });

                it("should support attrDelete", function () {
                    applyEdit(ATTR_SIMPLE, {
                        type: "attrDelete",
                        tagID: 100,
                        attribute: "class"
                    }, '<div data-brackets-id="100"></div>');
                });

                it("should parse entities in the value when adding an attribute", function () {
                    applyEdit(EMPTY_ELEMENT, {
                        type: "attrAdd",
                        tagID: 10,
                        attribute: "class",
                        value: "And: &amp;, em-dash: &mdash;, heart: &#10084;",
                        _valueExpected: "And: &, em-dash: —, heart: ❤"
                    });
                });

                it("should parse entities in the value when changing an attribute", function () {
                    applyEdit(ATTR_SIMPLE, {
                        type: "attrChange",
                        tagID: 100,
                        attribute: "class",
                        value: "And: &amp;, em-dash: &mdash;, heart: &#10084;",
                        _valueExpected: "And: &, em-dash: —, heart: ❤"
                    });
                });
            });

            describe("Text edits", function () {

                it("should support textInsert", function () {
                    applyEdit(EMPTY_ELEMENT, {
                        type: "textInsert",
                        content: "foo",
                        parentID: 10
                    }, '<div data-brackets-id="10">foo</div>');
                });

                it("should support textReplace", function () {
                    applyEdit(ONE_TEXT_NODE, {
                        type: "textReplace",
                        content: "bar",
                        parentID: 40
                    }, '<div data-brackets-id="40">bar</div>');

                });

                it("should support textDelete", function () {
                    applyEdit(ONE_TEXT_NODE, {
                        type: "textDelete",
                        parentID: 40
                    }, '<div data-brackets-id="40"></div>');
                });

                it("should parse entities when inserting text content", function () {
                    applyEdit(EMPTY_ELEMENT, {
                        type: "textInsert",
                        content: "And: &amp;, em-dash: &mdash;, heart: &#10084;",
                        _contentExpected: "And: &, em-dash: —, heart: ❤",
                        parentID: 10
                    });
                });

                it("should parse entities when replacing text content", function () {
                    applyEdit(ONE_TEXT_NODE, {
                        type: "textReplace",
                        content: "And: &amp;, em-dash: &mdash;, heart: &#10084;",
                        _contentExpected: "And: &, em-dash: —, heart: ❤",
                        parentID: 40
                    });
                });

                it("should not parse entities when inserting into <script>", function () {
                    applyEdit(SCRIPT_TAG, {
                        type: "textInsert",
                        content: "And: &amp;, em-dash: &mdash;, heart: &#10084;",
                        parentID: 401
                    });
                });
                it("should not parse entities when inserting into <style>", function () {
                    applyEdit(STYLE_TAG, {
                        type: "textInsert",
                        content: "And: &amp;, em-dash: &mdash;, heart: &#10084;",
                        parentID: 402
                    });
                });
                it("should not parse entities when replacing in <script>", function () {
                    applyEdit(SCRIPT_TAG_WITH_TEXT, {
                        type: "textReplace",
                        content: "And: &amp;, em-dash: &mdash;, heart: &#10084;",
                        parentID: 403
                    });
                });
                it("should not parse entities when replacing in <style>", function () {
                    applyEdit(STYLE_TAG_WITH_TEXT, {
                        type: "textReplace",
                        content: "And: &amp;, em-dash: &mdash;, heart: &#10084;",
                        parentID: 404
                    });
                });
            });

            describe("Working with text and elements", function () {

                it("should support textInsert with elements", function () {
                    applyEdit(MIXED_ELEMENT_FIRST, {
                        type: "textInsert",
                        content: "x",
                        parentID: 60,
                        beforeID: 61
                    }, '<div data-brackets-id="60">x<em data-brackets-id="61">code</em> the web</div>');

                    applyEdit(MIXED_ELEMENT_THIRD, {
                        type: "textInsert",
                        content: "x",
                        parentID: 64,
                        afterID: 65
                    }, '<div data-brackets-id="64">code the <em data-brackets-id="65">web</em>x</div>');
                });

                it("should support textDelete with elements", function () {
                    applyEdit(MIXED_ELEMENT_FIRST, {
                        type: "textDelete",
                        parentID: 60,
                        afterID: 61
                    }, '<div data-brackets-id="60"><em data-brackets-id="61">code</em></div>');

                    applyEdit(MIXED_ELEMENT_SECOND, {
                        type: "textDelete",
                        parentID: 62,
                        beforeID: 63
                    }, '<div data-brackets-id="62"><em data-brackets-id="63">the</em> web</div>');

                    applyEdit(MIXED_ELEMENT_SECOND, {
                        type: "textDelete",
                        parentID: 62,
                        afterID: 63
                    }, '<div data-brackets-id="62">code <em data-brackets-id="63">the</em></div>');

                    applyEdit(MIXED_ELEMENT_THIRD, {
                        type: "textDelete",
                        parentID: 64,
                        beforeID: 65
                    }, '<div data-brackets-id="64"><em data-brackets-id="65">web</em></div>');

                    applyEdit(MIXED_ELEMENT_BEFORE_AFTER, {
                        type: "textDelete",
                        parentID: 66,
                        afterID: 67,
                        beforeID: 68
                    }, '<div data-brackets-id="66"><em data-brackets-id="67">c</em><em data-brackets-id="68">t</em>he <em data-brackets-id="69">w</em>eb</div>');

                    applyEdit(MIXED_ELEMENT_BEFORE_AFTER, {
                        type: "textDelete",
                        parentID: 66,
                        afterID: 68,
                        beforeID: 69
                    }, '<div data-brackets-id="66"><em data-brackets-id="67">c</em>ode <em data-brackets-id="68">t</em><em data-brackets-id="69">w</em>eb</div>');
                });

                it("should support textReplace with elements", function () {
                    applyEdit(MIXED_ELEMENT_FIRST, {
                        type: "textReplace",
                        parentID: 60,
                        afterID: 61,
                        content: " BRACKETS"
                    }, '<div data-brackets-id="60"><em data-brackets-id="61">code</em> BRACKETS</div>');

                    applyEdit(MIXED_ELEMENT_SECOND, {
                        type: "textReplace",
                        parentID: 62,
                        beforeID: 63,
                        content: "BRACKETS "
                    }, '<div data-brackets-id="62">BRACKETS <em data-brackets-id="63">the</em> web</div>');

                    applyEdit(MIXED_ELEMENT_SECOND, {
                        type: "textReplace",
                        parentID: 62,
                        afterID: 63,
                        content: " BRACKETS"
                    }, '<div data-brackets-id="62">code <em data-brackets-id="63">the</em> BRACKETS</div>');

                    applyEdit(MIXED_ELEMENT_THIRD, {
                        type: "textReplace",
                        parentID: 64,
                        beforeID: 65,
                        content: "BRACKETS "
                    }, '<div data-brackets-id="64">BRACKETS <em data-brackets-id="65">web</em></div>');

                    applyEdit(MIXED_ELEMENT_BEFORE_AFTER, {
                        type: "textReplace",
                        parentID: 66,
                        afterID: 67,
                        beforeID: 68,
                        content: "BRACKETS "
                    }, '<div data-brackets-id="66"><em data-brackets-id="67">c</em>BRACKETS <em data-brackets-id="68">t</em>he <em data-brackets-id="69">w</em>eb</div>');

                    applyEdit(MIXED_ELEMENT_BEFORE_AFTER, {
                        type: "textReplace",
                        parentID: 66,
                        afterID: 68,
                        beforeID: 69,
                        content: "BRACKETS "
                    }, '<div data-brackets-id="66"><em data-brackets-id="67">c</em>ode <em data-brackets-id="68">t</em>BRACKETS <em data-brackets-id="69">w</em>eb</div>');
                });

            });

            describe("Working with text and comments", function () {

                it("should support textInsert with comments", function () {
                    applyEdit(ONE_COMMENT_NODE, {
                        type: "textInsert",
                        content: "bar",
                        parentID: 41
                    }, '<div data-brackets-id="41"><!-- foo -->bar</div>');
                });

                it("should support textReplace with comments", function () {
                    applyEdit(MIXED_COMMENT_FIRST, {
                        type: "textReplace",
                        content: "x the web",
                        parentID: 50
                    }, '<div data-brackets-id="50">x the web</div>');

                    applyEdit(MIXED_COMMENT_SECOND, {
                        type: "textReplace",
                        content: "code x web",
                        parentID: 51
                    }, '<div data-brackets-id="51">code x web</div>');

                    applyEdit(MIXED_COMMENT_THIRD, {
                        type: "textReplace",
                        content: "code the x",
                        parentID: 52
                    }, '<div data-brackets-id="52">code the x</div>');
                });

                it("should support textDelete with comments", function () {
                    applyEdit(MIXED_COMMENT_FIRST, {
                        type: "textDelete",
                        parentID: 50
                    }, '<div data-brackets-id="50"></div>');

                    applyEdit(MIXED_COMMENT_SECOND, {
                        type: "textDelete",
                        parentID: 51
                    }, '<div data-brackets-id="51"></div>');

                    applyEdit(MIXED_COMMENT_THIRD, {
                        type: "textDelete",
                        parentID: 52
                    }, '<div data-brackets-id="52"></div>');
                });

            });

            describe("Ignoring injected highlight nodes in text operations", function () {
                it("should handle deleting text content before highlight node", function () {
                    applyEdit(CHILD_WITH_HIGHLIGHT_AND_TEXT_BEFORE, {
                        type: "textDelete",
                        parentID: 201
                    }, '<div data-brackets-id="201"><div class="__brackets-ld-highlight"></div></div>');
                });
                it("should handle deleting text content after highlight node", function () {
                    applyEdit(CHILD_WITH_HIGHLIGHT_AND_TEXT_AFTER, {
                        type: "textDelete",
                        parentID: 202
                    }, '<div data-brackets-id="202"><div class="__brackets-ld-highlight"></div></div>');
                });
                it("should handle deleting text content before and after highlight node", function () {
                    applyEdit(CHILD_WITH_HIGHLIGHT_AND_TEXT_BOTH, {
                        type: "textDelete",
                        parentID: 203
                    }, '<div data-brackets-id="203"><div class="__brackets-ld-highlight"></div></div>');
                });
                it("should handle deleting text content before highlight node relative to tag after highlight node", function () {
                    applyEdit(CHILD_WITH_HIGHLIGHT_AND_TEXT_BEFORE_TAG, {
                        type: "textDelete",
                        parentID: 204,
                        beforeID: 304
                    }, '<div data-brackets-id="204"><div class="__brackets-ld-highlight"></div><img data-brackets-id="304"></div>');
                });
                it("should handle deleting text content after highlight node relative to tag before highlight node", function () {
                    applyEdit(CHILD_WITH_HIGHLIGHT_AND_TEXT_AFTER_TAG, {
                        type: "textDelete",
                        parentID: 205,
                        afterID: 305
                    }, '<div data-brackets-id="205"><img data-brackets-id="305"><div class="__brackets-ld-highlight"></div></div>');
                });
                it("should handle deleting text content before and after highlight node relative to tag after", function () {
                    applyEdit(CHILD_WITH_HIGHLIGHT_AND_TEXT_BOTH_TAG_AFTER, {
                        type: "textDelete",
                        parentID: 206,
                        beforeID: 306
                    }, '<div data-brackets-id="206"><div class="__brackets-ld-highlight"></div><img data-brackets-id="306"></div>');
                });
                it("should handle deleting text content before and after highlight node relative to tag before", function () {
                    applyEdit(CHILD_WITH_HIGHLIGHT_AND_TEXT_BOTH_TAG_BEFORE, {
                        type: "textDelete",
                        parentID: 207,
                        afterID: 307
                    }, '<div data-brackets-id="207"><img data-brackets-id="307"><div class="__brackets-ld-highlight"></div></div>');
                });

                it("should handle replacing text content before highlight node", function () {
                    applyEdit(CHILD_WITH_HIGHLIGHT_AND_TEXT_BEFORE, {
                        type: "textReplace",
                        parentID: 201,
                        content: "newText"
                    }, '<div data-brackets-id="201"><div class="__brackets-ld-highlight"></div>newText</div>');
                });
                it("should handle replacing text content after highlight node", function () {
                    applyEdit(CHILD_WITH_HIGHLIGHT_AND_TEXT_AFTER, {
                        type: "textReplace",
                        parentID: 202,
                        content: "newText"
                    }, '<div data-brackets-id="202"><div class="__brackets-ld-highlight"></div>newText</div>');
                });
                it("should handle replacing text content before and after highlight node", function () {
                    applyEdit(CHILD_WITH_HIGHLIGHT_AND_TEXT_BOTH, {
                        type: "textReplace",
                        parentID: 203,
                        content: "newText"
                    }, '<div data-brackets-id="203"><div class="__brackets-ld-highlight"></div>newText</div>');
                });
                it("should handle replacing text content before highlight node relative to tag after highlight node", function () {
                    applyEdit(CHILD_WITH_HIGHLIGHT_AND_TEXT_BEFORE_TAG, {
                        type: "textReplace",
                        parentID: 204,
                        beforeID: 304,
                        content: "newText"
                    }, '<div data-brackets-id="204"><div class="__brackets-ld-highlight"></div>newText<img data-brackets-id="304"></div>');
                });
                it("should handle replacing text content after highlight node relative to tag before highlight node", function () {
                    applyEdit(CHILD_WITH_HIGHLIGHT_AND_TEXT_AFTER_TAG, {
                        type: "textReplace",
                        parentID: 205,
                        afterID: 305,
                        content: "newText"
                    }, '<div data-brackets-id="205"><img data-brackets-id="305">newText<div class="__brackets-ld-highlight"></div></div>');
                });
                it("should handle replacing text content before and after highlight node relative to tag after", function () {
                    applyEdit(CHILD_WITH_HIGHLIGHT_AND_TEXT_BOTH_TAG_AFTER, {
                        type: "textReplace",
                        parentID: 206,
                        beforeID: 306,
                        content: "newText"
                    }, '<div data-brackets-id="206"><div class="__brackets-ld-highlight"></div>newText<img data-brackets-id="306"></div>');
                });
                it("should handle replacing text content before and after highlight node relative to tag before", function () {
                    applyEdit(CHILD_WITH_HIGHLIGHT_AND_TEXT_BOTH_TAG_BEFORE, {
                        type: "textReplace",
                        parentID: 207,
                        afterID: 307,
                        content: "newText"
                    }, '<div data-brackets-id="207"><img data-brackets-id="307">newText<div class="__brackets-ld-highlight"></div></div>');
                });
            });

        });

    });
});
