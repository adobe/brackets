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
        CSSUtils                = require("CSSUtils"),
        SpecRunnerUtils         = require("./SpecRunnerUtils.js");
    
    var testPath                = SpecRunnerUtils.getTestPath("/spec/CSSManager-test-files"),
        simpleCssFileEntry      = new NativeFileSystem.FileEntry(testPath + "/simple.css"),
        universalCssFileEntry   = new NativeFileSystem.FileEntry(testPath + "/universal.css"),
        groupsFileEntry         = new NativeFileSystem.FileEntry(testPath + "/groups.css"),
        offsetsCssFileEntry     = new NativeFileSystem.FileEntry(testPath + "/offsets.css");
    
    
    /**
     * Verifies whether one of the results returned by CSSUtils._findAllMatchingSelectorsInText()
     * came from the expected selector string or not. String is the complete compound selector, not
     * the larger selector group or the smaller rightmost-simple-selector. E.g. if some rule
     * "div, foo .bar { ... }" matches a search for ".bar", the selector will be "foo .bar"
     */
    var toMatchSelector = function (expected) {
        return this.actual.selector.trim() === expected;
    };
    
    function init(spec, fileEntry) {
        spec.fileCssContent = null;
        
        if (fileEntry) {
            spec.addMatchers({toMatchSelector: toMatchSelector});
            
            var doneLoading = false;
            
            runs(function () {
                FileUtils.readAsText(fileEntry)
                    .done(function (text) {
                        spec.fileCssContent = text;
                    });
            });
            
            waitsFor(function () { return (spec.fileCssContent !== null); }, 1000);
        }
    }
    
    
    describe("CSSUtils", function () {
        
        beforeEach(function () {
            init(this);
        });
        
        describe("basics", function () {
            
            it("should parse an empty string", function () {
                runs(function () {
                    var result = CSSUtils._findAllMatchingSelectorsInText("", { tag: "div" });
                    expect(result.length).toEqual(0);
                });
            });
            
            // it("should parse simple selectors from more than one file", function () {
            //     // TODO: it'd be nice to revive this test by shimming FileIndexManager.getFileInfoList() or something
            // });
        });
        
        describe("line offsets", function () {
            
            function expectRuleRanges(spec, cssCode, selector, ranges) {
                var result = CSSUtils._findAllMatchingSelectorsInText(cssCode, selector);
                spec.expect(result.length).toEqual(ranges.length);
                ranges.forEach(function (range, i) {
                    spec.expect(result[i].line).toEqual(range.start);
                    spec.expect(result[i].ruleEndLine).toEqual(range.end);
                });
            }
            
            it("should return correct start and end line numbers for simple rules", function () {
                runs(function () {
                    init(this, simpleCssFileEntry);
                });
                
                runs(function () {
                    expectRuleRanges(this, this.fileCssContent, "html", [ {start: 0, end: 2}, {start: 4, end: 6 }]);
                    expectRuleRanges(this, this.fileCssContent, ".firstGrade", [ {start: 8, end: 10} ]);
                    expectRuleRanges(this, this.fileCssContent, "#brack3ts",
                        [ {start: 16, end: 18} ]);
                });
            });
            
            it("should handle rules on adjacent lines", function () {
                runs(function () {
                    init(this, offsetsCssFileEntry);
                });
                
                runs(function () {
                    expectRuleRanges(this, this.fileCssContent, "a", [
                        {start: 0, end: 2}, {start: 3, end: 5 }, {start: 7, end: 7},
                        {start: 8, end: 8}, {start: 10, end: 10}, {start: 10, end: 10}
                    ]);
                });
            });
        });
        
        describe("findMatchingRules() with the universal selector", function () {
        
            beforeEach(function () {
                init(this, universalCssFileEntry);
            });
            
            it("should match a tag name not referenced anywhere in the CSS", function () {
                var matches = CSSUtils._findAllMatchingSelectorsInText(this.fileCssContent, "blockquote");
                expect(matches.length).toEqual(1);
                expect(matches[0]).toMatchSelector("*");
            });
            it("should match a tag name also referenced elsewhere in the CSS", function () {
                var matches = CSSUtils._findAllMatchingSelectorsInText(this.fileCssContent, "p");
                
                expect(matches.length).toEqual(2);
                expect(matches[0]).toMatchSelector("*");
                expect(matches[1]).toMatchSelector("p");
            });
        });
        
        describe("findMatchingRules() with sprint 4 exemptions", function () {
        
            beforeEach(function () {
                var sprint4exemptions = new NativeFileSystem.FileEntry(testPath + "/sprint4.css");
                init(this, sprint4exemptions);
            });
            
            it("should match a class selector (right-most only, no pseudo or attr selectors)", function () {
                var matches = CSSUtils._findAllMatchingSelectorsInText(this.fileCssContent, ".message");
                
                expect(matches.length).toEqual(7);
                expect(matches[0]).toMatchSelector("div.message");
                expect(matches[1]).toMatchSelector("footer .message");
                expect(matches[2]).toMatchSelector("footer div.message");
                expect(matches[3]).toMatchSelector("h2.message");
                expect(matches[4]).toMatchSelector("div.message:hovered");
                expect(matches[5]).toMatchSelector(".message:hover");
                expect(matches[6]).toMatchSelector(".message[data-attr='42']");
            });
            
            it("should match a type selector (can terminate with class name, ID, pseudo or attr selectors)", function () {
                var matches = CSSUtils._findAllMatchingSelectorsInText(this.fileCssContent, "h4");
                
                expect(matches.length).toEqual(5);
            });
        });
        
    }); // describe("CSSUtils")
    
    
    describe("CSS Parsing: ", function () {
        
        var lastCssCode,
            match,
            expectParseError;
        
        function _findMatchingRules(cssCode, tagInfo) {
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
                return CSSUtils._findAllMatchingSelectorsInText(cssCode, selector);
            } else {
                CSSUtils._findAllMatchingSelectorsInText(cssCode, "dummy");
            }
        }
        
        /**
         * Test helper function; tagInfo object contains one of: tag, id, clazz. Tests against only
         * the given cssCode string in isolation (no CSS files are loaded).
         */
        var _match = function (cssCode, tagInfo) {
            lastCssCode = cssCode;
            try {
                return _findMatchingRules(cssCode, tagInfo);
            } catch (e) {
                this.fail(e.message + ": " + cssCode);
                return [];
            }
        };
        
        /** Tests against the same CSS text as the last call to match() */
        function matchAgain(tagInfo) {
            return match(lastCssCode, tagInfo);
        }
        
        
        /**
         * Test helper function: expects CSS parsing to fail at the given 0-based offset within the
         * cssCode string, with the given error message.
         */
        var _expectParseError = function (cssCode, expectedCodeOffset, expectedErrorMessage) {
            try {
                _findMatchingRules(cssCode, { tag: "dummy_shouldnt_read_anyway" });
                
                // shouldn't get here since _loadString() is expected to throw
                this.fail("Expected parse error: " + cssCode);
                
            } catch (error) {
                expect(error.index).toBe(expectedCodeOffset);
                expect(error.message).toBe(expectedErrorMessage);
            }
        };
            
        /** To call fail(), these helpers need access to the value of 'this' inside each it() */
        beforeEach(function () {
            match = _match.bind(this);
            expectParseError = _expectParseError.bind(this);
        });


        describe("Simple selectors: ", function () {
        
            it("should match a lone type selector given a type", function () {
                var result = match("div { color:red }", { tag: "div" });
                expect(result.length).toBe(1);
                
                result = matchAgain({ tag: "span" });
                expect(result.length).toBe(0);
                
                result = matchAgain({ tag: "divfoo" }); //selector is a prefix of search
                expect(result.length).toBe(0);
                
                result = matchAgain({ tag: "di" });     //search is a prefix of selector
                expect(result.length).toBe(0);
            });
            
            it("should match a lone class selector given a class", function () {
                var result = match(".foo { color:red }", { clazz: "foo" });
                expect(result.length).toBe(1);
                
                result = matchAgain({ clazz: "bar" });
                expect(result.length).toBe(0);
                
                result = matchAgain({ clazz: "foobar" }); //selector is a prefix of search
                expect(result.length).toBe(0);
                
                result = matchAgain({ clazz: "fo" });     //search is a prefix of selector
                expect(result.length).toBe(0);
                
                result = matchAgain({ clazz: ".foo" });   //search has extra '.' (invalid search)
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
                
                // Quotes AND braces nested inside string
                result = match("div::after { content: \"\\\"}\\\"\"; }\nh4 { color: red}", { tag: "div" });
                expect(result.length).toBe(1);
                result = matchAgain({ tag: "h4" });
                expect(result.length).toBe(1);
                
                result = match("div::after { content: \"\\\"{\"; }\nh4 { color: red}", { tag: "div" });
                expect(result.length).toBe(1);
                result = matchAgain({ tag: "h4" });
                expect(result.length).toBe(1);
                
                css = "@import \"null?\\\"{\"; \n" +   // a real-world CSS hack similar to the above case
                      "div { color: red }";
                result = match(css, { tag: "div" });
                expect(result.length).toBe(1);
                
                // Newline inside string (escaped)
                result = match("li::before { content: 'foo\\nbar'; } \n div { color:red }", { tag: "div" });
                expect(result.length).toBe(1);
                
                // Newline inside string (unescaped, with backslash line terminator)
                // TODO (issue #317): LESS parser chokes on this
                result = match("li::before { content: 'foo\\\nbar'; } \n div { color:red }", { tag: "div" });
                expect(result.length).toBe(1);
                
                // Comments inside strings
                result = match("div::before { content: \"/*\"; } \n h4 { color: red }", { tag: "div" });
                expect(result.length).toBe(1);
                result = matchAgain({ tag: "h4" });
                expect(result.length).toBe(1);
                
                result = match("div::before { content: \"/**/\"; } \n h4 { color:red }", { tag: "div" });
                expect(result.length).toBe(1);
                result = matchAgain({ tag: "h4" });
                expect(result.length).toBe(1);

                result = match("div::before { content: \"/*\"; } \n h4::before { content: \"*/\" }", { tag: "div" });
                expect(result.length).toBe(1);
                result = matchAgain({ tag: "h4" });
                expect(result.length).toBe(1);
                
                result = match("/* div::before { content: \"*/\"; } \n h4 { color:red }*/ \n p { color:green }", { tag: "div" });
                expect(result.length).toBe(0);
                result = matchAgain({ tag: "h4" });
                expect(result.length).toBe(0);
                result = matchAgain({ tag: "p" });
                expect(result.length).toBe(1);
            });
            
            it("should handle unusual whitespace", function () {
                // This is valid CSS, but both Chrome and FF treat it as invalid
                // It *should* be treated as ".foo .bar", not ".foo.bar"
                var css = ".foo\n" +
                          ".bar\n" +
                          "{ color: red; }";
                var result = match(css, { clazz: "foo" });
                expect(result.length).toBe(0);
                result = matchAgain({ clazz: "bar" });
                expect(result.length).toBe(1);
                
                css = ".foo\n" +
                      "{\n" +
                      "    color: red;\n" +
                      "}";
                result = match(css, { clazz: "foo" });
                expect(result.length).toBe(1);
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
                
                // Test items of each type in all positions (first, last, middle)
                result = match("h4, h4, h4 { color:red }", { tag: "h4" });
                expect(result.length).toBe(3);
                result = match(".foo, .foo, .foo { color:red }", { clazz: "foo" });
                expect(result.length).toBe(3);
                result = match("#bar, #bar, #bar { color:red }", { id: "bar" });
                expect(result.length).toBe(3);
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

        // The following tests expect "failures" in order to pass. They
        // will be updated once the associated issues are fixed.
        describe("Known Issues", function () {
            
            // TODO (issue #332): ParseError for double semi-colon
            it("should handle an empty declaration (extra semi-colon)", function () {
                var result = match("h4 { color:red;; }", { tag: "h4" });
                expect(result.length).toBe(1);
                result = match("div{; color:red}", { tag: "div" });
                expect(result.length).toBe(1);
            });
            
            // TODO (issue #338): ParseError for various IE filter syntaxes
            it("should handle IE filter syntaxes", function () {
                var result = match("div{opacity:0; filter:alpha(opacity = 0)}", { tag: "div" });
                expect(result.length).toBe(1);
                result = match("div { filter:alpha(opacity = 0) }", { tag: "div" });
                expect(result.length).toBe(1);
                result = match("div { filter:progid:DXImageTransform.Microsoft.Gradient(GradientType=0,StartColorStr='#92CBE0',EndColorStr='#6B9EBC'); }",
                    { tag: "div" });
                expect(result.length).toBe(1);
            });
            
            // TODO (issue #343): Inline editor has trouble with CSS Hacks
            it("should handle unnecessary escape codes", function () {
                var result = match("div { f\\loat: left; }", { tag: "div" });
                expect(result.length).toBe(1);
            });
            
            // TODO (issue #343): Inline editor has trouble with CSS Hacks
            it("should handle comments within properties", function () {
                match("div { display/**/: block; }");
                match("div/**/ { display: block; }");
                match("div /**/{ display: block; }");
                match("div {/**/ display: block; }");
                match("div { /**/display: block; }");
                match("div { display:/**/ block; }");
                match("div { display: /**/block; }");
                match("div { display: block/**/; }");
                match("div { display: block /**/; }");
            });
            
        }); // describe("Known Issues")    


    }); //describe("CSS Parsing")
    
});
