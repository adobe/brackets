/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global brackets: true */
(function () {
    "use strict";
    
    // Function to test whether a given error represents an illegal cross origin access
    var testCrossOriginError;
    
    if (navigator.userAgent.search(" Chrome/") !== -1) {
        // Chrome support
        testCrossOriginError = function (message, url, line) {
            return url === "" && line === 0 && message === "Script error.";
        };
    } else if (navigator.userAgent.slice(0, 6) === 'Opera/') {
        // Opera support
        testCrossOriginError = function (message, url, line) {
            return message === "Uncaught exception: DOMException: NETWORK_ERR";
        };
    }
    
    // Abort if running in the shell, running on a server or not running in a supported and affected browser
    if (typeof (brackets) !== "undefined"
            || document.location.href.substr(0, 7) !== "file://"
            || !testCrossOriginError) {
        return;
    }
    
    // Remember the current error handler to restore it once we're done
    var previousErrorHandler = window.onerror;
    
    // Our error handler
    function handleError(message, url, line) {
        // Ignore this error if it does not look like the rather vague cross origin error in Chrome
        // Chrome will print it to the console anyway
        if (!testCrossOriginError(message, url, line)) {
            if (previousErrorHandler) {
                return previousErrorHandler(message, url, line);
            }
            return;
        }
        
        // Show an error message
        alert("Oops! This application doesn't run in browsers yet.\n\nIt is built in HTML, but right now it runs as a desktop app so you can use it to edit local files. Please use the application shell in the following repo to run this application:\n\ngithub.com/adobe/brackets-shell");
        
        // Restore the original handler for later errors
        window.onerror = previousErrorHandler;
    }

    // Install our error handler
    window.onerror = handleError;
}());