/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, forin: true, maxerr: 50, regexp: true, bitwise: true */
/* global addEventListener, window */
(function() {
    "use strict";

    function handleClick(e) {
        var url = e.target.getAttribute("href");

        // For local paths vs. absolute URLs, try to open the right file.
        // Special case (i.e., pass through) some common, non-http(s) protocol
        // schemes so they work as expected.
        if(/^(javascript|mailto|data|blob):/.test(url)) {
            return true;
        }

        if(!(/\:?\/\//.test(url)) && window._Brackets_LiveDev_Transport) {
            window._Brackets_LiveDev_Transport.send("bramble-navigate:" + url);
        } else {
            window.open(url, "_blank");
        }

        return false;
    }

    addEventListener("DOMContentLoaded", function init() {
        // Intercept clicks to <a> in the document.
        var links = document.links;
        var len = links.length;

        for(var i=0; i<len; i++) {
            links[i].onclick = handleClick;
        }
    }, false);
}());
