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

/*jslint vars: true, plusplus: true, nomen: true, regexp: true, maxerr: 50 */
/*global define, brackets, $, window */

define(function (require, exports, module) {
    "use strict";

    var KeyEvent        = brackets.getModule("utils/KeyEvent"),
        Strings         = brackets.getModule("strings"),
        Mustache        = brackets.getModule("thirdparty/mustache/mustache");

    var TimingFunctionUtils = require("TimingFunctionUtils");

    /** Mustache template that forms the bare DOM structure of the UI */
    var BezierCurveEditorTemplate = require("text!BezierCurveEditorTemplate.html");

    /** @const @type {number} */
    var HEIGHT_ABOVE    =  75,    // extra height above main grid
        HEIGHT_BELOW    =  75,    // extra height below main grid
        HEIGHT_MAIN     = 150,    // height of main grid
        WIDTH_MAIN      = 150;    // width of main grid

    var animationRequest = null;

    /**
     * CubicBezier object constructor
     *
     * @param {string|Array.number[4]} coordinates Four parameters passes to cubic-bezier()
     *      either in string or array format.
     */
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

    /**
     * BezierCanvas object constructor
     *
     * @param {Element} canvas Inline editor <canvas> element
     * @param {CubicBezier} bezier Associated CubicBezier object
     * @param {number|Array.number} padding Element padding
     */
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

        /**
         * Calculates CSS offsets for <canvas> element
         *
         * @return {left:string, top:string}
         */
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

        /**
         * Round off number to hundreths place, convert to string, and strip leading zero
         *
         * @param {number} v Value
         * @return {string}
         */
        prettify: function (v) {
            return (Math.round(v * 100) / 100).toString().replace(/^0\./, ".");
        },

        /**
         * Get CSS left, top offsets for endpoint handle
         *
         * @param {Element} element Endpoint handle <button> element
         * @return {Array.string[2]}
         */
        offsetsToCoordinates: function (element) {
            var p = this.padding,
                w = this.canvas.width,
                h = this.canvas.height * 0.5;

            // Convert padding percentage to actual padding
            p = p.map(function (a, i) {
                return a * ((i % 2) ? w : h);
            });

            return [
                this.prettify((parseInt($(element).css("left"), 10)    - p[3]) / (w + p[1] + p[3])),
                this.prettify((h - parseInt($(element).css("top"), 10) - p[2]) / (h - p[0] - p[2]))
            ];
        },

        /**
         * Paint canvas
         *
         * @param {Object} settings Paint settings
         */
        plot: function (settings) {
            var xy = this.bezier.coordinates,
                ctx = this.canvas.getContext("2d"),
                setting;

            var defaultSettings = {
                handleTimingFunction: "#2893ef",
                handleThickness: 0.008,
                vBorderThickness: 0.02,
                hBorderThickness: 0.01,
                bezierTimingFunction: "#2893ef",
                bezierThickness: 0.03
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
            ctx.fillStyle = settings.handleTimingFunction;
            ctx.lineWidth = settings.handleThickness;
            ctx.strokeStyle = settings.handleTimingFunction;

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

        /**
         * Convert CSS padding shorthand to longhand
         *
         * @param {number|Array.number} padding Element padding
         * @return {Array.number}
         */
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

    /**
     * Handle click in <canvas> element
     *
     * @param {Event} e Mouse click event
     */
    function _curveClick(e) {
        var self = e.target,
            bezierEditor = self.bezierEditor;

        var curveBoundingBox = bezierEditor._getCurveBoundingBox(),
            left = curveBoundingBox.left,
            top  = curveBoundingBox.top,
            x    = e.pageX - left,
            y    = e.pageY - top - HEIGHT_ABOVE,
            $P1  = $(bezierEditor.P1),
            $P2  = $(bezierEditor.P2);

        // Helper function to calculate distance between 2-D points
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
        $P.get(0).focus();

        // update coords
        bezierEditor._cubicBezierCoords = bezierEditor.bezierCanvas
            .offsetsToCoordinates(bezierEditor.P1)
            .concat(bezierEditor.bezierCanvas.offsetsToCoordinates(bezierEditor.P2));

        bezierEditor._commitTimingFunction();
        bezierEditor._updateCanvas();
    }

    /**
     * Helper function for handling point move
     *
     * @param {Event} e Mouse move event
     * @param {number} x New horizontal position
     * @param {number} y New vertical position
     */
    function handlePointMove(e, x, y) {
        var self = e.target,
            bezierEditor = self.bezierEditor;

        // Helper function to redraw curve
        function mouseMoveRedraw() {
            if (!bezierEditor.dragElement) {
                animationRequest = null;
                return;
            }

            // Update code
            bezierEditor._commitTimingFunction();

            bezierEditor._updateCanvas();
            animationRequest = window.requestAnimationFrame(mouseMoveRedraw);
        }

        // This is a dragging state, but left button is no longer down, so mouse
        // exited element, was released, and re-entered element. Treat like a drop.
        if (bezierEditor.dragElement && (e.which !== 1)) {
            bezierEditor.dragElement = null;
            bezierEditor._commitTimingFunction();
            bezierEditor._updateCanvas();
            bezierEditor = null;
            return;
        }

        // Constrain time (x-axis) to 0 to 1 range. Progression (y-axis) is
        // theoretically not constrained, although canvas to drawing curve is
        // arbitrarily constrained to -0.5 to 1.5 range.
        x = Math.min(Math.max(0, x), WIDTH_MAIN);

        if (bezierEditor.dragElement) {
            $(bezierEditor.dragElement).css({
                left: x + "px",
                top:  y + "px"
            });
        }

        // update coords
        bezierEditor._cubicBezierCoords = bezierEditor.bezierCanvas
            .offsetsToCoordinates(bezierEditor.P1)
            .concat(bezierEditor.bezierCanvas.offsetsToCoordinates(bezierEditor.P2));

        if (!animationRequest) {
            animationRequest = window.requestAnimationFrame(mouseMoveRedraw);
        }
    }

    /**
     * Update Time (x-axis) and Progression (y-axis) data for mouse position
     *
     * @param {Element} canvas <canvas> element
     * @param {number} x Horizontal position
     * @param {number} y Vertical position
     */
    function updateTimeProgression(curve, x, y) {
        var percentX = Math.round(100 * x / WIDTH_MAIN),
            percentY = Math.round(100 * ((HEIGHT_MAIN - y) / HEIGHT_MAIN));

        // Constrain horizontal percentage to [0, 100] range
        percentX = Math.min(Math.max(0, percentX), 100);

        curve.parentNode.setAttribute("data-time", percentX);
        curve.parentNode.setAttribute("data-progression", percentY);
    }

    /**
     * Handle mouse move in <canvas> element
     *
     * @param {Event} e Mouse move event
     */
    function _curveMouseMove(e) {
        var self = e.target,
            bezierEditor = self.bezierEditor,
            curveBoundingBox = bezierEditor._getCurveBoundingBox(),
            left   = curveBoundingBox.left,
            top    = curveBoundingBox.top,
            x = e.pageX - left,
            y = e.pageY - top - HEIGHT_ABOVE;

        updateTimeProgression(self, x, y);

        if (bezierEditor.dragElement) {
            if (e.pageX === 0 && e.pageY === 0) {
                return;
            }

            handlePointMove(e, x, y);
        }
    }

    /**
     * Handle mouse move in <button> element
     *
     * @param {Event} e Mouse move event
     */
    function _pointMouseMove(e) {
        var self = e.target,
            bezierEditor = self.bezierEditor,
            curveBoundingBox = bezierEditor._getCurveBoundingBox(),
            left = curveBoundingBox.left,
            top  = curveBoundingBox.top,
            x = e.pageX - left,
            y = e.pageY - top - HEIGHT_ABOVE;

        updateTimeProgression(bezierEditor.curve, x, y);

        if (e.pageX === 0 && e.pageY === 0) {
            return;
        }

        handlePointMove(e, x, y);
    }

    /**
     * Handle mouse down in <button> element
     *
     * @param {Event} e Mouse down event
     */
    function _pointMouseDown(e) {
        var self = e.target;

        self.bezierEditor.dragElement = self;
    }

    /**
     * Handle mouse up in <button> element
     *
     * @param {Event} e Mouse up event
     */
    function _pointMouseUp(e) {
        var self = e.target;

        self.focus();

        if (self.bezierEditor.dragElement) {
            self.bezierEditor.dragElement = null;
            self.bezierEditor._commitTimingFunction();
            self.bezierEditor._updateCanvas();
        }
    }

    /**
     * Handle key down in <button> element
     *
     * @param {Event} e Key down event
     */
    function _pointKeyDown(e) {
        var code = e.keyCode,
            self = e.target,
            bezierEditor = self.bezierEditor;

        if (code >= KeyEvent.DOM_VK_LEFT && code <= KeyEvent.DOM_VK_DOWN) {
            e.preventDefault();

            // Arrow keys pressed
            var $this = $(e.target),
                left = parseInt($this.css("left"), 10),
                top  = parseInt($this.css("top"), 10),
                offset = (e.shiftKey ? 15 : 3),
                newVal;

            switch (code) {
            case KeyEvent.DOM_VK_LEFT:
                newVal = Math.max(0, left - offset);
                if (left === newVal) {
                    return false;
                }
                $this.css({ left: newVal + "px" });
                break;
            case KeyEvent.DOM_VK_UP:
                newVal = Math.max(-HEIGHT_ABOVE, top - offset);
                if (top === newVal) {
                    return false;
                }
                $this.css({ top: newVal + "px" });
                break;
            case KeyEvent.DOM_VK_RIGHT:
                newVal = Math.min(WIDTH_MAIN, left + offset);
                if (left === newVal) {
                    return false;
                }
                $this.css({ left: newVal + "px" });
                break;
            case KeyEvent.DOM_VK_DOWN:
                newVal = Math.min(HEIGHT_MAIN + HEIGHT_BELOW, top + offset);
                if (top === newVal) {
                    return false;
                }
                $this.css({ top: newVal + "px" });
                break;
            }

            // update coords
            bezierEditor._cubicBezierCoords = bezierEditor.bezierCanvas
                .offsetsToCoordinates(bezierEditor.P1)
                .concat(bezierEditor.bezierCanvas.offsetsToCoordinates(bezierEditor.P2));

            bezierEditor._commitTimingFunction();
            bezierEditor._updateCanvas();
            return true;

        } else if (code === KeyEvent.DOM_VK_ESCAPE) {
            return true;
        } else if (code === KeyEvent.DOM_VK_TAB && !e.ctrlKey && !e.metaKey && !e.altKey) {
            // Switch between the two points by tabbing
            if ($(e.target).hasClass("P1")) {
                $(".P2").focus();
            } else {
                $(".P1").focus();
            }
            e.preventDefault();
            return true;
        }

        return false;
    }


    /**
     * Constructor for BezierCurveEditor Object. This control may be used standalone
     * or within an InlineTimingFunctionEditor inline widget.
     *
     * @param {!jQuery} $parent  DOM node into which to append the root of the bezier curve editor UI
     * @param {!RegExpMatch} bezierCurve  RegExp match object of initially selected bezierCurve
     * @param {!function(string)} callback  Called whenever selected bezierCurve changes
     */
    function BezierCurveEditor($parent, bezierCurve, callback) {
        // Create the DOM structure, filling in localized strings via Mustache
        this.$element = $(Mustache.render(BezierCurveEditorTemplate, Strings));
        $parent.append(this.$element);

        this._callback = callback;
        this.dragElement = null;

        // current cubic-bezier() function params
        this._cubicBezierCoords = this._getCubicBezierCoords(bezierCurve);

        this.hint = {};
        this.hint.elem = $(".hint", this.$element);
        // If function was auto-corrected, then originalString holds the original function,
        // and an informational message needs to be shown
        if (bezierCurve.originalString) {
            TimingFunctionUtils.showHideHint(this.hint, true, bezierCurve.originalString, "cubic-bezier(" + this._cubicBezierCoords.join(", ") + ")");
        } else {
            TimingFunctionUtils.showHideHint(this.hint, false);
        }

        this.P1 = this.$element.find(".P1")[0];
        this.P2 = this.$element.find(".P2")[0];
        this.curve = this.$element.find(".curve")[0];

        this.P1.bezierEditor = this.P2.bezierEditor = this.curve.bezierEditor = this;

        this.bezierCanvas = new BezierCanvas(this.curve, null, [0, 0]);

        // redraw canvas
        this._updateCanvas();

        $(this.curve)
            .on("click", _curveClick)
            .on("mousemove", _curveMouseMove);
        $(this.P1)
            .on("mousemove", _pointMouseMove)
            .on("mousedown", _pointMouseDown)
            .on("mouseup", _pointMouseUp)
            .on("keydown", _pointKeyDown);
        $(this.P2)
            .on("mousemove", _pointMouseMove)
            .on("mousedown", _pointMouseDown)
            .on("mouseup", _pointMouseUp)
            .on("keydown", _pointKeyDown);
    }

    /**
     * Destructor called by InlineTimingFunctionEditor.onClosed()
     */
    BezierCurveEditor.prototype.destroy = function () {

        this.P1.bezierEditor = this.P2.bezierEditor = this.curve.bezierEditor = null;

        $(this.curve)
            .off("click", _curveClick)
            .off("mousemove", _curveMouseMove);
        $(this.P1)
            .off("mousemove", _pointMouseMove)
            .off("mousedown", _pointMouseDown)
            .off("mouseup", _pointMouseUp)
            .off("keydown", _pointKeyDown);
        $(this.P2)
            .off("mousemove", _pointMouseMove)
            .off("mousedown", _pointMouseDown)
            .off("mouseup", _pointMouseUp)
            .off("keydown", _pointKeyDown);
    };


    /** Returns the root DOM node of the BezierCurveEditor UI */
    BezierCurveEditor.prototype.getRootElement = function () {
        return this.$element;
    };

    /**
     * Default focus needs to go somewhere, so give it to P1
     */
    BezierCurveEditor.prototype.focus = function () {
        this.P1.focus();
        return true;
    };

    /**
     * Generates cubic-bezier function based on coords, and updates the doc
     */
    BezierCurveEditor.prototype._commitTimingFunction = function () {
        var bezierCurveVal = "cubic-bezier(" +
            this._cubicBezierCoords[0] + ", " +
            this._cubicBezierCoords[1] + ", " +
            this._cubicBezierCoords[2] + ", " +
            this._cubicBezierCoords[3] + ")";
        this._callback(bezierCurveVal);
        TimingFunctionUtils.showHideHint(this.hint, false);
    };

    /**
     * Handle all matches returned from TimingFunctionUtils.cubicBezierMatch() and
     * return array of coords
     *
     * @param {RegExp.match} match Matches returned from cubicBezierMatch()
     * @return {Array.number[4]}
     */
    BezierCurveEditor.prototype._getCubicBezierCoords = function (match) {

        if (match[0].match(/^cubic-bezier/)) {
            // cubic-bezier()
            return match.slice(1, 5);
        } else {
            // handle special cases of cubic-bezier calls
            switch (match[0]) {
            case "linear":
                return [ "0", "0", "1", "1" ];
            case "ease":
                return [ ".25", ".1", ".25", "1" ];
            case "ease-in":
                return [ ".42", "0", "1", "1" ];
            case "ease-out":
                return [ "0", "0", ".58", "1" ];
            case "ease-in-out":
                return [ ".42", "0", ".58", "1" ];
            }
        }

        window.console.log("brackets-cubic-bezier: getCubicBezierCoords() passed invalid RegExp match array");
        return [ "0", "0", "0", "0" ];
    };

    /**
     * Get <canvas> element's bounding box
     *
     * @return {left: number, top: number, width: number, height: number}
     */
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

    /**
     * Update <canvas> after a change
     */
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

    /**
     * Handle external update
     *
     * @param {!RegExpMatch} bezierCurve  RegExp match object of updated bezierCurve
     */
    BezierCurveEditor.prototype.handleExternalUpdate = function (bezierCurve) {
        this._cubicBezierCoords = this._getCubicBezierCoords(bezierCurve);
        this._updateCanvas();
        // If function was auto-corrected, then originalString holds the original function,
        // and an informational message needs to be shown
        if (bezierCurve.originalString) {
            TimingFunctionUtils.showHideHint(this.hint, true, bezierCurve.originalString, "cubic-bezier(" + this._cubicBezierCoords.join(", ") + ")");
        } else {
            TimingFunctionUtils.showHideHint(this.hint, false);
        }
    };


    exports.BezierCurveEditor = BezierCurveEditor;
});
