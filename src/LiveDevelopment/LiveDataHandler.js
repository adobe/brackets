/*
 * Copyright (c) 2012 - present Adobe Systems Incorporated. All rights reserved.
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

// FUTURE: Merge part (or all) of this class with InlineTextEditor

/**
 * An inline editor for displaying and editing multiple text ranges. Each range corresponds to a
 * contiguous set of lines in a file.
 *
 * In the current implementation, only one range is visible at a time. A list on the right side
 * of the editor allows the user to select which range is visible.
 *
 * This module does not dispatch any events.
 */
define(function (require, exports, module) {
    "use strict";

    var FileUtils           = require("file/FileUtils"),
        NodeDomain          = require("utils/NodeDomain"),
        EditorManager       = require("editor/EditorManager"),
        Commands            = require('command/Commands'),
        CommandManager      = require('command/CommandManager'),
        FileSystem          = require('filesystem/FileSystem'),
        FileSystemImpl      = FileSystem._FileSystem,
        HTMLInstrumentation = require("language/HTMLInstrumentation"),
        MultiRangeInlineEditor  = require("editor/MultiRangeInlineEditor"),
        Strings                 = require("strings"),
        ProjectManager      = require("project/ProjectManager"),
        DocumentManager     = require("document/DocumentManager"),
        CSSUtils            = require("language/CSSUtils"),
        CSSCustomParser     = require("LiveDevelopment/CSSParser");
        
    var _oldFilter = FileSystemImpl.prototype._indexFilter;
        
    var _ = require("thirdparty/lodash");
    var relatedFiles = [];
    
    var WebSocketTransportDomain = require("LiveDevelopment/transports/WebSocketTransport").WebSocketTransportDomain;
    var inlineInfo;

    var breadCrumbItem =  '<li><a href="#">{{selector}}</a></li>';
    var InlineSelectorEntry = '<li class="topcoat-list__item" style="cursor:move" title="{{title}}">{{selector}}</li>';
    var SectionHeaderEntry  = '<li class="section-header" title="{{fileName}}"><span class="disclosure-triangle expanded"></span><span class="filename">{{fileName}}</span> ({{ruleCount}})</li>';
    var SelectorEntry = '<li title="{{selectorText}} :{{lineIndex}}">{{selectorText}} <span class="related-file">:{{lineIndex}}</span></li>';
    var FileNameTemplate = '<a class="filename" title=""><div class="dirty-indicator" style="width: 0px;">•</div> {{fileName}} : <span class="line-number">0</span></a>';
    
    function _jumpToNode(editor, position) {
        if (position) {
            editor.setCursorPos(position.line, position.ch, true);
        }
    }
    
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
            if (pathArr.hasOwnProperty(node)) {
                _addToPath(editor, pathArr[node]);
            }
        }
    }
    
    function _handleRelatedFilesView(pathArr) {
        relatedFiles = JSON.parse(pathArr);
    }

    function _isVendorPrefixedRule(rule) {
        if (rule.selectors) {
            return !rule.selectors.filter(function (prop) {
                return !/-(moz|ms|o)-/.test(prop);
            }).length;
        } else {
            return false;
        }
    }
    
    function _getMatchedRule(rules, index) {
        var counter, ruleRefCounter = -1, rule, refRule;
        for (counter in rules) {
            if (rules.hasOwnProperty(counter)) {
                rule = rules[counter];
                if (rule.type !== 'comment' && !_isVendorPrefixedRule(rule)) {
                    ruleRefCounter++;
                }

                if (ruleRefCounter === index) {
                    refRule = rule;
                    break;
                }
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
        var fileName = ProjectManager.getProjectRoot()._path + $entry.data("file").substring(1);
        if (inlineInfo) {
            //inlineInfo.editor.destroy();
            $("#livedata-tools .inline-editor-holder").empty();
        }
        DocumentManager.getDocumentForPath(fileName).done(function (doc) {
            doc._ensureMasterEditor();
            selectors = CSSCustomParser.praseCSS(doc.getText()).stylesheet.rules;
            //CSSUtils.consolidateRules(CSSUtils.extractAllSelectors(doc.getText()));
            if (selectors.length > 0) {
                matchedSelector = _getMatchedRule(selectors, parseInt($entry.data("index"), 10));
            }
            if (matchedSelector) {
                var range = {
                    startLine: matchedSelector.position.start.line - 1,
                    endLine: matchedSelector.position.end.line - 1,
                    startChar: matchedSelector.position.start.column - 1,
                    endChar: matchedSelector.position.end.column - 1
                };

                inlineInfo = EditorManager.createInlineEditorForDocument(doc, range, $("#livedata-tools .inline-editor-holder"));
                inlineInfo.editor.refresh();
                inlineInfo.editor._renderGutters();
                $("#livedata-tools .inline-editor-header .filename").html("");
                $(FileNameTemplate.split("{{fileName}}").join($entry.data("file").split("/").pop())).appendTo("#livedata-tools .inline-editor-header .filename");
            }
        });
    }
    
    function _getRelativeDocRange(doc, entry) {
        var selectors = CSSCustomParser.praseCSS(doc.getText()).stylesheet.rules;
        var matchedSelector;
        var range;
        if (selectors.length > 0) {
            matchedSelector = _getMatchedRule(selectors, parseInt(entry.index, 10));
        }
        if (matchedSelector) {
            range = {
                name: entry.selectorText,
                document: doc,
                lineStart: matchedSelector.position.start.line - 1,
                lineEnd: matchedSelector.position.end.line - 1
            };
        }
        return range;
    }
    
    function _createMultiRangeInlineEditor(rules) {
        console.warn(rules);
        var info = new MultiRangeInlineEditor.MultiRangeInlineEditor(rules);
        console.warn(info);
    }
    
    function _createGlobalCSSSearchHandler(consolidatedRanges) {
        brackets.connected = true;
        brackets.findMatchingRules = function () {
            var $deferred = $.Deferred();
            $deferred.resolve(consolidatedRanges);
            return $deferred.promise();
        };
    }
    
    /*function _consolidateRules(ruleArr) {
        var files = Object.keys(ruleArr), rules;
        var fIndex, file, rule, $entry, consolidatedRanges = [];
        
        for (fIndex in files) {
            if (files.hasOwnProperty(fIndex)) {
                file = files[fIndex];
                rules = ruleArr[file];
                DocumentManager.getDocumentForPath(ProjectManager.getProjectRoot()._path + file.substring(1)).done(function (doc) {
                    var rIndex;
                    for (rIndex in rules) {
                        if (rules.hasOwnProperty(rIndex)) {
                            rule = rules[rIndex];
                            if (parseInt(rule.index, 10)) {
                                consolidatedRanges.push(_getRelativeDocRange(doc, rule));
                                delete ruleArr[file];
                            }
                        }
                    }
                    if (Object.keys(ruleArr).length === 0) {
                        _createGlobalCSSSearchHandler(consolidatedRanges);
                    }
                });
            }
        }
    }*/
    
    $(window.document).on("click", "#livedata-tools .related > ul > li", function () {
        _handleInlineEdit($(this));
    });
    
    function _processLiveData(ruleArr) {
        $("#livedata-tools .related > ul").html("");
        var files = Object.keys(ruleArr), rules;
        var fIndex, file, rIndex, rule, $entry;
        
        for (fIndex in files) {
            if (files.hasOwnProperty(fIndex)) {
                file = files[fIndex];
                rules = ruleArr[file];
                $(SectionHeaderEntry.split("{{fileName}}").join(file.split("/").pop()).split("{{ruleCount}}").join(rules.length)).appendTo("#livedata-tools .related > ul");
                for (rIndex in rules) {
                    if (rules.hasOwnProperty(rIndex)) {
                        rule = rules[rIndex];
                        if (parseInt(rule.index, 10)) {
                            $entry = $(SelectorEntry.split("{{selectorText}}").join(rule.selectorText).split("{{lineIndex}}").join(rule.index)).appendTo("#livedata-tools .related > ul");
                            $entry.data("file", file);
                            $entry.data("index", rule.index);
                        }
                    }
                }
            }
        }
        
        $("#livedata-tools .related > ul > li:nth-child(2)").addClass("selected");
        _handleInlineEdit($("#livedata-tools .related > ul > li:nth-child(2)"));
        //_consolidateRules(ruleArr);
    }
    
    WebSocketTransportDomain.on("livedata", function (obj, message) {
        message = JSON.parse(message);
        if (message.relatedFiles) {
            _handleRelatedFilesView(message.relatedFiles);
        } else {
            $("#livedata-tools").show();
            $("#livedata-tools #breadcrumb").show();
            _processNodePath(JSON.parse(message.path));
            _processLiveData(JSON.parse(message.data));
        }
    });
    
    ProjectManager.addClassesProvider(function (data) {
        if ($("#related-toggle").is(":checked")) {
            if (relatedFiles.indexOf("/" + data.fullPath.replace(ProjectManager.getProjectRoot().fullPath, "")) === -1) {
                return "not-in-preview";
            }
        }
        return "";
    });
    
    $(window.document).on("change", "#related-toggle", function () {
        //CommandManager.execute(Commands.FILE_REFRESH);
        ProjectManager.rerenderTree();
    });
    
    /*var oldFilter = FileSystemImpl.prototype._indexFilter;
    function _newFilter(path, name) {
        return relatedFiles.indexOf("/" + path.replace(ProjectManager.getProjectRoot().fullPath, "")) !== -1;
    };
    
    
    $(document).on("change", "#related-toggle", function () {
        if ($("#related-toggle").is(":checked")) {
            FileSystemImpl.prototype._indexFilter = _newFilter;
        } else {
            FileSystemImpl.prototype._indexFilter = _oldFilter;
        }
        ProjectManager.rerenderTree();
    });*/

});
