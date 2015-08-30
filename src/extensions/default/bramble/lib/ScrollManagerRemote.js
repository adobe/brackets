/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, forin: true, maxerr: 50, regexp: true, bitwise: true */
/* global addEventListener, sessionStorage */
(function() {
    "use strict";

    var SCROLL_KEY = "___bramble-preview-scrollTop::" + window.___brambleFilename;

    // Retore last scroll position for this session (if any)
    addEventListener("DOMContentLoaded", function() {
        document.body.scrollTop = sessionStorage.getItem(SCROLL_KEY)|0;
    }, false);

    // Remember last scroll position for this document
    addEventListener("scroll", function() {
        sessionStorage.setItem(SCROLL_KEY, document.body.scrollTop);
    }, false);
}());
