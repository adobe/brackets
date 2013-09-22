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

/*jslint vars: true, plusplus: true, nomen: true, regexp: true, maxerr: 50 */
/*global define, brackets, $, window, Mustache */

define(function (require, exports, module) {
    "use strict";
    
    var EditorManager   = brackets.getModule("editor/EditorManager"),
        KeyEvent        = brackets.getModule("utils/KeyEvent"),
        StringUtils     = brackets.getModule("utils/StringUtils"),
        Strings         = brackets.getModule("strings");

    var BezierCurveUtils            = require("BezierCurveUtils"),
        InlineBezierCurveEditor     = require("InlineBezierCurveEditor").InlineBezierCurveEditor;
    
    /** Mustache template that forms the bare DOM structure of the UI */
    var BezierCurveEditorTemplate   = require("text!BezierCurveEditorTemplate.html");
    
    /** @const @type {number} */
    var STEP_MULTIPLIER = 5;

    /**
     * Returns current bezier curve editor, or null
     * @return {?BezierCurveEditor}
     */
    function getBezierCurveEditorForElement(element) {
        var result = null,
            $widgetRoot,
            editor = EditorManager.getCurrentFullEditor(),
            $ancestorBezierCurveEditor = $(element).closest(".bezier-curve-editor");
        
        if (editor && $ancestorBezierCurveEditor.length === 1) {
            editor.getInlineWidgets().some(function (widget) {
                if (widget.bezierCurveEditor) {
                    $widgetRoot = widget.bezierCurveEditor.getRootElement();

                    if ($widgetRoot.length === 1 &&
                            $widgetRoot[0] === $ancestorBezierCurveEditor[0]) {
                        result = widget.bezierCurveEditor;
                        return true;
                    }
                }
                return false;
            });
        }
        
        return result;
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
                handleBezierCurve: "#1461FC",
                handleThickness: 0.008,
                vBorderThickness: 0.02,
                hBorderThickness: 0.01,
                bezierBezierCurve: "#1461FC",
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
            ctx.fillStyle = settings.handleBezierCurve;
            ctx.lineWidth = settings.handleThickness;
            ctx.strokeStyle = settings.handleBezierCurve;

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

    // Event handlers
    
    function _curveClick(event) {
        var self = event.target,
            bezierEditor = getBezierCurveEditorForElement(self);

        if (!bezierEditor) {
            return;
        }
        
        var curveBoundingBox = bezierEditor._getCurveBoundingBox(),
            left = curveBoundingBox.left,
            top  = curveBoundingBox.top,
            x    = event.pageX - left,
            y    = event.pageY - top - 75,
            $P1  = $(bezierEditor.P1),
            $P2  = $(bezierEditor.P2);

        // Y-value of points can be *dragged* outside of 0-1 range, or adjusted
        // with keyboard, but disallow clicking outside 0-1 range. This is because
        // UI gives no visual range for this, and user most likely wants to change
        // selection in editor.
        if (y < 0 || y > 150) {
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
        bezierEditor._cubicBezierCoords = bezierEditor.bezierCanvas
            .offsetsToCoordinates(bezierEditor.P1)
            .concat(bezierEditor.bezierCanvas.offsetsToCoordinates(bezierEditor.P2));

        bezierEditor._commitBezierCurve();
        bezierEditor._updateCanvas();
    }

    function _curveMouseMove(event) {
        var self = event.target,
            bezierEditor = getBezierCurveEditorForElement(self);

        if (!bezierEditor) {
            return;
        }
        
        var curveBoundingBox = bezierEditor._getCurveBoundingBox(),
            left   = curveBoundingBox.left,
            top    = curveBoundingBox.top,
            height = curveBoundingBox.height,
            x = event.pageX - left,
            y = event.pageY - top - 75;

        self.parentNode.setAttribute("data-time", Math.round(100 * x / curveBoundingBox.width));
        self.parentNode.setAttribute("data-progression", Math.round(100 * (3 * height / 4 - y) / (height * 0.5) - 50));
    }

    // Make the handles draggable
    function _pointMouseDown(e) {
        var self = e.target,
            bezierEditor = getBezierCurveEditorForElement(self),
            isMouseDown = true,
            animationRequest = null;

        function mouseMoveRedraw() {
            if (!isMouseDown) {
                animationRequest = null;
                return;
            }

            if (bezierEditor) {
                bezierEditor._updateCanvas();
            }
    
            animationRequest = window.webkitRequestAnimationFrame(mouseMoveRedraw);
        }

        function pointMouseMove(e) {
            if (!bezierEditor) {
                return;
            }

            var x = e.pageX,
                y = e.pageY,
                curveBoundingBox = bezierEditor._getCurveBoundingBox(),
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
            bezierEditor._cubicBezierCoords = bezierEditor.bezierCanvas
                .offsetsToCoordinates(bezierEditor.P1)
                .concat(bezierEditor.bezierCanvas.offsetsToCoordinates(bezierEditor.P2));

            if (!animationRequest) {
                animationRequest = window.webkitRequestAnimationFrame(mouseMoveRedraw);
            }
        }

        function pointMouseUp() {
            self.focus();
            isMouseDown = false;

            if (bezierEditor) {
                bezierEditor._commitBezierCurve();
                bezierEditor._updateCanvas();
            }

            self.removeEventListener("mousemove", pointMouseMove, true);
            self.removeEventListener("mouseup",   pointMouseUp,   true);
        }

        self.addEventListener("mousemove", pointMouseMove, true);
        self.addEventListener("mouseup",   pointMouseUp,   true);
    }

    function _pointKeyDown(event) {
        var code = event.keyCode,
            self = event.target,
            bezierEditor = getBezierCurveEditorForElement(self);

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
            // TODO - put this code in BezierCurveEditor method?
            bezierEditor._cubicBezierCoords = bezierEditor.bezierCanvas
                .offsetsToCoordinates(bezierEditor.P1)
                .concat(bezierEditor.bezierCanvas.offsetsToCoordinates(bezierEditor.P2));

            bezierEditor._commitBezierCurve();
            bezierEditor._updateCanvas();

            return false;
        }
    }


    /**
     * BezierCurveEditor control; may be used standalone or within an InlineBezierCurveEditor inline widget.
     * @param {!jQuery} $parent  DOM node into which to append the root of the bezier curve editor UI
     * @param {!string} bezierCurve  Initially selected bezierCurve
     * @param {!function(string)} callback  Called whenever selected bezierCurve changes
     */
    function BezierCurveEditor($parent, bezierCurve, callback) {
        // Create the DOM structure, filling in localized strings via Mustache
        this.$element = $(Mustache.render(BezierCurveEditorTemplate, Strings));
        $parent.append(this.$element);
        
        this._callback = callback;

        // current cubic-bezier() function params
        this._cubicBezierCoords = this._getCubicBezierCoords(bezierCurve);

        this.P1 = this.$element.find(".P1")[0];
        this.P2 = this.$element.find(".P2")[0];
        this.curve = this.$element.find(".curve")[0];

        this.bezierCanvas = new BezierCanvas(this.curve, null, [0, 0]);
        
        // redraw canvas
        this._updateCanvas();

        this.curve.addEventListener("click", _curveClick, true);
        this.curve.addEventListener("mousemove", _curveMouseMove, true);
        this.P1.addEventListener("mousedown", _pointMouseDown, true);
        this.P2.addEventListener("mousedown", _pointMouseDown, true);
        this.P1.addEventListener("keydown", _pointKeyDown, true);
        this.P2.addEventListener("keydown", _pointKeyDown, true);
    }

    /** destructor */
    BezierCurveEditor.prototype.destroy = function () {

        this.curve.removeEventListener("click", _curveClick, true);
        this.curve.removeEventListener("mousemove", _curveMouseMove, true);
        this.P1.removeEventListener("mousedown", _pointMouseDown, true);
        this.P2.removeEventListener("mousedown", _pointMouseDown, true);
        this.P1.removeEventListener("keydown", _pointKeyDown, true);
        this.P2.removeEventListener("keydown", _pointKeyDown, true);
    };


    /** Returns the root DOM node of the BezierCurveEditor UI */
    BezierCurveEditor.prototype.getRootElement = function () {
        return this.$element;
    };
    
    /**
     * Update all UI elements to reflect the selected bezierCurve. It is usually
     * incorrect to call this directly; use _commitBezierCurve() instead.
     */

    /** Focus the main bezier curve square's thumb */
    BezierCurveEditor.prototype.focus = function () {
        if (this.$selectionBase && !this.$selectionBase.is(":focus")) {
            this.$selectionBase.focus();
            return true;
        }
        return false;
    };

    /**
     * Normalize the given bezierCurve string into the format used by tinybezierCurve, by adding a space 
     * after commas.
     * @param {string} bezierCurve The bezierCurve to be corrected if it looks like an RGB or HSL bezierCurve.
     * @return {string} a normalized bezierCurve string.
     */
    BezierCurveEditor.prototype._normalizeBezierCurveString = function (bezierCurve) {
        return bezierCurve.toLowerCase();
    };

    /**
     * Sets _bezierCurve (and optionally _hsv) based on a string input, and updates the UI. The string's
     * format determines the new selected bezierCurve's format.
     * @param {!string} bezierCurveVal
     * @param {boolean=} resetHsv  Pass false ONLY if hsv set already been modified to match bezierCurveVal. Default: true.
     */
    BezierCurveEditor.prototype._commitBezierCurve = function () {
        var bezierCurveVal = "cubic-bezier(" +
            this._cubicBezierCoords[0] + ", " +
            this._cubicBezierCoords[1] + ", " +
            this._cubicBezierCoords[2] + ", " +
            this._cubicBezierCoords[3] + ")";
        this._callback(bezierCurveVal);
        this._bezierCurve = bezierCurveVal;
    };

    /** Converts a mouse coordinate to be relative to zeroPos, and clips to [0, maxOffset] */
    function _getNewOffset(pos, zeroPos, maxOffset) {
        var offset = pos - zeroPos;
        offset = Math.min(maxOffset, Math.max(0, offset));
        return offset;
    }
    
    /**
     * Helper for attaching drag-related mouse listeners to an element. It's up to
     * 'handler' to actually move the element as mouse is dragged.
     * @param {!function(jQuery.event)} handler  Called whenever drag position changes
     */
    BezierCurveEditor.prototype._registerDragHandler = function ($element, handler) {
        var mouseupHandler = function (event) {
            $(window).unbind("mousemove", handler);
            $(window).unbind("mouseup", mouseupHandler);
        };
        $element.mousedown(function (event) {
            $(window).bind("mousemove", handler);
            $(window).bind("mouseup", mouseupHandler);
        });
        $element.mousedown(handler);  // run drag-update handler on initial mousedown too
    };
    
    /** 
     * Global handler for keys in the bezierCurve editor.
     */
    BezierCurveEditor.prototype._handleKeydown = function (event) {
        var hasCtrl = (brackets.platform === "win") ? (event.ctrlKey) : (event.metaKey);
        if (event.keyCode === KeyEvent.DOM_VK_LEFT ||
                event.keyCode === KeyEvent.DOM_VK_RIGHT ||
                event.keyCode === KeyEvent.DOM_VK_UP ||
                event.keyCode === KeyEvent.DOM_VK_DOWN) {
            // Prevent arrow keys that weren't handled by a child control 
            // from being handled by a parent, either through bubbling or 
            // through default native behavior. There isn't a good general
            // way to tell if the target would handle this event by default,
            // so we look to see if the target is a text input control.
            var preventDefault = false,
                $target = $(event.target);
                
            // If the input has no "type" attribute, it defaults to text. So we
            // have to check for both possibilities.
            if ($target.is("input:not([type])") || $target.is("input[type=text]")) {
                // Text input control. In WebKit, if the cursor gets to the start
                // or end of a text field and can't move any further, the default 
                // action doesn't take place in the text field, so the event is handled
                // by the outer scroller. We have to prevent in that case too.
                if ($target[0].selectionStart === $target[0].selectionEnd &&
                        ((event.keyCode === KeyEvent.DOM_VK_LEFT && $target[0].selectionStart === 0) ||
                         (event.keyCode === KeyEvent.DOM_VK_RIGHT && $target[0].selectionEnd === $target.val().length))) {
                    preventDefault = true;
                }
            } else {
                // Not a text input control, so we want to prevent default.
                preventDefault = true;
            }

            if (preventDefault) {
                event.stopPropagation();
                return false; // equivalent to event.preventDefault()
            }
        }
    };

    BezierCurveEditor.prototype._bindKeyHandler = function ($element, handler) {
        $element.bind("keydown", handler);
    };

    // handle all matches returned from cubicBezierMatch()
    // return array of coords
    BezierCurveEditor.prototype._getCubicBezierCoords = function (match) {

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

        window.console.log("brackets-cubic-bezier: getCubicBezierCoords() passed invalid RegExp match array");
        return [ 0, 0, 0, 0 ];
    };

    BezierCurveEditor.prototype._getCurveBoundingBox = function () {
        var $canvas = this.$element.find(".curve"),
            canvasOffset = $canvas.offset();

        return {
            left:    canvasOffset.left,
            top:     canvasOffset.top,
            width:   $canvas.width(),
            height:  $canvas.height()
        };
    };

    BezierCurveEditor.prototype._updateCanvas = function () {
        // collect data, build model
        if (this._cubicBezierCoords) {
            this.bezierCanvas.bezier = window.bezier = new CubicBezier(this._cubicBezierCoords);

            var offsets = this.bezierCanvas.getOffsets();

            $(this.P1).css({
                left: offsets[0].left,
                top:  offsets[0].top
            });
            $(this.P2).css({
                left: offsets[1].left,
                top:  offsets[1].top
            });

            this.bezierCanvas.plot();
        }
    };
    
    
    exports.BezierCurveEditor = BezierCurveEditor;
});
