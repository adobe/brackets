/*
 * Copyright (c) 2012 Adobe Systems Incorporated. All rights reserved.
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
/*global define, brackets, $, window, tinycolor */

define(function (require, exports, module) {
    "use strict";
    require("thirdparty/tinycolor-min");
    
    var KeyEvent    = brackets.getModule("utils/KeyEvent"),
        StringUtils = brackets.getModule("utils/StringUtils"),
        Strings     = require("strings");
    var STEP_MULTIPLIER = 5;
    
    function ColorEditor(element, color, callback, swatches) {
        this.element = element;
        this.callback = callback;
        this.swatches = swatches;
        this.bindKeyHandler = this.bindKeyHandler.bind(this);

        this.handleOpacityKeydown = this.handleOpacityKeydown.bind(this);
        this.handleHueKeydown = this.handleHueKeydown.bind(this);
        this.handleSelectionKeydown = this.handleSelectionKeydown.bind(this);
        this.registerDragHandler = this.registerDragHandler.bind(this);
        this.handleOpacityDrag = this.handleOpacityDrag.bind(this);
        this.handleHueDrag = this.handleHueDrag.bind(this);
        this.handleSelectionFieldDrag = this.handleSelectionFieldDrag.bind(this);

        this.color = tinycolor(color);
        this.lastColor = color;
        this.$element = $(this.element);
        this.$colorValue = this.$element.find(".color_value");
        this.$buttonList = this.$element.find("ul.button-bar");
        this.$rgbaButton = this.$element.find(".rgba");
        this.$hexButton = this.$element.find(".hex");
        this.$hslButton = this.$element.find(".hsla");
        this.$currentColor = this.$element.find(".current_color");
        this.$lastColor = this.$element.find(".last_color");
        this.$selection = this.$element.find(".color_selection_field");
        this.$selectionBase = this.$element.find(".color_selection_field .selector_base");
        this.$hueBase = this.$element.find(".hue_slider .selector_base");
        this.$opacityGradient = this.$element.find(".opacity_gradient");
        this.$hueSlider = this.$element.find(".hue_slider");
        this.$opacitySlider = this.$element.find(".opacity_slider");
        this.$hueSelector = this.$element.find(".hue_slider .selector_base");
        this.$opacitySlider = this.$element.find(".opacity_slider");
        this.$opacitySelector = this.$element.find(".opacity_slider .selector_base");
        this.$swatches = this.$element.find(".swatches");
        this.addSwatches();
        this.addFieldListeners();
        this.$lastColor.css("background-color", this.lastColor);
        this.commitColor(color);
    }

    ColorEditor.prototype.defaultColor = "rgba(0,0,0,1)";

    ColorEditor.prototype.hsv = tinycolor("rgba(0,0,0,1)").toHsv();

    ColorEditor.prototype.addFieldListeners = function () {
        this.bindColorFormatToRadioButton("rgba");
        this.bindColorFormatToRadioButton("hex");
        this.bindColorFormatToRadioButton("hsla");
        // TODO: This is not really updating other UI and the color value. 
        // Commenting it out and temporarily making it read only input field.
        //this.$colorValue.change(this.colorSetter);
        this.bindOriginalColorButton();
        this.registerDragHandler(this.$selection, this.handleSelectionFieldDrag);
        this.registerDragHandler(this.$hueSlider, this.handleHueDrag);
        this.registerDragHandler(this.$opacitySlider, this.handleOpacityDrag);
        this.bindKeyHandler(this.$selectionBase, this.handleSelectionKeydown);
        this.bindKeyHandler(this.$hueBase, this.handleHueKeydown);
        this.bindKeyHandler(this.$opacitySelector, this.handleOpacityKeydown);
        
        // Bind key handler to HSLa button only if we don't have any color swatches
        // and this becomes the last UI element in the tab loop.
        if ($(this.$swatches).children().length === 0) {
            this.bindKeyHandler(this.$hslButton, this.handleHslKeydown);
        }
    };

    ColorEditor.prototype.synchronize = function () {
        var colorObject, colorValue, hueColor;
        colorValue = this.getColor().toString();
        colorObject = tinycolor(colorValue);
        hueColor = "hsl(" + this.hsv.h + ", 100%, 50%)";
        this.updateColorTypeRadioButtons(colorObject.format);
        this.$colorValue.attr("value", colorValue);
        this.$currentColor.css("background-color", colorValue);
        this.$selection.css("background-color", hueColor);
        this.$hueBase.css("background-color", hueColor);
        this.$selectionBase.css("background-color", colorObject.toHexString());
        this.$opacityGradient.css("background-image", "-webkit-gradient(linear, 0% 0%, 0% 100%, from(" + hueColor + "), to(transparent))");
        this.$hueSelector.css("bottom", (this.hsv.h / 360 * 100) + "%");
        this.$opacitySelector.css("bottom", (this.hsv.a * 100) + "%");
        if (!isNaN(this.hsv.s)) {
            this.hsv.s = (this.hsv.s * 100) + "%";
        }
        if (!isNaN(this.hsv.v)) {
            this.hsv.v = (this.hsv.v * 100) + "%";
        }
        this.$selectionBase.css({
            left: this.hsv.s,
            bottom: this.hsv.v
        });
    };

    ColorEditor.prototype.focus = function () {
        if (!this.$selection.find(".selector_base").is(":focus")) {
            this.$selection.find(".selector_base").focus();
            return true;
        }
        return false;
    };

    ColorEditor.prototype.colorSetter = function () {
        var newColor, newValue;
        newValue = $.trim(this.$colorValue.val());
        newColor = tinycolor(newValue);
        if (!newColor.ok) {
            newValue = this.getColor();
            newColor = tinycolor(newValue);
        }
        this.commitColor(newValue, true);
        this.hsv = newColor.toHsv();
        this.synchronize();
    };

    ColorEditor.prototype.getColor = function () {
        return this.color || this.defaultColor;
    };

    ColorEditor.prototype.updateColorTypeRadioButtons = function (format) {
        this.$buttonList.find("li").removeClass("selected");
        switch (format) {
        case "rgb":
            this.$buttonList.find(".rgba").parent().addClass("selected");
            break;
        case "hex":
        case "name":
            this.$buttonList.find(".hex").parent().addClass("selected");
            break;
        case "hsl":
            this.$buttonList.find(".hsla").parent().addClass("selected");
            break;
        }
    };

    ColorEditor.prototype.bindColorFormatToRadioButton = function (buttonClass, propertyName, value) {
        var handler,
            _this = this;
        handler = function (event) {
            var colorObject, newColor, newFormat;
            newFormat = $(event.currentTarget).html().toLowerCase();
            newColor = _this.getColor();
            colorObject = tinycolor(newColor);
            switch (newFormat) {
            case "hsla":
                newColor = colorObject.toHslString();
                break;
            case "rgba":
                newColor = colorObject.toRgbString();
                break;
            case "hex":
                newColor = colorObject.toHexString();
                _this.hsv.a = 1;
                _this.synchronize();
                break;
            }
            _this.commitColor(newColor, false);
        };
        this.$element.find("." + buttonClass).click(handler);
    };

    ColorEditor.prototype.bindOriginalColorButton = function () {
        var _this = this;
        this.$lastColor.click(function (event) {
            _this.commitColor(_this.lastColor, true);
        });
    };

    ColorEditor.prototype.addSwatches = function () {
        var _this = this;
 
        this.swatches.forEach(function (swatch) {
            var stringFormat = (swatch.count > 1) ? Strings.USED_COLOR_TIP_PLURAL : Strings.USED_COLOR_TIP_SINGULAR,
                usedColorTip = StringUtils.format(stringFormat, swatch.value, swatch.count);
            _this.$swatches.append("<li><div class='swatch_bg'><div class='swatch' style='background-color: " +
                    swatch.value + ";' title='" + usedColorTip + "'></div></div> <span class='value'" + " tabindex='0' title='" +
                    usedColorTip + "'>" + swatch.value + "</span></li>");
        });

        this.$swatches.find("li").keydown(function (event) {
            if (event.keyCode === KeyEvent.DOM_VK_RETURN ||
                    event.keyCode === KeyEvent.DOM_VK_ENTER ||
                    event.keyCode === KeyEvent.DOM_VK_SPACE) {
                _this.commitColor($(event.currentTarget).find(".value").html());
            } else if (event.keyCode === KeyEvent.DOM_VK_TAB) {
                if (!event.shiftKey && $(this).next("li").length === 0) {
                    _this.$selectionBase.focus();
                    return false;
                }
            }
        });

        this.$swatches.find("li").click(function (event) {
            // Set focus to the corresponding value label of the swatch.
            $(event.currentTarget).find(".value").focus();
            _this.commitColor($(event.currentTarget).find(".value").html());
        });
    };

    ColorEditor.prototype.setColorAsHsv = function (hsv, commitHsv) {
        var colorVal, k, newColor, newHsv, oldColor, oldFormat, v;
        newHsv = this.hsv;
        for (k in hsv) {
            if (hsv.hasOwnProperty(k)) {
                v = hsv[k];
                newHsv[k] = v;
            }
        }
        newColor = tinycolor(newHsv);
        oldColor = tinycolor(this.getColor());
        oldFormat = oldColor.format;

        switch (oldFormat) {
        case "hsl":
            colorVal = newColor.toHslString();
            break;
        case "rgb":
            colorVal = newColor.toRgbString();
            break;
        case "hex":
        case "name":
            colorVal = this.hsv.a < 1 ? newColor.toRgbString() : newColor.toHexString();
            break;
        }
        this.commitColor(colorVal, commitHsv);
    };

    ColorEditor.prototype.commitColor = function (colorVal, resetHsv) {
        var colorObj;
        if (resetHsv === undefined) {
            resetHsv = true;
        }
        this.callback(colorVal);
        this.color = colorVal;
        this.$colorValue.val(colorVal);
        if (resetHsv) {
            colorObj = tinycolor(colorVal);
            this.hsv = colorObj.toHsv();
            this.color = colorObj;
        }
        this.synchronize();
    };

    function _getNewOffset(newVal, minVal, maxVal) {
        var offset = newVal - minVal;
        offset = Math.min(maxVal, Math.max(0, offset));
        return offset;
    }
    
    ColorEditor.prototype.handleSelectionFieldDrag = function (event) {
        var height, hsv, width, xOffset, yOffset;
        height = this.$selection.height();
        width = this.$selection.width();
        xOffset = _getNewOffset(event.clientX, this.$selection.offset().left, width);
        yOffset = _getNewOffset(event.clientY, this.$selection.offset().top, height);
        hsv = {};
        hsv.s = xOffset / width;
        hsv.v = 1 - yOffset / height;
        this.setColorAsHsv(hsv, false);
        if (!this.$selection.find(".selector_base").is(":focus")) {
            this.$selection.find(".selector_base").focus();
        }
    };

    ColorEditor.prototype.handleHueDrag = function (event) {
        var height, hsv, offset;
        height = this.$hueSlider.height();
        offset = _getNewOffset(event.clientY, this.$hueSlider.offset().top, height);
        hsv = {};
        hsv.h = (1 - offset / height) * 360;
        this.setColorAsHsv(hsv, false);
        if (!this.$hueSlider.find(".selector_base").is(":focus")) {
            this.$hueSlider.find(".selector_base").focus();
        }
    };

    ColorEditor.prototype.handleOpacityDrag = function (event) {
        var height, hsv, offset;
        height = this.$opacitySlider.height();
        offset = _getNewOffset(event.clientY, this.$opacitySlider.offset().top, height);
        hsv = {};
        hsv.a = 1 - offset / height;
        this.setColorAsHsv(hsv, false);
        if (!this.$opacitySlider.find(".selector_base").is(":focus")) {
            this.$opacitySlider.find(".selector_base").focus();
        }
    };

    ColorEditor.prototype.registerDragHandler = function (selector, handler) {
        var element, mouseupHandler;
        element = this.$element.find(selector);
        element.mousedown(handler);
        mouseupHandler = function (event) {
            $(window).unbind("mousemove", handler);
            $(window).unbind("mouseup", mouseupHandler);
        };
        element.mousedown(function (event) {
            $(window).bind("mousemove", handler);
            $(window).bind("mouseup", mouseupHandler);
        });
    };

    ColorEditor.prototype.handleHslKeydown = function (event) {
        switch (event.keyCode) {
        case KeyEvent.DOM_VK_TAB:
            if (!event.shiftKey) {
                this.$selectionBase.focus();
                return false;
            }
            break;
        }
    };

    ColorEditor.prototype.handleSelectionKeydown = function (event) {
        var hsv = {},
            step = 1.5,
            xOffset,
            yOffset,
            adjustedOffset;

        switch (event.keyCode) {
        case KeyEvent.DOM_VK_LEFT:
        case KeyEvent.DOM_VK_RIGHT:
            step = event.shiftKey ? step * STEP_MULTIPLIER : step;
            xOffset = Number($.trim(this.$selectionBase.css("left").replace("%", "")));
            adjustedOffset = (event.keyCode === KeyEvent.DOM_VK_LEFT) ? (xOffset - step) : (xOffset + step);
            xOffset = Math.min(100, Math.max(0, adjustedOffset));
            hsv.s = xOffset / 100;
            this.setColorAsHsv(hsv, false);
            return false;
        case KeyEvent.DOM_VK_DOWN:
        case KeyEvent.DOM_VK_UP:
            step = event.shiftKey ? step * STEP_MULTIPLIER : step;
            yOffset = Number($.trim(this.$selectionBase.css("bottom").replace("%", "")));
            adjustedOffset = (event.keyCode === KeyEvent.DOM_VK_DOWN) ? (yOffset - step) : (yOffset + step);
            yOffset = Math.min(100, Math.max(0, adjustedOffset));
            hsv.v = yOffset / 100;
            this.setColorAsHsv(hsv, false);
            return false;
        case KeyEvent.DOM_VK_TAB:
            if (event.shiftKey) {
                if ($(this.$swatches).children().length === 0) {
                    this.$hslButton.focus();
                } else {
                    $(this.$swatches).find(".value:last").focus();
                }
                return false;
            }
            break;
        }
    };

    ColorEditor.prototype.handleHueKeydown = function (event) {
        var hsv = {},
            hue = Number(this.hsv.h),
            step = 3.6;

        switch (event.keyCode) {
        case KeyEvent.DOM_VK_DOWN:
            step = event.shiftKey ? step * STEP_MULTIPLIER : step;
            if (hue > 0) {
                hsv.h = (hue - step) <= 0 ? 360 - step : hue - step;
                this.setColorAsHsv(hsv);
            }
            return false;
        case KeyEvent.DOM_VK_UP:
            step = event.shiftKey ? step * STEP_MULTIPLIER : step;
            if (hue < 360) {
                hsv.h = (hue + step) >= 360 ? step : hue + step;
                this.setColorAsHsv(hsv);
            }
            return false;
        }
    };

    ColorEditor.prototype.handleOpacityKeydown = function (event) {
        var alpha = this.hsv.a,
            hsv = {},
            step = 0.01;

        switch (event.keyCode) {
        case KeyEvent.DOM_VK_DOWN:
            step = event.shiftKey ? step * STEP_MULTIPLIER : step;
            if (alpha > 0) {
                hsv.a = (alpha - step) <= 0 ? 0 : alpha - step;
                this.setColorAsHsv(hsv);
            }
            return false;
        case KeyEvent.DOM_VK_UP:
            step = event.shiftKey ? step * STEP_MULTIPLIER : step;
            if (alpha < 100) {
                hsv.a = (alpha + step) >= 1 ? 1 : alpha + step;
                this.setColorAsHsv(hsv);
            }
            return false;
        }
    };

    ColorEditor.prototype.bindKeyHandler = function (element, handler) {
        element.bind("keydown", handler);
    };

    // Prevent clicks on some UI elements (color selection field, slider and large swatch) from taking focus
    $(window.document).on("mousedown", ".color_selection_field, .slider, .large_swatch", function (e) {
        e.preventDefault();
    });

    exports.ColorEditor = ColorEditor;
});
