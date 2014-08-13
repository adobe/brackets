/*
 * Copyright (c) 2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Dispatcher
 * @typechecks
 */

/*globals define */
define(function (require, exports, module) {
  "use strict";

  var invariant = require('./invariant');

  var _lastID = 1;
  var _prefix = 'ID_';

  /**
   * Dispatcher is used to broadcast payloads to registered callbacks. This is
   * different from generic pub-sub systems in two ways:
   *
   *   1) Callbacks are not subscribed to particular events. Every payload is
   *      dispatched to every registered callback.
   *   2) Callbacks can be deferred in whole or part until other callbacks have
   *      been executed.
   *
   * For example, consider this hypothetical flight destination form, which
   * selects a default city when a country is selected:
   *
   *   var flightDispatcher = new Dispatcher();
   *
   *   // Keeps track of which country is selected
   *   var CountryStore = {country: null};
   *
   *   // Keeps track of which city is selected
   *   var CityStore = {city: null};
   *
   *   // Keeps track of the base flight price of the selected city
   *   var FlightPriceStore = {price: null}
   *
   * When a user changes the selected city, we dispatch the payload:
   *
   *   flightDispatcher.dispatch({
   *     actionType: 'city-update',
   *     selectedCity: 'paris'
   *   });
   *
   * This payload is digested by `CityStore`:
   *
   *   flightDispatcher.register(function(payload)) {
   *     if (payload.actionType === 'city-update') {
   *       CityStore.city = payload.selectedCity;
   *     }
   *   });
   *
   * When the user selects a country, we dispatch the payload:
   *
   *   flightDispatcher.dispatch({
   *     actionType: 'country-update',
   *     selectedCountry: 'australia'
   *   });
   *
   * This payload is digested by both stores:
   *
   *    CountryStore.dispatchToken = flightDispatcher.register(function(payload) {
   *     if (payload.actionType === 'country-update') {
   *       CountryStore.country = payload.selectedCountry;
   *     }
   *   });
   *
   * When the callback to update `CountryStore` is registered, we save a reference
   * to the returned token. Using this token with `waitFor()`, we can guarantee
   * that `CountryStore` is updated before the callback that updates `CityStore`
   * needs to query its data.
   *
   *   CityStore.dispatchToken = flightDispatcher.register(function(payload) {
   *     if (payload.actionType === 'country-update') {
   *       // `CountryStore.country` may not be updated.
   *       flightDispatcher.waitFor([CountryStore.dispatchToken]);
   *       // `CountryStore.country` is now guaranteed to be updated.
   *
   *       // Select the default city for the new country
   *       CityStore.city = getDefaultCityForCountry(CountryStore.country);
   *     }
   *   });
   *
   * The usage of `waitFor()` can be chained, for example:
   *
   *   FlightPriceStore.dispatchToken =
   *     flightDispatcher.register(function(payload)) {
   *       switch (payload.actionType) {
   *         case 'country-update':
   *           flightDispatcher.waitFor([CityStore.dispatchToken]);
   *           FlightPriceStore.price =
   *             getFlightPriceStore(CountryStore.country, CityStore.city);
   *           break;
   *
   *         case 'city-update':
   *           FlightPriceStore.price =
   *             FlightPriceStore(CountryStore.country, CityStore.city);
   *           break;
   *     }
   *   });
   *
   * The `country-update` payload will be guaranteed to invoke the stores'
   * registered callbacks in order: `CountryStore`, `CityStore`, then
   * `FlightPriceStore`.
   */
  function Dispatcher() {
    this._callbacks = {};
    this._isPending = {};
    this._isHandled = {};
    this._isDispatching = false;
    this._pendingPayload = null;
  }

  Dispatcher.prototype = {

    /**
     * Registers a callback to be invoked with every dispatched payload. Returns
     * a token that can be used with `waitFor()`.
     *
     * @param {function} callback
     * @return {string}
     */
    register: function (callback) {
      var id = _prefix + _lastID++;
      this._callbacks[id] = callback;
      return id;
    },

    /**
     * Removes a callback based on its token.
     *
     * @param {string} id
     */
    unregister: function (id) {
      invariant(
        this._callbacks[id],
        'Dispatcher.unregister(...): `%s` does not map to a registered callback.',
        id
      );
      delete this._callbacks[id];
    },

    /**
     * Waits for the callbacks specified to be invoked before continuing execution
     * of the current callback. This method should only be used by a callback in
     * response to a dispatched payload.
     *
     * @param {array<string>} ids
     */
    waitFor: function (ids) {
      invariant(
        this._isDispatching,
        'Dispatcher.waitFor(...): Must be invoked while dispatching.'
      );
      
      var ii;

      for (ii = 0; ii < ids.length; ii++) {
        var id = ids[ii];
        if (this._isPending[id]) {
          invariant(
            this._isHandled[id],
            'Dispatcher.waitFor(...): Circular dependency detected while ' +
              'waiting for `%s`.',
            id
          );
        } else {
          invariant(
            this._callbacks[id],
            'Dispatcher.waitFor(...): `%s` does not map to a registered callback.',
            id
          );
          this._invokeCallback(id);
        }
      }
    },

    /**
     * Dispatches a payload to all registered callbacks.
     *
     * @param {object} payload
     */
    dispatch: function (payload) {
      invariant(
        !this._isDispatching,
        'Dispatch.dispatch(...): Cannot dispatch in the middle of a dispatch.'
      );
      
      this._startDispatching(payload);
      try {
        Object.keys(this._callbacks).forEach(function (id) {
          if (!this._isPending[id]) {
            this._invokeCallback(id);
          }
        });
      } finally {
        this._stopDispatching();
      }
    },

    /**
     * Is this Dispatcher currently dispatching.
     *
     * @return {boolean}
     */
    isDispatching: function () {
      return this._isDispatching;
    },

    /**
     * Call the callback stored with the given id. Also do some internal
     * bookkeeping.
     *
     * @param {string} id
     * @internal
     */
    _invokeCallback: function (id) {
      this._isPending[id] = true;
      this._callbacks[id](this._pendingPayload);
      this._isHandled[id] = true;
    },

    /**
     * Set up bookkeeping needed when dispatching.
     *
     * @param {object} payload
     * @internal
     */
    _startDispatching: function (payload) {
      Object.keys(this._callbacks).forEach(function (id) {
        this._isPending[id] = false;
        this._isHandled[id] = false;
      });
      this._pendingPayload = payload;
      this._isDispatching = true;
    },

    /**
     * Clear bookkeeping used for dispatching.
     *
     * @internal
     */
    _stopDispatching: function () {
      this._pendingPayload = null;
      this._isDispatching = false;
    }
  };

  module.exports = Dispatcher;
});
