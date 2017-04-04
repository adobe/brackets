/*
 * Copyright (c) 2017 - present Adobe Systems Incorporated. All rights reserved.
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

/** 
 * This transport provides a WebSocket connection between Brackets and a live browser preview.
 * This is just a thin wrapper around the Node extension (WebSocketTransportDomain) that actually
 * provides the WebSocket server and handles the communication. We also rely on an injected script in
 * the browser for the other end of the transport.
 */

define(function (require, exports, module) {
    "use strict";

    var FileUtils           = require("file/FileUtils"),
        NodeDomain          = require("utils/NodeDomain"),
        EditorManager       = require("editor/EditorManager"),
        HTMLInstrumentation = require("language/HTMLInstrumentation"),
        ProjectManager      = require("project/ProjectManager"),
        DocumentManager     = require("document/DocumentManager"),
        CSSUtils            = require("language/CSSUtils"),
        CSSCustomParser     = require("LiveDevelopment/CSSParser");
        
    var breadCrumbItem =  '<li><a href="#">{{selector}}</a></li>';
    var InlineSelectorEntry = '<li class="topcoat-list__item" style="cursor:move" title="{{title}}">{{selector}}</li>';
    var SectionHeaderEntry  = '<li class="section-header" title="{{fileName}}"><span class="disclosure-triangle expanded"></span><span class="filename">{{fileName}}</span> ({{ruleCount}})</li>';
    var SelectorEntry = '<li title="{{selectorText}} :{{lineIndex}}">{{selectorText}} <span class="related-file">:{{lineIndex}}</span></li>';
    var FileNameTemplate = '<a class="filename" title=""><div class="dirty-indicator" style="width: 0px;">•</div> {{fileName}} : <span class="line-number">0</span></a>';
    
    // The node extension that actually provides the WebSocket server.

    var domainPath = FileUtils.getNativeBracketsDirectoryPath() + "/" + FileUtils.getNativeModuleDirectoryPath(module) + "/node/WebSocketTransportDomain";

    var WebSocketTransportDomain = new NodeDomain("webSocketTransport", domainPath);
    var inlineInfo;

    // Events
    
    function _jumpToNode(editor, position) {
        if (position) {
            editor.setCursorPos(position.line, position.ch, true);
        }
    }

    WebSocketTransportDomain.on("message", function (obj, message) {
        //console.log("WebSocketTransport - event - message" + " - " + message);
        var editor = EditorManager.getActiveEditor(),
            position = HTMLInstrumentation.getPositionFromTagId(editor, parseInt(message, 10));

        _jumpToNode(editor, position);
    });
    
    function _addToPath(editor, node) {
        var base = $(breadCrumbItem.replace("{{selector}}", node.label)).prependTo('#livedata-tools #breadcrumb');

        base.on('click', function () {
            var position = HTMLInstrumentation.getPositionFromTagId(editor, parseInt(node.target, 10));
            _jumpToNode(editor, position);
        });
    }
    
    function _processNodePath(pathArr) {
        $('#breadcrumb').html("");
        var editor = EditorManager.getActiveEditor(),
            node;
            
        for (node in pathArr) {
            _addToPath(editor, pathArr[node]);
        }
    }
    
    function _isVendorPrefixedRule(rule) {
        if (rule.selectors) {
            return !rule.selectors.filter(prop => !/-(moz|ms|o)-/.test(prop)).length;
        } else {
            return false;
        }
    }
    
    function _getMatchedRule(rules, index) {
        var counter, ruleRefCounter = -1, rule, refRule;
        for (counter in rules) {
            rule = rules[counter];
            if (rule.type !== 'comment' && !_isVendorPrefixedRule(rule)) {
                ruleRefCounter++;
            }
            
            if (ruleRefCounter === index) {
                refRule = rule;
                break;
            }
        }
        
        return refRule;
    }
    
    function _handleInlineEdit($entry) {
        if (!$entry.data("file")) {
            return;
        }
        
        $("#livedata-tools .selection")
            .css("top", $entry.position().top)
            .height($entry.outerHeight());
            

        var inlineDocRange, selectors, matchedSelector;
        var fileName = ProjectManager.getProjectRoot()._path + $entry.data("file");
        if (inlineInfo) {
            //inlineInfo.editor.destroy();
            $("#livedata-tools .inline-editor-holder").empty();
        }
        DocumentManager.getDocumentForPath(fileName).done(function (doc) {
            selectors = CSSCustomParser.praseCSS(doc.getText()).stylesheet.rules;
            //CSSUtils.consolidateRules(CSSUtils.extractAllSelectors(doc.getText()));
            if (selectors.length > 0) {
                matchedSelector = _getMatchedRule(selectors, parseInt($entry.data("index"), 10));
            }
            if (matchedSelector) {
                var range = {
                    startLine: matchedSelector.position.start.line - 1,
                    endLine: matchedSelector.position.end.line - 1
                };
                inlineInfo = EditorManager.createInlineEditorForDocument(doc, range, $("#livedata-tools .inline-editor-holder"));
                inlineInfo.editor.refresh();
                $("#livedata-tools .inline-editor-header .filename").html("");
                $(FileNameTemplate.split("{{fileName}}").join($entry.data("file").split("/").pop())).appendTo("#livedata-tools .inline-editor-header .filename");
            }
        });
    }
    
    $(document).on("click", "#livedata-tools .related > ul > li", function () {
        _handleInlineEdit($(this));
    });
    
    function _processLiveData(ruleArr) {
        $("#livedata-tools .related > ul").html("");
        var files = Object.keys(ruleArr), rules;
        var fIndex, file, rIndex, rule, $entry;
        
        for (fIndex in files) {
            file = files[fIndex];
            rules = ruleArr[file];
            $(SectionHeaderEntry.split("{{fileName}}").join(file.split("/").pop()).split("{{ruleCount}}").join(rules.length)).appendTo("#livedata-tools .related > ul");
            for (rIndex in rules) {
                rule = rules[rIndex];
                if (parseInt(rule.index)) {
                    $entry = $(SelectorEntry.split("{{selectorText}}").join(rule.selectorText).split("{{lineIndex}}").join(rule.index)).appendTo("#livedata-tools .related > ul");
                    $entry.data("file", file);
                    $entry.data("index", rule.index);
                }
            }
        }
        
        $("#livedata-tools .related > ul > li:nth-child(2)").addClass("selected");
        _handleInlineEdit($("#livedata-tools .related > ul > li:nth-child(2)"));
    }
    
    WebSocketTransportDomain.on("livedata", function (obj, message) {
        message = JSON.parse(message);
        $("#livedata-tools").show();
        $("#livedata-tools #breadcrumb").show();
        _processNodePath(JSON.parse(message.path));
        _processLiveData(JSON.parse(message.data));
    });
    
    function createWebSocketServer(port) {
        WebSocketTransportDomain.exec("start", parseInt(port, 10));
    }
    
    function closeWebSocketServer() {
        WebSocketTransportDomain.exec("close");
    }
    
    exports.createWebSocketServer = createWebSocketServer;
    exports.closeWebSocketServer  = closeWebSocketServer;
});
