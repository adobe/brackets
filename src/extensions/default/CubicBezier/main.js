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
 */

/*
 * The popover frame was borrowed from Glenn Ruehle's Hover Preview:
 * - https://github.com/gruehle/HoverPreview
 *
 * The bezier canvas and editing code was adapted from Lea Verou's cubic-bezier project:
 * - https://github.com/LeaVerou/cubic-bezier (cubic-bezier.com)
 * 
 * The canvas exceeds the top and bottom of popover so y-value of points can be
 * dragged outside of the 0-1 range.
 * 
 *   . . . . . .
 *   .         .
 *   +---------+
 *   |         |
 *   |         |
 *   |         |
 *   |         |
 *   +---------+ <-- inner popover box has height of 149
 *   .         .
 *   . . . . . . <-- canvas has height of 300 (extra 75 above/below)
 * 
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true,  regexp: true, indent: 4, maxerr: 50 */
/*global define, brackets, $, window, curve, P1, P2, hidePopover */

define(function (require, exports, module) {
    "use strict";

    // Brackets modules
    var CommandManager      = brackets.getModule("command/CommandManager"),
        EditorManager       = brackets.getModule("editor/EditorManager"),
        ExtensionUtils      = brackets.getModule("utils/ExtensionUtils"),
        KeyEvent            = brackets.getModule("utils/KeyEvent"),
        Menus               = brackets.getModule("command/Menus"),
        PreferencesManager  = brackets.getModule("preferences/PreferencesManager");

    var enabled = true,             // only show popover when enabled
        isShowing = false,          // is popover showing?
        prefs,                      // preferences
        previewMark,                // CodeMirror marker highlighting the preview text
        $popoverContainer,          // popover container
        $popover = "",              // popover contents
        cubicBezierCoords = [],     // current cubic-bezier() function params
        activeEditor,               // active editor
        currentMatch,               // current RegExp results
        isMouseDown = false,        // are we dragging?
        animationRequest,           // active anuimation request
        lastLine = -1,              // performance: don't need to research same line
        ctx,                        // canvas context
        bezierCanvas;

    var ENABLE_CUBIC_BEZIER      = "Enable cubic-bezier editor",
        CMD_ENABLE_CUBIC_BEZIER  = "redmunds.enable-cubicbezier.view.menu";
    
    // Functions

    function charCoords(cm, pos) {
        var coords = cm.charCoords(pos);

        // CodeMirror 2 uses x, y, ybot
        // CodeMirror 3 uses left, top, bottom
        // Since this code was written for CodeMirror 2, return
        // a CM2-normalized struct
        return {
            x: coords.x || coords.left,
            y: coords.y || coords.top,
            ybot: coords.ybot || coords.bottom
        };
    }

    // matches returned from  this function must handled in getCubicBezierCoords()
    // return RegExp match array (or null)
    function cubicBezierMatch(str) {
        // First look for cubic-bezier(...)
        var match = str.match(/cubic-bezier\(\s*(\S+)\s*,\s*(\S+)\s*,\s*(\S+)\s*,\s*(\S+)\s*\)/);
        if (match) {
            return match;
        }

        // Next look for the ease functions (which are special cases of cubic-bezier())
        // Start with a syntax verifying search
        match = str.match(/[: ,]ease(-in-out|-in|-out|)[ ,;]/);
        if (match) {
            // return exact match to keyword that we need for later replacement
            return str.match(/ease(-in-out|-in|-out)?/);
        }

        // Final case is linear. The linear keyword can occur in other values,
        // so we only detect when it's on same line as "transition"
        match = str.match(/transition.*?[: ,]linear[ ,;]/);
        if (match) {
            // return exact match to keyword that we need for later replacement
            return str.match(/linear/);
        }

        return null;
    }

    // handle all matches returned from cubicBezierMatch()
    // return array of coords
    function getCubicBezierCoords(match) {

        if (match[0].match(/^cubic-bezier/)) {
            // cubic-bezier()
            return match.slice(1, 5);
        } else {
            // handle special cases of cubic-bezier calls
            switch (match[0]) {
            case "linear":
                return [ 0, 0, 1, 1 ];
            case "ease":
                return [ 0.25, 0.1, 0.25, 1 ];
            case "ease-in":
                return [ 0.42, 0, 1, 1 ];
            case "ease-out":
                return [ 0, 0, 0.58, 1 ];
            case "ease-in-out":
                return [ 0.42, 0, 0.58, 1 ];
            }
        }

        console.log("brackets-cubic-bezier: getCubicBezierCoords() passed invalid RegExp match array");
        return [ 0, 0, 0, 0 ];
    }

    function getCurveBoundingBox() {
        var $canvas = $popoverContainer.find("#curve"),
            canvasOffset = $canvas.offset();

        return {
            left:    canvasOffset.left,
            top:     canvasOffset.top,
            width:   $canvas.width(),
            height:  $canvas.height()
        };
    }

    function updateCode() {
        var startPos,
            endPos,
            sel,
            str;

        if (!activeEditor || !currentMatch) {
            return;
        }

        sel = activeEditor.getSelection();
        if (previewMark) {
            // get startPos/endPos from previewMark
            startPos = $.extend(true, {}, sel.start);
            endPos   = $.extend(true, {}, sel.end);

            // clear old preview
            previewMark.clear();
            previewMark = null;
        } else {
            // change selection and mark text on first edit to point
            startPos = {
                line: sel.start.line,
                ch: currentMatch.lineOffset + currentMatch.index
            };
            endPos = {
                line: sel.start.line,
                ch: currentMatch.lineOffset + currentMatch.index + currentMatch[0].length
            };
        }

        // Make edit
        str = "cubic-bezier(" +
              cubicBezierCoords[0] + ", " +
              cubicBezierCoords[1] + ", " +
              cubicBezierCoords[2] + ", " +
              cubicBezierCoords[3] + ")";
        activeEditor.document.replaceRange(str, startPos, endPos);

        // select range
        endPos.ch = startPos.ch + str.length;
        activeEditor.setSelection(startPos, endPos);
        
        // previewMark
        var options = {};
        options.className = "cubic-bezier-highlight";
        previewMark = activeEditor._codeMirror.markText(startPos, endPos, options);
    }

    // From cubic-bezier.js
    function CubicBezier(coordinates) {
        if (typeof coordinates === "string") {
            this.coordinates = coordinates.split(",");
        } else {
            this.coordinates = coordinates;
        }

        if (!this.coordinates) {
            throw "No offsets were defined";
        }

        this.coordinates = this.coordinates.map(function (n) { return +n; });

        var i;
        for (i = 3; i >= 0; i--) {
            var xy = this.coordinates[i];
            if (isNaN(xy) || (((i % 2) === 0) && (xy < 0 || xy > 1))) {
                throw "Wrong coordinate at " + i + "(" + xy + ")";
            }
        }
    }

    function BezierCanvas(canvas, bezier, padding) {
        this.canvas  = canvas;
        this.bezier  = bezier;
        this.padding = this.getPadding(padding);

        // Convert to a cartesian coordinate system with axes from 0 to 1
        var ctx = this.canvas.getContext("2d"),
            p = this.padding;

        ctx.scale(canvas.width * (1 - p[1] - p[3]), -canvas.height * 0.5 * (1 - p[0] - p[2]));
        ctx.translate(p[3] / (1 - p[1] - p[3]), (-1 - p[0] / (1 - p[0] - p[2])) - 0.5);
    }

    BezierCanvas.prototype = {
        getOffsets: function () {
            var p = this.padding,
                w = this.canvas.width,
                h = this.canvas.height * 0.5;

            return [{
                left: w * (this.bezier.coordinates[0]     * (1 - p[3] - p[1]) - p[3]) + "px",
                top:  h * (1 - this.bezier.coordinates[1] * (1 - p[0] - p[2]) - p[0]) + "px"
            }, {
                left: w * (this.bezier.coordinates[2]     * (1 - p[3] - p[1]) - p[3]) + "px",
                top:  h * (1 - this.bezier.coordinates[3] * (1 - p[0] - p[2]) - p[0]) + "px"
            }];
        },

        // round off to hundreths place, strip leading zero
        prettify: function (v) {
            return (Math.round(v * 100) / 100).toString().replace(/^0\./, ".");
        },

        offsetsToCoordinates: function (element) {
            var p = this.padding,
                w = this.canvas.width,
                h = this.canvas.height * 0.5,
                x,
                y;

            // Convert padding percentage to actual padding
            p = p.map(function (a, i) {
                return a * ((i % 2) ? w : h);
            });

            return [
                this.prettify((parseInt($(element).css("left"), 10)    - p[3]) / (w + p[1] + p[3])),
                this.prettify((h - parseInt($(element).css("top"), 10) - p[2]) / (h - p[0] - p[2]))
            ];
        },

        plot: function (settings) {
            var xy = this.bezier.coordinates,
                ctx = this.canvas.getContext("2d"),
                setting;

            var defaultSettings = {
                handleColor: "rgba(0,0,0,.6)",
                handleThickness: 0.008,
                vBorderThickness: 0.02,
                hBorderThickness: 0.01,
                bezierColor: "rgb(128,128,128)",
                bezierThickness: 0.02
            };

            settings = settings || {};

            for (setting in defaultSettings) {
                if (defaultSettings.hasOwnProperty(setting)) {
                    if (!settings.hasOwnProperty(setting)) {
                        settings[setting] = defaultSettings[setting];
                    }
                }
            }

            ctx.clearRect(-0.5, -0.5, 2, 2);

            // Draw control handles
            ctx.beginPath();
            ctx.fillStyle = settings.handleColor;
            ctx.lineWidth = settings.handleThickness;
            ctx.strokeStyle = settings.handleColor;

            ctx.moveTo(0, 0);
            ctx.lineTo(xy[0], xy[1]);
            ctx.moveTo(1, 1);
            ctx.lineTo(xy[2], xy[3]);

            ctx.stroke();
            ctx.closePath();

            ctx.beginPath();
            ctx.arc(xy[0], xy[1], 1.5 * settings.handleThickness, 0, 2 * Math.PI, false);
            ctx.closePath();

            ctx.fill();

            ctx.beginPath();
            ctx.arc(xy[2], xy[3], 1.5 * settings.handleThickness, 0, 2 * Math.PI, false);
            ctx.closePath();

            ctx.fill();

            // Draw bezier curve
            ctx.beginPath();
            ctx.lineWidth = settings.bezierThickness;
            ctx.strokeStyle = settings.bezierColor;
            ctx.moveTo(0, 0);
            ctx.bezierCurveTo(xy[0], xy[1], xy[2], xy[3], 1, 1);
            ctx.stroke();
            ctx.closePath();
        },

        getPadding: function (padding) {
            var p = (typeof padding === "number") ? [padding] : padding;

            if (p.length === 1) {
                p[1] = p[0];
            }
            if (p.length === 2) {
                p[2] = p[0];
            }
            if (p.length === 3) {
                p[3] = p[1];
            }

            return p;
        }
    };

    function updateCanvas() {
        // collect data, build model
        if (cubicBezierCoords) {
            bezierCanvas.bezier = window.bezier = new CubicBezier(cubicBezierCoords);

            var offsets = bezierCanvas.getOffsets();

            $(P1).css({
                left: offsets[0].left,
                top:  offsets[0].top
            });
            $(P2).css({
                left: offsets[1].left,
                top:  offsets[1].top
            });

            bezierCanvas.plot();
        }
    }
    
    // Event handlers

    function mouseMoveRedraw() {
        if (!isMouseDown) {
            animationRequest = null;
            return;
        }

        updateCanvas();

        animationRequest = window.webkitRequestAnimationFrame(mouseMoveRedraw);
    }

    // Make the handles draggable
    function pointMouseDown(e) {
        var self = e.target;
        isMouseDown = true;

        function pointMouseMove(e) {
            var x = e.pageX,
                y = e.pageY,
                curveBoundingBox = getCurveBoundingBox(),
                left = curveBoundingBox.left,
                top  = curveBoundingBox.top;

            if (x === 0 && y === 0) {
                return;
            }

            // Constrain time (x-axis) to 0 to 1 range. Progression (y-axis) is
            // theoretically not constrained, although canvas to drawing curve is
            // arbitrarily constrained to -0.5 to 1.5 range.
            x = Math.min(Math.max(left, x), left + curveBoundingBox.width);

            $(self).css({
                left: x - left     + "px",
                top:  y - top - 75 + "px"
            });

            // update coords
            cubicBezierCoords = bezierCanvas
                .offsetsToCoordinates(P1)
                .concat(bezierCanvas.offsetsToCoordinates(P2));

            if (!animationRequest) {
                animationRequest = window.webkitRequestAnimationFrame(mouseMoveRedraw);
            }
        }

        function pointMouseUp() {
            self.focus();
            isMouseDown = false;

            updateCode();
            updateCanvas();

            self.removeEventListener("mousemove", pointMouseMove, true);
            self.removeEventListener("mouseup",   pointMouseUp,   true);
        }

        self.addEventListener("mousemove", pointMouseMove, true);
        self.addEventListener("mouseup",   pointMouseUp,   true);
    }

    function pointKeyDown(event) {
        var code = event.keyCode;

        if (code >= KeyEvent.DOM_VK_LEFT && code <= KeyEvent.DOM_VK_DOWN) {
            event.preventDefault();

            // Arrow keys pressed
            var $this = $(event.target),
                left = parseInt($this.css("left"), 10),
                top  = parseInt($this.css("top"), 10),
                offset = (event.shiftKey ? 20 : 2);

            switch (code) {
            case KeyEvent.DOM_VK_LEFT:
                $this.css({ left: left - offset + "px" });
                break;
            case KeyEvent.DOM_VK_UP:
                $this.css({ top: top - offset + "px" });
                break;
            case KeyEvent.DOM_VK_RIGHT:
                $this.css({ left: left + offset + "px" });
                break;
            case KeyEvent.DOM_VK_DOWN:
                $this.css({ top: top + offset + "px" });
                break;
            }

            // update coords
            cubicBezierCoords = bezierCanvas
                .offsetsToCoordinates(P1)
                .concat(bezierCanvas.offsetsToCoordinates(P2));

            updateCode();
            updateCanvas();

            return false;

        } else if (event.keyCode === KeyEvent.DOM_VK_ESCAPE) {
            hidePopover();
            event.preventDefault();
            if (activeEditor) {
                activeEditor.focus();
            }
        }
    }

    function curveClick(event) {
        var curveBoundingBox = getCurveBoundingBox(),
            left = curveBoundingBox.left,
            top  = curveBoundingBox.top,
            x    = event.pageX - left,
            y    = event.pageY - top - 75,
            $P1  = $(P1),
            $P2  = $(P2);

        // Y-value of points can be *dragged* outside of 0-1 range, or adjusted
        // with keyboard, but disallow clicking outside 0-1 range. This is because
        // UI gives no visual range for this, and user most likely wants to change
        // selection in editor.
        if (y < 0 || y > 149) {
            return;
        }

        function distance(x1, y1, x2, y2) {
            return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
        }

        // Find which point is closer
        var distP1 = distance(x, y, parseInt($P1.css("left"), 10), parseInt($P1.css("top"), 10)),
            distP2 = distance(x, y, parseInt($P2.css("left"), 10), parseInt($P2.css("top"), 10)),
            $P     = (distP1 < distP2) ? $P1 : $P2;

        $P.css({
            left: x + "px",
            top:  y + "px"
        });

        // update coords
        cubicBezierCoords = bezierCanvas
            .offsetsToCoordinates(P1)
            .concat(bezierCanvas.offsetsToCoordinates(P2));

        updateCode();
        updateCanvas();
    }

    function curveMouseMove(event) {
        var self = event.target,
            curveBoundingBox = getCurveBoundingBox(),
            left   = curveBoundingBox.left,
            top    = curveBoundingBox.top,
            height = curveBoundingBox.height,
            x = event.pageX - left,
            y = event.pageY - top - 75;

        self.parentNode.setAttribute("data-time", Math.round(100 * x / curveBoundingBox.width));
        self.parentNode.setAttribute("data-progression", Math.round(100 * (3 * height / 4 - y) / (height * 0.5) - 50));
    }

    function hidePopover() {
        if (previewMark) {
            previewMark.clear();
            previewMark = null;
        }

        $popoverContainer.hide();
        isShowing = false;

        curve.removeEventListener("click", curveClick, true);
        curve.removeEventListener("mousemove", curveMouseMove, true);
        P1.removeEventListener("mousedown", pointMouseDown, true);
        P2.removeEventListener("mousedown", pointMouseDown, true);
        P1.removeEventListener("keydown", pointKeyDown, true);
        P2.removeEventListener("keydown", pointKeyDown, true);
    }

    // When scrolling, resizing, etc. hide, but clear lastLine
    // so it shows again on current line
    function temporaryHidePopover() {
        hidePopover();
        lastLine = -1;
    }

    function positionPopover(xpos, ypos) {
        // Do not reposition popover when dragging point with mouse
        if (!isMouseDown) {
            var isPopoverAbove = true,
                newLeft   = xpos - $popoverContainer.width() / 2 - 10,
                newTop    = ypos - $popoverContainer.height() - 38,
                oldOffset = $popoverContainer.offset();

            if (newTop < 100) {
                isPopoverAbove = false;
                newTop = ypos + 38;
            }

            // When editing, the width of resulting code can change, especially
            // when converting special case (e.g. "ease") to cubic-bezier().
            // This can cause position of popover to move, which is disconcerting
            // when editing. So, only reposition if line (i.e. top) has changed
            // or if x position changed by more than 100px.
            if (newTop !== oldOffset.top || Math.abs(newLeft - oldOffset.left) > 100) {
                $popoverContainer.offset({ left: newLeft, top:  newTop });
            }

            if (isPopoverAbove) {
                $popoverContainer.removeClass("popoverBelow");
                $popoverContainer.addClass("popoverAbove");
            } else {
                $popoverContainer.removeClass("popoverAbove");
                $popoverContainer.addClass("popoverBelow");
            }
        }
    }

    function showPopover(xpos, ypos) {
        hidePopover();

        // redraw canvas
        updateCanvas();

        $popoverContainer.show();
        isShowing = true;

        positionPopover(xpos, ypos);

        curve.addEventListener("click", curveClick, true);
        curve.addEventListener("mousemove", curveMouseMove, true);
        P1.addEventListener("mousedown", pointMouseDown, true);
        P2.addEventListener("mousedown", pointMouseDown, true);
        P1.addEventListener("keydown", pointKeyDown, true);
        P2.addEventListener("keydown", pointKeyDown, true);
    }

    function queryPopoverProviders(editor, pos) {
        var cm = editor._codeMirror,
            editorWidth = $(editor.getRootElement()).width(),
            line = cm.getLine(pos.line);

        // code runs several matches complicated patterns, multiple times, so
        // first do a quick, simple check to see make sure we may have a match
        if (!line.match(/cubic-bezier|linear|ease/)) {
            hidePopover();
            return;
        }

        currentMatch = cubicBezierMatch(line);

        if (!currentMatch) {
            hidePopover();
            return;
        }
        
        // check for subsequent matches, and use first match after pos
        var lineOffset = 0;
        while (pos.ch > (currentMatch.index + currentMatch[0].length + lineOffset)) {
            var restOfLine = line.substring(currentMatch.index + currentMatch[0].length + lineOffset),
                newMatch = cubicBezierMatch(restOfLine);

            if (newMatch) {
                lineOffset += (currentMatch.index + currentMatch[0].length);
                currentMatch = $.extend(true, [], newMatch);
            } else {
                break;
            }
        }

        currentMatch.lineOffset = lineOffset;

        var startPos = {line: pos.line, ch: lineOffset + currentMatch.index},
            endPos   = {line: pos.line, ch: lineOffset + currentMatch.index + currentMatch[0].length},
            startCoords = charCoords(cm, startPos),
            xPos = (Math.min(charCoords(cm, endPos).x, editorWidth) - startCoords.x) / 2 + startCoords.x;

        // update points
        cubicBezierCoords = getCubicBezierCoords(currentMatch);

        showPopover(xPos, startCoords.y);
    }

    function onSelectionChanged() {
        var sel,
            mode;

        // Figure out which current editor
        if (!enabled || !activeEditor) {
            temporaryHidePopover();
            return;
        }

        sel  = activeEditor.getSelection();
        mode = activeEditor.getModeForSelection();

        // verify we're in CSS markup, and selection does not span multple lines
        if (mode !== "css" || sel.start.line !== sel.end.line) {
            hidePopover();
            return;
        }

        // Performance: if we're not showing, no need to recheck same line
        if (!isShowing && (sel.start.line === lastLine)) {
            return;
        }
        lastLine = sel.start.line;

        queryPopoverProviders(activeEditor, sel.start);
    }

    function onEditorKeyDown(event) {
        if (event.keyCode === KeyEvent.DOM_VK_ESCAPE) {
            hidePopover();
            event.preventDefault();
        }
    }

    function updateMenuItemCheckmark() {
        CommandManager.get(CMD_ENABLE_CUBIC_BEZIER).setChecked(enabled);
    }

    function handleEventListeners(enabled) {
        var editorWindow = $("#editor-holder")[0];
        if (enabled) {
            editorWindow.addEventListener("click", onSelectionChanged, true);
            editorWindow.addEventListener("scroll", temporaryHidePopover, true);
            editorWindow.addEventListener("keydown", onEditorKeyDown, true);
            window.addEventListener("resize", temporaryHidePopover, true);
        } else {
            editorWindow.removeEventListener("click", onSelectionChanged, true);
            editorWindow.removeEventListener("scroll", temporaryHidePopover, true);
            editorWindow.removeEventListener("keydown", onEditorKeyDown, true);
            window.removeEventListener("resize", temporaryHidePopover, true);
        }
    }

    function toggleEnableCubicBezierEditor() {
        enabled = !enabled;
        prefs.setValue("enabled", enabled);
        updateMenuItemCheckmark();

        if (enabled) {
            lastLine = -1;
        }
        
        handleEventListeners(enabled);
        onSelectionChanged();
    }

    function init() {
        var menu = Menus.getMenu(Menus.AppMenuBar.VIEW_MENU);

        prefs = PreferencesManager.getPreferenceStorage(module, { enabled: true });
        enabled = prefs.getValue("enabled");

        // Add menu command
        CommandManager.register(ENABLE_CUBIC_BEZIER, CMD_ENABLE_CUBIC_BEZIER, toggleEnableCubicBezierEditor);

        if (menu) {
            menu.addMenuItem(CMD_ENABLE_CUBIC_BEZIER);
            updateMenuItemCheckmark();
        }

        handleEventListeners(enabled);

        // Create the preview container & contents
        $popover = $(
            "<div class='cubic-bezier'>" +
                "<div class='coordinate-plane'> " +
                    "<span class='control-point' id='P0'></span> " +
                    "<button class='control-point' id='P1'></button> " +
                    "<button class='control-point' id='P2'></button> " +
                    "<span class='control-point' id='P3'></span> " +
                    "<canvas height='300' width='149' id='curve'></canvas> " +
                "</div>" +
                "</div>"
        );
    
        $popoverContainer = $("<div id='popover-container' style='display:none;'>").appendTo($("body"));
        $popoverContainer.append($popover);
    
        // Load our stylesheet
        ExtensionUtils.loadStyleSheet(module, "popover.css");
    
        ctx = curve.getContext("2d");
        bezierCanvas = new BezierCanvas(curve, null, [0, 0]);

        $(EditorManager).on("activeEditorChange", function (event, editor) {
            if (activeEditor) {
                $(activeEditor).off("cursorActivity", onSelectionChanged);
            }
            activeEditor = editor;
    
            if (activeEditor) {
                $(activeEditor).on("cursorActivity", onSelectionChanged);
            }
    
            // The cursorActivity event does not get triggered across editors,
            // so call it here
            onSelectionChanged();
        });
    }

    init();
});
