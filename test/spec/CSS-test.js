/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, describe: false, it: false, expect: false, beforeEach: false, afterEach: false, waitsFor: false, runs: false, brackets: false */

define(function (require, exports, module) {
    'use strict';
    
    // Load dependent modules
    var SpecRunnerUtils     = require("./SpecRunnerUtils.js"),
        CSSManager          = require("../../src/CSSManager.js").CSSManager;
    
    // Test helper functions
    // tagInfo: tag, id, clazz
    function match(cssCode, tagInfo) {
        var mgr = new CSSManager();
        mgr.loadString(cssCode);
        if (tagInfo) {
            var selector = "";
            if (tagInfo.tag)    selector += tagInfo.tag;
            if (tagInfo.clazz)  selector += "." + tagInfo.clazz;
            if (tagInfo.id)     selector += "#" + tagInfo.id;
            return mgr.findMatchingRules(selector);
        } else {
            return null;
        }
    }
    
    // Tests for CSS parsing / rule search

    describe("CSS Parsing: ", function () {

        describe("Simple selectors: ", function () {
        
            it("should match a lone type selector given a type", function () {
                var result = match("div { color:red }", { tag: "div" });
                expect(result.length).toBe(1);
                
                result = match("div { color:red }", { tag: "span" });
                expect(result.length).toBe(0);
                
                result = match("div { color:red }", { tag: "divfoo" });
                expect(result.length).toBe(0);
                
                result = match("div { color:red }", { tag: "di" });
                expect(result.length).toBe(0);
            });
            
            it("should match a lone class selector given a class", function () {
                var result = match(".foo { color:red }", { clazz: "foo" });
                expect(result.length).toBe(1);
                
                result = match(".foo { color:red }", { clazz: "bar" });
                expect(result.length).toBe(0);
                
                result = match(".foo { color:red }", { clazz: "foobar" });
                expect(result.length).toBe(0);
                
                result = match(".foo { color:red }", { clazz: "fo" });
                expect(result.length).toBe(0);
                
                result = match(".foo { color:red }", { clazz: ".foo" });
                expect(result.length).toBe(0);
            });
            
            it("should match a lone id selector given an id", function () {
                var result = match("#foo { color:red }", { id: "foo" });
                expect(result.length).toBe(1);
                
                result = match("#foo { color:red }", { id: "bar" });
                expect(result.length).toBe(0);
                
                result = match("#foo { color:red }", { id: "foobar" });
                expect(result.length).toBe(0);
                
                result = match("#foo { color:red }", { id: "fo" });
                expect(result.length).toBe(0);
                
                result = match("#foo { color:red }", { id: "#foo" });
                expect(result.length).toBe(0);
            });
            
            it("shouldn't confuse type, class, and id", function () {
                var css = "div { color:red } \n\
                           .foo { color:green } \n\
                           #bar { color:blue }";
                           
                var result = match(css, { tag: "div" });
                expect(result.length).toBe(1);
                result = match(css, { tag: "foo" });
                expect(result.length).toBe(0);
                result = match(css, { tag: "bar" });
                expect(result.length).toBe(0);
                
                result = match(css, { clazz: "div" });
                expect(result.length).toBe(0);
                result = match(css, { clazz: "foo" });
                expect(result.length).toBe(1);
                result = match(css, { clazz: "bar" });
                expect(result.length).toBe(0);
                
                result = match(css, { id: "div" });
                expect(result.length).toBe(0);
                result = match(css, { id: "foo" });
                expect(result.length).toBe(0);
                result = match(css, { id: "bar" });
                expect(result.length).toBe(1);
            });
            
            it("should be case-sensitive for all but types", function () {
                var css = "div { color:red } \n\
                           DIV { color:red } \n\
                           .foo { color:green } \n\
                           .Foo { color:black } \n\
                           #bar { color:blue } \n\
                           #baR { color:white }";
                           
                var result = match(css, { tag: "div" });
                expect(result.length).toBe(2);
                result = match(css, { tag: "Div" });
                expect(result.length).toBe(2);
                
                result = match(css, { clazz: "foo" });
                expect(result.length).toBe(1);
                result = match(css, { clazz: "Foo" });
                expect(result.length).toBe(1);
                result = match(css, { clazz: "FOO" });
                expect(result.length).toBe(0);
                
                result = match(css, { id: "bar" });
                expect(result.length).toBe(1);
                result = match(css, { id: "baR" });
                expect(result.length).toBe(1);
                result = match(css, { id: "BAR" });
                expect(result.length).toBe(0);
            });
            
            it("should match permissively", function () {
                var css = "div.foo { color:red } \n\
                           div#bar { color:green } \n\
                           div.foo#bar { color:blue } \n\
                           .foo#bar { color:black } \n\
                           div.foo.class2 { color: white } \n\
                           .foo.class2 { color: yellow } \n\
                           .foo#bar.class2 { color: cyan }";
                // note last line: id selectors don't necessarily need to come last
                
                var result = match(css, { tag: "div" });   // all selectors including a 'div' type selector
                expect(result.length).toBe(4);
                
                result = match(css, { clazz: "foo" });      // all selectors including a '.foo' class selector
                expect(result.length).toBe(6);
                
                result = match(css, { clazz: "class2" });   // all selectors including a '.class2' class selector
                expect(result.length).toBe(3);
                
                result = match(css, { clazz: "foo" });      // all selectors including a '#bar' id selector
                expect(result.length).toBe(4);
            });
            
            it("should allow searching conjunctions of type, class, and id", function () {
                // TODO: not required for Sprint 4
                
                // var css = "div.foo { color:red } \n\
                //            div#bar { color:green } \n\
                //            div.foo#bar { color:blue } \n\
                //            .foo#bar { color:black } \n\
                //            div.foo.class2 { color: white } \n\
                //            .foo.class2 { color: yellow } \n\
                //            .foo#bar.class2 { color: cyan }";
                // // note last line: id selectors don't necessarily need to come last
                //
                // var result = match(css, { tag: "div", clazz: "foo" });   // all selectors including a 'div' type selector AND a '.foo' class selector
                // expect(result.length).toBe(3);
                //
                // // TODO: any way to search two of the same thing? (e.g. all selectors including a '.foo' AND a '.class2' class selector)
                //
                // result = match(css, { clazz: "foo", id: "bar" });   // all selectors including a '.foo' class selector AND a '#bar' id selector
                // expect(result.length).toBe(3);
                //
                // result = match(css, { tag: "div", id: "bar" });      // all selectors including a 'div' type selector AND a '#bar' id selector
                // expect(result.length).toBe(2);
                //
                // result = match(css, { tag: "div", clazz: "foo", id: "bar" });
                // expect(result.length).toBe(1);
                //
                // result = match(css, { tag: "div", clazz: "class2", id: "bar" });
                // expect(result.length).toBe(0);
            });
            
            it("should match lone '*' given any tag; else ignore", function () {
                var css = "* { color:red } \n\
                           *.foo { color:green } \n\
                           *#bar { color:blue } \n\
                           *.foo#bar { color:yellow }";
                // should be treated the same as: *, .foo, #bar, .foo#bar respectively
                
                var result = match(css, { tag: "div" });
                expect(result.length).toBe(1);
                
                result = match(css, { clazz: "foo" });
                expect(result.length).toBe(2);
                
                result = match(css, { id: "bar" });
                expect(result.length).toBe(2);
                
                result = match(css, { clazz: "otherClass" });
                expect(result.length).toBe(0);
                result = match(css, { id: "otherId" });
                expect(result.length).toBe(0);
            });
            
            it("should ignore pseudo-class selectors", function () {
                // Note: not actually required for Sprint 4
                var css = "div:hover { color:red } \n\
                           .foo:hover { color:green } \n\
                           div.foo:hover { color:blue } \n\
                           #bar:hover { color:yellow } \n\
                           div#bar:hover { color:black } \n\
                           .foo.class2:hover { color:white } \n\
                           div:focus:hover { color:cyan } \n\
                           div.foo:focus:hover { color:brown } \n\
                           .foo:focus:hover { color:pink } \n\
                           div:focus.class3:hover { color:purple } \n\
                           :focus.class3:hover { color:gray }";
                
                var result = match(css, { tag: "div" });
                expect(result.length).toBe(6);
                result = match(css, { clazz: "foo" });
                expect(result.length).toBe(5);
                result = match(css, { id: "bar" });
                expect(result.length).toBe(2);
                
                result = match(css, { clazz: "class3" });
                expect(result.length).toBe(2);
                
                result = match(css, { tag: "hover" });
                expect(result.length).toBe(0);
                result = match(css, { clazz: "hover" });
                expect(result.length).toBe(0);
                result = match(css, { id: "hover" });
                expect(result.length).toBe(0);
                result = match(css, { tag: "focus" });
                expect(result.length).toBe(0);
                result = match(css, { clazz: "focus" });
                expect(result.length).toBe(0);
                result = match(css, { id: "focus" });
                expect(result.length).toBe(0);
            });
            
            it("should ignore attribute selectors", function () {
                // Note: not actually required for Sprint 4
                var css = "div { color:red } \n\
                           div[foo] { color:green } \n\
                           h4[div] { color:blue } \n\
                           h4[foo] { color:blue } \n\
                           h4[title=\"div\"] { color:yellow } \n\
                           h4[title=\".foo\"] { color:yellow } \n\
                           h4[attr].bar { color:black } \n\
                           h4.bar[attr] { color:black }";
                
                var result = match(css, { tag: "div" });
                expect(result.length).toBe(2);
                result = match(css, { tag: "h4" });
                expect(result.length).toBe(6);
                
                result = match(css, { clazz: "foo" });
                expect(result.length).toBe(0);
                result = match(css, { clazz: "bar" });
                expect(result.length).toBe(2);
            });
            
            it("should ignore the content of strings", function () {
                // Spaces inside string, single quotes
                var result = match("div[attr='.foo #bar'] {}", { tag: "div" });
                expect(result.length).toBe(1);
                result = match("div[attr='.foo #bar'] {}", { clazz: "foo" });
                expect(result.length).toBe(0);
                result = match("div[attr='.foo #bar'] {}", { id: "bar" });
                expect(result.length).toBe(0);

                // ...double quotes
                result = match("div[attr=\".foo #bar\"] {}", { tag: "div" });
                expect(result.length).toBe(1);
                result = match("div[attr=\".foo #bar\"] {}", { clazz: "foo" });
                expect(result.length).toBe(0);
                result = match("div[attr=\".foo #bar\"] {}", { id: "bar" });
                expect(result.length).toBe(0);
                
                // Quotes nested within quotes
                var css = "div[attr=\"value with \\\"nested double .quotes\\\"\"] { color:red } \n\
                           div[attr=\"value with 'single .quotes'\"] { color:green } \n\
                           div[attr='value with \\'nested single .quotes\\''] { color:blue } \n\
                           div[attr='value with \"double .quotes\"'] { color:blue } \n\
                           div[attr='value with \"double .quotes\"'].foo { color:yellow } \n\
                           div#bar[attr='value with \"double .quotes\"h4'] { color:white } \n\
                           div[attr='value with \"double .quotes\"h4'] .foo { color:black } \n\
                           .foo { color:cyan }";
                           
                result = match(css, { tag: "div"});
                expect(result.length).toBe(6);
                result = match(css, { clazz: "foo"});
                expect(result.length).toBe(3);
                result = match(css, { id: "bar"});
                expect(result.length).toBe(1);
                
                result = match(css, { clazz: "quotes"});
                expect(result.length).toBe(0);
                result = match(css, { tag: "h4"});
                expect(result.length).toBe(0);
                
                // Braces inside string; string inside rule (not inside selector)
                css = "a::after { content: ' {' attr(href) '}'; } \n\
                       .foo { color:red } \n\
                       a::after { content: \" {\" attr(href) \"}\"; } \n\
                       li::before { content: \"} h4 { color:black }\"; } \n\
                       div { color:green }";
                
                result = match(css, { tag: "a" });
                expect(result.length).toBe(2);
                result = match(css, { tag: "div" });
                expect(result.length).toBe(1);
                result = match(css, { clazz: "foo" });
                expect(result.length).toBe(1);
                result = match(css, { tag: "h4" });
                expect(result.length).toBe(0);
                
                // Newline inside string (escaped)
                result = match("li::before { content: 'foo\\nbar'; } \n div { color:red }", { tag: "div" });
                expect(result.length).toBe(1);
                
                // Newline inside string (unescaped, with backslash line terminator)
                result = match("li::before { content: 'foo\\\nbar'; } \n div { color:red }", { tag: "div" });
                expect(result.length).toBe(1);
            });
            
            it("shouldn't crash on CSS3 selectors", function () {
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
                match("tagName:not([attr=\"value\"])[attr2='value2'] {}");  // FIXME: causes error
                
                // Pseudo-elements (can only occur once, and must be after the rightmost combinator)
                match("::first-line");
                match("tagName::first-line");
                match(".className::first-line");
                match("::first-line.className"); //spec says this is valid but no browsers seem to support it
                match("p:hover::first-line");
                // not valid: :not(::first-line) - because pseudo-elements aren't simple selectors
                
                // Namespaces
                var nsDecl = "@namespace ns \"http://www.example.com\"\n";
                match("[*|role] {}");
                match("[|role] {}");
                match(nsDecl+"[ns|role] {}");
                match(nsDecl+"[ns|role|='value'] {}");
                match("*|div {}");
                match("|div {}");
                match(nsDecl+"ns|div {}");
                match("*|* {}");
                match("|* {}");
                match(nsDecl+"ns|* {}");
                match("*|*:not(* {}");      // actual example from W3C spec; 5 points if you can figure out what it means!
                
            });
            
            it("shouldn't crash on CSS Animation syntax (@keyframe)", function () {
                var css = "div { color:red } \n\
                           @keyframes slide { \n\
                             from { left: 0; } \n\
                             50% { left: 30px; } \n\
                             to { left: 100px; } \n\
                           } \n\
                           .foo { color:green }";
                
                var result = match(css, { tag: "div" });
                expect(result.length).toBe(1);
                result = match(css, { clazz: "foo" });
                expect(result.length).toBe(1);
                
                result = match(css, { tag: "slide" });
                expect(result.length).toBe(0);
                result = match(css, { tag: "from" });
                expect(result.length).toBe(0);
            });
                
        }); // describe("Simple selectors")
        
        
        describe("Combinators", function () {
            it("should ignore descendant combinators", function () {
                var result = match("h4 .foo { color:red }", { tag:"h4" });
                expect(result.length).toBe(0);
                result = match("h4 .foo { color:red }", { clazz:"foo" });
                expect(result.length).toBe(1);
                
                result = match("p h4 div { color:red }", { tag:"p" });
                expect(result.length).toBe(0);
                result = match("p h4 div { color:red }", { tag:"h4" });
                expect(result.length).toBe(0);
                result = match("p h4 div { color:red }", { tag:"div" });
                expect(result.length).toBe(1);
                
                result = match(".foo h4 { color:red }", { tag:"h4" });
                expect(result.length).toBe(1);
                result = match(".foo h4 { color:red }", { clazz:"foo" });
                expect(result.length).toBe(0);
                
                result = match("div div { color:red }", { tag:"div" });
                expect(result.length).toBe(1);
                result = match(".foo .foo { color:red }", { clazz:"foo" });
                expect(result.length).toBe(1);
                result = match(".foo .foo { color:red }", { tag:"foo" });
                expect(result.length).toBe(0);
            });
            
            it("should ignore other combinators", function () {
                var result = match("h4 > .foo { color:red }", { tag:"h4" });
                expect(result.length).toBe(0);
                result = match("h4 > .foo { color:red }", { clazz:"foo" });
                expect(result.length).toBe(1);
                
                result = match(".foo > h4 { color:red }", { tag:"h4" });
                expect(result.length).toBe(1);
                result = match(".foo > h4 { color:red }", { clazz:"foo" });
                expect(result.length).toBe(0);
                
                result = match("h4 + .foo { color:red }", { tag:"h4" });
                expect(result.length).toBe(0);
                result = match("h4 + .foo { color:red }", { clazz:"foo" });
                expect(result.length).toBe(1);
                
                result = match(".foo + h4 { color:red }", { tag:"h4" });
                expect(result.length).toBe(1);
                result = match(".foo + h4 { color:red }", { clazz:"foo" });
                expect(result.length).toBe(0);
                
                result = match("p > h4 + div { color:red }", { tag:"p" });
                expect(result.length).toBe(0);
                result = match("p > h4 + div { color:red }", { tag:"h4" });
                expect(result.length).toBe(0);
                result = match("p > h4 + div { color:red }", { tag:"div" });
                expect(result.length).toBe(1);
                result = match("p > h4 div { color:red }", { tag:"p" });
                expect(result.length).toBe(0);
                result = match("p > h4 div { color:red }", { tag:"h4" });
                expect(result.length).toBe(0);
                result = match("p > h4 div { color:red }", { tag:"div" });
                expect(result.length).toBe(1);
                
                result = match("h4>.foo { color:red }", { tag:"h4" });
                expect(result.length).toBe(0);
                result = match("h4>.foo { color:red }", { clazz:"foo" });
                expect(result.length).toBe(1);
                result = match("h4> .foo { color:red }", { tag:"h4" });
                expect(result.length).toBe(0);
                result = match("h4> .foo { color:red }", { clazz:"foo" });
                expect(result.length).toBe(1);
                result = match("h4 >.foo { color:red }", { tag:"h4" });
                expect(result.length).toBe(0);
                result = match("h4 >.foo { color:red }", { clazz:"foo" });
                expect(result.length).toBe(1);
                
                result = match("h4+.foo { color:red }", { tag:"h4" });
                expect(result.length).toBe(0);
                result = match("h4+.foo { color:red }", { clazz:"foo" });
                expect(result.length).toBe(1);
                
                result = match("h4 * .foo { color:red }", { tag:"h4" });
                expect(result.length).toBe(0);
                result = match("h4 * .foo { color:red }", { clazz:"foo" });
                expect(result.length).toBe(1);
                result = match("h4 ~ .foo { color:red }", { tag:"h4" });
                expect(result.length).toBe(0);
                result = match("h4 ~ .foo { color:red }", { clazz:"foo" });
                expect(result.length).toBe(1);
                
            });
        }); // describe("Combinators")        
        
        
        describe("Selector groups", function () {
            it("should match any item in selector group", function () {
                // Comma- and space- separated
                var result = match("h4, .foo, #bar { color:red }", { tag:"h4" });
                expect(result.length).toBe(1);
                result = match("h4, .foo, #bar { color:red }", { clazz:"foo" });
                expect(result.length).toBe(1);
                result = match("h4, .foo, #bar { color:red }", { id:"bar" });
                expect(result.length).toBe(1);
                
                // Comma only
                result = match("h4,.foo,#bar { color:red }", { tag:"h4" });
                expect(result.length).toBe(1);
                result = match("h4,.foo,#bar { color:red }", { clazz:"foo" });
                expect(result.length).toBe(1);
                result = match("h4,.foo,#bar { color:red }", { id:"bar" });
                expect(result.length).toBe(1);
                
                // Newline-separated
                result = match("h4,\n.foo,\r\n#bar { color:red }", { tag:"h4" });
                expect(result.length).toBe(1);
                result = match("h4,\n.foo,\r\n#bar { color:red }", { clazz:"foo" });
                expect(result.length).toBe(1);
                result = match("h4,\n.foo,\r\n#bar { color:red }", { id:"bar" });
                expect(result.length).toBe(1);
                
                // Space-separated with a space combinator
                result = match("h4, .foo #bar { color:red }", { tag:"h4" });
                expect(result.length).toBe(1);
                result = match("h4, .foo #bar { color:red }", { clazz:"foo" });
                expect(result.length).toBe(0);
                result = match("h4, .foo #bar { color:red }", { id:"bar" });
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
