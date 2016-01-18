/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, forin: true, maxerr: 50, regexp: true, bitwise: true */
/* global addEventListener, removeEventListener, sessionStorage */
(function(transport) {
    "use strict";

    var SCROLL_KEY = "___bramble-preview-scrollTop::" + window.___brambleFilename;

    var listening = false;

    function sendHighlightInfo(e) {
        var x = e.pageX - window.pageXOffset;
        var y = e.pageY - window.pageYOffset;
        var elem = document.elementFromPoint(x, y);
        if(!elem) {
            return;
        }

        var ds = elem.dataset;
        if(!(ds.brambleStartLine && ds.brambleStartCh && ds.brambleEndLine && ds.brambleEndCh)) {
            return;
        }

        // If the element has a brackets-id, and this was a click,
        // use that info to highlight it. Don't bother for mousemove.
        var bracketsId = ds.bracketsId;
        if(bracketsId) {
            bracketsId = "," + bracketsId;
        }

        transport.send("bramble-highlight-lines:" + ds.brambleStartLine + "," +
            ds.brambleStartCh + "," + ds.brambleEndLine + "," + ds.brambleEndCh + bracketsId);
    }

    function shouldIgnoreElemEvent(e) {
        // Ignore mouseout for any inner elements (just for entire window)
        var from = e.relatedTarget || e.toElement;
        if(!from || from.nodeName === "HTML") {
            // Further filter things by only responding to events close to the left/top
            if(e.clientX <= 32 || e.clientY <= 32) {
                return false;
            }
        }

        return true;
    }

    function startListener() {
        if(listening) {
            return;
        }

        addEventListener("mousemove", sendHighlightInfo, false);
        listening = true;
    }

    function stopListener() {
        if(!listening) {
            return;
        }

        removeEventListener("mousemove", sendHighlightInfo, false);
        listening = false;
    }

    addEventListener("DOMContentLoaded", function() {
        // Restore last scroll position for this session (if any)
        document.body.scrollTop = sessionStorage.getItem(SCROLL_KEY)|0;

        // Do not listen for mouse events relevant for the inspector
        // if there is no livedoc
        if(!transport) {
            return;
        }

        startListener();

        // If the user clicks on an element, stop inspecting with mousemove (pin editor)
        addEventListener("click", function(e) {
            transport.send("bramble-inspector-disable");
            stopListener();
            sendHighlightInfo(e);
        });

        addEventListener("mouseout", function(e) {
            if(!shouldIgnoreElemEvent(e)) {
                // Start listening for user inspecting elements (again)
                startListener();
                return false;
            }
        });

    }, false);

    // Remember last scroll position for this document
    addEventListener("scroll", function() {
        sessionStorage.setItem(SCROLL_KEY, document.body.scrollTop);
    }, false);

}(window._Brackets_LiveDev_Transport));
