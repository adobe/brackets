/* global Window, Uint8Array */
define(function (require, exports, module) {
    "use strict";

    var UUID = require("bramble/thirdparty/MessageChannel/uuid.core");
    var nativeMessageChannel = window.MessageChannel && !window.MessageChannel._shim;

    // This papers over the differences between postMessage'ing the
    // MessagePort with native MessageChannel vs. the shim (which uses
    // window.postMessage behind the scene).
    function postMsg(win, args) {
        if(nativeMessageChannel) {
            win.postMessage.apply(win, args);
        } else {
            args.unshift(win);
            Window.postMessage.apply(Window, args);
        }
    }

    // We have to be careful trying to transfer ArrayBuffer in postMessage
    // in Blink (and also Safari, it seems):
    // https://code.google.com/p/chromium/issues/detail?id=334408&q=transferable&colspec=ID%20Pri%20M%20Week%20ReleaseBlock%20Cr%20Status%20Owner%20Summary%20OS%20Modified
    //
    // Here we try to transfer an ArrayBuffer as the first thing we do, and see
    // if we get it back correctly.
    function checkArrayBufferTransfer(port, callback) {
        var numbers = [1, 2, 3, 4];
        var data = new Uint8Array(numbers);
        var buffer = data.buffer;

        function checkArrayBufferTransferHandler(e) {
            port.removeEventListener("message", checkArrayBufferTransferHandler, false);

            try {
                var a = new Uint8Array(numbers);
                var b = new Uint8Array(e.data.buffer);

                callback(null, a.length === b.length &&
                               a[0] === b[0]         &&
                               a[1] === b[1]         &&
                               a[2] === b[2]         &&
                               a[3] === b[3]);
            } catch(err) {
                callback(null, false);
            }
        }

        port.addEventListener("message", checkArrayBufferTransferHandler, false);
        port.postMessage({buffer: buffer}, [buffer]);
    }

    exports.checkArrayBufferTransfer = checkArrayBufferTransfer;
    exports.postMessage = postMsg;
    exports.UUID = UUID;
});
