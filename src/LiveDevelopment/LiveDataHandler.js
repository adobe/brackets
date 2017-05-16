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

define(function (require, exports, module) {
    "use strict";

    var FileUtils           = require("file/FileUtils"),
        NodeDomain          = require("utils/NodeDomain"),
        AppInit             = require("utils/AppInit"),
        EditorManager       = require("editor/EditorManager"),
        LiveDevelopment     = require("LiveDevelopment/LiveDevelopment"),
        Commands            = require('command/Commands'),
        CommandManager      = require('command/CommandManager'),
        FileSystem          = require('filesystem/FileSystem'),
        ViewUtils               = require("utils/ViewUtils"),
        WorkingSetView          = require("project/WorkingSetView"),
        FileSystemImpl      = FileSystem._FileSystem,
        HTMLInstrumentation = require("language/HTMLInstrumentation"),
        MultiRangeInlineEditor  = require("editor/MultiRangeInlineEditor"),
        Strings                 = require("strings"),
        ProjectManager      = require("project/ProjectManager"),
        DocumentManager     = require("document/DocumentManager"),
        CSSUtils            = require("language/CSSUtils"),
        CSSCustomParser     = require("thirdparty/CSSParser"),
        WorkspaceManager        = require("view/WorkspaceManager"),
        Mustache                = require("thirdparty/mustache/mustache"),
        ConnectedToolsTemplate  = require("text!htmlContent/connected-tools.html");
        
        
    var _currentInspectedSource;
        
    var _ = require("thirdparty/lodash");
    var relatedFiles = [];
    var relatedFilesToDOMNodeMap = {};
    
    var WebSocketTransport = require("LiveDevelopment/transports/WebSocketTransport"),
        WebSocketTransportDomain = WebSocketTransport.WebSocketTransportDomain;
        
    var inlineInfo, lastVisitedPath;
    var $livedataPanel, $relatedFilesPanel, $breadCrumb;

    var breadCrumbItem =  '<li><a href="#">{{selector}}</a></li>';
    var InlineSelectorEntry = '<li class="topcoat-list__item" style="cursor:move" title="{{title}}">{{selector}}</li>';
    var SectionHeaderEntry  = '<li class="section-header" title="@media {{selectorText}}"><span class="disclosure-triangle expanded"></span><span class="activemedia">@media &nbsp;</span><span class="filename">{{selectorText}}</span></li>';
    var SelectorEntry = '<li title="{{selectorText}} :{{lineIndex}}">{{selectorText}} <span class="related-file">:{{fileName}}</span></li>';
    var FileNameTemplate = '<a class="filename" title=""><div class="dirty-indicator" style="width: 0px;">•</div> {{fileName}} : <span class="line-number">0</span></a>';
    var RelatedFileEntryTemplate = '<li></li>';
    
    function _jumpToNode(editor, position) {
        if (position) {
            editor.setCursorPos(position.line, position.ch, true);
        }
    }
    
    function _addToPath(editor, node) {
        //var base = $(breadCrumbItem.replace("{{selector}}", node.label)).prependTo('#livedata-tools #breadcrumb');
        var base = $(breadCrumbItem.replace("{{selector}}", node.label)).prependTo($breadCrumb);

        base.on('click', function () {
            var position = HTMLInstrumentation.getPositionFromTagId(editor, parseInt(node.target, 10));
            _jumpToNode(editor, position);
        });
    }
    
    function _processNodePath(pathArr) {
        //$('#breadcrumb').html("");
        $breadCrumb.empty();
        var editor = EditorManager.getActiveEditor(),
            node;
            
        for (node in pathArr) {
            if (pathArr.hasOwnProperty(node)) {
                _addToPath(editor, pathArr[node]);
            }
        }
    }
    
    function _getFileEntryWrapper(path) {
        var data = {fullPath: path,
                    name: FileUtils.getBaseName(path),
                    isFile: true};
            
        // Create new list item with a link
        var $link = $("<a href='#'></a>").html(ViewUtils.getFileEntryDisplay({name: FileUtils.getBaseName(path)}));

        // Use the file icon providers
        WorkingSetView.useIconProviders(data, $link);
        $link.attr("title", path);
        return $link;
    }
    
    function _getRelatedFileName(path) {
        var supportedExtensions = ['js', 'css', 'html', 'htm', 'xhtml'];
        var filename = path.split("/").pop();
        var extn = filename.split(".").pop();
        if (supportedExtensions.indexOf(extn) !== -1) {
            return filename;
        } else {
            return "";
        }
    }
    
    function _highlightRelatedDocTab() {
        var doc = EditorManager.getActiveEditor().document;
        $relatedFilesPanel.find(".active").removeClass("active");
        if (doc && relatedFilesToDOMNodeMap[doc.file._path]) {
            relatedFilesToDOMNodeMap[doc.file._path].addClass("active");
        }
    }
    
    function _handleRelatedFilesView(pathArr) {
        var processedFileName, fullPath;
        relatedFiles = JSON.parse(pathArr);
        relatedFilesToDOMNodeMap = {};
        $relatedFilesPanel.find("ul").empty();
        ProjectManager.rerenderTree();
        relatedFiles.forEach(function (path) {
            processedFileName = _getRelatedFileName(path);
            fullPath = ProjectManager.getProjectRoot()._path + path.substring(1);
            if (processedFileName) {
                relatedFilesToDOMNodeMap[fullPath] = $(RelatedFileEntryTemplate).append(_getFileEntryWrapper(fullPath)).appendTo($relatedFilesPanel.find("ul")).data("path", fullPath);
                relatedFilesToDOMNodeMap[fullPath].on("click", function () {
                    var fullPath = $(this).data("path");
                    CommandManager.execute(Commands.FILE_OPEN, {fullPath: fullPath});
                });
            }
        });
        _highlightRelatedDocTab();
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
    
    function _handleInlineEdit($entry, selData) {
        if (!$entry.data("file")) {
            return;
        }
        
        $("#livedata-tools .selection")
            .css("top", $entry.position().top)
            .height($entry.outerHeight());
            

        var inlineDocRange, selectors, matchedSelector, parentSelector;
        var fileName = ProjectManager.getProjectRoot()._path + $entry.data("file").substring(1);
        if (inlineInfo) {
            inlineInfo.editor.destroy();
            $("#livedata-tools .inline-editor-holder").empty();
        }
        DocumentManager.getDocumentForPath(fileName).done(function (doc) {
            doc._ensureMasterEditor();
            selectors = CSSCustomParser.praseCSS(doc.getText()).stylesheet.rules;
            //CSSUtils.consolidateRules(CSSUtils.extractAllSelectors(doc.getText()));
            if (selectors.length > 0) {
                if ($entry.data("parentIndex")) {
                    // Detected nested selector - media rule
                    parentSelector = _getMatchedRule(selectors, parseInt($entry.data("parentIndex"), 10));
                    matchedSelector = _getMatchedRule(parentSelector.rules, parseInt($entry.data("index"), 10));
                } else {
                    matchedSelector = _getMatchedRule(selectors, parseInt($entry.data("index"), 10));
                }
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
                inlineInfo.editor.connected = true;
                $("#livedata-tools .inline-editor-header .filename").html("");
                $(FileNameTemplate.split("{{fileName}}").join($entry.data("file").split("/").pop())).appendTo("#livedata-tools .inline-editor-header .filename");
                if (selData) {
                    var i, decl;
                    for (i in matchedSelector.declarations) {
                        if (matchedSelector.declarations.hasOwnProperty(i)) {
                            decl = matchedSelector.declarations[i];
                            if (decl.property === selData.name && decl.value === selData.value) {
                                inlineInfo.editor.focus();
                                inlineInfo.editor.setCursorPos({line: decl.position.end.line - 1, ch: decl.position.end.column - 1 - selData.value.length});
                            }
                        }
                    }
                }
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
    
        if (!ruleArr.length) {
            $('.empty-related-container').show();
            $(".inline-text-editor, .related-container").hide();
            return;
        }
        
        $('.empty-related-container').hide();
        $(".inline-text-editor, .related-container").show();
        
        $("#livedata-tools .related > ul").html("");
        var files = Object.keys(ruleArr), rules;
        var fIndex, file, rIndex, rule, $entry;
        
        for (rIndex in ruleArr) {
            if (ruleArr.hasOwnProperty(rIndex)) {
                rule = ruleArr[rIndex];
                if (!isNaN(parseInt(rule.index, 10))) {
                    $entry = $(SelectorEntry.split("{{selectorText}}").join(rule.selectorText).split("{{fileName}}").join(rule.href.split("/").pop())).appendTo("#livedata-tools .related > ul");
                    $entry.data("file", rule.href);
                    $entry.data("index", rule.index);
                    if (rule.media) {
                        $entry.data("parentIndex", rule.parentIndex);
                        $entry.attr('title', rule.media);
                        $entry.addClass('activeMedia');
                    }
                }
            }
        }
        
        $("#livedata-tools .related > ul > li:nth-child(1)").addClass("selected");
        _handleInlineEdit($("#livedata-tools .related > ul > li:nth-child(1)"));
        //_consolidateRules(ruleArr);
    }
    
    function _getDisplayValue(value) {
        return isNaN(parseInt(value, 10)) ? value : parseInt(value, 10);
    }
    
    function _jumpToDef(metadata) {
        if (metadata && metadata.index) {
            _handleInlineEdit($("#livedata-tools .related > ul > li:nth-child(" + metadata.index + ")"), metadata);
        }
        if (window.event) {
            window.event.stopPropagation();
        }
    }
    
    function _overlayBoxLayer(layer, data) {
        $('#livedata-tools .metrics .' + layer + ' > .top').text(_getDisplayValue(data.top));
        $('#livedata-tools .metrics .' + layer + ' > .right').text(_getDisplayValue(data.right));
        $('#livedata-tools .metrics .' + layer + ' > .bottom').text(_getDisplayValue(data.bottom));
        $('#livedata-tools .metrics .' + layer + ' > .left').text(_getDisplayValue(data.left));
        
        $('#livedata-tools .metrics .' + layer).unbind("click");
        $('#livedata-tools .metrics .' + layer + ' > .top').unbind("click");
        $('#livedata-tools .metrics .' + layer + ' > .right').unbind("click");
        $('#livedata-tools .metrics .' + layer + ' > .bottom').unbind("click");
        $('#livedata-tools .metrics .' + layer + ' > .left').unbind("click");
        
        $('#livedata-tools .metrics .' + layer).on("click", function () {
            _jumpToDef(data.metadata[$(this).attr('name')]);
        });
        $('#livedata-tools .metrics .' + layer + ' > .top').on("click", function () {
            _jumpToDef(data.metadata[$(this).attr('name')]);
        });
        $('#livedata-tools .metrics .' + layer + ' > .right').on("click", function () {
            _jumpToDef(data.metadata[$(this).attr('name')]);
        });
        $('#livedata-tools .metrics .' + layer + ' > .bottom').on("click", function () {
            _jumpToDef(data.metadata[$(this).attr('name')]);
        });
        $('#livedata-tools .metrics .' + layer + ' > .left').on("click", function () {
            _jumpToDef(data.metadata[$(this).attr('name')]);
        });
    }

    function _overlayContentbox(data) {
        $('#livedata-tools .metrics .contentbox > .contentwidth').text(_getDisplayValue(data.width));
        $('#livedata-tools .metrics .contentbox > .contentheight').text(_getDisplayValue(data.height));
        
        $('#livedata-tools .metrics .contentbox > .contentwidth').unbind("click");
        $('#livedata-tools .metrics .contentbox > .contentheight').unbind("click");
        
        $('#livedata-tools .metrics .contentbox > .contentwidth').on("click", function () {
            _jumpToDef(data.metadata.width);
        });
        $('#livedata-tools .metrics .contentbox > .contentheight').on("click", function () {
            _jumpToDef(data.metadata.height);
        });
    }
    
    function _processBoxModelMarker(boxModel) {
        _overlayBoxLayer('margin', boxModel.margin);
        _overlayBoxLayer('border', boxModel.border);
        _overlayBoxLayer('padding', boxModel.padding);
        _overlayContentbox(boxModel.content);
    }
    
    WebSocketTransportDomain.on("livedata", function (obj, message) {
        message = JSON.parse(message);
        if (message.relatedFiles) {
            if (message.source) {
                var sourcePathInProject = ProjectManager.getProjectRoot()._path + message.source.substring(1);
                if (sourcePathInProject !== _currentInspectedSource) {
                    _currentInspectedSource = sourcePathInProject;
                    LiveDevelopment.agents.network.liveSourceSync = true;
                    CommandManager.execute(Commands.FILE_OPEN, {fullPath: _currentInspectedSource}).done(function () {
                        //LiveDevelopment.reload();
                        LiveDevelopment.agents.network.liveSourceSync = true;
                    });
                } else {
                    _handleRelatedFilesView(message.relatedFiles);
                }
            }
        } else {
            if (lastVisitedPath !== message.path || message.refresh) {
                lastVisitedPath = message.path;
                _processNodePath(JSON.parse(message.path));
                _processLiveData(JSON.parse(message.data));
                _processBoxModelMarker(message.boxmodel);
            }
        }
    });
    
    ProjectManager.addClassesProvider(function (data) {
        if ($("#inspect-toggle").is(":checked") && relatedFiles.length) {
            if (relatedFiles.indexOf("/" + data.fullPath.replace(ProjectManager.getProjectRoot().fullPath, "")) === -1) {
                return "not-in-preview";
            } else {
                return "in-preview";
            }
        }
        return "";
    });
    
    function _handleInspectToggle() {
        if ($("#inspect-toggle").is(":checked")) {
            $livedataPanel.show();
            $(".connected-tools").show();
            $("#livedata-tools .related > ul > li:nth-child(1)").addClass("selected");
            _handleInlineEdit($("#livedata-tools .related > ul > li:nth-child(1)"));
        } else {
            $livedataPanel.hide();
            $(".connected-tools").hide();
        }
        ProjectManager.rerenderTree();
    }
    
    function _handleReverseInspectToggle() {
        $(this).toggleClass("active");
        if ($(this).hasClass("active")) {
            WebSocketTransport.sendDataToBrowser(JSON.stringify({inspect: true}));
        } else {
            WebSocketTransport.sendDataToBrowser(JSON.stringify({inspect: false}));
        }
    }
    
    function _handleLiveViewStatus(event, status, reason) {
        if (status === 3) {
            $("#inspect-toggle").on("change", _handleInspectToggle);
            $("#toggle-reverse-inspect").on("click", _handleReverseInspectToggle);
            $("body").addClass("connected");
            $breadCrumb.show();
            $('#status-info').detach().appendTo('#status-indicators');
            _currentInspectedSource = DocumentManager.getCurrentDocument().file.fullPath;
            setTimeout(function () {
                EditorManager.getActiveEditor().setCursorPos(EditorManager.getActiveEditor().getCursorPos());
            }, 500);
        } else {
            relatedFiles = [];
            lastVisitedPath = null;
            $breadCrumb.empty();
            $breadCrumb.hide();
            $("#inspect-toggle").attr('checked', null);
            $("#inspect-toggle").off("change", _handleInspectToggle);
            $("#toggle-reverse-inspect").off("click", _handleReverseInspectToggle);
            $("body").removeClass("connected");
            $('#status-info').detach().prependTo('#status-bar');
        }
    }
    
    AppInit.appReady(function () {
        LiveDevelopment.on("statusChange", _handleLiveViewStatus);
        
        // Create bottom panel for connected tools
        $livedataPanel = WorkspaceManager.createBottomPanel("livedata-tools", $(Mustache.render(ConnectedToolsTemplate, Strings)), 100);
        
        $relatedFilesPanel = $('<div id="related-files-container"><ul class="nav nav-tabs"></ul></div>').appendTo(".content");
        
        $breadCrumb = $('<ul id="breadcrumb"></ul>').prependTo("#status-bar");
    });
    
});
