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


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, window, setTimeout */

/**
 * ExtensionData stores subscriptions and shared data references.
 */

define(function (require, exports, module) {
    'use strict';
    
    var postal = require("thirdparty/postal");
    var _ = require("thirdparty/underscore");
    require("thirdparty/postal.diagnostics");
    var wireTap = new postal.diagnostics.DiagnosticsWireTap({name: "console"});
    
    var publishers = {};
    var sharedData = {};
    var extensions = {};
    
    function getData(names) {
        if (typeof names === "string") {
            names = [names];
        }
        var promises = [];
        names.forEach(function (name) {
            if (sharedData.hasOwnProperty(name)) {
                var getter = sharedData[name];
                if (getter) {
                    promises.push(getter());
                }
            }
        });
        var d = $.Deferred();
        $.when.apply($, promises).then(function () {
            var args = arguments;
            var result = {};
            names.forEach(function (name, i) {
                result[name] = args[i];
            });
            d.resolve(result);
        });
        
        return d.promise();
    }
    
    postal.configuration.bus.augmentEnvelope = function (subDef, envelope) {
        var options = subDef.options;
        if (options && options.withData) {
            return getData(options.withData).then(function (data) {
                envelope.data = data;
            });
        }
    };
        
    postal.SubscriptionDefinition.prototype.withOptions = function (options) {
        this.options = options;
    };
    
    function WrappedChannel(ext, channelName) {
        this._ext = ext;
        this._channel = postal.channel(channelName);
    }
    
    WrappedChannel.prototype.subscribe = function (topic, callback, options) {
        options = options || {};
        options.extensionName = this._ext.extensionName;
        var sub = this._channel.subscribe(topic, callback, options);
        this._ext._addSubscription(sub);
        return sub;
    };
    
    WrappedChannel.prototype.publish = function (topic, data) {
		var envelope = arguments.length === 1 ?
		                (Object.prototype.toString.call(topic) === '[object String]' ?
	                        { topic: topic } : topic) : { topic : topic, data : data };
		envelope.channel = this._channel.channel;
        envelope.extensionName = this._ext.extensionName;
		return postal.configuration.bus.publish(envelope);
    };
    
    function ExtensionData(extensionName, metadata) {
        this.extensionName = extensionName;
        this.metadata = metadata || {};
        this._subscriptions = [];
        this._sharedData = [];
    }
    
    ExtensionData.prototype.channel = function (channelName) {
        return new WrappedChannel(this, channelName);
    };
    
//    ExtensionData.prototype.publish = PubSub.publish;
//    ExtensionData.prototype.subscribe = function (message, callback, options) {
//        var token = PubSub.subscribe(message, callback, options);
//        this.tokens.push(token);
//    };
//    ExtensionData.prototype.willPublish = function (message, metadata) {
//    };
    
    ExtensionData.prototype.shareData = function (name, getter) {
        sharedData[name] = getter;
        this._sharedData.push(name);
    };
    
    ExtensionData.prototype.getData = getData;

    ExtensionData.prototype._addSubscription = function (sub) {
        this._subscriptions.push(sub);
    };
    
    ExtensionData.prototype._unregister = function () {
        this._sharedData.forEach(function (name) {
            delete sharedData[name];
        });
        this._subscriptions.forEach(function (sub) {
            sub.unsubscribe();
        });
    };
        
    function registerExtension(extensionName, metadata) {
        var ed = new ExtensionData(extensionName);
        extensions[extensionName] = ed;
        return ed;
    }
    
    function unregisterExtension(extensionName) {
        var ed = extensions[extensionName];
        ed._unregister();
    }
    
    var core = exports.core = registerExtension("core");
    
    exports.registerExtension = registerExtension;
    exports.unregisterExtension = unregisterExtension;
    exports._logMessages = "";
});