/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, describe: false, it: false, xit: false, expect: false, beforeEach: false, afterEach: false, waitsFor: false, runs: false, $: false, CodeMirror: false */

define(function (require, exports, module) {
    'use strict';
    
    var NativeFileSystem        = require("NativeFileSystem").NativeFileSystem,
        Async                   = require("Async"),
        FileUtils               = require("FileUtils"),
        CSSManager              = require("CSSManager"),
        SpecRunnerUtils         = require("./SpecRunnerUtils.js");
    
    var testPath                = SpecRunnerUtils.getTestPath("/spec/CSSManager-test-files"),
        simpleCssFileEntry      = new NativeFileSystem.FileEntry(testPath + "/simple.css"),
        universalCssFileEntry   = new NativeFileSystem.FileEntry(testPath + "/universal.css"),
        groupsFileEntry         = new NativeFileSystem.FileEntry(testPath + "/groups.css");
    
    var getSelectorAt = function (info, i, selectorGroupPos) {
        var selectors = info[i].ruleset.selectors,
            selector,
            selectorCount   = selectors.length;
        
        if (selectorGroupPos !== undefined) {
            selector = selectors[selectorGroupPos];
        } else if (selectorCount) {
            selector = selectors[selectorCount - 1];
        }
        
        return selector;
    };
    
    // Jasmine matcher for sprint 4 selector matching
    var toMatchLastSelector = function (expected) {
        return this.actual.toCSS({compress: true}).trim() === expected;
    };
    
    function getTextForInfos(infos) {
        var results = [],
            deferred = new $.Deferred();
        
        var masterPromise = Async.doInParallel(infos, function (info) {
            var oneFileResult = new $.Deferred();
            var textResult = FileUtils.readAsText(info.source);
        
            textResult.done(function (content) {
                content = content.replace(/\r\n/g, '\n');
                var lines = content.split("\n").slice(info.lineStart, info.lineEnd + 1);
                
                results.push(lines.join("\n"));
                oneFileResult.resolve();
            });
            
            return oneFileResult;
        });
        
        masterPromise.done(function () {
            deferred.resolve(results);
        });
        
        return deferred;
    }
    
    function init(spec, fileEntry) {
        spec.cssManager = new CSSManager.CSSManager();
        
        if (fileEntry) {
            spec.addMatchers({toMatchLastSelector: toMatchLastSelector});
            
            var styleRules;
            
            runs(function () {
                spec.cssManager.loadFile(fileEntry).done(function (result) {
                    styleRules = result;
                });
            });
            
            waitsFor(function () { return styleRules; }, 1000);
        }
    }
    
    
    describe("CSSManager", function () {
        
        beforeEach(function () {
            init(this);
        });
        
        describe("initial state", function () {
            
            it("should initialize with no rules", function () {
                expect(this.cssManager.getStyleRules().length).toEqual(0);
            });
            
        });
        
        describe("loadFiles", function () {
            
            it("should parse a simple selectors from more than one file", function () {
                var simpleRules     = null,
                    universalRules  = null,
                    ruleTexts       = null;
                
                runs(function () {
                    this.cssManager.loadFile(simpleCssFileEntry).done(function (result) {
                        simpleRules = result;
                    });
                });
                
                waitsFor(function () { return simpleRules; }, 1000);
                
                runs(function () {
                    expect(simpleRules.length).toEqual(6);
                    expect(simpleRules[0].source.fullPath).toEqual(simpleCssFileEntry.fullPath);
                    expect(this.cssManager.getStyleRules()).toEqual(simpleRules);
                });
                
                runs(function () {
                    this.cssManager.loadFile(universalCssFileEntry).done(function (result) {
                        universalRules = result;
                    });
                });
                
                waitsFor(function () { return universalRules; }, 1000);
                
                runs(function () {
                    expect(universalRules.length).toEqual(4);
                    expect(universalRules[0].source.fullPath).toEqual(universalCssFileEntry.fullPath);
                    
                    // CSSManager should append these style rules
                    expect(this.cssManager.getStyleRules()).toEqual(simpleRules.concat(universalRules));
                });
            });
        });
        
        describe("RuleSetInfo", function () {
            
            it("should return correct start and end line numbers", function () {
                var styleRules  = null,
                    loadFile    = false,
                    ruleTexts   = null;
                
                runs(function () {
                    this.cssManager.loadFile(simpleCssFileEntry).done(function (result) {
                        styleRules = result;
                    });
                });
                
                waitsFor(function () { return styleRules; }, 1000);
                
                runs(function () {
                    // use lineStart and lineEnd to index into file content
                    getTextForInfos(styleRules).done(function (texts) {
                        ruleTexts = texts;
                    });
                });
                
                waitsFor(function () { return ruleTexts !== null; }, 1000);
                
                runs(function () {
                    expect(ruleTexts[0]).toEqual("html {\n    color: \"red\";\n}\n");
                    expect(ruleTexts[1]).toEqual("HTML {\n    color: \"orange\";\n}\n");
                    expect(ruleTexts[2]).toEqual(".firstGrade {\n    color: \"green\";\n}\n");
                    expect(ruleTexts[3]).toEqual(".FIRSTGRADE {\n    color: \"yellow\";\n}\n");
                    expect(ruleTexts[4]).toEqual("#brack3ts {\n    color: \"blue\";\n}\n");
                    expect(ruleTexts[5]).toEqual("#BRACK3TS {\n    color: \"black\";\n}");
                });
            });
        });
        
        describe("_loadString", function () {
            it("should parse arbitrary string content", function () {
                var results = this.cssManager._loadString("div { color: red }");
                
                expect(results.length).toEqual(1);
            });
        });
        
        describe("findMatchingRules() with simple selectors", function () {
        
            beforeEach(function () {
                init(this, simpleCssFileEntry);
            });
            
            it("should match type selectors", function () {
                var matches = this.cssManager.findMatchingRules("html");
                
                expect(matches.length).toEqual(2);
                expect(getSelectorAt(matches, 0)).toMatchLastSelector("html");
                expect(getSelectorAt(matches, 1)).toMatchLastSelector("HTML");
            });
            
            it("should match class name selectors", function () {
                var matches = this.cssManager.findMatchingRules(".firstGrade");
                
                expect(matches.length).toEqual(1);
                
                // Parser will save selectors as lowercase
                expect(getSelectorAt(matches, 0)).toMatchLastSelector(".firstGrade");
            });
            
            it("should match IDs", function () {
                var matches = this.cssManager.findMatchingRules("#brack3ts");
                
                expect(matches.length).toEqual(1);
                expect(getSelectorAt(matches, 0)).toMatchLastSelector("#brack3ts");
            });
            
            it("should not find a universal selector", function () {
                var matches = this.cssManager.findMatchingRules("pre");
                
                // html and universal selector
                expect(matches.length).toEqual(0);
            });
        });
        
        describe("findMatchingRules() with the universal selector", function () {
        
            beforeEach(function () {
                init(this, universalCssFileEntry);
            });
            
            it("should match the universal selector alone", function () {
                var matches = this.cssManager.findMatchingRules("blockquote");
                
                expect(matches.length).toEqual(1);
                expect(getSelectorAt(matches, 0)).toMatchLastSelector("*");
            });
            
            it("should match a tag name selector", function () {
                var matches = this.cssManager.findMatchingRules("p");
                
                expect(matches.length).toEqual(2);
                expect(getSelectorAt(matches, 0)).toMatchLastSelector("*");
                expect(getSelectorAt(matches, 1)).toMatchLastSelector("p");
            });
            
            it("should match a class name selector", function () {
                var matches = this.cssManager.findMatchingRules(".firstGrade");
                
                expect(matches.length).toEqual(1);
                expect(getSelectorAt(matches, 0)).toMatchLastSelector(".firstGrade");
            });
            
            it("should match an id selector", function () {
                var matches = this.cssManager.findMatchingRules("#brack3ts");
                
                expect(matches.length).toEqual(1);
                expect(getSelectorAt(matches, 0)).toMatchLastSelector("#brack3ts");
            });
        });
        
        describe("findMatchingRules() with selector grouping", function () {
        
            beforeEach(function () {
                init(this, groupsFileEntry);
            });
            
            it("should match a selector in any position of a group", function () {
                var matches = this.cssManager.findMatchingRules("h1");
                
                expect(matches.length).toEqual(4);
                expect(getSelectorAt(matches, 0, 0)).toMatchLastSelector("h1");
                expect(getSelectorAt(matches, 1, 1)).toMatchLastSelector("h1");
                expect(getSelectorAt(matches, 2, 0)).toMatchLastSelector("h1");
                expect(getSelectorAt(matches, 3, 2)).toMatchLastSelector("h1");
            });
        });
        
        describe("findMatchingRules() with sprint 4 exemptions", function () {
        
            beforeEach(function () {
                var sprint4exemptions = new NativeFileSystem.FileEntry(testPath + "/sprint4.css");
                init(this, sprint4exemptions);
            });
            
            it("should match a class selector (right-most only, no pseudo or attr selectors)", function () {
                var matches = this.cssManager.findMatchingRules(".message");
                
                expect(matches.length).toEqual(7);
                expect(getSelectorAt(matches, 0, 0)).toMatchLastSelector("div.message");
                expect(getSelectorAt(matches, 1, 0)).toMatchLastSelector("footer .message");
                expect(getSelectorAt(matches, 2, 0)).toMatchLastSelector("footer div.message");
                expect(getSelectorAt(matches, 3, 1)).toMatchLastSelector("h2.message");
                expect(getSelectorAt(matches, 4, 0)).toMatchLastSelector("div.message:hovered");
                expect(getSelectorAt(matches, 5, 0)).toMatchLastSelector(".message:hover");
                expect(getSelectorAt(matches, 6, 0)).toMatchLastSelector(".message[data-attr='42']");
            });
            
            it("should match a type selector (can terminate with class name, ID, pseudo or attr selectors)", function () {
                var matches = this.cssManager.findMatchingRules("h4");
                
                expect(matches.length).toEqual(5);
            });
        });
    }); // describe("CSSManager")
    
    
    describe("CSS Parsing: ", function () {
        
        var manager,
            match;
        
        function findMatchingRules(tagInfo) {
            if (tagInfo) {
                var selector = "";
                if (tagInfo.tag) {
                    selector += tagInfo.tag;
                }
                if (tagInfo.clazz) {
                    selector += "." + tagInfo.clazz;
                }
                if (tagInfo.id) {
                    selector += "#" + tagInfo.id;
                }
                return manager.findMatchingRules(selector);
            } else {
                return [];
            }
        }
        
        /**
         * Test helper function; tagInfo object contains one of: tag, id, clazz. Tests against a
         * clean CSSManager that has loaded only the given cssCode string.
         */
        var _match = function (cssCode, tagInfo) {
            try {
                manager = new CSSManager.CSSManager();
                manager._loadString(cssCode);
            } catch (e) {
                this.fail(e.message + ": " + cssCode);
                return [];
            }
            
            return findMatchingRules(tagInfo);
        };
        
        /** Tests against the CSSManager created by the most recent call to match() */
        function matchAgain(tagInfo) {
            return findMatchingRules(tagInfo);
        }
        
        beforeEach(function () {
            match = _match.bind(this);
        });

        describe("Simple selectors: ", function () {
        
            it("should match a lone type selector given a type", function () {
                var result = match("div { color:red }", { tag: "div" });
                expect(result.length).toBe(1);
                
                result = matchAgain({ tag: "span" });
                expect(result.length).toBe(0);
                
                result = matchAgain({ tag: "divfoo" });
                expect(result.length).toBe(0);
                
                result = matchAgain({ tag: "di" });
                expect(result.length).toBe(0);
            });
            
            it("should match a lone class selector given a class", function () {
                var result = match(".foo { color:red }", { clazz: "foo" });
                expect(result.length).toBe(1);
                
                result = matchAgain({ clazz: "bar" });
                expect(result.length).toBe(0);
                
                result = matchAgain({ clazz: "foobar" });
                expect(result.length).toBe(0);
                
                result = matchAgain({ clazz: "fo" });
                expect(result.length).toBe(0);
                
                result = matchAgain({ clazz: ".foo" });
                expect(result.length).toBe(0);
            });
            
            it("should match a lone id selector given an id", function () {
                var result = match("#foo { color:red }", { id: "foo" });
                expect(result.length).toBe(1);
                
                result = matchAgain({ id: "bar" });
                expect(result.length).toBe(0);
                
                result = matchAgain({ id: "foobar" });
                expect(result.length).toBe(0);
                
                result = matchAgain({ id: "fo" });
                expect(result.length).toBe(0);
                
                result = matchAgain({ id: "#foo" });
                expect(result.length).toBe(0);
            });
            
            it("shouldn't confuse type, class, and id", function () {
                var css = "div { color:red } \n" +
                          ".foo { color:green } \n" +
                          "#bar { color:blue }";
                           
                var result = match(css, { tag: "div" });
                expect(result.length).toBe(1);
                result = matchAgain({ tag: "foo" });
                expect(result.length).toBe(0);
                result = matchAgain({ tag: "bar" });
                expect(result.length).toBe(0);
                
                result = matchAgain({ clazz: "div" });
                expect(result.length).toBe(0);
                result = matchAgain({ clazz: "foo" });
                expect(result.length).toBe(1);
                result = matchAgain({ clazz: "bar" });
                expect(result.length).toBe(0);
                
                result = matchAgain({ id: "div" });
                expect(result.length).toBe(0);
                result = matchAgain({ id: "foo" });
                expect(result.length).toBe(0);
                result = matchAgain({ id: "bar" });
                expect(result.length).toBe(1);
            });
            
            it("should be case-sensitive for all but types", function () {
                var css = "div { color:red } \n" +
                          "DIV { color:red } \n" +
                          ".foo { color:green } \n" +
                          ".Foo { color:black } \n" +
                          "#bar { color:blue } \n" +
                          "#baR { color:white }";
                           
                var result = match(css, { tag: "div" });
                expect(result.length).toBe(2);
                result = matchAgain({ tag: "Div" });
                expect(result.length).toBe(2);
                
                result = matchAgain({ clazz: "foo" });
                expect(result.length).toBe(1);
                result = matchAgain({ clazz: "Foo" });
                expect(result.length).toBe(1);
                result = matchAgain({ clazz: "FOO" });
                expect(result.length).toBe(0);
                
                result = matchAgain({ id: "bar" });
                expect(result.length).toBe(1);
                result = matchAgain({ id: "baR" });
                expect(result.length).toBe(1);
                result = matchAgain({ id: "BAR" });
                expect(result.length).toBe(0);
            });
            
            it("should match permissively", function () {
                var css = "div.foo { color:red } \n" +
                          "div#bar { color:green } \n" +
                          "div.foo#bar { color:blue } \n" +
                          ".foo#bar { color:black } \n" +
                          "div.foo.class2 { color: white } \n" +
                          ".foo.class2 { color: yellow } \n" +
                          ".foo#bar.class2 { color: cyan }";
                // note last line: id selectors don't necessarily need to come last
                
                var result = match(css, { tag: "div" });   // all selectors including a 'div' type selector
                expect(result.length).toBe(4);
                
                result = matchAgain({ clazz: "foo" });      // all selectors including a '.foo' class selector
                expect(result.length).toBe(6);
                
                result = matchAgain({ clazz: "class2" });   // all selectors including a '.class2' class selector
                expect(result.length).toBe(3);
                
                result = matchAgain({ id: "bar" });         // all selectors including a '#bar' id selector
                expect(result.length).toBe(4);
            });
            
            it("should allow searching conjunctions of type, class, and id", function () {
                // TODO: not required for Sprint 4
                
                // var css = "div.foo { color:red } \n" +
                //           "div#bar { color:green } \n" +
                //           "div.foo#bar { color:blue } \n" +
                //           ".foo#bar { color:black } \n" +
                //           "div.foo.class2 { color: white } \n" +
                //           ".foo.class2 { color: yellow } \n" +
                //           ".foo#bar.class2 { color: cyan }";
                // // note last line: id selectors don't necessarily need to come last
                //
                // var result = match(css, { tag: "div", clazz: "foo" });   // all selectors including a 'div' type selector AND a '.foo' class selector
                // expect(result.length).toBe(3);
                //
                // // TODO: any way to search two of the same thing? (e.g. all selectors including a '.foo' AND a '.class2' class selector)
                //
                // result = matchAgain({ clazz: "foo", id: "bar" });   // all selectors including a '.foo' class selector AND a '#bar' id selector
                // expect(result.length).toBe(3);
                //
                // result = matchAgain({ tag: "div", id: "bar" });      // all selectors including a 'div' type selector AND a '#bar' id selector
                // expect(result.length).toBe(2);
                //
                // result = matchAgain({ tag: "div", clazz: "foo", id: "bar" });
                // expect(result.length).toBe(1);
                //
                // result = matchAgain({ tag: "div", clazz: "class2", id: "bar" });
                // expect(result.length).toBe(0);
            });
            
            it("should match lone '*' given any tag; else ignore", function () {
                var css = "* { color:red } \n" +
                          "*.foo { color:green } \n" +
                          "*#bar { color:blue } \n" +
                          "*.foo#bar { color:yellow }";
                // should be treated the same as: *, .foo, #bar, .foo#bar respectively
                
                var result = match(css, { tag: "div" });
                expect(result.length).toBe(1);
                
                result = matchAgain({ clazz: "foo" });
                expect(result.length).toBe(2);
                
                result = matchAgain({ id: "bar" });
                expect(result.length).toBe(2);
                
                result = matchAgain({ clazz: "otherClass" });
                expect(result.length).toBe(0);
                result = matchAgain({ id: "otherId" });
                expect(result.length).toBe(0);
            });
            
            it("should ignore pseudo-class selectors", function () {
                // Note: not actually required for Sprint 4
                var css = "div:hover { color:red } \n" +
                          ".foo:hover { color:green } \n" +
                          "div.foo:hover { color:blue } \n" +
                          "#bar:hover { color:yellow } \n" +
                          "div#bar:hover { color:black } \n" +
                          ".foo.class2:hover { color:white } \n" +
                          "div:focus:hover { color:cyan } \n" +
                          "div.foo:focus:hover { color:brown } \n" +
                          ".foo:focus:hover { color:pink } \n" +
                          "div:focus.class3:hover { color:purple } \n" +
                          ":focus.class3:hover { color:gray }";
                
                var result = match(css, { tag: "div" });
                expect(result.length).toBe(6);
                result = matchAgain({ clazz: "foo" });
                expect(result.length).toBe(5);
                result = matchAgain({ id: "bar" });
                expect(result.length).toBe(2);
                
                result = matchAgain({ clazz: "class3" });
                expect(result.length).toBe(2);
                
                result = matchAgain({ tag: "hover" });
                expect(result.length).toBe(0);
                result = matchAgain({ clazz: "hover" });
                expect(result.length).toBe(0);
                result = matchAgain({ id: "hover" });
                expect(result.length).toBe(0);
                result = matchAgain({ tag: "focus" });
                expect(result.length).toBe(0);
                result = matchAgain({ clazz: "focus" });
                expect(result.length).toBe(0);
                result = matchAgain({ id: "focus" });
                expect(result.length).toBe(0);
            });
            
            it("should ignore attribute selectors", function () {
                // Note: not actually required for Sprint 4
                var css = "div { color:red } \n" +
                          "div[foo] { color:green } \n" +
                          "h4[div] { color:blue } \n" +
                          "h4[foo] { color:blue } \n" +
                          "h4[title=\"div\"] { color:yellow } \n" +
                          "h4[title=\".foo\"] { color:yellow } \n" +
                          "h4[attr].bar { color:black } \n" +
                          "h4.bar[attr] { color:black }";
                
                var result = match(css, { tag: "div" });
                expect(result.length).toBe(2);
                result = matchAgain({ tag: "h4" });
                expect(result.length).toBe(6);
                
                result = matchAgain({ clazz: "foo" });
                expect(result.length).toBe(0);
                result = matchAgain({ clazz: "bar" });
                expect(result.length).toBe(2);
            });
            
            it("should ignore the content of strings", function () {
                // Spaces inside string, single quotes
                var result = match("div[attr='.foo #bar'] {}", { tag: "div" });
                expect(result.length).toBe(1);
                result = matchAgain({ clazz: "foo" });
                expect(result.length).toBe(0);
                result = matchAgain({ id: "bar" });
                expect(result.length).toBe(0);

                // ...double quotes
                result = match("div[attr=\".foo #bar\"] {}", { tag: "div" });
                expect(result.length).toBe(1);
                result = matchAgain({ clazz: "foo" });
                expect(result.length).toBe(0);
                result = matchAgain({ id: "bar" });
                expect(result.length).toBe(0);
                
                // Quotes nested within quotes
                var css = "div[attr=\"value with \\\"nested double .quotes\\\"\"] { color:red } \n" +
                          "div[attr=\"value with 'single .quotes'\"] { color:green } \n" +
                          "div[attr='value with \\'nested single .quotes\\''] { color:blue } \n" +
                          "div[attr='value with \"double .quotes\"'] { color:blue } \n" +
                          "div[attr='value with \"double .quotes\"'].foo { color:yellow } \n" +
                          "div#bar[attr='value with \"double .quotes\"h4'] { color:white } \n" +
                          "div[attr='value with \"double .quotes\"h4'] .foo { color:black } \n" +
                          ".foo { color:cyan }";
                           
                result = match(css, { tag: "div"});
                expect(result.length).toBe(6);
                result = matchAgain({ clazz: "foo"});
                expect(result.length).toBe(3);
                result = matchAgain({ id: "bar"});
                expect(result.length).toBe(1);
                
                result = matchAgain({ clazz: "quotes"});
                expect(result.length).toBe(0);
                result = matchAgain({ tag: "h4"});
                expect(result.length).toBe(0);
                
                // Braces inside string; string inside rule (not inside selector)
                css = "a::after { content: ' {' attr(href) '}'; } \n" +
                      ".foo { color:red } \n" +
                      "a::after { content: \" {\" attr(href) \"}\"; } \n" +
                      "li::before { content: \"} h4 { color:black }\"; } \n" +
                      "div { color:green }";
                
                result = match(css, { tag: "a" });
                expect(result.length).toBe(2);
                result = matchAgain({ tag: "div" });
                expect(result.length).toBe(1);
                result = matchAgain({ clazz: "foo" });
                expect(result.length).toBe(1);
                result = matchAgain({ tag: "h4" });
                expect(result.length).toBe(0);
                
                // Newline inside string (escaped)
                result = match("li::before { content: 'foo\\nbar'; } \n div { color:red }", { tag: "div" });
                expect(result.length).toBe(1);
                
                // Newline inside string (unescaped, with backslash line terminator)
                // TODO (issue #317): LESS parser chokes on this
                // result = match("li::before { content: 'foo\\\nbar'; } \n div { color:red }", { tag: "div" });
                // expect(result.length).toBe(1);
            });
            
            it("shouldn't crash on CSS3 selectors", function () {
                // See spec: http://www.w3.org/TR/selectors/
                
                // Attribute selectors
                match("[role] {}");
                match("a[href] {}");
                match(".slider[role] {}");
                match("a[href][nofollow] {}");
                match("[href][nofollow] {}");
                match("[attr='value'] {}");
                match("[attr=\"value\"] {}");
                match("[attr~='value'] {}");
                match("[attr|='value'] {}");
                match("[attr^='value'] {}");
                match("[attr$='value'] {}");
                match("[attr*='value'] {}");
                match("div[attr*='value'].myClass#myId {}");
                match("div#myId[attr*='value'].myClass {}");
                match(":focus[attr=\"value\"].className {}");
                
                // TODO (issue #317): LESS parser chokes on attributes ending in a digit
                // match("tagName[attr2='value'] {}");
                // match("tagName[attr2 = 'value'] {}");
                // match("tagName[attr2 ='value'] {}");
                // match("tagName[attr2= 'value'] {}");
                // match("tagName[attr2=\"value\"] {}");
                // match("[attr2='value'] {}"); 
                // match("tagName[attr=\"value\"][attr2=\"value2\"] {}");
                // match("tagName[attr='value'][attr2='value2'] {}");
                match(":not([attr2=\"value2\"]) {}");   // oddly, works fine if it's in a :not() clause
                
                // Pseudo-classes with complicated syntax
                match(":lang(de) {}");
                match(":lang(en-US) {}");
                match("ul:nth-child(+2n) {}");
                match("ul:nth-child( 2n + 1 ) {}");
                match("ul:nth-child(2n + 1) {}");
                match("ul:nth-child(2n+1) {}");
                match("ul:nth-child(-2n+1) {}");
                match("ul:nth-child(+n+1) {}");
                match("ul:nth-child(n-1) {}");
                match("ul:nth-child(0n+5) {}");
                match("ul:nth-child(-0n+5) {}");
                match("ul:nth-child(n) {}");
                match("ul:nth-child(2) {}");
                match("ul:nth-child(-2) {}");
                match("ul:nth-child(-2)[href^='ftp']#myId.myClass {}");
                
                // :not is especially nasty
                match(":not(:link) {}");
                match(":not(:link):not(:focus) {}");
                match("tagName:not(.className).className2 {}");
                match(".className:not(tagName) {}");
                match("tagName:not(.className) {}");
                match(":not(tagName.className) {}");
                match("tagName:not([attr=\"value\"]) {}");
                match("tagName:not([attr=\"value\"])[attrB='valueB'] {}");
                match("tagName[attr='value']:not([attrB=\"valueB\"]) {}");
                
                // Pseudo-elements (can only occur once, and must be after the rightmost combinator)
                match("::first-line {}");
                match("tagName::first-line {}");
                match(".className::first-line {}");
                match("::first-line.className {}"); //spec says this is valid but no browsers seem to support it
                match("p:hover::first-line {}");
                // not valid: :not(::first-line) - because pseudo-elements aren't simple selectors
                
                // Namespaces
                // TODO (issue #317): LESS parser chokes on these
                // var nsDecl = "@namespace ns \"http://www.example.com\"\n";
                // match("[*|role] {}");
                // match("[|role] {}");
                // match(nsDecl + "[ns|role] {}");
                // match(nsDecl + "[ns|role|='value'] {}");
                // match("*|div {}");
                // match("|div {}");
                // match(nsDecl + "ns|div {}");
                // match("*|* {}");
                // match("|* {}");
                // match(nsDecl + "ns|* {}");
                // match("*|*:not(*) {}");      // actual example from W3C spec; 5 points if you can figure out what it means!
            });
            
            it("shouldn't crash on CSS Animation syntax (@keyframe)", function () {
                var css = "div { color:red } \n" +
                          "@keyframes slide { \n" +
                          "  from { left: 0; } \n" +
                          "  50% { left: 30px; } \n" +
                          "  to { left: 100px; } \n" +
                          "} \n" +
                          ".foo { color:green }";
                
                var result = match(css, { tag: "div" });
                expect(result.length).toBe(1);
                result = matchAgain({ clazz: "foo" });
                expect(result.length).toBe(1);
                
                result = matchAgain({ tag: "slide" });
                expect(result.length).toBe(0);
                result = matchAgain({ tag: "from" });
                expect(result.length).toBe(0);
            });
                
        }); // describe("Simple selectors")
        
        
        describe("Combinators", function () {
            it("should ignore descendant combinators", function () {
                var result = match("h4 .foo { color:red }", { tag: "h4" });
                expect(result.length).toBe(0);
                result = matchAgain({ clazz: "foo" });
                expect(result.length).toBe(1);
                
                result = match("p h4 div { color:red }", { tag: "p" });
                expect(result.length).toBe(0);
                result = matchAgain({ tag: "h4" });
                expect(result.length).toBe(0);
                result = matchAgain({ tag: "div" });
                expect(result.length).toBe(1);
                
                result = match(".foo h4 { color:red }", { tag: "h4" });
                expect(result.length).toBe(1);
                result = matchAgain({ clazz: "foo" });
                expect(result.length).toBe(0);
                
                result = match("div div { color:red }", { tag: "div" });
                expect(result.length).toBe(1);
                result = match(".foo .foo { color:red }", { clazz: "foo" });
                expect(result.length).toBe(1);
                result = matchAgain({ tag: "foo" });
                expect(result.length).toBe(0);
            });
            
            it("should ignore other combinators", function () {
                var result = match("h4 > .foo { color:red }", { tag: "h4" });
                expect(result.length).toBe(0);
                result = matchAgain({ clazz: "foo" });
                expect(result.length).toBe(1);
                
                result = match(".foo > h4 { color:red }", { tag: "h4" });
                expect(result.length).toBe(1);
                result = matchAgain({ clazz: "foo" });
                expect(result.length).toBe(0);
                
                result = match("h4 + .foo { color:red }", { tag: "h4" });
                expect(result.length).toBe(0);
                result = matchAgain({ clazz: "foo" });
                expect(result.length).toBe(1);
                
                result = match(".foo + h4 { color:red }", { tag: "h4" });
                expect(result.length).toBe(1);
                result = matchAgain({ clazz: "foo" });
                expect(result.length).toBe(0);
                
                result = match("p > h4 + div { color:red }", { tag: "p" });
                expect(result.length).toBe(0);
                result = matchAgain({ tag: "h4" });
                expect(result.length).toBe(0);
                result = matchAgain({ tag: "div" });
                expect(result.length).toBe(1);
                result = match("p > h4 div { color:red }", { tag: "p" });
                expect(result.length).toBe(0);
                result = matchAgain({ tag: "h4" });
                expect(result.length).toBe(0);
                result = match("p > h4 div { color:red }", { tag: "div" });
                expect(result.length).toBe(1);
                
                result = match("h4>.foo { color:red }", { tag: "h4" });
                expect(result.length).toBe(0);
                result = matchAgain({ clazz: "foo" });
                expect(result.length).toBe(1);
                result = match("h4> .foo { color:red }", { tag: "h4" });
                expect(result.length).toBe(0);
                result = matchAgain({ clazz: "foo" });
                expect(result.length).toBe(1);
                result = match("h4 >.foo { color:red }", { tag: "h4" });
                expect(result.length).toBe(0);
                result = matchAgain({ clazz: "foo" });
                expect(result.length).toBe(1);
                
                result = match("h4+.foo { color:red }", { tag: "h4" });
                expect(result.length).toBe(0);
                result = matchAgain({ clazz: "foo" });
                expect(result.length).toBe(1);
                
                result = match("h4 * .foo { color:red }", { tag: "h4" });
                expect(result.length).toBe(0);
                result = matchAgain({ clazz: "foo" });
                expect(result.length).toBe(1);
                result = match("h4 ~ .foo { color:red }", { tag: "h4" });
                expect(result.length).toBe(0);
                result = matchAgain({ clazz: "foo" });
                expect(result.length).toBe(1);
                
            });
        }); // describe("Combinators")        
        
        
        describe("Selector groups", function () {
            it("should match any item in selector group", function () {
                // Comma- and space- separated
                var result = match("h4, .foo, #bar { color:red }", { tag: "h4" });
                expect(result.length).toBe(1);
                result = matchAgain({ clazz: "foo" });
                expect(result.length).toBe(1);
                result = matchAgain({ id: "bar" });
                expect(result.length).toBe(1);
                
                // Comma only
                result = match("h4,.foo,#bar { color:red }", { tag: "h4" });
                expect(result.length).toBe(1);
                result = matchAgain({ clazz: "foo" });
                expect(result.length).toBe(1);
                result = matchAgain({ id: "bar" });
                expect(result.length).toBe(1);
                
                // Newline-separated
                result = match("h4,\n.foo,\r\n#bar { color:red }", { tag: "h4" });
                expect(result.length).toBe(1);
                result = matchAgain({ clazz: "foo" });
                expect(result.length).toBe(1);
                result = matchAgain({ id: "bar" });
                expect(result.length).toBe(1);
                
                // Space-separated with a space combinator
                result = match("h4, .foo #bar { color:red }", { tag: "h4" });
                expect(result.length).toBe(1);
                result = matchAgain({ clazz: "foo" });
                expect(result.length).toBe(0);
                result = matchAgain({ id: "bar" });
                expect(result.length).toBe(1);
            });
        }); // describe("Selector groups")        


        describe("At-rules", function () {
            it("should handle @media", function () {
                // TODO - not required for Sprint 4
            });
            
            it("should handle @page", function () {
                // TODO - not required for Sprint 4
            });
        }); // describe("At-rules")        


    }); //describe("CSS Parsing")
    
});
