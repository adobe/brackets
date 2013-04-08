/**
 * Shims built-in async functions and automatically wraps callbacks with "wrap"
 * @param {function} wrap The function to return the new callback
 */
module.exports = function hook(wrap) {
	if (alreadyRequired) throw new Error("This should only be required and used once");
	alreadyRequired = true;
	
	// Wrap setTimeout and setInterval
	["setTimeout", "setInterval"].forEach(function (name) {
		var original = this[name];
		this[name] = function (callback) {
			arguments[0] = wrap(callback, name);
			return original.apply(this, arguments);
		};
	});
	
	// Wrap process.nextTick
	var nextTick = process.nextTick;
	process.nextTick = function wrappedNextTick(callback) {
		arguments[0] = wrap(callback, 'process.nextTick');
		return nextTick.apply(this, arguments);
	};
	
	// Wrap FS module async functions
	var FS = require('fs');
	Object.keys(FS).forEach(function (name) {
		// If it has a *Sync counterpart, it's probably async
		if (!FS.hasOwnProperty(name + "Sync")) return;
		var original = FS[name];
		FS[name] = function () {
			var i = arguments.length - 1;
			if (typeof arguments[i] === 'function') {
				arguments[i] = wrap(arguments[i], 'fs.'+name);
			}
			return original.apply(this, arguments); 
		};
	});
	
	// Wrap EventEmitters
	var EventEmitter = require('events').EventEmitter;
	var onEvent = EventEmitter.prototype.on;
	EventEmitter.prototype.on = EventEmitter.prototype.addListener = function (type, callback) {
		var newCallback = wrap(callback, 'EventEmitter.on');
		if (newCallback !== callback) {
			callback.wrappedCallback = newCallback;
			arguments[1] = newCallback;
		}
		return onEvent.apply(this, arguments);
	};
	var removeEvent = EventEmitter.prototype.removeListener;
	EventEmitter.prototype.removeListener = function (type, callback) {
		if (callback && callback.hasOwnProperty("wrappedCallback")) {
			arguments[1] = callback.wrappedCallback;
		}
		return removeEvent.apply(this, arguments);
	};
}

var alreadyRequired;

