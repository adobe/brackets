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
/*global define, $, describe, CodeMirror, jasmine, beforeEach, afterEach, it, runs, waitsFor, expect, waitsForDone, waitsForFail, spyOn */

define(function (require, exports, module) {
    'use strict';
    
    // Load dependent modules
    var LanguageManager = require("language/LanguageManager"),
        DocumentManager = require("document/DocumentManager"),
        PathUtils       = require("thirdparty/path-utils/path-utils.min"),
        SpecRunnerUtils = require("spec/SpecRunnerUtils"),
        FileUtils       = require("file/FileUtils");
    
    describe("LanguageManager", function () {
        
        beforeEach(function () {
            waitsForDone(LanguageManager.ready, "LanguageManager ready", 10000);
            
            spyOn(console, "error");
        });
        
        function defineLanguage(definition) {
            var def = $.extend({}, definition);
            
            if (def.blockComment) {
                def.blockComment = [def.blockComment.prefix, def.blockComment.suffix];
            }
            
            return LanguageManager.defineLanguage(definition.id, def);
        }
        
        function validateLanguage(expected, actual) {
            if (!actual) {
                actual = LanguageManager.getLanguage(expected.id);
            } else {
                expect(LanguageManager.getLanguage(expected.id)).toBe(actual);
            }
            
            var i = 0,
                expectedFileExtensions = expected.fileExtensions || [],
                expectedFileExtensionsLength = expectedFileExtensions.length,
                actualFileExtensions = actual.getFileExtensions();
            
            expect(actual.getId()).toBe(expected.id);
            expect(actual.getName()).toBe(expected.name);
            
            for (i; i < expectedFileExtensionsLength; i++) {
                expect(actualFileExtensions).toContain(expectedFileExtensions[i]);
            }
            
            expect(actual.getFileNames()).toEqual(expected.fileNames || []);
            
            if (expected.blockComment) {
                expect(actual.hasBlockCommentSyntax()).toBe(true);
                expect(actual.getBlockCommentPrefix()).toBe(expected.blockComment.prefix);
                expect(actual.getBlockCommentSuffix()).toBe(expected.blockComment.suffix);
            } else {
                expect(actual.hasBlockCommentSyntax()).toBe(false);
            }
            
            if (expected.lineComment) {
                var lineComment = Array.isArray(expected.lineComment) ? expected.lineComment : [expected.lineComment];
                expect(actual.hasLineCommentSyntax()).toBe(true);
                expect(actual.getLineCommentPrefixes().toString()).toBe(lineComment.toString());
            } else {
                expect(actual.hasLineCommentSyntax()).toBe(false);
            }
        }
        
        describe("built-in languages", function () {
            
            it("should support built-in languages", function () {
                var html   = LanguageManager.getLanguage("html"),
                    coffee = LanguageManager.getLanguage("coffeescript");
                
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
                    "fileExtensions": ["html", "htm", "shtm", "shtml", "xhtml"],
                    "blockComment": {prefix: "<!--", suffix: "-->"}
                };
                
                validateLanguage(def, html);
                
                def = {
                    "id": "coffeescript",
                    "name": "CoffeeScript",
                    "mode": "coffeescript",
                    "fileExtensions": ["coffee", "cf", "cson"],
                    "fileNames": ["cakefile"]
                };

                validateLanguage(def, coffee);
            });
            
        });
        
        describe("LanguageManager API", function () {
            
            it("should map identifiers to languages", function () {
                var html = LanguageManager.getLanguage("html");
                
                expect(html).not.toBe(null);
                expect(LanguageManager.getLanguage("DoesNotExist")).toBe(undefined);
            });
            
            it("should map file extensions to languages", function () {
                var html    = LanguageManager.getLanguage("html"),
                    css     = LanguageManager.getLanguage("css"),
                    unknown = LanguageManager.getLanguage("unknown");
                
                // Bare file names
                expect(LanguageManager.getLanguageForPath("foo.html")).toBe(html);
                expect(LanguageManager.getLanguageForPath("INDEX.HTML")).toBe(html);
                expect(LanguageManager.getLanguageForPath("foo.doesNotExist")).toBe(unknown);
                
                // Paths
                expect(LanguageManager.getLanguageForPath("c:/only/testing/the/path.html")).toBe(html);  // abs Windows-style
                expect(LanguageManager.getLanguageForPath("/only/testing/the/path.css")).toBe(css);      // abs Mac/Linux-style
                expect(LanguageManager.getLanguageForPath("only/testing/the/path.css")).toBe(css);       // relative
                
                // Unknown file types
                expect(LanguageManager.getLanguageForPath("/code/html")).toBe(unknown);
                expect(LanguageManager.getLanguageForPath("/code/foo.html.notreally")).toBe(unknown);
            });
            
            it("should map complex file extensions to languages", function () {
                var ruby    = LanguageManager.getLanguage("ruby"),
                    html    = LanguageManager.getLanguage("html"),
                    unknown = LanguageManager.getLanguage("unknown");
                
                expect(LanguageManager.getLanguageForPath("foo.html.erb")).toBe(unknown);
                expect(LanguageManager.getLanguageForPath("foo.erb")).toBe(unknown);
                
                html.addFileExtension("html.erb");
                ruby.addFileExtension("erb");
                
                expect(LanguageManager.getLanguageForPath("foo.html.erb")).toBe(html);
                expect(LanguageManager.getLanguageForPath("foo.erb")).toBe(ruby);
            });
            
            it("should map file names to languages", function () {
                var coffee  = LanguageManager.getLanguage("coffeescript"),
                    unknown = LanguageManager.getLanguage("unknown");
                
                expect(LanguageManager.getLanguageForPath("cakefile")).toBe(coffee);
                expect(LanguageManager.getLanguageForPath("CakeFiLE")).toBe(coffee);
                expect(LanguageManager.getLanguageForPath("cakefile.doesNotExist")).toBe(unknown);
                expect(LanguageManager.getLanguageForPath("Something.cakefile")).toBe(unknown);
            });
        });

        describe("defineLanguage", function () {
            
            it("should create a basic language", function () {
                var language,
                    promise,
                    def = { id: "one", name: "One", mode: ["null", "text/plain"] };
                
                // mode already exists, this test is completely synchronous
                promise = defineLanguage(def).done(function (lang) {
                    language = lang;
                });
                
                expect(promise.state() === "resolved").toBeTruthy();
                
                validateLanguage(def, language);
            });
            
            it("should log errors for invalid language id values", function () {
                defineLanguage({ id: null });
                expect(console.error).toHaveBeenCalledWith("Language ID must be a string");
                
                defineLanguage({ id: "HTML5" });
                expect(console.error).toHaveBeenCalledWith("Invalid language ID \"HTML5\": Only groups of lower case letters and numbers are allowed, separated by underscores.");
                
                defineLanguage({ id: "_underscore" });
                expect(console.error).toHaveBeenCalledWith("Invalid language ID \"_underscore\": Only groups of lower case letters and numbers are allowed, separated by underscores.");
            });
            
            it("should log errors for invalid language name values", function () {
                defineLanguage({ id: "two" });
                expect(console.error).toHaveBeenCalledWith("name must be a string");
                
                defineLanguage({ id: "three", name: "" });
                expect(console.error).toHaveBeenCalledWith("name must not be empty");
            });
            
            it("should log errors for missing mode value", function () {
                defineLanguage({ id: "four", name: "Four" });
                expect(console.error).toHaveBeenCalledWith("mode must be a string");
                
                defineLanguage({ id: "five", name: "Five", mode: "" });
                expect(console.error).toHaveBeenCalledWith("mode must not be empty");
            });
            
            it("should create a language with file extensions and a mode", function () {
                var def = { id: "pascal", name: "Pascal", fileExtensions: ["pas", "p"], mode: "pascal" },
                    language;
                
                runs(function () {
                    defineLanguage(def).done(function (lang) {
                        language = lang;
                    });
                });
                
                waitsFor(function () {
                    return Boolean(language);
                }, "The language should be resolved", 50);
                
                runs(function () {
                    expect(LanguageManager.getLanguageForPath("file.p")).toBe(language);
                    validateLanguage(def, language);
                });
            });
            
            it("should allow multiple languages to use the same mode", function () {
                var xmlBefore,
                    def         = { id: "wix", name: "WiX", fileExtensions: ["wix"], mode: "xml" },
                    lang,
                    xmlAfter;
                
                runs(function () {
                    xmlBefore = LanguageManager.getLanguage("xml");
                    
                    defineLanguage(def).done(function (language) {
                        lang = language;
                        xmlAfter = LanguageManager.getLanguage("xml");
                    });
                });
                
                waitsFor(function () {
                    return Boolean(lang);
                }, "The language should be resolved", 50);
                
                runs(function () {
                    expect(xmlBefore).toBe(xmlAfter);
                    expect(LanguageManager.getLanguageForPath("file.wix")).toBe(lang);
                    expect(LanguageManager.getLanguageForPath("file.xml")).toBe(xmlAfter);
                    
                    validateLanguage(def, lang);
                });
            });
            
            // FIXME: Add internal LanguageManager._reset()
            // or unload a language (pascal is loaded from the previous test)
            it("should return an error if a language is already defined", function () {
                var def = { id: "pascal", name: "Pascal", fileExtensions: ["pas", "p"], mode: "pascal" },
                    error = -1;
                
                runs(function () {
                    defineLanguage(def).fail(function (err) {
                        error = err;
                    });
                });
                
                waitsFor(function () {
                    return error !== -1;
                }, "The promise should be rejected with an error", 50);
                
                runs(function () {
                    expect(error).toBe("Language \"pascal\" is already defined");
                });
            });
            
            it("should validate comment prefix/suffix", function () {
                var def = { id: "coldfusion", name: "ColdFusion", fileExtensions: ["cfml", "cfm"], mode: "xml" },
                    language;
                
                runs(function () {
                    defineLanguage(def).done(function (lang) {
                        language = lang;
                    });
                });
                
                waitsFor(function () {
                    return Boolean(language);
                }, "The language should be resolved", 50);
                
                runs(function () {
                    language.setLineCommentSyntax("");
                    expect(console.error).toHaveBeenCalledWith("prefix must not be empty");
                    
                    language.setBlockCommentSyntax("<!---", "");
                    expect(console.error).toHaveBeenCalledWith("suffix must not be empty");
                    
                    language.setBlockCommentSyntax("", "--->");
                    expect(console.error).toHaveBeenCalledWith("prefix must not be empty");
                    
                    def.lineComment = "//";
                    def.blockComment = {
                        prefix: "<!---",
                        suffix: "--->"
                    };
                    
                    language.setLineCommentSyntax(def.lineComment);
                    language.setBlockCommentSyntax(def.blockComment.prefix, def.blockComment.suffix);
                    
                    validateLanguage(def, language);
                });
            });
            
            it("should validate multiple line comment prefixes", function () {
                var def = { id: "php2", name: "PHP2", fileExtensions: ["php2"], mode: "php" },
                    language;
                
                runs(function () {
                    defineLanguage(def).done(function (lang) {
                        language = lang;
                    });
                });
                
                waitsFor(function () {
                    return Boolean(language);
                }, "The language should be resolved", 50);
                
                runs(function () {
                    language.setLineCommentSyntax([]);
                    expect(console.error).toHaveBeenCalledWith("The prefix array should not be empty");
                    
                    language.setLineCommentSyntax([""]);
                    expect(console.error).toHaveBeenCalledWith("prefix[0] must not be empty");
                    
                    language.setLineCommentSyntax(["#", ""]);
                    expect(console.error).toHaveBeenCalledWith("prefix[1] must not be empty");
                    
                    def.lineComment = ["#"];
                    
                    language.setLineCommentSyntax(def.lineComment);
                    validateLanguage(def, language);
                });
                
                runs(function () {
                    def.lineComment = ["#", "//"];
                    
                    language.setLineCommentSyntax(def.lineComment);
                    validateLanguage(def, language);
                });
            });
            
            it("should load a built-in CodeMirror mode", function () {
                var id          = "erlang",
                    def         = { id: id, name: "erlang", fileExtensions: ["erlang"], mode: "erlang" },
                    language;
                
                runs(function () {
                    // erlang is not defined in the default set of languages in languages.json
                    expect(CodeMirror.modes[id]).toBe(undefined);
                    
                    defineLanguage(def).done(function (lang) {
                        language = lang;
                    });
                });
                
                waitsFor(function () {
                    return Boolean(language);
                }, "The language should be resolved", 50);
                
                runs(function () {
                    expect(LanguageManager.getLanguageForPath("file.erlang")).toBe(language);
                    validateLanguage(def, language);
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
                    doc         = SpecRunnerUtils.createMockActiveDocument({ filename: "foo.js", language: "javascript" }),
                    spy         = jasmine.createSpy("languageChanged event handler");
                
                // sanity check language
                expect(doc.getLanguage()).toBe(javascript);
                
                // Documents are only 'active' while referenced; they won't be maintained by DocumentManager
                // for global updates like rename otherwise.
                doc.addRef();
                
                // listen for event
                $(doc).on("languageChanged", spy);
                
                // trigger a rename
                DocumentManager.notifyPathNameChanged(doc.file.name, "dummy.html", false);
                
                // language should change
                expect(doc.getLanguage()).toBe(html);
                expect(spy).toHaveBeenCalled();
                expect(spy.callCount).toEqual(1);
                
                // check callback args (arg 0 is a jQuery event)
                expect(spy.mostRecentCall.args[1]).toBe(javascript);
                expect(spy.mostRecentCall.args[2]).toBe(html);
                
                // cleanup
                doc.releaseRef();
            });

            it("should update the document's language when a language is added", function () {
                var unknown,
                    doc,
                    spy,
                    schemeLanguage,
                    promise;
                
                runs(function () {
                    // Create a scheme script file
                    doc = SpecRunnerUtils.createMockActiveDocument({ filename: "file.scheme" });
                    
                    // Initial language will be unknown (scheme is not a default language)
                    unknown = LanguageManager.getLanguage("unknown");
                    
                    // listen for event
                    spy = jasmine.createSpy("languageChanged event handler");
                    $(doc).on("languageChanged", spy);
                    
                    // sanity check language
                    expect(doc.getLanguage()).toBe(unknown);
                    
                    // make active
                    doc.addRef();
                    
                    // Add the scheme language, DocumentManager should update all open documents
                    promise = LanguageManager.defineLanguage("scheme", {
                        name: "Scheme",
                        mode: "scheme",
                        fileExtensions: ["scheme"]
                    }).done(function (language) {
                        schemeLanguage = language;
                    });
                
                    waitsForDone(promise, "loading scheme mode", 1000);
                });
                
                runs(function () {
                    // language should change
                    expect(doc.getLanguage()).toBe(schemeLanguage);
                    expect(spy).toHaveBeenCalled();
                    expect(spy.callCount).toEqual(1);
                    
                    // check callback args (arg 0 is a jQuery event)
                    expect(spy.mostRecentCall.args[1]).toBe(unknown);
                    expect(spy.mostRecentCall.args[2]).toBe(schemeLanguage);
                    
                    // cleanup
                    doc.releaseRef();
                });
            });
            
            it("should update the document's language when a language is modified", function () {
                var unknown,
                    doc,
                    spy,
                    modifiedLanguage,
                    promise;
                
                // Create a foo script file
                doc = SpecRunnerUtils.createMockActiveDocument({ filename: "test.foo" });
                
                // Initial language will be unknown (foo is not a default language)
                unknown = LanguageManager.getLanguage("unknown");
                
                // listen for event
                spy = jasmine.createSpy("languageChanged event handler");
                $(doc).on("languageChanged", spy);
                
                // sanity check language
                expect(doc.getLanguage()).toBe(unknown);
                
                // make active
                doc.addRef();
                
                modifiedLanguage = LanguageManager.getLanguage("html");
                modifiedLanguage.addFileExtension("foo");
                
                // language should change
                expect(doc.getLanguage()).toBe(modifiedLanguage);
                expect(spy).toHaveBeenCalled();
                expect(spy.callCount).toEqual(1);
                
                // check callback args (arg 0 is a jQuery event)
                expect(spy.mostRecentCall.args[1]).toBe(unknown);
                expect(spy.mostRecentCall.args[2]).toBe(modifiedLanguage);
                
                // cleanup
                doc.releaseRef();
            });
        });
    });
});
