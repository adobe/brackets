// This is a transport injected into the browser via a script that handles the low
// level communication between the live development protocol handlers on both sides.
// This transport provides a postMessage mechanism. It's injected separately from the
// protocol handler so that the transport can be changed separately.

(function (global) {
    "use strict";
    // In case of detached preview window.opener will refer to editor window
    var parent = window.opener || window.parent;
    var postMessageTransport = {
        /**
         * @private
         * An object that contains callbacks to handle various transport events. See `setCallbacks()`.
         * @type {?{connect: ?function, message: ?function(string), close: ?function}}
         */
        _callbacks: null,

        /**
         * Sets the callbacks that should be called when various transport events occur.
         */
        setCallbacks: function (callbacks) {
            this._callbacks = callbacks;
        },

        connect: function (url) {
            var self = this;

            parent.postMessage(JSON.stringify({
                type: "connect",
                url: global.location.href
            }), "*");

            if (self._callbacks && self._callbacks.connect) {
                self._callbacks.connect();
            }
        },

        /**
         * Sends a message over the transport.
         * @param {string} msgStr The message to send.
         */
        send: function (msgStr) {
            parent.postMessage(JSON.stringify({
                type: "message",
                message: msgStr
            }), "*");
        },

        /**
         * Establish postMessage connection.
         */
        enable: function () {
            this.connect();
            var self = this;

            // Listen for message.
            window.addEventListener("message", function (event) {
                if (self._callbacks && self._callbacks.message) {
                    self._callbacks.message(event.data);
                }
            });
        }
    };

    global._Brackets_LiveDev_Transport = postMessageTransport;
}(this));
