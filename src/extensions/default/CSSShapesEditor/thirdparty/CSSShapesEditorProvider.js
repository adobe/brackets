/*
 * Copyright (c) 2013 Adobe Systems Incorporated.
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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50, browser: true */
/*global window, CSSShapesEditor */

/*
    Register CSSShapesEditor as a provider for editing shape properties.
    A provider is just a wrapper over custom editors to provide a common interface.

    All providers MUST implement at a minimum this interface:
    {
        // turns on editor on specified target HTMLElement.
        // picks-up necessary setup args from model
        setup: function (target, model) {},

        // update the editor state given the provided model
        update: function (model) {},

        // turn off the editor and remove any scaffolding
        remove: function () {},

        // sets a callback to be called with the new value
        onValueChange: function (callback) {}
    }
*/
(function () {

    "use strict";

    if (!window._LD_CSS_EDITOR || typeof window._LD_CSS_EDITOR.registerProvider !== "function") {
        throw new Error("Missing LiveEditorRemoteDriver from Brackets");
    }

    if (!window.CSSShapesEditor) {
        throw new Error("Missing CSSShapesEditor");
    }

    var _onKeydown;

    function Provider() {}

    Provider.prototype.setup = function (target, model) {
        var scope = this,
            options = {};

        switch (model.property) {
        case "shape-inside":
        case "-webkit-shape-inside":
            options.defaultRefBox = "content-box";
            break;
        case "clip-path":
        case "-webkit-clip-path":
            options.defaultRefBox = "border-box";
            break;
        default:
            options.defaultRefBox = "margin-box";
        }

        /*
          @private
          Handle keydown events when a polygon editor is active.
          Declared globally within module so it can be removed by Provider.remove()
          Defined here so it can access scope.inst

          T key toggles the free transform editor (scale/rotate)
          Esc key turns off free transform editor; quietly ignored if editor was never turned on.

          @param {Event} e keydown event
        */
        _onKeydown = function (e) {
            // only handle cases for polygon editors
            if (scope.inst.type !== "polygon") {
                return;
            }
            // T key toggles rotate/scale editor
            if (e.keyIdentifier === "U+0054") {
                scope.inst.toggleFreeTransform();
            }

            // escape key turns off rotate/scale editor
            if (e.keyCode === 27) {
                scope.inst.turnOffFreeTransform();
            }
        };

        scope.inst = new CSSShapesEditor(target, model.value, options);
        scope.inst.on("shapechange", function () {
            if (scope.callback) {
                scope.callback.call(scope.inst, scope.inst.getCSSValue());
            }
        });

        document.addEventListener("keydown", _onKeydown);
    };

    Provider.prototype.update = function (model) {
        if (!model || typeof model !== "object") {
            throw new TypeError("Invalid input model. Expected object, got " + model);
        }

        if (!model.value || typeof model.value !== "string") {
            throw new TypeError("Invalid update value. Expected string, got " + model.value);
        }

        this.inst.update(model.value);
    };

    Provider.prototype.onValueChange = function (fn) {
        if (typeof fn !== "function") {
            throw new TypeError("Invalid callback. Expected function, got " + fn);
        }

        this.callback = fn;
    };

    Provider.prototype.remove = function () {
        this.inst.remove();
        this.inst = null;
        this.callback = undefined;
        document.removeEventListener("keydown", _onKeydown);
    };

    var properties = ["shape-inside", "-webkit-shape-inside", "shape-outside", "-webkit-shape-outside", "clip-path", "-webkit-clip-path"];

    properties.forEach(function (property) {

        // expose an editor only when the property is supported by the browser
        if (document.body.style[property] !== undefined) {
            window._LD_CSS_EDITOR.registerProvider(property, Provider);
        } else {
            console.warn(property + " is not supported by this browser.\n Perhaps it is not enabled. See html.adobe.com/webplatform/enable");
        }
    });

}());
