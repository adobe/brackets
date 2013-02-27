/*
 * Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
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
/*global define, $, describe, CodeMirror, jasmine, beforeEach, afterEach, it, runs, waitsFor, expect, waitsForDone, waitsForFail */

define(function (require, exports, module) {
    'use strict';
    
    // Load dependent modules
    var LanguageManager = require("language/LanguageManager"),
        PathUtils       = require("thirdparty/path-utils/path-utils.min"),
        SpecRunnerUtils = require("spec/SpecRunnerUtils"),
        FileUtils       = require("file/FileUtils");
    
    describe("LanguageManager", function () {
        
        function defineLanguage(definition) {
            var def = $.extend({}, definition);
            
            if (def.blockComment) {
                def.blockComment = [def.blockComment.prefix, def.blockComment.suffix];
            }
            
            if (def.lineComment) {
                def.lineComment = def.lineComment.prefix;
            }
            
            return LanguageManager.defineLanguage(definition.id, def);
        }
        
        function validateLanguage(expected, actual) {
            if (!actual) {
                actual = LanguageManager.getLanguage(expected.id);
            } else {
                expect(LanguageManager.getLanguage(expected.id)).toBe(actual);
            }
            
            expect(actual.id).toBe(expected.id);
            expect(actual.name).toBe(expected.name);
            
            expect(actual.getFileExtensions()).toEqual(expected.fileExtensions || []);
            
            if (expected.blockComment) {
                expect(expected.blockComment.prefix).toBe(actual.blockComment.prefix);
                expect(expected.blockComment.suffix).toBe(actual.blockComment.suffix);
            } else {
                expect(actual.blockComment).toBe(undefined);
            }
            
            if (expected.lineComment) {
                expect(expected.lineComment.prefix).toBe(actual.lineComment.prefix);
            } else {
                expect(actual.lineComment).toBe(undefined);
            }
            
            // using async waitsFor is ok if it's the last block in a spec
            if (expected.mode) {
                waitsForDone(actual.modeReady, '"' + expected.mode + '" mode loading', 10000);
            } else {
                waitsForFail(actual.modeReady, '"' + expected.mode + '" should not load', 10000);
            }
        }
        
        describe("built-in languages", function () {
            
            it("should support built-in languages", function () {
                var html = LanguageManager.getLanguage("html");
                
                // check basic language support
                expect(html).not.toBeNull();
                expect(LanguageManager.getLanguage("css")).not.toBeNull();
                expect(LanguageManager.getLanguage("javascript")).not.toBeNull();
                expect(LanguageManager.getLanguage("json")).not.toBeNull();
                
                // check html mode
                var def = {
                    "id": "html",
                    "name": "HTML",
                    "mode": ["htmlmixed", "text/x-brackets-html"],
                    "fileExtensions": ["html", "htm", "shtm", "shtml", "xhtml", "cfm", "cfml", "cfc", "dhtml", "xht"],
                    "blockComment": {prefix: "<!--", suffix: "-->"}
                };
                
                validateLanguage(def, html);
            });
            
        });
        
        describe("LanguageManager API", function () {
            
            it("should map modes to languages", function () {
                var html = LanguageManager.getLanguage("html");
                
                expect(html).not.toBe(null);
                expect(LanguageManager.getLanguage("DoesNotExist")).toBe(undefined);
            });
            
            it("should map extensions to languages", function () {
                var html    = LanguageManager.getLanguage("html"),
                    unknown = LanguageManager.getLanguage("unknown");
                
                expect(LanguageManager.getLanguageForFileExtension("foo.html")).toBe(html);
                expect(LanguageManager.getLanguageForFileExtension("INDEX.HTML")).toBe(html);
                expect(LanguageManager.getLanguageForFileExtension("foo.doesNotExist")).toBe(unknown);
            });
            
        });

        describe("defineLanguage", function () {
            
            it("should create a basic language", function () {
                var def     = { id: "one", name: "One" },
                    lang    = defineLanguage(def);
                
                validateLanguage(def, lang);
            });
            
            it("should throw errors for invalid language id values", function () {
                expect(function () { defineLanguage({ id: null   }); }).toThrow(new Error("Language ID must be a string"));
                expect(function () { defineLanguage({ id: "123"  }); }).toThrow(new Error('Invalid language ID "123": Only groups of letters a-z are allowed, separated by _ (i.e. "cpp" or "foo_bar")'));
                expect(function () { defineLanguage({ id: "html" }); }).toThrow(new Error('Language "html" is already defined'));
            });
            
            it("should throw errors for invalid language name values", function () {
                expect(function () { defineLanguage({ id: "two"             }); }).toThrow(new Error("name must be a string"));
                expect(function () { defineLanguage({ id: "three", name: "" }); }).toThrow(new Error("name must not be empty"));
            });
            
            it("should create a language with file extensions and a mode", function () {
                var def     = { id: "pascal", name: "Pascal", fileExtensions: ["pas", "p"], mode: "pascal" },
                    lang    = defineLanguage(def);
                
                expect(LanguageManager.getLanguageForFileExtension("file.p")).toBe(lang);
                
                validateLanguage(def, lang);
            });
            
            it("should allow multiple languages to use the same mode", function () {
                var xmlBefore   = LanguageManager.getLanguage("xml"),
                    def         = { id: "wix", name: "WiX", fileExtensions: ["wix"], mode: "xml" },
                    lang        = defineLanguage(def),
                    xmlAfter    = LanguageManager.getLanguage("xml");
                
                expect(xmlBefore).toBe(xmlAfter);
                expect(LanguageManager.getLanguageForFileExtension("file.wix")).toBe(lang);
                expect(LanguageManager.getLanguageForFileExtension("file.xml")).toBe(xmlAfter);
                
                validateLanguage(def, lang);
            });
            
            // FIXME: Add internal LanguageManager._reset()
            // or unload a language (pascal is loaded from the previous test)
            it("should return an error if a language is already defined", function () {
                var def = { id: "pascal", name: "Pascal", fileExtensions: ["pas", "p"], mode: "pascal" };
                
                expect(function () { defineLanguage(def); }).toThrow(new Error('Language "pascal" is already defined'));
            });
            
            it("should validate comment prefix/suffix", function () {
                var def     = { id: "coldfusion", name: "ColdFusion", fileExtensions: ["cfml", "cfm"], mode: "xml" },
                    lang    = defineLanguage(def);
                
                expect(function () { lang.setLineComment("");           }).toThrow(new Error("prefix must not be empty"));
                expect(function () { lang.setBlockComment("<!---", ""); }).toThrow(new Error("suffix must not be empty"));
                expect(function () { lang.setBlockComment("", "--->");  }).toThrow(new Error("prefix must not be empty"));
                
                def.lineComment = {
                    prefix: "//"
                };
                def.blockComment = {
                    prefix: "<!---",
                    suffix: "--->"
                };
                
                lang.setLineComment(def.lineComment.prefix);
                lang.setBlockComment(def.blockComment.prefix, def.blockComment.suffix);
                
                validateLanguage(def, lang);
            });
            
            it("should load a built-in CodeMirror mode", function () {
                var id = "erlang";
                
                runs(function () {
                    // erlang is not defined in the default set of languages in languages.json
                    expect(CodeMirror.modes[id]).toBe(undefined);
                    
                    var def     = { id: id, name: "erlang", fileExtensions: ["erlang"], mode: "erlang" },
                        lang    = defineLanguage(def);
                    
                    expect(LanguageManager.getLanguageForFileExtension("file.erlang")).toBe(lang);
                    
                    validateLanguage(def, lang);
                });
                
                runs(function () {
                    // confirm the mode is loaded in CodeMirror
                    expect(CodeMirror.modes[id]).not.toBe(undefined);
                });
            });
            
        });
        
        describe("rename file extension", function () {
            
            it("should update the document's language when a file is renamed", function () {
                var javascript  = LanguageManager.getLanguage("javascript"),
                    html        = LanguageManager.getLanguage("html"),
                    doc         = SpecRunnerUtils.createMockDocument("foo", javascript),
                    spy         = jasmine.createSpy("languageChanged event handler");
                
                // sanity check language
                expect(doc.getLanguage()).toBe(javascript);
                
                // listen for event
                $(doc).on("languageChanged", spy);
                
                // trigger a rename
                FileUtils.updateFileEntryPath(doc.file, doc.file.name, "dummy.html", false);
                
                // language should change
                expect(doc.getLanguage()).toBe(html);
                expect(spy).toHaveBeenCalled();
                expect(spy.callCount).toEqual(1);
                
                // check callback args (arg 0 is a jQuery event)
                expect(spy.mostRecentCall.args[1]).toBe(javascript);
                expect(spy.mostRecentCall.args[2]).toBe(html);
            });
            
        });
    });
});
