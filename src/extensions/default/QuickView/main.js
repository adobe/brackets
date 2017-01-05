/*
 * Copyright (c) 2013 - present Adobe Systems Incorporated. All rights reserved.
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

/*jslint regexp: true */

define(function (require, exports, module) {
    "use strict";

    // Brackets modules
    var ColorUtils          = brackets.getModule("utils/ColorUtils"),
        CommandManager      = brackets.getModule("command/CommandManager"),
        Commands            = brackets.getModule("command/Commands"),
        CSSUtils            = brackets.getModule("language/CSSUtils"),
        EditorManager       = brackets.getModule("editor/EditorManager"),
        ExtensionUtils      = brackets.getModule("utils/ExtensionUtils"),
        FileUtils           = brackets.getModule("file/FileUtils"),
        Menus               = brackets.getModule("command/Menus"),
        PreferencesManager  = brackets.getModule("preferences/PreferencesManager"),
        LanguageManager     = brackets.getModule("language/LanguageManager"),
        Strings             = brackets.getModule("strings"),
        ViewUtils           = brackets.getModule("utils/ViewUtils"),
        TokenUtils          = brackets.getModule("utils/TokenUtils"),
        PathUtils           = brackets.getModule("thirdparty/path-utils/path-utils");

    var previewContainerHTML       = require("text!QuickViewTemplate.html");

    var enabled,                             // Only show preview if true
        prefs                      = null,   // Preferences
        $previewContainer,                   // Preview container
        $previewContent,                     // Preview content holder
        lastMousePos,                        // Last mouse position
        animationRequest,                    // Request for animation frame
        extensionlessImagePreview;           // Whether to try and preview extensionless URLs

    // Constants
    var CMD_ENABLE_QUICK_VIEW       = "view.enableQuickView",
        HOVER_DELAY                 = 350,  // Time (ms) mouse must remain over a provider's matched text before popover appears
        POINTER_HEIGHT              = 15,   // Pointer height, used to shift popover above pointer (plus a little bit of space)
        POPOVER_HORZ_MARGIN         =  5;   // Horizontal margin

    var styleLanguages = ["css", "text/x-less", "sass", "text/x-scss", "stylus"];

    // List of protocols which we will support for image preview urls
    var validProtocols = ["data:", "http:", "https:", "ftp:", "file:"];

    prefs = PreferencesManager.getExtensionPrefs("quickview");
    prefs.definePreference("enabled", "boolean", true, {
        description: Strings.DESCRIPTION_QUICK_VIEW_ENABLED
    });

    // Whether or not to try and show image previews for URLs missing extensions
    // (e.g., https://avatars2.githubusercontent.com/u/476009?v=3&s=200)
    prefs.definePreference("extensionlessImagePreview", "boolean", true, {
        description: Strings.DESCRIPTION_EXTENSION_LESS_IMAGE_PREVIEW
    });

    /**
     * There are three states for this var:
     * 1. If null, there is no provider result for the given mouse position.
     * 2. If non-null, and visible==true, there is a popover currently showing.
     * 3. If non-null, but visible==false, we're waiting for HOVER_DELAY, which
     *    is tracked by hoverTimer. The state changes to visible==true as soon as
     *    there is a provider. If the mouse moves before then, timer is restarted.
     *
     * @type {{
     *      visible: boolean,
     *      editor: !Editor,
     *      hoverTimer: number,             - setTimeout() token
     *      start: !{line, ch},             - start of matched text range
     *      end: !{line, ch},               - end of matched text range
     *      content: !string,               - HTML content to display in popover
     *      onShow: ?function():void,       - called once popover content added to the DOM (may never be called)
     *        - if specified, must call positionPreview()
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
            $previewContainer.removeClass("active");
        } else {
            window.clearTimeout(popoverState.hoverTimer);
        }
        popoverState = null;
    }

    function positionPreview(editor, xpos, ypos, ybot) {
        var previewWidth  = $previewContainer.outerWidth(),
            top           = ypos - $previewContainer.outerHeight() - POINTER_HEIGHT,
            left          = xpos - previewWidth / 2,
            elementRect = {
                top:    top,
                left:   left - POPOVER_HORZ_MARGIN,
                height: $previewContainer.outerHeight() + POINTER_HEIGHT,
                width:  previewWidth + 2 * POPOVER_HORZ_MARGIN
            },
            clip = ViewUtils.getElementClipSize($(editor.getRootElement()), elementRect);

        // Prevent horizontal clipping
        if (clip.left > 0) {
            left += clip.left;
        } else if (clip.right > 0) {
            left -= clip.right;
        }

        // If clipped on top, flip popover below line
        if (clip.top > 0) {
            top = ybot + POINTER_HEIGHT;
            $previewContainer
                .removeClass("preview-bubble-above")
                .addClass("preview-bubble-below");
        } else {
            $previewContainer
                .removeClass("preview-bubble-below")
                .addClass("preview-bubble-above");
        }

        $previewContainer
            .css({
                left: left,
                top: top
            })
            .addClass("active");
    }

    function divContainsMouse($div, mousePos) {
        var offset = $div.offset();

        return (mousePos.clientX >= offset.left &&
                mousePos.clientX <= offset.left + $div.width() &&
                mousePos.clientY >= offset.top &&
                mousePos.clientY <= offset.top + $div.height());
    }


    // Color & gradient preview provider --------------------------------------

    function colorAndGradientPreviewProvider(editor, pos, token, line) {

        // Check for gradient. -webkit-gradient() can have parens in parameters
        // nested 2 levels. Other gradients can only nest 1 level.
        var gradientRegEx = /-webkit-gradient\((?:[^\(]*?(?:\((?:[^\(]*?(?:\([^\)]*?\))*?)*?\))*?)*?\)|(?:(?:-moz-|-ms-|-o-|-webkit-|:|\s)((repeating-)?linear-gradient)|(?:-moz-|-ms-|-o-|-webkit-|:|\s)((repeating-)?radial-gradient))(\((?:[^\)]*?(?:\([^\)]*?\))*?)*?\))/gi,
            colorRegEx    = new RegExp(ColorUtils.COLOR_REGEX),
            mode          = TokenUtils.getModeAt(editor._codeMirror, pos, false),
            isStyleSheet  = (styleLanguages.indexOf(mode) !== -1);

        function areParensBalanced(str) {
            var i,
                nestLevel = 0,
                len;

            if (isStyleSheet) {
                // Remove comments & strings from style sheets
                str = CSSUtils.reduceStyleSheetForRegExParsing(str);
            }
            len = str.length;

            for (i = 0; i < len; i++) {
                switch (str[i]) {
                case "(":
                    nestLevel++;
                    break;
                case ")":
                    nestLevel--;
                    break;
                case "\\":
                    i++;    // next char is escaped, so skip it
                    break;
                }
            }

            // if parens are balanced, nest level will be 0
            return (nestLevel === 0);
        }

        function execGradientMatch(line, parensBalanced) {
            // Unbalanced parens cause infinite loop (see issue #4650)
            var gradientMatch = (parensBalanced ? gradientRegEx.exec(line) : null),
                prefix = "",
                colorValue;

            if (gradientMatch) {
                if (gradientMatch[0].indexOf("@") !== -1) {
                    // If the gradient match has "@" in it, it is most likely a less or
                    // sass variable. Ignore it since it won't be displayed correctly.
                    gradientMatch = null;

                } else {
                    // If it was a linear-gradient or radial-gradient variant with a vendor prefix
                    // add "-webkit-" so it shows up correctly in Brackets.
                    if (gradientMatch[0].match(/-o-|-moz-|-ms-|-webkit-/i)) {
                        prefix = "-webkit-";
                    }

                    // For prefixed gradients, use the non-prefixed value as the color value.
                    // "-webkit-" will be added before this value later
                    if (gradientMatch[1]) {
                        colorValue = gradientMatch[1] + gradientMatch[5];    // linear gradiant
                    } else if (gradientMatch[3]) {
                        colorValue = gradientMatch[3] + gradientMatch[5];    // radial gradiant
                    } else if (gradientMatch[0]) {
                        colorValue = gradientMatch[0];                       // -webkit-gradient
                        prefix = "";                                         // do not prefix
                    }
                }
            }

            return {
                match:      gradientMatch,
                prefix:     prefix,
                colorValue: colorValue
            };
        }

        function execColorMatch(editor, line, pos) {
            var colorMatch,
                ignoreNamedColors;

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
            function isNamedColor(match) {
                if (match && match[0] && /^[a-z]+$/i.test(match[0])) { // only for color names, not for hex-/rgb-values
                    return true;
                }
            }

            // Hyphens do not count as a regex word boundary (\b), so check for those here
            do {
                colorMatch = colorRegEx.exec(line);
                if (!colorMatch) {
                    break;
                }
                if (ignoreNamedColors === undefined) {
                    var mode = TokenUtils.getModeAt(editor._codeMirror, pos, false).name;
                    ignoreNamedColors = styleLanguages.indexOf(mode) === -1;
                }
            } while (hyphenOnMatchBoundary(colorMatch, line) ||
                    (ignoreNamedColors && isNamedColor(colorMatch)));

            return colorMatch;
        }

        // simple css property splitter (used to find color stop arguments in gradients)
        function splitStyleProperty(property) {
            var token = /((?:[^"']|".*?"|'.*?')*?)([(,)]|$)/g;
            var recurse = function () {
                var array = [];
                for (;;) {
                    var result = token.exec(property);
                    if (result[2] === "(") {
                        var str = result[1].trim() + "(" + recurse().join(",") + ")";
                        result = token.exec(property);
                        str += result[1];
                        array.push(str);
                    } else {
                        array.push(result[1].trim());
                    }
                    if (result[2] !== ",") {
                        return array;
                    }
                }
            };
            return (recurse());
        }

        // color stop helpers
        function isGradientColorStop(args) {
            return (args.length > 0 && args[0].match(colorRegEx) !== null);
        }

        function hasLengthInPixels(args) {
            return (args.length > 1 && args[1].indexOf("px") > 0);
        }

        // Normalizes px color stops to %
        function normalizeGradientExpressionForQuickview(expression) {
            if (expression.indexOf("px") > 0) {
                var paramStart = expression.indexOf("(") + 1,
                    paramEnd = expression.lastIndexOf(")"),
                    parameters = expression.substring(paramStart, paramEnd),
                    params = splitStyleProperty(parameters),
                    lowerBound = 0,
                    upperBound = $previewContainer.width(),
                    args,
                    thisSize,
                    i;

                // find lower bound
                for (i = 0; i < params.length; i++) {
                    args = params[i].split(" ");

                    if (hasLengthInPixels(args)) {
                        thisSize = parseFloat(args[1]);

                        upperBound = Math.max(upperBound, thisSize);
                        // we really only care about converting negative
                        //  pixel values -- so take the smallest negative pixel
                        //  value and use that as baseline for display purposes
                        if (thisSize < 0) {
                            lowerBound = Math.min(lowerBound, thisSize);
                        }
                    }
                }

                // convert negative lower bound to positive and adjust all pixel values
                //  so that -20px is now 0px and 100px is now 120px
                lowerBound = Math.abs(lowerBound);

                // Offset the upperbound by the lowerBound to give us a corrected context
                upperBound += lowerBound;

                // convert to %
                for (i = 0; i < params.length; i++) {
                    args = params[i].split(" ");
                    if (isGradientColorStop(args) && hasLengthInPixels(args)) {
                        if (upperBound === 0) {
                            thisSize = 0;
                        } else {
                            thisSize = ((parseFloat(args[1]) + lowerBound) / upperBound) * 100;
                        }
                        args[1] = thisSize + "%";
                    }
                    params[i] = args.join(" ");
                }

                // put it back together.
                expression = expression.substring(0, paramStart) + params.join(", ") + expression.substring(paramEnd);
            }
            return expression;
        }

        var parensBalanced = areParensBalanced(line),
            gradientMatch = execGradientMatch(line, parensBalanced),
            match = gradientMatch.match || execColorMatch(editor, line, pos),
            cm = editor._codeMirror;

        while (match) {
            if (pos.ch < match.index) {
                // Gradients are matched first, then colors, so...
                if (gradientMatch.match) {
                    // ... gradient match is past cursor -- stop looking for gradients, start searching for colors
                    gradientMatch = { match: null, prefix: "", colorValue: null };
                } else {
                    // ... color match is past cursor -- stop looping
                    break;
                }
            } else if (pos.ch <= match.index + match[0].length) {
                // build the css for previewing the gradient from the regex result
                var previewCSS = gradientMatch.prefix + (gradientMatch.colorValue || match[0]);

                // normalize the arguments to something that we can display to the user
                // NOTE: we need both the div and the popover's _previewCSS member
                //          (used by unit tests) to match so normalize the css for both
                previewCSS = normalizeGradientExpressionForQuickview(previewCSS);

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
                gradientMatch = execGradientMatch(line, parensBalanced);
            }
            match = gradientMatch.match || execColorMatch(editor, line, pos);
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
                if (pos.ch < urlMatch.index) {
                    // match is past cursor, so stop looping
                    break;
                } else if (pos.ch <= urlMatch.index + urlMatch[0].length) {
                    tokenString = urlMatch[1];
                    break;
                }
                urlMatch = urlRegEx.exec(line);
            }
        }

        if (!tokenString) {
            return null;
        }

        // Strip leading/trailing quotes, if present
        tokenString = tokenString.replace(/(^['"])|(['"]$)/g, "");

        var sPos, ePos;
        var docPath = editor.document.file.fullPath;
        var imgPath;

        // Determine whether or not this URL/path is likely to be an image.
        var parsed = PathUtils.parseUrl(tokenString);
        // If the URL has a protocol, check if it's one of the supported protocols
        var hasProtocol = parsed.protocol !== "" && validProtocols.indexOf(parsed.protocol.trim().toLowerCase()) !== -1;
        var ext = parsed.filenameExtension.replace(/^\./, '');
        var language = LanguageManager.getLanguageForExtension(ext);
        var id = language && language.getId();
        var isImage = id === "image" || id === "svg";

        // Use this URL if this is an absolute URL and either points to a
        // filename with a known image extension, or lacks an extension (e.g.,
        // a web service that returns an image). Honour the extensionlessImagePreview
        // preference as well in the latter case.
        if (hasProtocol && (isImage || (!ext && extensionlessImagePreview))) {
            imgPath = tokenString;
        }
        // Use this filename if this is a path with a known image extension.
        else if (!hasProtocol && isImage) {
            imgPath = "file:///" + FileUtils.getDirectoryPath(docPath) + tokenString;
        }

        if (!imgPath) {
            return null;
        }

        if (urlMatch) {
            sPos = {line: pos.line, ch: urlMatch.index};
            ePos = {line: pos.line, ch: urlMatch.index + urlMatch[0].length};
        } else {
            sPos = {line: pos.line, ch: token.start};
            ePos = {line: pos.line, ch: token.end};
        }

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
                    .append("<div class='img-size'>" +
                                this.naturalWidth + " &times; " + this.naturalHeight + " " + Strings.UNIT_PIXELS +
                            "</div>"
                        );
                $previewContainer.show();
                positionPreview(editor, popoverState.xpos, popoverState.ytop, popoverState.ybot);
            }).on("error", function (e) {
                e.preventDefault();
                hidePreview();
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
            popover.visible = false;
            popover.editor  = editor;
            return popover;
        }

        return null;
    }

    function getHoveredEditor(mousePos) {
        // Figure out which editor we are over
        var fullEditor = EditorManager.getCurrentFullEditor();

        if (!fullEditor || !mousePos) {
            return;
        }

        // Check for inline Editor instances first
        var inlines = fullEditor.getInlineWidgets(),
            i,
            editor;

        for (i = 0; i < inlines.length; i++) {
            var $inlineEditorRoot = inlines[i].editor && $(inlines[i].editor.getRootElement()), // see MultiRangeInlineEditor
                $otherDiv = inlines[i].$htmlContent;

            if ($inlineEditorRoot && divContainsMouse($inlineEditorRoot, mousePos)) {
                editor = inlines[i].editor;
                break;
            } else if ($otherDiv && divContainsMouse($otherDiv, mousePos)) {
                // Mouse inside unsupported inline editor like Quick Docs or Color Editor
                return;
            }
        }

        // Check main editor
        if (!editor) {
            if (divContainsMouse($(fullEditor.getRootElement()), mousePos)) {
                editor = fullEditor;
            }
        }

        return editor;
    }

    /**
     * Changes the current hidden popoverState to visible, showing it in the UI and highlighting
     * its matching text in the editor.
     */
    function showPreview(editor, popover) {
        var token, cm;

        // Figure out which editor we are over
        if (!editor) {
            editor = getHoveredEditor(lastMousePos);
        }

        if (!editor || !editor._codeMirror) {
            hidePreview();
            return;
        }

        cm = editor._codeMirror;

        // Find char mouse is over
        var pos = cm.coordsChar({left: lastMousePos.clientX, top: lastMousePos.clientY});

        // No preview if mouse is past last char on line
        if (pos.ch >= editor.document.getLine(pos.line).length) {
            return;
        }

        if (popover) {
            popoverState = popover;
        } else {
            // Query providers and append to popoverState
            token = TokenUtils.getTokenAt(cm, pos);
            popoverState = $.extend({}, popoverState, queryPreviewProviders(editor, pos, token));
        }

        if (popoverState && popoverState.start && popoverState.end) {
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
            } else {
                positionPreview(editor, popoverState.xpos, popoverState.ytop, popoverState.ybot);
            }
        }
    }

    function processMouseMove() {
        animationRequest = null;

        if (!lastMousePos) {
            return;         // should never get here, but safety first!
        }

        var showImmediately = false,
            editor = null;

        if (popoverState && popoverState.visible) {
            // Only figure out which editor we are over when there is already a popover
            // showing (otherwise wait until after delay to minimize processing)
            editor = getHoveredEditor(lastMousePos);
            if (editor && editor._codeMirror) {
                // Find char mouse is over
                var cm = editor._codeMirror,
                    pos = cm.coordsChar({left: lastMousePos.clientX, top: lastMousePos.clientY});

                if (popoverState.start && popoverState.end &&
                        editor.posWithinRange(pos, popoverState.start, popoverState.end, true) &&
                        (pos.ch < editor.document.getLine(pos.line).length)) {

                    // That one's still relevant - nothing more to do
                    // Note: posWithinRange() includes mouse past end of line, so need to check for that case
                    return;
                }
            }

            // That one doesn't cover this pos - hide it and start anew
            showImmediately = true;
        }

        // Initialize popoverState
        hidePreview();
        popoverState = {};

        // Set timer to scan and show. This will get cancelled (in hidePreview())
        // if mouse movement rendered this popover inapplicable before timer fires.
        // When showing "immediately", still use setTimeout() to make this async
        // so we return from this mousemove event handler ASAP.
        popoverState.hoverTimer = window.setTimeout(function () {
            showPreview(editor);
        }, showImmediately ? 0 : HOVER_DELAY);
    }

    function handleMouseMove(event) {
        lastMousePos = null;

        if (!enabled) {
            return;
        }

        if (event.which) {
            // Button is down - don't show popovers while dragging
            hidePreview();
            return;
        }

        // Keep track of last mouse position
        lastMousePos = {
            clientX: event.clientX,
            clientY: event.clientY
        };

        // Prevent duplicate animation frame requests
        if (!animationRequest) {
            animationRequest = window.requestAnimationFrame(processMouseMove);
        }
    }

    function onActiveEditorChange(event, current, previous) {
        // Hide preview when editor changes
        hidePreview();

        if (previous && previous.document) {
            previous.document.off("change", hidePreview);
        }

        if (current && current.document) {
            current.document.on("change", hidePreview);
        }
    }

    // Menu command handlers
    function updateMenuItemCheckmark() {
        CommandManager.get(CMD_ENABLE_QUICK_VIEW).setChecked(enabled);
    }

    function setExtensionlessImagePreview(_extensionlessImagePreview, doNotSave) {
        if (extensionlessImagePreview !== _extensionlessImagePreview) {
            extensionlessImagePreview = _extensionlessImagePreview;
            if (!doNotSave) {
                prefs.set("extensionlessImagePreview", enabled);
                prefs.save();
            }
        }
    }

    function setEnabled(_enabled, doNotSave) {
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
                EditorManager.on("activeEditorChange", onActiveEditorChange);

            } else {
                editorHolder.removeEventListener("mousemove", handleMouseMove, true);
                editorHolder.removeEventListener("scroll", hidePreview, true);
                editorHolder.removeEventListener("mouseout", hidePreview, true);

                // Cleanup doc "change" listener
                onActiveEditorChange(null, null, EditorManager.getActiveEditor());
                EditorManager.off("activeEditorChange", onActiveEditorChange);

                hidePreview();
            }
            if (!doNotSave) {
                prefs.set("enabled", enabled);
                prefs.save();
            }
        }
        // Always update the checkmark, even if the enabled flag hasn't changed.
        updateMenuItemCheckmark();
    }

    function toggleEnableQuickView() {
        setEnabled(!enabled);
    }

    function _forceShow(popover) {
        hidePreview();
        lastMousePos = {
            clientX: popover.xpos,
            clientY: Math.floor((popover.ybot + popover.ytop) / 2)
        };
        showPreview(popover.editor, popover);
    }

    // Create the preview container
    $previewContainer = $(previewContainerHTML).appendTo($("body"));
    $previewContent = $previewContainer.find(".preview-content");

    // Load our stylesheet
    ExtensionUtils.loadStyleSheet(module, "QuickView.less");

    // Register command
    // Insert menu at specific pos since this may load before OR after code folding extension
    CommandManager.register(Strings.CMD_ENABLE_QUICK_VIEW, CMD_ENABLE_QUICK_VIEW, toggleEnableQuickView);
    Menus.getMenu(Menus.AppMenuBar.VIEW_MENU).addMenuItem(CMD_ENABLE_QUICK_VIEW, null, Menus.AFTER, Commands.VIEW_TOGGLE_INSPECTION);

    // Setup initial UI state
    setEnabled(prefs.get("enabled"), true);
    setExtensionlessImagePreview(prefs.get("extensionlessImagePreview"), true);

    prefs.on("change", "enabled", function () {
        setEnabled(prefs.get("enabled"), true);
    });

    prefs.on("change", "extensionlessImagePreview", function () {
        setExtensionlessImagePreview(prefs.get("extensionlessImagePreview"));
    });

    // For unit testing
    exports._queryPreviewProviders  = queryPreviewProviders;
    exports._forceShow              = _forceShow;
});
