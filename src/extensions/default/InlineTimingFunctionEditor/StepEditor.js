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

define(function (require, exports, module) {
    "use strict";

    var KeyEvent    = brackets.getModule("utils/KeyEvent"),
        Strings     = brackets.getModule("strings"),
        Mustache    = brackets.getModule("thirdparty/mustache/mustache");

    var TimingFunctionUtils = require("TimingFunctionUtils");

    /** Mustache template that forms the bare DOM structure of the UI */
    var StepEditorTemplate   = require("text!StepEditorTemplate.html");

    /** @const @type {number} */
    var STEP_LINE   = 1,
        DASH_LINE   = 2;

    /**
     * StepParameters object constructor
     *
     * @param {{ count: number, timing: string}} params Parameters passed to steps()
     *      either in string or array format.
     */
    function StepParameters(params) {
        if (!params) {
            throw "No parameters were defined";
        }

        this.count  = params.count;
        this.timing = params.timing;
    }

    /**
     * StepCanvas object constructor
     *
     * @param {Element} canvas Inline editor <canvas> element
     * @param {StepParameters} stepParams Associated StepParameters object
     * @param {number|Array.number} padding Element padding
     */
    function StepCanvas(canvas, stepParams, padding) {
        this.canvas     = canvas;
        this.stepParams = stepParams;
        this.padding    = this.getPadding(padding);

        // Convert to a cartesian coordinate system with axes from 0 to 1
        var ctx = this.canvas.getContext("2d"),
            p = this.padding;

        ctx.scale(canvas.width * (1 - p[1] - p[3]), -canvas.height * (1 - p[0] - p[2]));
        ctx.translate(p[3] / (1 - p[1] - p[3]), (-1 - p[0] / (1 - p[0] - p[2])));
    }

    StepCanvas.prototype = {

        drawBackground: function () {
            this.ctx.beginPath();
            this.ctx.lineWidth   = this.settings.borderWidth;
            this.ctx.strokeStyle = this.settings.borderColor;
            this.ctx.fillStyle = this.settings.bgColor;
            this.ctx.moveTo(0, 0);
            this.ctx.lineTo(0, 1);
            this.ctx.lineTo(1, 1);
            this.ctx.lineTo(1, 0);
            this.ctx.lineTo(0, 0);
            this.ctx.stroke();
            this.ctx.fill();
            this.ctx.closePath();
        },

        drawPoint: function (x, y, isFilled) {
            // Points are always step color
            this.ctx.beginPath();
            this.ctx.lineWidth   = this.settings.pointLineWidth;
            this.ctx.strokeStyle = this.settings.stepColor;
            this.ctx.arc(x, y, this.settings.pointRadius, 0, 2 * Math.PI, false);
            this.ctx.stroke();
            if (isFilled) {
                this.ctx.fillStyle = this.settings.stepColor;
                this.ctx.fill();
            }
            this.ctx.closePath();
        },

        drawLine: function (x1, y1, x2, y2, type) {
            this.ctx.beginPath();
            if (type === STEP_LINE) {
                this.ctx.lineWidth   = this.settings.stepLineWidth;
                this.ctx.strokeStyle = this.settings.stepColor;
            } else if (type === DASH_LINE) {
                this.ctx.lineWidth   = this.settings.dashLineWidth;
                this.ctx.strokeStyle = this.settings.dashColor;
            }
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
            this.ctx.stroke();
            this.ctx.closePath();
        },

        drawStartInterval: function (x1, y1, x2, y2) {
            var pr = this.settings.pointRadius;

            // Draw empty start point
            this.drawPoint(x1, y1, false);

            // Draw dashed line up to next step
            this.drawLine(x1, y1 + pr, x1, y2, DASH_LINE);

            // Draw filled mid point
            this.drawPoint(x1, y2, true);

            // Draw step line
            this.drawLine(x1, y2, x2 - pr, y2, STEP_LINE);
        },

        drawEndInterval: function (x1, y1, x2, y2) {
            var pr = this.settings.pointRadius;

            // Draw filled start point
            this.drawPoint(x1, y1, true);

            // Draw step line
            this.drawLine(x1, y1, x2 - pr, y1, STEP_LINE);

            // Draw empty mid point
            this.drawPoint(x2, y1, false);

            // Draw dashed line up to next step
            this.drawLine(x2, y1 + pr, x2, y2, DASH_LINE);
        },

        /**
         * Paint canvas
         *
         * @param {Object} settings Paint settings
         */
        plot: function (settings) {
            var setting, i, j, last, interval,
                sp = this.stepParams,
                isStart = (sp.timing === "start"),
                p = [];

            var defaultSettings = {
                bgColor:        "transparent",
                borderColor:    "#bbb",
                stepColor:      "#2893ef",
                dashColor:      "#b8b8b8",
                borderWidth:    0.00667,
                stepLineWidth:  0.02,
                dashLineWidth:  0.008,
                pointLineWidth: 0.008,
                pointRadius:    0.015
            };

            this.settings = settings || {};

            for (setting in defaultSettings) {
                if (defaultSettings.hasOwnProperty(setting)) {
                    if (!this.settings.hasOwnProperty(setting)) {
                        this.settings[setting] = defaultSettings[setting];
                    }
                }
            }

            this.ctx = this.canvas.getContext("2d");

            // Build points array. There's a starting point at 0,0
            // plus a point for each step
            p[0] = { x: 0, y: 0 };
            for (i = 1; i <= sp.count; i++) {
                interval = i / sp.count;
                p[i] = { x: interval, y: interval };
            }

            // Start with a clean slate
            this.ctx.clearRect(-0.5, -0.5, 2, 2);
            this.drawBackground();

            // Draw each interval
            last = p.length - 1;
            for (i = 0, j = 1; i < last; i++, j++) {
                if (isStart) {
                    this.drawStartInterval(p[i].x, p[i].y, p[j].x, p[j].y);
                } else {
                    this.drawEndInterval(p[i].x, p[i].y, p[j].x, p[j].y);
                }
            }

            // Each interval draws start and mid point for that interval,
            // so we need to draw last point. It's always filled.
            this.drawPoint(p[last].x, p[last].y, true);
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
     * Handle key down in <canvas> element
     *
     * @param {Event} e Key down event
     */
    function _canvasKeyDown(e) {
        var code = e.keyCode,
            self = e.target,
            stepEditor = self.stepEditor;

        if (code >= KeyEvent.DOM_VK_LEFT && code <= KeyEvent.DOM_VK_DOWN) {
            e.preventDefault();

            // Arrow keys pressed
            switch (code) {
            case KeyEvent.DOM_VK_LEFT:
                stepEditor.stepCanvas.stepParams.timing = "start";
                break;
            case KeyEvent.DOM_VK_UP:
                // No upper limit
                stepEditor.stepCanvas.stepParams.count++;
                break;
            case KeyEvent.DOM_VK_RIGHT:
                stepEditor.stepCanvas.stepParams.timing = "end";
                break;
            case KeyEvent.DOM_VK_DOWN:
                if (stepEditor.stepCanvas.stepParams.count > 1) {
                    stepEditor.stepCanvas.stepParams.count--;
                }
                break;
            }

            // update step params
            stepEditor._stepParams = stepEditor.stepCanvas.stepParams;

            stepEditor._commitTimingFunction();
            stepEditor._updateCanvas();
            return true;

        } else if (code === KeyEvent.DOM_VK_ESCAPE) {
            return true;
        }

        return false;
    }


    /**
     * Constructor for StepEditor Object. This control may be used standalone
     * or within an InlineTimingFunctionEditor inline widget.
     *
     * @param {!jQuery} $parent  DOM node into which to append the root of the step editor UI
     * @param {!RegExpMatch} stepMatch  RegExp match object of initially selected step function
     * @param {!function(string)} callback  Called whenever selected step function changes
     */
    function StepEditor($parent, stepMatch, callback) {
        // Create the DOM structure, filling in localized strings via Mustache
        this.$element = $(Mustache.render(StepEditorTemplate, Strings));
        $parent.append(this.$element);

        this._callback = callback;

        // current step function params
        this._stepParams = this._getStepParams(stepMatch);

        this.hint = {};
        this.hint.elem = $(".hint", this.$element);
        // If function was auto-corrected, then originalString holds the original function,
        // and an informational message needs to be shown
        if (stepMatch.originalString) {
            TimingFunctionUtils.showHideHint(this.hint, true, stepMatch.originalString, "steps(" + this._stepParams.count.toString() + ", " + this._stepParams.timing + ")");
        } else {
            TimingFunctionUtils.showHideHint(this.hint, false);
        }

        this.canvas = this.$element.find(".steps")[0];

        this.canvas.stepEditor = this;

        // Padding (3rd param)is scaled, so 0.1 translates to 15px
        // Note that this is rendered inside canvas CSS "content"
        // (i.e. this does not map to CSS padding)
        this.stepCanvas = new StepCanvas(this.canvas, null, [0.1]);

        // redraw canvas
        this._updateCanvas();

        $(this.canvas).on("keydown", _canvasKeyDown);
    }

    /**
     * Destructor called by InlineTimingFunctionEditor.onClosed()
     */
    StepEditor.prototype.destroy = function () {
        this.canvas.stepEditor = null;
        $(this.canvas).off("keydown", _canvasKeyDown);
    };


    /** Returns the root DOM node of the StepEditor UI */
    StepEditor.prototype.getRootElement = function () {
        return this.$element;
    };

    /**
     * Default focus needs to go somewhere, so give it to canvas
     */
    StepEditor.prototype.focus = function () {
        this.canvas.focus();
        return true;
    };

    /**
     * Generates step function based on parameters, and updates the doc
     */
    StepEditor.prototype._commitTimingFunction = function () {
        var stepFuncVal = "steps(" +
            this._stepParams.count.toString() + ", " +
            this._stepParams.timing + ")";
        this._callback(stepFuncVal);
        TimingFunctionUtils.showHideHint(this.hint, false);
    };

    /**
     * Handle all matches returned from TimingFunctionUtils.stepMatch() and
     * return array of coords
     *
     * @param {RegExp.match} match Matches returned from stepMatch()
     * @return {{count: number, timing: string}}
     */
    StepEditor.prototype._getStepParams = function (match) {

        if (match[0].match(/^steps/)) {
            // steps()
            return {
                count:  parseInt(match[1], 10),
                timing: match[2] || "end"
            };
        } else {
            // handle special cases of steps functions
            switch (match[0]) {
            case "step-start":
                return { count: 1, timing: "start" };
            case "step-end":
                return { count: 1, timing: "end" };
            }
        }

        window.console.log("step timing function: _getStepParams() passed invalid RegExp match array");
        return { count: 1, timing: "end" };
    };

    /**
     * Get <canvas> element's bounding box
     *
     * @return {left: number, top: number, width: number, height: number}
     */
    StepEditor.prototype._getCanvasBoundingBox = function () {
        var $canvas = this.$element.find(".steps"),
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
    StepEditor.prototype._updateCanvas = function () {
        // collect data, build model
        if (this._stepParams) {
            this.stepCanvas.stepParams = window.stepParams = new StepParameters(this._stepParams);

            this.stepCanvas.plot();
        }
    };

    /**
     * Handle external update
     *
     * @param {!RegExpMatch} stepMatch  RegExp match object of updated step function
     */
    StepEditor.prototype.handleExternalUpdate = function (stepMatch) {
        this._stepParams = this._getStepParams(stepMatch);
        this._updateCanvas();
        // If function was auto-corrected, then originalString holds the original function,
        // and an informational message needs to be shown
        if (stepMatch.originalString) {
            TimingFunctionUtils.showHideHint(this.hint, true, stepMatch.originalString, "steps(" + this._stepParams.count.toString() + ", " + this._stepParams.timing + ")");
        } else {
            TimingFunctionUtils.showHideHint(this.hint, false);
        }
    };


    exports.StepEditor = StepEditor;
});
