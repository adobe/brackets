/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define */
define(function (require, exports, module) {
    "use strict";

    /**
     * Management of the remote connection to a Filer FileSystem running in
     * the hosting window holding this iframe. This code needs to get started
     * early, so that fs operations run quickly on startup.
     */

    var fnQueue = require("filesystem/impls/filer/lib/queue");
    var ChannelUtils = require("bramble/ChannelUtils");
    var UUID = ChannelUtils.UUID;
    var allowArrayBufferTransfer;
    var port;

    // Remote filesystem callbacks
    var callbackQueue = {};

    function remoteFSCallbackHandler(e) {
        var data = e.data;
        var callbackItem = callbackQueue[data.callback];
        if(!callbackItem.persist) {
            delete callbackQueue[data.callback];
        }
        callbackItem.callback.apply(null, data.result);
    }

    function receiveMessagePort(e) {
        var data = e.data;
        try {
            data = JSON.parse(data);
            data = data || {};
        } catch(err) {
            data = {};
        }

        if (data.type === "bramble:filer") {
            window.removeEventListener("message", receiveMessagePort, false);
            port = e.ports[0];
            port.start();

            ChannelUtils.checkArrayBufferTransfer(port, function(err, isAllowed) {
                allowArrayBufferTransfer = isAllowed;
                port.addEventListener("message", remoteFSCallbackHandler, false);
                fnQueue.ready();
            });
        }
    }

    function init() {
        // Request the that remote FS be setup
        window.addEventListener("message", receiveMessagePort, false);
        window.parent.postMessage(JSON.stringify({type: "bramble:filer"}), "*");
    }

    function proxyCall(fn, options, callback) {
        var id = UUID.generate();
        callbackQueue[id] = {
            callback: callback,
            persist: options.persist
        };

        fnQueue.exec(function() {
            var transferable;
            if (allowArrayBufferTransfer && options.transfer) {
                transferable = [options.transfer];
            }
            port.postMessage({method: fn, callback: id, args: options.args}, transferable);
        });
    }

    exports.init = init;
    exports.proxyCall = proxyCall;
});
