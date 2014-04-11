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
/*global _onValueChange: false, remove: false */

(function () {
    "use strict";

        /** @type {Object} Object literal with available editors for given properties. @see registerProvider() */
    var _providers = {},
        /** @type {CSSShapesEditor} current active editor for model.property */
        _activeEditor,
        /** @type {HTMLElement} element matched by model.selector */
        _target = null,
        /**
          @type {Object} Object literal with selector, CSS property and value.

          Will be updated by setup() and _onValueChange()
          Will be synced to Brackets via getModel() to update text in code editor.

          @example {selector: "body", property: "shape-inside", value: "circle()" }
        */
        _model = null,
        /** @type {RegEx} regular expression for shape values with no coordinates **/
        _emptyShapeRE = /(polygon|circle|rectangle|ellipse)\(\s*\)/i;

    /**
     * @private
     * Returns true if the element's computed style
     * contains the provided property/value CSS rule.
     *
     * @param {!HTMLElement} element
     * @param {!string} property CSS property
     * @param {!string} value CSS property value
     *
     * @return {boolean}
     */
    function _hasPropertyValue(element, property, value) {
        var result = false,
            style,
            test,
            testStyle;

        // Using a dummy test element with the given CSS rule to get an accurate
        // computed style value because the browser automatically expands shorthands.
        //
        // @example:
        // circle() -> circle(closest-side at 50% 50%)
        // ellipse() -> ellipse(closest-side closest-side at 50% 50%)
        //
        // Also helps avoid false negatives due to whitespace in value.
        //
        // @example:
        // circle(50%) === circle(  50%  )
        test = document.createElement("div");
        test.style.position = "absolute";
        test.style.display = "none";
        test.style[property] = value;
        document.body.appendChild(test);

        testStyle = window.getComputedStyle(test);
        style = window.getComputedStyle(element, null);

        if (style[property] && (style[property] === testStyle[property])) {
            result = true;
        }

        // cleanup
        test.parentNode.removeChild(test);

        return result;
    }

    /**
     * Setup an editor for a specific CSS property of an element using data in model.
     * Editors must be registered with registerProvider()
     *
     * @throws {TypeError} if input model is falsy or does not contain property
     *
     * @param {!Object} model object literal with data:
     *   {
     *       // selector to match an element for editing
     *       selector: {string},
     *
     *       // CSS property to edit
     *       property: {string},
     *
     *       // Initial value for editor
     *       value: {string}
     *   }
     */
    function setup(model) {
        if (!model || !model.property) {
            throw new TypeError("Invalid input model or missing property.");
        }

        if (!_providers[model.property]) {
            return;
        }

        // Find the first matching element from the given selector
        // TODO: implement querySelectorAll() navigation through multiple results
        _target = document.querySelector(model.selector);

        if (!_target) {
            return;
        }

        // Naively checks if the given css value exists on the element matched by the selector
        //
        // Mitigates problem scenarios:
        // - selector is found in media query which does not match current page view
        // - multiple duplicate selectors in the origin stylesheet, but not editing the one which applies last on the page
        if (!_hasPropertyValue(_target, model.property, model.value)) {
            // TODO: try handling this with Inspector.getMatchedStylesForNode() in LiveEditorLocalDriver
            console.log("Style mismatch. Expected:\n" + model.value + "\n\nFound:\n" + window.getComputedStyle(_target, null)[model.property]);
            remove();
            return;
        }

        // store the data from Brackets editor
        _model = model;

        _model.forceUpdate = _emptyShapeRE.test(_model.value);

        // get an editor that can handle the property
        _activeEditor = new _providers[model.property]();
        _activeEditor.setup(_target, model);

        // sync the element's style and the model value
        _activeEditor.onValueChange(_onValueChange);
    }

    /**
     * Handler for value "change" events from the live editor which was setup on the page.
     * Cache the value into the local model, which will be polled for by LiveEditorLocalDriver
     * to sync with Brackets editor
     *
     * @param {!string} value
     */
    function _onValueChange(value) {
        if (!_target || !value || typeof value !== "string") {
            return;
        }

        // update the selector target's style
        _target.style[_model.property] = value;

        // If the previous shape value coordinates are missing, ex: `polygon()`, like auto-suggested by Brackets hinting,
        // the CSSShapesEditor will automatically infer coordintates from the element and return a usable shape value.
        //
        // Here, we set a flag to force the code editor to accept this inferred default shape value.
        // By default, the code editor ignores shape values coming from the live editor if the user is still typing.
        // Setting this flag to true circumvents that behavior.
        _model.forceUpdate = _emptyShapeRE.test(_model.value);

        // update the model. will be requested by Brackets to sync code editor
        _model.value = value;
    }

    /**
     * Remove the live editor.
     */
    function remove() {
        if (_activeEditor) {
            _activeEditor.remove();
            _activeEditor = undefined;
        }

        _target.style[_model.property] = "";
        _model = null;
    }

    /**
     * Update the live editor with the given data.
     * @param {!Object} model Object literal with CSS property, value, selector.
     */
    function update(model) {
        _activeEditor.update(model);
    }

    /**
     * Expose the cached model data updated after live editor "change" events.
     * LiveEditorLocalDriver polls this to sync model with Brackets editor
     * @return {string}
     */
    function getModel() {
        return JSON.stringify(_model);
    }

    /*
     * Register an editor for the given CSS property.
     * This allows support for custom editors for any CSS property.
     *
     * Editor will be invoked if the given property
     * matches model.property in _LD_CSS_EDITOR.setup(model).
     *
     * @param {!string} property CSS property
     * @param {!Object} editor Editor for the property.
     *
     * Provided editors MUST implement the follwing interface:
     * {
     *   // turn on editor on specified target HTMLElement.
     *   // picks-up necessary args from model
     *   setup: function (target, model) {},
     *
     *   // update the editor state given the provided model
     *   update: function (model) {},
     *
     *   // turn off the editor and remove any scaffolding
     *   remove: function () {},
     *
     *   // sets a callback to be called with the new value
     *   onValueChange: function (callback) {}
     * }
     */
    function registerProvider(property, editor) {
        // TODO: check for interface conformity
        _providers[property] = editor;
    }

    window._LD_CSS_EDITOR = {
        setup:              setup,
        remove:             remove,
        update:             update,
        getModel:           getModel,
        registerProvider:   registerProvider
    };

}());
