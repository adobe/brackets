/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, describe: false, it: false, expect: false, beforeEach: false, afterEach: false, waitsFor: false, runs: false, brackets: false */

define(function (require, exports, module) {
    'use strict';
    
    // Load dependent modules
    var SpecRunnerUtils     = require("./SpecRunnerUtils.js");
    
    // Test helper functions
    // tagInfo: tag, id, clazz
    function match(cssCode, tagInfo) {
        // var mgr = new CSSManager();
        // mgr.loadText(cssCode);
        // if (tagInfo) {
        //     return mgr.findMatchingRules(tagInfo);
        // } else {
        //     return null;
        // }
        return [];
    }
    
    // Tests for CSS parsing / rule search

    describe("CSS Parsing", function () {

        beforeEach(function () {
        });
    
        afterEach(function () {
        });
    
        describe("Simple selectors", function () {
        
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
                
                var result = match(css, { type: "div" });
                expect(result.length).toBe(1);
                result = match(css, { type: "foo" });
                expect(result.length).toBe(0);
                result = match(css, { type: "bar" });
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
                           
                var result = match(css, { type: "div" });
                expect(result.length).toBe(2);
                result = match(css, { type: "Div" });
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
                           .foo.#bar.class2 { color: cyan }";
                // note last line: id selectors don't necessarily need to come last
                
                var result = match(css, { type: "div" });   // all selectors including a 'div' type selector
                expect(result.length).toBe(4);
                
                result = match(css, { clazz: "foo" });      // all selectors including a '.foo' class selector
                expect(result.length).toBe(6);
                
                result = match(css, { clazz: "class2" });   // all selectors including a '.class2' class selector
                expect(result.length).toBe(3);
                
                result = match(css, { clazz: "foo" });      // all selectors including a '#bar' id selector
                expect(result.length).toBe(4);
            });
            
            it("should match lone '*' given any tag; else ignore", function () {
                var css = "* { color:red } \n\
                           *.foo { color:green } \n\
                           *#bar { color:blue } \n\
                           *.foo#bar { color:yellow }";
                // should be treated the same as: *, .foo, #bar, .foo#bar respectively
                
                var result = match(css, { type: "div" });
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
                // TODO
            });
            
            it("should ignore the content of strings", function () {
                // TODO: break out into a separate quote-parsing test
                match("[attr=\"value with \\\"inner quotes\\\"\"]");
                
                // Strings can also occur inside rules
                match("a::after { content: ' (' attr(href) ')'; }");
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
                match("tagName:not([attr=\"value\"])[attr2='value2'] {}");
                
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
                // TODO
            });
                
        }); // describe("Simple selectors")
        
        
        describe("Combinators", function () {
            it("should ignore combinators", function () {
                // TODO
            });
        }); // describe("Combinators")        
        
        
        describe("Selector groups", function () {
                // TODO
        }); // describe("Selector groups")        


        describe("At-rules", function () {
            it("should handle @media", function () {
                // TODO
            });
            it("should handle @page", function () {
                // TODO
            });
        }); // describe("At-rules")        


    }); //describe("CSS Parsing")
});
