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

/*jslint vars: true, plusplus: true, devel: true, nomen: true,  regexp: true, indent: 4, maxerr: 50 */
/*global define, brackets, $, PathUtils, CodeMirror */

define(function (require, exports, module) {
    "use strict";
    
    // Brackets modules
    var CommandManager      = brackets.getModule("command/CommandManager"),
        EditorManager       = brackets.getModule("editor/EditorManager"),
        ExtensionUtils      = brackets.getModule("utils/ExtensionUtils"),
        Menus               = brackets.getModule("command/Menus"),
        Strings             = brackets.getModule("strings"),
        PreferencesManager  = brackets.getModule("preferences/PreferencesManager");
    
    var PREFERENCES_CLIENT_ID      = "com.adobe.hoverPreview",
        defaultPrefs               = { enabled: true },
        enabled                    = true,   // Only show preview if true
        prefs                      = null,   // Preferences
        previewMark,                         // CodeMirror marker highlighting the preview text
        $previewContainer,                   // Preview container
        currentImagePreviewContent = "";     // Current image preview content, or "" if no content is showing.
    
    function hidePreview() {
        if (previewMark) {
            previewMark.clear();
            previewMark = null;
        }
        $previewContainer.empty();
        $previewContainer.hide();
        $previewContainer.removeClass("small-padding-bottom");
        currentImagePreviewContent = "";
    }
    
    function positionPreview(xpos, ypos, ybot) {
        var top = ypos - $previewContainer.height() - 38;
        
        if (top < 0) {
            $previewContainer.removeClass("preview-bubble");
            $previewContainer.addClass("preview-bubble-below");
            top = ybot + 16;
            $previewContainer.offset({
                left: xpos - $previewContainer.width() / 2 - 10,
                top: top
            });
        } else {
            $previewContainer.removeClass("preview-bubble-below");
            $previewContainer.addClass("preview-bubble");
            $previewContainer.offset({
                left: xpos - $previewContainer.width() / 2 - 10,
                top: top
            });
        }
    }
    
    function showPreview(content, xpos, ypos, ybot) {
        hidePreview();
        $previewContainer.append(content);
        $previewContainer.show();
        positionPreview(xpos, ypos, ybot);
    }
    
    function divContainsMouse($div, event) {
        var offset = $div.offset();
        
        return (event.clientX >= offset.left &&
                event.clientX <= offset.left + $div.width() &&
                event.clientY >= offset.top &&
                event.clientY <= offset.top + $div.height());
    }
    
    function charCoords(cm, pos) {
        var coords = cm.charCoords(pos);
        
        // CodeMirror 2 uses x, y, ybot
        // CodeMirror 3 uses left, top, bottom
        // Since this code was written for CodeMirror 2, return 
        // a CM2-normalized struct
        return {
            x: coords.x || coords.left,
            y: coords.y || coords.top,
            yBot: coords.ybot || coords.bottom
        };
    }
    
    function coordsChar(cm, coords) {
        if (CodeMirror.version) {
            coords.left = coords.x;
            coords.top = coords.y;
        }
        
        return cm.coordsChar(coords);
    }
    
    function markText(cm, start, end, className) {
        if (CodeMirror.version) {
            return cm.markText(start, end, {className: className});
        } else {
            return cm.markText(start, end, className);
        }
    }
    
    function queryPreviewProviders(editor, pos, token, line, event) {
        
        // TODO: Support plugin providers. For now we just hard-code...
        var cm = editor._codeMirror;
        
        if (!cm || !editor) {
            return;
        }
        
        var editorWidth = $(editor.getRootElement()).width();
        
        // Check for gradient
        var gradientRegEx = /-webkit-gradient\([^;]*;?|(-moz-|-ms-|-o-|-webkit-|\s)(linear-gradient\([^;]*);?|(-moz-|-ms-|-o-|-webkit-)(radial-gradient\([^;]*);?/,
            gradientMatch = line.match(gradientRegEx),
            prefix = "",
            colorValue;
        
        // If it was a linear-gradient or radial-gradient variant, prefix with "-webkit-" so it
        // shows up correctly in Brackets.
        if (gradientMatch && gradientMatch[0].indexOf("-webkit-gradient") !== 0) {
            prefix = "-webkit-";
        }
        
        // For prefixed gradients, use the non-prefixed value as the color value. "-webkit-" will be added 
        // before this value
        if (gradientMatch && gradientMatch[2]) {
            colorValue = gradientMatch[2];
        }
        
        // Check for color
        var colorRegEx = /#[a-f0-9]{6}|#[a-f0-9]{3}|rgb\( ?\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b ?, ?\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b ?, ?\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b ?\)|rgb\( ?\b([0-9]{1,2}%|100%) ?, ?\b([0-9]{1,2}%|100%) ?, ?\b([0-9]{1,2}%|100%) ?\)|rgba\( ?\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b ?, ?\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b ?, ?\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b ?, ?(1|0|0?\.[0-9]{1,3}) ?\)|rgba\( ?\b([0-9]{1,2}%|100%) ?, ?\b([0-9]{1,2}%|100%) ?, ?\b([0-9]{1,2}%|100%) ?, ?(1|0|0?\.[0-9]{1,3}) ?\)|hsl\( ?\b([0-9]{1,2}|[12][0-9]{2}|3[0-5][0-9]|360)\b ?, ?\b([0-9]{1,2}|100)\b% ?, ?\b([0-9]{1,2}|100)\b% ?\)|hsla\( ?\b([0-9]{1,2}|[12][0-9]{2}|3[0-5][0-9]|360)\b ?, ?\b([0-9]{1,2}|100)\b% ?, ?\b([0-9]{1,2}|100)\b% ?, ?(1|0|0?\.[0-9]{1,3}) ?\)|\baliceblue\b|\bantiquewhite\b|\baqua\b|\baquamarine\b|\bazure\b|\bbeige\b|\bbisque\b|\bblack\b|\bblanchedalmond\b|\bblue\b|\bblueviolet\b|\bbrown\b|\bburlywood\b|\bcadetblue\b|\bchartreuse\b|\bchocolate\b|\bcoral\b|\bcornflowerblue\b|\bcornsilk\b|\bcrimson\b|\bcyan\b|\bdarkblue\b|\bdarkcyan\b|\bdarkgoldenrod\b|\bdarkgray\b|\bdarkgreen\b|\bdarkgrey\b|\bdarkkhaki\b|\bdarkmagenta\b|\bdarkolivegreen\b|\bdarkorange\b|\bdarkorchid\b|\bdarkred\b|\bdarksalmon\b|\bdarkseagreen\b|\bdarkslateblue\b|\bdarkslategray\b|\bdarkslategrey\b|\bdarkturquoise\b|\bdarkviolet\b|\bdeeppink\b|\bdeepskyblue\b|\bdimgray\b|\bdimgrey\b|\bdodgerblue\b|\bfirebrick\b|\bfloralwhite\b|\bforestgreen\b|\bfuchsia\b|\bgainsboro\b|\bghostwhite\b|\bgold\b|\bgoldenrod\b|\bgray\b|\bgreen\b|\bgreenyellow\b|\bgrey\b|\bhoneydew\b|\bhotpink\b|\bindianred\b|\bindigo\b|\bivory\b|\bkhaki\b|\blavender\b|\blavenderblush\b|\blawngreen\b|\blemonchiffon\b|\blightblue\b|\blightcoral\b|\blightcyan\b|\blightgoldenrodyellow\b|\blightgray\b|\blightgreen\b|\blightgrey\b|\blightpink\b|\blightsalmon\b|\blightseagreen\b|\blightskyblue\b|\blightslategray\b|\blightslategrey\b|\blightsteelblue\b|\blightyellow\b|\blime\b|\blimegreen\b|\blinen\b|\bmagenta\b|\bmaroon\b|\bmediumaquamarine\b|\bmediumblue\b|\bmediumorchid\b|\bmediumpurple\b|\bmediumseagreen\b|\bmediumslateblue\b|\bmediumspringgreen\b|\bmediumturquoise\b|\bmediumvioletred\b|\bmidnightblue\b|\bmintcream\b|\bmistyrose\b|\bmoccasin\b|\bnavajowhite\b|\bnavy\b|\boldlace\b|\bolive\b|\bolivedrab\b|\borange\b|\borangered\b|\borchid\b|\bpalegoldenrod\b|\bpalegreen\b|\bpaleturquoise\b|\bpalevioletred\b|\bpapayawhip\b|\bpeachpuff\b|\bperu\b|\bpink\b|\bplum\b|\bpowderblue\b|\bpurple\b|\bred\b|\brosybrown\b|\broyalblue\b|\bsaddlebrown\b|\bsalmon\b|\bsandybrown\b|\bseagreen\b|\bseashell\b|\bsienna\b|\bsilver\b|\bskyblue\b|\bslateblue\b|\bslategray\b|\bslategrey\b|\bsnow\b|\bspringgreen\b|\bsteelblue\b|\btan\b|\bteal\b|\bthistle\b|\btomato\b|\bturquoise\b|\bviolet\b|\bwheat\b|\bwhite\b|\bwhitesmoke\b|\byellow\b|\byellowgreen\b/gi,
            colorMatch = colorRegEx.exec(line),
            match = gradientMatch || colorMatch;

        while (match) {
            if (match && pos.ch >= match.index && pos.ch <= match.index + match[0].length) {
                var preview = "<div class='color-swatch-bg'>"                           +
                              "    <div class='color-swatch' style='background:"        +
                                        prefix + (colorValue || match[0]) + ";'>"       +
                              "    </div>"                                              +
                              "</div>";
                var startPos = {line: pos.line, ch: match.index},
                    endPos = {line: pos.line, ch: match.index + match[0].length},
                    startCoords = charCoords(cm, startPos),
                    xPos;
                
                xPos = (charCoords(cm, endPos).x - startCoords.x) / 2 + startCoords.x;
                showPreview(preview, xPos, startCoords.y, startCoords.yBot);
                previewMark = markText(
                    cm,
                    startPos,
                    endPos,
                    "preview-highlight"
                );
                return;
            }
            match = colorRegEx.exec(line);
        }
        
        // Check for image name
        var urlRegEx = /url\(([^\)]*)\)/,
            tokenString,
            urlMatch = line.match(urlRegEx);

        if (urlMatch && pos.ch >= urlMatch.indx && pos.ch <= urlMatch.index + urlMatch[0].length) {
            tokenString = urlMatch[1];
        } else if (token.className === "string") {
            tokenString = token.string;
        }
        
        if (tokenString) {
            // Strip quotes, if present
            var quotesRegEx = /(\'|\")?([^(\'|\")]*)(\'|\")?/;
            tokenString = tokenString.replace(quotesRegEx, "$2");
            
            if (/(\.gif|\.png|\.jpg|\.jpeg|\.svg)$/i.test(tokenString)) {
                var sPos, ePos;
                var docPath = editor.document.file.fullPath;
                var imgPath;
                
                if (PathUtils.isAbsoluteUrl(tokenString)) {
                    imgPath = tokenString;
                } else {
                    imgPath = "file:///" + docPath.substr(0, docPath.lastIndexOf("/") + 1) + tokenString;
                }
                
                if (urlMatch) {
                    sPos = {line: pos.line, ch: urlMatch.index};
                    ePos = {line: pos.line, ch: urlMatch.index + urlMatch[0].length};
                } else {
                    sPos = {line: pos.line, ch: token.start};
                    ePos = {line: pos.line, ch: token.end};
                }
                
                if (imgPath) {
                    var imgPreview = "<div class='image-preview'>"          +
                                     "    <img src=\"" + imgPath + "\">"    +
                                     "</div>";
                    if (imgPreview !== currentImagePreviewContent) {
                        var coord = charCoords(cm, sPos);
                        var xpos = (charCoords(cm, ePos).x - coord.x) / 2 + coord.x;
                        var ypos = coord.y;
                        var ybot = coord.yBot;
                        showPreview(imgPreview, xpos, ypos, ybot);
                        
                        // Hide the preview container until the image is loaded.
                        $previewContainer.hide();
                        $previewContainer.find("img").on("load", function () {
                            $previewContainer.find(".image-preview")
                                .append("<br/>"                                                 +
                                        "<span class='img-size'>"                               +
                                                this.naturalWidth + " x " + this.naturalHeight  +
                                        "</span>"
                                    );
                            $previewContainer.addClass("small-padding-bottom");
                            $previewContainer.show();
                            positionPreview(xpos, ypos, ybot);
                        });
                        previewMark = markText(
                            cm,
                            sPos,
                            ePos,
                            "preview-highlight"
                        );
                        currentImagePreviewContent = imgPreview;
                    }
                    return;
                }
            }
        }
        
        hidePreview();
    }
    
    function handleMouseMove(event) {
        if (!enabled) {
            return;
        }
        
        // Figure out which editor we are over
        var fullEditor = EditorManager.getCurrentFullEditor();
        
        if (!fullEditor) {
            hidePreview();
            return;
        }
        
        // Check inlines first
        var inlines = fullEditor.getInlineWidgets(),
            i,
            editor;
        
        for (i = 0; i < inlines.length; i++) {
            var $inlineDiv = inlines[i].$editorsDiv;
            
            if (divContainsMouse($inlineDiv, event)) {
                editor = inlines[i].editors[0];
                break;
            }
        }
        
        // Check main editor
        if (!editor) {
            if (divContainsMouse($(fullEditor.getRootElement()), event)) {
                editor = fullEditor;
            }
        }
        
        if (editor && editor._codeMirror) {
            var cm = editor._codeMirror;
            var pos = coordsChar(cm, {x: event.clientX, y: event.clientY});
            var token = cm.getTokenAt(pos);
            var line = cm.getLine(pos.line);
            
            queryPreviewProviders(editor, pos, token, line, event);
        } else {
            hidePreview();
        }
    }
    
    // Init: Listen to all mousemoves in the editor area
    $("#editor-holder")[0].addEventListener("mousemove", handleMouseMove, true);
    $("#editor-holder")[0].addEventListener("scroll", hidePreview, true);
    
    // Create the preview container
    $previewContainer = $("<div id='hover-preview-container' class='preview-bubble'>").appendTo($("body"));
    
    // Load our stylesheet
    ExtensionUtils.loadStyleSheet(module, "HoverPreview.css");
    
    // Add menu command
    var CMD_ENABLE_HOVER_PREVIEW  = "view.enableHoverPreview";

    function updateMenuItemCheckmark() {
        CommandManager.get(CMD_ENABLE_HOVER_PREVIEW).setChecked(enabled);
    }

    function setEnabled(_enabled) {
        if (enabled !== _enabled) {
            enabled = _enabled;
            if (!enabled) {
                hidePreview();
            }
            prefs.setValue("enabled", enabled);
        }
        // Always update the checkmark, even if the enabled flag hasn't changed.
        updateMenuItemCheckmark();
    }
    
    function toggleEnableHoverPreview() {
        setEnabled(!enabled);
    }
      
    CommandManager.register(Strings.CMD_ENABLE_HOVER_PREVIEW, CMD_ENABLE_HOVER_PREVIEW, toggleEnableHoverPreview);
    var menu = Menus.getMenu(Menus.AppMenuBar.VIEW_MENU);
    menu.addMenuItem(CMD_ENABLE_HOVER_PREVIEW);
    
    // Init PreferenceStorage
    prefs = PreferencesManager.getPreferenceStorage(PREFERENCES_CLIENT_ID, defaultPrefs);

    // Setup initial UI state
    setEnabled(prefs.getValue("enabled"));
});
