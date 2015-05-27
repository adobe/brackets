/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4,
maxerr: 50, browser: true */
/*global define, URL */

/**
 * Not all browsers support everything we need for the live preview (I'm
 * looking at you, IE).  This code tests features we need, and provides
 * different strategies to solve those issues.
 */
define(function (require, exports, module) {
    "use strict";

    /*
     * Try to create a Blob URL with type text/html and put in an iframe.
     * IE won't allow it, so we have to use document.write().  The callback
     * returns true if Blob URLs of type text/html are supported.
     */
    var _supportsIFrameHTMLBlobURL;

    exports.supportsIFrameHTMLBlobURL = function(callback) {
        if(typeof _supportsIFrameHTMLBlobURL !== "undefined") {
            callback(null, _supportsIFrameHTMLBlobURL);
            return;
        }

        var blob = new Blob(["<div id='bloburl-test'></div>"], {type: "text/html"});
        var blobURL = URL.createObjectURL(blob);

        var iframe = document.createElement("iframe");
        iframe.style.display = "none";
        document.body.appendChild(iframe);

        var onloadTimer;

        function onload() {
            clearTimeout(onloadTimer);

            // If the iframe doesn't have the expected content, it didn't load properly
            try {
                _supportsIFrameHTMLBlobURL = !!(iframe.contentWindow.document.querySelector("#bloburl-test"));
                document.body.removeChild(iframe);
                iframe = null;
                URL.revokeObjectURL(blobURL);
                blob = null;
                blobURL = null;
            } catch(e) {
                _supportsIFrameHTMLBlobURL = false;
            }

            callback(null, _supportsIFrameHTMLBlobURL);
        }

        iframe.onload = onload;
        iframe.src = blobURL;

        // Just in case a browser doesn't fire onload for the iframe
        onloadTimer = setTimeout(onload, 1000);
    };
});
