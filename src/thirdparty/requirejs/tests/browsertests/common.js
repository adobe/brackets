//Common functions for the test files. *MUST* be included after require.js.

(function() {
    var messages = [];
    var bodyReady = false;
  
    window.log = function(message) {
        if (typeof console != "undefined" && console.log) {
            console.log(message);
        } else {
            messages.push(message);
            if (bodyReady) {
                dumpLogs();
            }
        }
    }
  
    function dumpLogs() {
        bodyReady = true;
        if (messages.length) {
            var body = document.getElementsByTagName("body")[0];
            if (body) {
                for (var i = 0; i < messages.length; i++) {
                    var div = document.createElement("div");
                    div.innerHTML = messages[i];
                    body.appendChild(div);
                }
            }
            messages =[];
        }
    }

    //Wait for document ready before dumping results.
    //Will not work with Firefox 3.5 or earlier, but just
    //be sure to use Firebug or something that defines console.log
    var tries = 0;
    function checkDom() {
        if (document.readyState === "complete") {
            dumpLogs();
        } else if (tries < 5) {
            tries += 1;
            setTimeout(checkDom, 1000);
        }
    }

    checkDom();
})();