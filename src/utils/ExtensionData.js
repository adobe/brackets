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
    
    // begin PubSubJS (modified)
    var PubSub = {
        name: 'PubSubJS',
        version: '1.3.3'
    },
        messages = {},
        lastUid = -1;

	/**
	 *	Returns a function that throws the passed exception, for use as argument for setTimeout
	 *	@param { Object } ex An Error object
	 */
	function throwException(ex) {
		return function reThrowException() {
			throw ex;
		};
	}

	function callSubscriberWithDelayedExceptions(subscriber, envelope, data) {
		try {
			subscriber(data, envelope);
		} catch (ex) {
			setTimeout(throwException(ex), 0);
		}
	}

	function callSubscriberWithImmediateExceptions(subscriber, envelope, data) {
		subscriber(data, envelope);
	}

	function deliverMessage(originalMessage, matchedMessage, data, immediateExceptions) {
		var subscribers = messages[matchedMessage],
			callSubscriber = immediateExceptions ? callSubscriberWithImmediateExceptions : callSubscriberWithDelayedExceptions,
            i,
            j;

		if (!messages.hasOwnProperty(matchedMessage)) {
			return;
		}
        
        var sendWithDataFactory = function () {
            return function (requestedData) {
                callSubscriber(subscribers[i].func, {
                    message: originalMessage,
                    data: requestedData
                }, data);
            };
        };
        
		for (i = 0, j = subscribers.length; i < j; i++) {
            var options = subscribers[i].options;
            if (options && options.withData) {
                // TODO this could probably raise an exception with the
                // current code, which is not good.
                getData(options.withData).then(sendWithDataFactory());
            } else {
			    callSubscriber(subscribers[i].func, {
                    message: originalMessage
                }, data);
            }
		}
	}

	function createDeliveryFunction(message, data, immediateExceptions) {
		return function deliverNamespaced() {
			var topic = String(message),
				position = topic.lastIndexOf('.');

			// deliver the message as it is now
			deliverMessage(message, message, data, immediateExceptions);

			// trim the hierarchy and deliver message to each level
			while (position !== -1) {
				topic = topic.substr(0, position);
				position = topic.lastIndexOf('.');
				deliverMessage(message, topic, data);
			}
		};
	}

	function messageHasSubscribers(message) {
		var topic = String(message),
			found = messages.hasOwnProperty(topic),
			position = topic.lastIndexOf('.');

		while (!found && position !== -1) {
			topic = topic.substr(0, position);
			position = topic.lastIndexOf('.');
			found = messages.hasOwnProperty(topic);
		}

		return found;
	}
    
    function getSubscribers(message) {
		var topic = String(message),
			found = [],
			position = topic.lastIndexOf('.');
        
        function testTopic(topicName) {
            if (messages.hasOwnProperty(topicName)) {
                found.concat(messages[topicName]);
            }
        }
        
        testTopic(topic);
        
		while (position !== -1) {
			topic = topic.substr(0, position);
			position = topic.lastIndexOf('.');
			testTopic(topic);
		}

		return found;
    }

	function publish(message, data, sync, immediateExceptions) {
        if (exports._logMessages !== undefined && message.substring(0, exports._logMessages.length) === exports._logMessages) {
            console.log("PubSub: ", message, data);
        }
		var deliver = createDeliveryFunction(message, data, immediateExceptions),
			hasSubscribers = messageHasSubscribers(message);

		if (!hasSubscribers) {
			return false;
		}

		if (sync === true) {
			deliver();
		} else {
			setTimeout(deliver, 0);
		}
		return true;
	}

	/**
	 *	PubSub.publish( message[, data] ) -> Boolean
	 *	- message (String): The message to publish
	 *	- data: The data to pass to subscribers
	 *	Publishes the the message, passing the data to it's subscribers
	**/
	PubSub.publish = function (message, data) {
		return publish(message, data, false, PubSub.immediateExceptions);
	};

	/**
	 *	PubSub.publishSync( message[, data] ) -> Boolean
	 *	- message (String): The message to publish
	 *	- data: The data to pass to subscribers
	 *	Publishes the the message synchronously, passing the data to it's subscribers
	**/
	PubSub.publishSync = function (message, data) {
		return publish(message, data, true, PubSub.immediateExceptions);
	};

	/**
	 *	PubSub.subscribe( message, func ) -> String
	 *	- message (String): The message to subscribe to
	 *	- func (Function): The function to call when a new message is published
	 *	Subscribes the passed function to the passed message. Every returned token is unique and should be stored if 
	 *	you need to unsubscribe
	**/
	PubSub.subscribe = function (message, func, options) {
		// message is not registered yet
		if (!messages.hasOwnProperty(message)) {
			messages[message] = [];
		}

		// forcing token as String, to allow for future expansions without breaking usage
		// and allow for easy use as key names for the 'messages' object
		var token = String(++lastUid);
		messages[message].push({ token : token, func : func, options: options });
        
        PubSub.publish("subscribe." + message, {
            message: message,
            options: options
        });

		// return token for unsubscribing
		return token;
	};

	/**
	 *	PubSub.unsubscribe( tokenOrFunction ) -> String | Boolean
	 *  - tokenOrFunction (String|Function): The token of the function to unsubscribe or func passed in on subscribe
	 *  Unsubscribes a specific subscriber from a specific message using the unique token 
	 *  or if using Function as argument, it will remove all subscriptions with that function	
	**/
	PubSub.unsubscribe = function (tokenOrFunction) {
		var isToken = typeof tokenOrFunction === 'string',
			key = isToken ? 'token' : 'func',
			succesfulReturnValue = isToken ? tokenOrFunction : true,

			result = false,
			m,
            i;
		
		for (m in messages) {
			if (messages.hasOwnProperty(m)) {
				for (i = messages[m].length - 1; i >= 0; i--) {
					if (messages[m][i][key] === tokenOrFunction) {
						messages[m].splice(i, 1);
						result = succesfulReturnValue;

						// tokens are unique, so we can just return here
						if (isToken) {
							return result;
						}
					}
				}
			}
		}

		return result;
	};
    
    // End PubSubJS (modified)
    
    var ExtensionData = function (extensionName, metadata) {
        this.extensionName = extensionName;
        this.metadata = metadata || {};
        this.tokens = [];
        this.sharedData = [];
    };
    
    ExtensionData.prototype.publish = PubSub.publish;
    ExtensionData.prototype.subscribe = function (message, callback, options) {
        var token = PubSub.subscribe(message, callback, options);
        this.tokens.push(token);
    };
    ExtensionData.prototype.willPublish = function (message, metadata) {
    };
    
    ExtensionData.prototype.shareData = function (name, getter) {
        sharedData[name] = getter;
        this.sharedData.push(name);
    };
    
    ExtensionData.prototype.getData = getData;
    
    ExtensionData.prototype.getSubscribers = getSubscribers;
    
    function registerExtension(extensionName, metadata) {
        var ed = new ExtensionData(extensionName);
        extensions[extensionName] = ed;
        return ed;
    }
    
    exports.registerExtension = registerExtension;
    exports.core = registerExtension("core");
    exports._logMessages = "";
});