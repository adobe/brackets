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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, window, _reset: false, _reconnect: false, update: false */

define(function (require, exports, module) {
    "use strict";

    var Inspector = brackets.getModule("LiveDevelopment/Inspector/Inspector"),
        _         = brackets.getModule("thirdparty/lodash");

    var LiveEditorRemoteDriver = require("text!LiveEditorRemoteDriver.js"),

        /** @type {string} namspace in the inspected page where live editor methods live */
        _namespace = "window._LD_CSS_EDITOR",

        /** @type {Object} snapshot of remote model from live editor in the inspected page (live preivew) */
        _model = {},

        /** @type {boolean} true if live editor instance was set up */
        _hasEditor = false,

        /** @type {number} milliseconds interval after which to sync the remote model with the local _model snapshot */
        _syncFrequency = 100,

        /** @type {Interval} result of setInterval() */
        _syncInterval,

        /** @type {number} number of attempts to reconnect after an error */
        _retryCount = 5,

        /** @type {Object} misc storage; used in reconnect scenario */
        _cache = {};

    /**
     * @private
     * Evaluate the given expression in the context of the pave in LivePreview.
     * Returns a promise.
     * Fails the promise if the inspector is not connected.
     * Fails the promise if an error was raised in the LivePreview.
     *
     * @param {!string} expression JavaScript code to be evaluated
     * @return {$.Promise}
     */
    function _call(expression) {
        var deferred = $.Deferred();

        if (!expression || typeof expression !== "string") {
            throw new TypeError("Invalid input. Expected string JS expression, got: " + expression);
        }

        if (Inspector.connected() !== true) {
            return deferred.reject();
        }

        Inspector.Runtime.evaluate(expression, function (resp) {
            if (!resp || resp.wasThrown) {
                console.error(resp.result);
                deferred.reject(resp.result);
            } else {
                deferred.resolve(resp.result);
            }
        });

        return deferred.promise();
    }

    /**
     * Inject remote live editor driver and any specified editor providers.
     * The remote live editor driver mirrors most of the local live editor driver API
     * to provide an interface to the in-browser live editor.
     * @param {Array.<string>=} providers String sources of editors to be available in the browser; optional
     */
    function init(providers) {
        var scripts = [].concat(LiveEditorRemoteDriver, providers || []);

        // cache dependencies for reuse when a re-init is required (ex: after a page refresh)
        _cache.dependencies = scripts;

        $(exports).triggerHandler("init");

        return _call(scripts.join(";"));
    }

    /**
     * Send instructions to remove the live editor from the page in LivePreview.
     * @return {$.Promise}
     */
    function remove() {
        if (_hasEditor === false) {
            var deferred = $.Deferred();
            return deferred.reject().promise();
        }

        _cache.model = undefined; // do not move in _reset(), otherwise the _reconnect() scenario misses the cache and fails
        _reset();
        var expr = _namespace + ".remove()";
        return _call(expr);
    }

    /**
    * @private
    * Handle the succesful promise of getting the model from the browser.
    *
    * Dispatches these events:
    *   update.model -- when the model received differs from the local snapshot
    *
    * @throws {TypeError} if the promise result is not a string.
    * @param {!string} response JSON stringified object with CSS property, value
    */
    function _whenGetRemoteModel(response) {
        if (!response || !response.value || typeof response.value !== "string") {
            throw new TypeError("Invalid result from remote driver .getModel(). Expected JSON string, got:" + response.value);
        }

        var data = JSON.parse(response.value),
            hasChanged = false,
            key;

        if (!data) {
            remove();
        }

        // sync the local model snapshot with the remote model
        _.forEach(data, function (value, key) {
            if (!_model[key] || !_.isEqual(_model[key], value)) {
                _model[key] = value;
                hasChanged = true;
            }
        });

        // notify Brackets so it can update the code editor
        if (hasChanged || data.forceUpdate) {
            $(exports).triggerHandler("update.model", [_model, data.forceUpdate]);
        }
    }

    /**
    * @private
    * Handle failed promises for eval() calls to the inspected page.
    * Promises fail if the user manually refreshes the page or navigates
    * because the injected editor files will be lost.
    * If this is the case, attempt to reconnect.
    *
    * Promises also fail because of errors thrown in the remote page.
    * If this is the case, remove the editor.
    */
    function _whenRemoteCallFailed() {
        // check if the remote editor namespace is still defined on the page
        _call(_namespace)
            .then(function (response) {
                if (response.type === "undefined") {
                    _reconnect();
                } else {
                    remove();
                }
            })
            .fail(remove);
    }

    /**
     * @private
     * Stop polling for the remote model
     */
    function _stopSyncLoop() {
        window.clearInterval(_syncInterval);
    }

    /**
     * @private
     * Reset flags and clear snapshot of remote model
     */
    function _reset() {
        _stopSyncLoop();
        _hasEditor = false;
        _model = {};
    }

    /**
     * @private
     * Attempt to get the model from the page in LivePreview.
     */
    function _onSyncTick() {
        var expr = _namespace + ".getModel()";
        _call(expr).then(_whenGetRemoteModel).fail(_whenRemoteCallFailed);
    }

    /**
     * @private
     * Poll for the remote model
     */
    function _startSyncLoop() {
        _syncInterval = window.setInterval(_onSyncTick, _syncFrequency);
    }

    /**
     * Send instructions to setup a live editor in the page in LivePreview
     * using the selector, css property and css value in the given model.
     *
     * If an editor for the current model already exists, then update it.
     * The model here is an instance of Model, not an object literal, like the local _model.
     *
     * @param {!Model} model Instance of Model with attributes from code editor
     * @return {$.Promise}
     */
    function setup(model) {

        _cache.model = _cache.model || model;

        var attr = {
            selector: model.get("selector"),
            value:    model.get("value"),
            property: model.get("property")
        };

        if (_hasEditor) {
            // If we are asked to re-setup the same editor, update the existing one
            if (attr.selector === _model.selector && attr.property === _model.property) {
                return update(model);
            }
        }

        var expr = _namespace + ".setup(" + JSON.stringify(attr) + ")";

        return _call(expr)
            .then(_startSyncLoop)
            .then(function () { _hasEditor = true; })
            .fail(_whenRemoteCallFailed);
    }

    /**
     * Send instructions to update the existing live editor in
     * the page in LivePreview with the state of the given model.
     *
     * The model here is an instance of Model, not an object literal, like _model.
     *
     * @throws {TypeError} if the input model is falsy.
     * @param {!Model} model Instance of Model obj with attributes from code editor.
     * @return {$.Promise}
     */
    function update(model) {
        if (!model) {
            throw new TypeError("Invalid update() input. Expected {Model} instance, got: " + model);
        }

        if (_hasEditor === false) {
            return setup(model);
        }

        _cache.model = model;

        var attr = {
            selector: model.get("selector"),
            value:    model.get("value"),
            property: model.get("property")
        };

        // Asking to update a different element / property? Setup a new editor
        if (attr.selector !== _model.selector || attr.property !== _model.property) {
            return remove().then(function () { return setup(model); });
        }

        var expr = _namespace + ".update(" + JSON.stringify(attr) + ")";
        return _call(expr).fail(_whenRemoteCallFailed);
    }

    /**
     * @private
     * When a user refreshes the live preview window, the injected live editor
     * and its dependecies get lost.
     *
     * This method attempts to re-inject them. It tries
     * a number of times before giving up.
     *
     * After a successful reconnect, it sets up the editor in the last cached state.
     *
     * @return {$.Promise}
     */
    function _reconnect() {
        var deferred = $.Deferred();

        function onPostInit() {
            _reset();
            setup(_cache.model);
            _retryCount = 5;
        }

        if (_retryCount === 0) {
            return deferred.reject();
        }

        _retryCount--;

        return init(_cache.dependencies).then(onPostInit);
    }

    exports.init    = init;
    exports.setup   = setup;
    exports.update  = update;
    exports.remove  = remove;
});
