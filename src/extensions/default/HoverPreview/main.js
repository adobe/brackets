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
    var AppInit             = brackets.getModule("utils/AppInit"),
        CommandManager      = brackets.getModule("command/CommandManager"),
        EditorManager       = brackets.getModule("editor/EditorManager"),
        ExtensionUtils      = brackets.getModule("utils/ExtensionUtils"),
        Menus               = brackets.getModule("command/Menus"),
        PreferencesManager  = brackets.getModule("preferences/PreferencesManager"),
        Strings             = brackets.getModule("strings");
   
    var previewContainerHTML       = require("text!HoverPreviewTemplate.html");
    
    var defaultPrefs               = { enabled: true },
        enabled,                             // Only show preview if true
        prefs                      = null,   // Preferences
        previewMark,                         // CodeMirror marker highlighting the preview text
        $previewContainer,                   // Preview container
        $previewContent,                     // Preview content holder
        currentImagePreviewContent   = "",   // Current image preview content, or "" if no content is showing.
        lastPreviewedColorOrGradient = "",   // Color/gradient value of last previewed.
        lastPreviewedImagePath       = "";   // Image path of last previewed.
    
    // Constants
    var CMD_ENABLE_HOVER_PREVIEW    = "view.enableHoverPreview",
        POSITION_OFFSET             = 38,   // Distance between the bottom of the line and the bottom of the preview container
        POINTER_LEFT_OFFSET         = 17,   // Half of the pointer width, used to find the center of the pointer
        POINTER_TOP_OFFSET          =  7,   // Pointer height, used to shift popover above pointer
        POSITION_BELOW_OFFSET       = 16;   // Amount to adjust to top position when the preview bubble is below the text
    
    function hidePreview() {
        if (previewMark) {
            previewMark.clear();
            previewMark = null;
        }
        $previewContent.empty();
        $previewContainer.hide();
        currentImagePreviewContent = "";
    }
    
    function positionPreview(xpos, ypos, ybot) {
        var top = ypos - $previewContainer.height() - POSITION_OFFSET;
        
        if (top < 0) {
            $previewContainer.removeClass("preview-bubble-above");
            $previewContainer.addClass("preview-bubble-below");
            top = ybot + POSITION_BELOW_OFFSET;
            $previewContainer.offset({
                left: xpos - $previewContainer.width() / 2 - POINTER_LEFT_OFFSET,
                top: top
            });
        } else {
            $previewContainer.removeClass("preview-bubble-below");
            $previewContainer.addClass("preview-bubble-above");
            $previewContainer.offset({
                left: xpos - $previewContainer.width() / 2 - POINTER_LEFT_OFFSET,
                top: top - POINTER_TOP_OFFSET
            });
        }
    }
    
    function showPreview(content, xpos, ypos, ybot) {
        hidePreview();
        $previewContent.append(content);
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

    function colorAndGradientPreviewProvider(editor, pos, token, line) {
        var cm = editor._codeMirror;
        
        lastPreviewedColorOrGradient = "";

        // Check for gradient. -webkit-gradient() can have parens in parameters
        // nested 2 levels. Other gradients can only nest 1 level.
        var gradientRegEx1 = /-webkit-gradient\((?:[^\(]*?(?:\((?:[^\(]*?(?:\([^\)]*?\))*?)*?\))*?)*?\)/,
            gradientRegEx2 = /(?:(?:-moz-|-ms-|-o-|-webkit-|)(linear-gradient)|(?:-moz-|-ms-|-o-|-webkit-)(radial-gradient))(\((?:[^\)]*?(?:\([^\)]*?\))*?)*?\))/,
            
            gradientMatch = line.match(gradientRegEx1) || line.match(gradientRegEx2),
            prefix = "",
            colorValue;
        
        if (gradientMatch) {
            if (gradientMatch[0].indexOf("@") !== -1) {
                // If the gradient match has "@" in it, it is most likely a less or
                // sass variable. Ignore it since it won't be displayed correctly.
                gradientMatch = null;

            } else if (gradientMatch[0].indexOf("to ") !== -1) {
                // If the gradient match has "to " in it, it's most likely the new gradient
                // syntax which is not supported until Chrome 26, so we can't yet preview it
                gradientMatch = null;
            }
        }
        
        if (gradientMatch) {
            // If it was a linear-gradient or radial-gradient variant, prefix with
            // "-webkit-" so it shows up correctly in Brackets.
            if (gradientMatch[0].indexOf("-webkit-gradient") !== 0) {
                prefix = "-webkit-";
            }
            
            // For prefixed gradients, use the non-prefixed value as the color value.
            // "-webkit-" will be added before this value
            if (gradientMatch[1]) {
                colorValue = gradientMatch[1] + gradientMatch[3];    // linear gradiant
            } else if (gradientMatch[2]) {
                colorValue = gradientMatch[2] + gradientMatch[3];    // radial gradiant
            }
        }
        
        // Check for color
        var colorRegEx = /#[a-f0-9]{6}\b|#[a-f0-9]{3}\b|rgb\( ?\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b ?, ?\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b ?, ?\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b ?\)|rgb\( ?\b([0-9]{1,2}%|100%) ?, ?\b([0-9]{1,2}%|100%) ?, ?\b([0-9]{1,2}%|100%) ?\)|rgba\( ?\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b ?, ?\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b ?, ?\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b ?, ?(1|0|0?\.[0-9]{1,3}) ?\)|rgba\( ?\b([0-9]{1,2}%|100%) ?, ?\b([0-9]{1,2}%|100%) ?, ?\b([0-9]{1,2}%|100%) ?, ?(1|0|0?\.[0-9]{1,3}) ?\)|hsl\( ?\b([0-9]{1,2}|[12][0-9]{2}|3[0-5][0-9]|360)\b ?, ?\b([0-9]{1,2}|100)\b% ?, ?\b([0-9]{1,2}|100)\b% ?\)|hsla\( ?\b([0-9]{1,2}|[12][0-9]{2}|3[0-5][0-9]|360)\b ?, ?\b([0-9]{1,2}|100)\b% ?, ?\b([0-9]{1,2}|100)\b% ?, ?(1|0|0?\.[0-9]{1,3}) ?\)|\baliceblue\b|\bantiquewhite\b|\baqua\b|\baquamarine\b|\bazure\b|\bbeige\b|\bbisque\b|\bblack\b|\bblanchedalmond\b|\bblue\b|\bblueviolet\b|\bbrown\b|\bburlywood\b|\bcadetblue\b|\bchartreuse\b|\bchocolate\b|\bcoral\b|\bcornflowerblue\b|\bcornsilk\b|\bcrimson\b|\bcyan\b|\bdarkblue\b|\bdarkcyan\b|\bdarkgoldenrod\b|\bdarkgray\b|\bdarkgreen\b|\bdarkgrey\b|\bdarkkhaki\b|\bdarkmagenta\b|\bdarkolivegreen\b|\bdarkorange\b|\bdarkorchid\b|\bdarkred\b|\bdarksalmon\b|\bdarkseagreen\b|\bdarkslateblue\b|\bdarkslategray\b|\bdarkslategrey\b|\bdarkturquoise\b|\bdarkviolet\b|\bdeeppink\b|\bdeepskyblue\b|\bdimgray\b|\bdimgrey\b|\bdodgerblue\b|\bfirebrick\b|\bfloralwhite\b|\bforestgreen\b|\bfuchsia\b|\bgainsboro\b|\bghostwhite\b|\bgold\b|\bgoldenrod\b|\bgray\b|\bgreen\b|\bgreenyellow\b|\bgrey\b|\bhoneydew\b|\bhotpink\b|\bindianred\b|\bindigo\b|\bivory\b|\bkhaki\b|\blavender\b|\blavenderblush\b|\blawngreen\b|\blemonchiffon\b|\blightblue\b|\blightcoral\b|\blightcyan\b|\blightgoldenrodyellow\b|\blightgray\b|\blightgreen\b|\blightgrey\b|\blightpink\b|\blightsalmon\b|\blightseagreen\b|\blightskyblue\b|\blightslategray\b|\blightslategrey\b|\blightsteelblue\b|\blightyellow\b|\blime\b|\blimegreen\b|\blinen\b|\bmagenta\b|\bmaroon\b|\bmediumaquamarine\b|\bmediumblue\b|\bmediumorchid\b|\bmediumpurple\b|\bmediumseagreen\b|\bmediumslateblue\b|\bmediumspringgreen\b|\bmediumturquoise\b|\bmediumvioletred\b|\bmidnightblue\b|\bmintcream\b|\bmistyrose\b|\bmoccasin\b|\bnavajowhite\b|\bnavy\b|\boldlace\b|\bolive\b|\bolivedrab\b|\borange\b|\borangered\b|\borchid\b|\bpalegoldenrod\b|\bpalegreen\b|\bpaleturquoise\b|\bpalevioletred\b|\bpapayawhip\b|\bpeachpuff\b|\bperu\b|\bpink\b|\bplum\b|\bpowderblue\b|\bpurple\b|\bred\b|\brosybrown\b|\broyalblue\b|\bsaddlebrown\b|\bsalmon\b|\bsandybrown\b|\bseagreen\b|\bseashell\b|\bsienna\b|\bsilver\b|\bskyblue\b|\bslateblue\b|\bslategray\b|\bslategrey\b|\bsnow\b|\bspringgreen\b|\bsteelblue\b|\btan\b|\bteal\b|\bthistle\b|\btomato\b|\bturquoise\b|\bviolet\b|\bwheat\b|\bwhite\b|\bwhitesmoke\b|\byellow\b|\byellowgreen\b/gi,
            colorMatch = colorRegEx.exec(line),
            match = gradientMatch || colorMatch;

        while (match) {
            if (pos.ch >= match.index && pos.ch <= match.index + match[0].length) {
                lastPreviewedColorOrGradient = (colorValue || match[0]);
                var preview = "<div class='color-swatch-bg'>"                           +
                              "    <div class='color-swatch' style='background:"        +
                                        prefix + lastPreviewedColorOrGradient + ";'>"       +
                              "    </div>"                                              +
                              "</div>";
                var startPos = {line: pos.line, ch: match.index},
                    endPos = {line: pos.line, ch: match.index + match[0].length},
                    startCoords = cm.charCoords(startPos),
                    xPos;
                
                xPos = (cm.charCoords(endPos).left - startCoords.left) / 2 + startCoords.left;
                showPreview(preview, xPos, startCoords.top, startCoords.bottom);
                previewMark = cm.markText(
                    startPos,
                    endPos,
                    {className: "hover-preview-highlight"}
                );
                return true;
            }
            match = colorRegEx.exec(line);
        }
        
        return false;
    }
    
    function imagePreviewProvider(editor, pos, token, line) {
        var cm = editor._codeMirror;
        
        lastPreviewedImagePath = "";
        
        // Check for image name
        var urlRegEx = /url\(([^\)]*)\)/,
            tokenString,
            urlMatch = line.match(urlRegEx);
        
        if (urlMatch && pos.ch >= urlMatch.index && pos.ch <= urlMatch.index + urlMatch[0].length) {
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
                        var coord = cm.charCoords(sPos);
                        var xpos = (cm.charCoords(ePos).left - coord.left) / 2 + coord.left;
                        var ypos = coord.top;
                        var ybot = coord.bottom;
                        showPreview(imgPreview, xpos, ypos, ybot);
                        
                        // Hide the preview container until the image is loaded.
                        $previewContainer.hide();
                        $previewContainer.find("img").on("load", function () {
                            $previewContent
                                .append("<div class='img-size'>"                                            +
                                            this.naturalWidth + " x " + this.naturalHeight + " pixels"  +
                                        "</div>"
                                    );
                            $previewContainer.show();
                            positionPreview(xpos, ypos, ybot);
                        });
                        previewMark = cm.markText(
                            sPos,
                            ePos,
                            {className: "hover-preview-highlight"}
                        );
                        currentImagePreviewContent = imgPreview;
                        lastPreviewedImagePath = imgPath;
                    }
                    return true;
                }
            }
        }
        
        return false;
    }
    
    function queryPreviewProviders(editor, pos, token, line) {
        
        // FUTURE: Support plugin providers. For now we just hard-code...
        if (!colorAndGradientPreviewProvider(editor, pos, token, line) &&
                !imagePreviewProvider(editor, pos, token, line)) {
            hidePreview();
        }
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
        
        // Check for inline Editor instances first
        var inlines = fullEditor.getInlineWidgets(),
            i,
            editor;
        
        for (i = 0; i < inlines.length; i++) {
            var $inlineDiv = inlines[i].$editorsDiv;  // see MultiRangeInlineEditor
            
            if ($inlineDiv && divContainsMouse($inlineDiv, event)) {
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
            var pos = cm.coordsChar({left: event.clientX, top: event.clientY});
            var token = cm.getTokenAt(pos);
            var line = cm.getLine(pos.line);
            
            queryPreviewProviders(editor, pos, token, line);
        } else {
            hidePreview();
        }
    }
    
    function getLastPreviewedColorOrGradient() {
        return lastPreviewedColorOrGradient;
    }
    
    function getLastPreviewedImagePath() {
        return lastPreviewedImagePath;
    }

    // Menu command handlers
    function updateMenuItemCheckmark() {
        CommandManager.get(CMD_ENABLE_HOVER_PREVIEW).setChecked(enabled);
    }

    function setEnabled(_enabled) {
        if (enabled !== _enabled) {
            enabled = _enabled;
            var editorHolder = $("#editor-holder")[0];
            if (enabled) {
                editorHolder.addEventListener("mousemove", handleMouseMove, true);
                editorHolder.addEventListener("scroll", hidePreview, true);
            } else {
                editorHolder.removeEventListener("mousemove", handleMouseMove, true);
                editorHolder.removeEventListener("scroll", hidePreview, true);
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
        
    // Create the preview container
    $previewContainer = $(previewContainerHTML).appendTo($("body"));
    $previewContent = $previewContainer.find(".preview-content");
    
    // Load our stylesheet
    ExtensionUtils.loadStyleSheet(module, "HoverPreview.css");
    
    // Register command
    CommandManager.register(Strings.CMD_ENABLE_HOVER_PREVIEW, CMD_ENABLE_HOVER_PREVIEW, toggleEnableHoverPreview);
    Menus.getMenu(Menus.AppMenuBar.VIEW_MENU).addMenuItem(CMD_ENABLE_HOVER_PREVIEW);
    
    // Init PreferenceStorage
    prefs = PreferencesManager.getPreferenceStorage(module, defaultPrefs);

    // Setup initial UI state
    setEnabled(prefs.getValue("enabled"));

    AppInit.appReady(function () {
        if (brackets.test) {
            brackets.test.extensions.HoverPreview = module.exports;
        }
    });
    
    // For unit testing
    exports._colorAndGradientPreviewProvider = colorAndGradientPreviewProvider;
    exports._imagePreviewProvider            = imagePreviewProvider;
    exports._getLastPreviewedColorOrGradient = getLastPreviewedColorOrGradient;
    exports._getLastPreviewedImagePath       = getLastPreviewedImagePath;
});
