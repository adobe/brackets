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
/*global define, brackets, $, window, PathUtils, CodeMirror */

define(function (require, exports, module) {
    "use strict";
    
    // Brackets modules
    var AppInit             = brackets.getModule("utils/AppInit"),
        CommandManager      = brackets.getModule("command/CommandManager"),
        DocumentManager     = brackets.getModule("document/DocumentManager"),
        EditorManager       = brackets.getModule("editor/EditorManager"),
        ExtensionUtils      = brackets.getModule("utils/ExtensionUtils"),
        Menus               = brackets.getModule("command/Menus"),
        PreferencesManager  = brackets.getModule("preferences/PreferencesManager"),
        Strings             = brackets.getModule("strings"),
        ColorUtils          = brackets.getModule("utils/ColorUtils");
   
    var previewContainerHTML       = require("text!QuickViewTemplate.html");
    
    var defaultPrefs               = { enabled: true },
        enabled,                             // Only show preview if true
        prefs                      = null,   // Preferences
        $previewContainer,                   // Preview container
        $previewContent,                     // Preview content holder
        lastPos;                             // Last line/ch pos processed by handleMouseMove
    
    // Constants
    var CMD_ENABLE_QUICK_VIEW       = "view.enableQuickView",
        HOVER_DELAY                 = 350,  // Time (ms) mouse must remain over a provider's matched text before popover appears
        POSITION_OFFSET             = 38,   // Distance between the bottom of the line and the bottom of the preview container
        POINTER_LEFT_OFFSET         = 17,   // Half of the pointer width, used to find the center of the pointer
        POINTER_TOP_OFFSET          =  7,   // Pointer height, used to shift popover above pointer
        POSITION_BELOW_OFFSET       = 16,   // Amount to adjust to top position when the preview bubble is below the text
        POPOVER_HORZ_MARGIN         =  5;   // Horizontal margin
    
    /**
     * There are three states for this var:
     * 1. If null, there is no provider result for the given mouse position.
     * 2. If non-null, and visible==true, there is a popover currently showing.
     * 3. If non-null, but visible==false, there is a provider result but it has not been shown yet because
     * we're waiting for HOVER_DELAY, which is tracked by hoverTimer. The state changes to visible==true as
     * soon as hoverTimer fires. If the mouse moves before then, the popover will never become visible.
     * 
     * @type {{
     *      visible: boolean,
     *      editor: !Editor,
     *      hoverTimer: number,             - setTimeout() token
     *      start: !{line, ch},             - start of matched text range
     *      end: !{line, ch},               - end of matched text range
     *      content: !string,               - HTML content to display in popover
     *      onShow: ?function():void,       - called once popover content added to the DOM (may never be called)
     *      xpos: number,                   - x of center of popover
     *      ytop: number,                   - y of top of matched text (when popover placed above text, normally)
     *      ybot: number,                   - y of bottom of matched text (when popover moved below text, avoiding window top)
     *      marker: ?CodeMirror.TextMarker  - only set once visible==true
     * }}
     */
    var popoverState = null;
    
    
    
    // Popover widget management ----------------------------------------------
    
    /**
     * Cancels whatever popoverState was currently pending and sets it back to null. If the popover was visible,
     * hides it; if the popover was invisible and still pending, cancels hoverTimer so it will never be shown.
     */
    function hidePreview() {
        if (!popoverState) {
            return;
        }
        
        if (popoverState.visible) {
            popoverState.marker.clear();
            
            $previewContent.empty();
            $previewContainer.hide();
            
        } else {
            window.clearTimeout(popoverState.hoverTimer);
        }
        
        popoverState = null;
    }
    
    function positionPreview(xpos, ypos, ybot) {
        var previewWidth  = $previewContainer.width(),
            top           = ypos - $previewContainer.height() - POSITION_OFFSET,
            left          = xpos - previewWidth / 2 - POINTER_LEFT_OFFSET,
            $editorHolder = $("#editor-holder"),
            editorLeft    = $editorHolder.offset().left;

        left = Math.max(left, editorLeft + POPOVER_HORZ_MARGIN);
        left = Math.min(left, editorLeft + $editorHolder.width() - previewWidth - POPOVER_HORZ_MARGIN);
        
        if (top < 0) {
            $previewContainer.removeClass("preview-bubble-above");
            $previewContainer.addClass("preview-bubble-below");
            top = ybot + POSITION_BELOW_OFFSET;
            $previewContainer.offset({
                left: left,
                top: top
            });
        } else {
            $previewContainer.removeClass("preview-bubble-below");
            $previewContainer.addClass("preview-bubble-above");
            $previewContainer.offset({
                left: left,
                top: top - POINTER_TOP_OFFSET
            });
        }
    }
    
    /**
     * Changes the current hidden popoverState to visible, showing it in the UI and highlighting
     * its matching text in the editor.
     */
    function showPreview() {
        
        var cm = popoverState.editor._codeMirror;
        popoverState.marker = cm.markText(
            popoverState.start,
            popoverState.end,
            {className: "quick-view-highlight"}
        );
        
        $previewContent.append(popoverState.content);
        $previewContainer.show();
        
        popoverState.visible = true;
        
        if (popoverState.onShow) {
            popoverState.onShow();
        }
        
        positionPreview(popoverState.xpos, popoverState.ytop, popoverState.ybot);
    }
    
    function divContainsMouse($div, event) {
        var offset = $div.offset();
        
        return (event.clientX >= offset.left &&
                event.clientX <= offset.left + $div.width() &&
                event.clientY >= offset.top &&
                event.clientY <= offset.top + $div.height());
    }
    
    
    // Color & gradient preview provider --------------------------------------

    function colorAndGradientPreviewProvider(editor, pos, token, line) {

        // Check for gradient. -webkit-gradient() can have parens in parameters
        // nested 2 levels. Other gradients can only nest 1 level.
        var gradientRegEx = /-webkit-gradient\((?:[^\(]*?(?:\((?:[^\(]*?(?:\([^\)]*?\))*?)*?\))*?)*?\)|(?:(?:-moz-|-ms-|-o-|-webkit-|\s)(linear-gradient)|(?:-moz-|-ms-|-o-|-webkit-)(radial-gradient))(\((?:[^\)]*?(?:\([^\)]*?\))*?)*?\))/gi,
            colorRegEx = new RegExp(ColorUtils.COLOR_REGEX);

        function execGradientMatch(line) {
            var gradientMatch = gradientRegEx.exec(line),
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

                } else {
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
            }

            return {
                match:      gradientMatch,
                prefix:     prefix,
                colorValue: colorValue
            };
        }

        function execColorMatch(line) {
            var colorMatch;

            function hyphenOnMatchBoundary(match, line) {
                var beforeIndex, afterIndex;
                if (match) {
                    beforeIndex = match.index - 1;
                    if (beforeIndex >= 0 && line[beforeIndex] === "-") {
                        return true;
                    } else {
                        afterIndex = match.index + match[0].length;
                        if (afterIndex < line.length && line[afterIndex] === "-") {
                            return true;
                        }
                    }
                }
                
                return false;
            }

            // Hyphens do not count as a regex word boundary (\b), so check for those here
            do {
                colorMatch = colorRegEx.exec(line);
            } while (colorMatch && hyphenOnMatchBoundary(colorMatch, line));

            return colorMatch;
        }

        var gradientMatch = execGradientMatch(line),
            match = gradientMatch.match || execColorMatch(line),
            cm = editor._codeMirror;

        while (match) {
            if (pos.ch >= match.index && pos.ch <= match.index + match[0].length) {
                var previewCSS = gradientMatch.prefix + (gradientMatch.colorValue || match[0]);
                var preview = "<div class='color-swatch' style='background:" + previewCSS + "'>" +
                              "</div>";
                var startPos = {line: pos.line, ch: match.index},
                    endPos = {line: pos.line, ch: match.index + match[0].length},
                    startCoords = cm.charCoords(startPos),
                    xPos;
                
                xPos = (cm.charCoords(endPos).left - startCoords.left) / 2 + startCoords.left;
                
                return {
                    start: startPos,
                    end: endPos,
                    content: preview,
                    xpos: xPos,
                    ytop: startCoords.top,
                    ybot: startCoords.bottom,
                    _previewCSS: previewCSS
                };
            }

            // Get next match
            if (gradientMatch.match) {
                gradientMatch = execGradientMatch(line);
            }
            match = gradientMatch.match || execColorMatch(line);
        }
        
        return null;
    }
    
    
    // Image preview provider -------------------------------------------------
    
    function imagePreviewProvider(editor, pos, token, line) {
        var cm = editor._codeMirror;
        
        // Check for image name
        var urlRegEx = /url\(([^\)]*)\)/gi,
            tokenString,
            urlMatch;

        if (token.type === "string") {
            tokenString = token.string;
        } else {
            urlMatch = urlRegEx.exec(line);
            while (urlMatch) {
                if (pos.ch >= urlMatch.index && pos.ch <= urlMatch.index + urlMatch[0].length) {
                    tokenString = urlMatch[1];
                    break;
                }
                urlMatch = urlRegEx.exec(line);
            }
        }
        
        if (tokenString) {
            // Strip quotes, if present
            var quotesRegEx = /(\'|\")?([^(\'|\")]*)(\'|\")?/;
            tokenString = tokenString.replace(quotesRegEx, "$2");
            
            if (/^(data\:image)|(\.gif|\.png|\.jpg|\.jpeg|\.svg)$/i.test(tokenString)) {
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
                    var coord = cm.charCoords(sPos);
                    var xpos = (cm.charCoords(ePos).left - coord.left) / 2 + coord.left;
                    
                    var showHandler = function () {
                        // Hide the preview container until the image is loaded.
                        $previewContainer.hide();
                        
                        $previewContainer.find(".image-preview > img").on("load", function () {
                            $previewContent
                                .append("<div class='img-size'>"                                            +
                                            this.naturalWidth + " x " + this.naturalHeight + " " + Strings.UNIT_PIXELS +
                                        "</div>"
                                    );
                            $previewContainer.show();
                            positionPreview(popoverState.xpos, popoverState.ytop, popoverState.ybot);
                        });
                    };
                    
                    return {
                        start: sPos,
                        end: ePos,
                        content: imgPreview,
                        onShow: showHandler,
                        xpos: xpos,
                        ytop: coord.top,
                        ybot: coord.bottom,
                        _imgPath: imgPath
                    };
                }
            }
        }
        
        return null;
    }
    

    // Preview hide/show logic ------------------------------------------------
    
    /**
     * Returns a 'ready for use' popover state object:
     * { visible: false, editor, start, end, content, ?onShow, xpos, ytop, ybot }
     * Lacks only hoverTimer (supplied by handleMouseMove()) and marker (supplied by showPreview()).
     */
    function queryPreviewProviders(editor, pos, token) {
        
        var line = editor.document.getLine(pos.line);
        
        // FUTURE: Support plugin providers. For now we just hard-code...
        var popover = colorAndGradientPreviewProvider(editor, pos, token, line) ||
                      imagePreviewProvider(editor, pos, token, line);
        
        if (popover) {
            // Providers return just { start, end, content, ?onShow, xpos, ytop, ybot }
            $.extend(popover, { visible: false, editor: editor });
            
            return popover;
        }
        return null;
    }
    
    
    function handleMouseMove(event) {
        if (!enabled) {
            return;
        }
        
        if (event.which) {
            // Button is down - don't show popovers while dragging
            hidePreview();
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
            var $inlineDiv = inlines[i].$editorsDiv,  // see MultiRangeInlineEditor
                $otherDiv  = inlines[i].$htmlContent;
            
            if ($inlineDiv && divContainsMouse($inlineDiv, event)) {
                editor = inlines[i].editors[0];
                break;
            } else if ($otherDiv && divContainsMouse($otherDiv, event)) {
                // Mouse inside unsupported inline editor like Quick Docs or Color Editor
                hidePreview();
                return;
            }
        }
        
        // Check main editor
        if (!editor) {
            if (divContainsMouse($(fullEditor.getRootElement()), event)) {
                editor = fullEditor;
            }
        }
        
        if (editor && editor._codeMirror) {
            // Find char mouse is over
            var cm = editor._codeMirror;
            var pos = cm.coordsChar({left: event.clientX, top: event.clientY});
            
            if (lastPos && lastPos.line === pos.line && lastPos.ch === pos.ch) {
                return;  // bail if mouse is on same char as last event
            }
            lastPos = pos;
            
            var showImmediately = false;
            
            // Is there a popover already visible or pending?
            if (popoverState) {
                if (editor.posWithinRange(pos, popoverState.start, popoverState.end)) {
                    // That one's still relevant - nothing more to do
                    return;
                } else {
                    // That one doesn't cover this pos - hide it and query providers anew
                    showImmediately = popoverState.visible;
                    hidePreview();
                }
            }
            
            // Query providers for a new popoverState
            var token = cm.getTokenAt(pos);
            popoverState = queryPreviewProviders(editor, pos, token);
            
            if (popoverState) {
                // We have a popover available - wait until we're ready to show it
                if (showImmediately) {
                    showPreview();
                } else {
                    popoverState.hoverTimer = window.setTimeout(function () {
                        // Ready to show now (we'll never get here if mouse movement rendered this popover
                        // inapplicable first - hidePopover() cancels hoverTimer)
                        showPreview();
                    }, HOVER_DELAY);
                }
            }
            
        } else {
            // Mouse not over any Editor - immediately hide popover
            hidePreview();
        }
    }
    
    function onActiveEditorChange(event, current, previous) {
        // Hide preview when editor changes
        hidePreview();

        if (previous && previous.document) {
            $(previous.document).off("change", hidePreview);
        }

        if (current && current.document) {
            $(current.document).on("change", hidePreview);
        }
    }

    // Menu command handlers
    function updateMenuItemCheckmark() {
        CommandManager.get(CMD_ENABLE_QUICK_VIEW).setChecked(enabled);
    }

    function setEnabled(_enabled) {
        if (enabled !== _enabled) {
            enabled = _enabled;
            var editorHolder = $("#editor-holder")[0];
            if (enabled) {
                // Note: listening to "scroll" also catches text edits, which bubble a scroll event up from the hidden text area. This means
                // we auto-hide on text edit, which is probably actually a good thing.
                editorHolder.addEventListener("mousemove", handleMouseMove, true);
                editorHolder.addEventListener("scroll", hidePreview, true);
                editorHolder.addEventListener("mouseout", hidePreview, true);

                // Setup doc "change" listener
                onActiveEditorChange(null, EditorManager.getActiveEditor(), null);
                $(EditorManager).on("activeEditorChange", onActiveEditorChange);

            } else {
                editorHolder.removeEventListener("mousemove", handleMouseMove, true);
                editorHolder.removeEventListener("scroll", hidePreview, true);
                editorHolder.removeEventListener("mouseout", hidePreview, true);

                // Cleanup doc "change" listener
                onActiveEditorChange(null, null, EditorManager.getActiveEditor());
                $(EditorManager).off("activeEditorChange", onActiveEditorChange);

                hidePreview();
            }
            prefs.setValue("enabled", enabled);
        }
        // Always update the checkmark, even if the enabled flag hasn't changed.
        updateMenuItemCheckmark();
    }
    
    function toggleEnableQuickView() {
        setEnabled(!enabled);
    }
        
    // Create the preview container
    $previewContainer = $(previewContainerHTML).appendTo($("body"));
    $previewContent = $previewContainer.find(".preview-content");
    
    // Load our stylesheet
    ExtensionUtils.loadStyleSheet(module, "QuickView.css");
    
    // Register command
    CommandManager.register(Strings.CMD_ENABLE_QUICK_VIEW, CMD_ENABLE_QUICK_VIEW, toggleEnableQuickView);
    Menus.getMenu(Menus.AppMenuBar.VIEW_MENU).addMenuItem(CMD_ENABLE_QUICK_VIEW);
    
    // Init PreferenceStorage
    prefs = PreferencesManager.getPreferenceStorage(module, defaultPrefs);

    // Setup initial UI state
    setEnabled(prefs.getValue("enabled"));

    AppInit.appReady(function () {
        if (brackets.test) {
            brackets.test.extensions.QuickView = module.exports;
        }
    });
    
    // For unit testing
    exports._queryPreviewProviders  = queryPreviewProviders;
    exports._forceShow              = function (popover) {
        hidePreview();
        popoverState = popover;
        showPreview();
    };
});
