/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, forin: true, maxerr: 50, regexp: true */
/* global define, brackets */

define(function (require, exports, module) {
    "use strict";

    var fs = brackets.getModule("filesystem/impls/filer/BracketsFiler").fs();
    var transport = require("lib/PostMessageTransport");

    module.exports.handleRequest = function(path) {
        var response = {method: "XMLHttpRequest"};

        // For now, we support text based requests only
        fs.readFile(path, "utf8", function(err, data) {
            if(err) {
                if(err.code === "ENOENT") {
                    response.error = "No resource found for `" + path + "`";
                    response.status = 404;
                } else {
                    response.error = "Could not complete the request";
                    response.status = 500;
                }
            } else {
                response.content = data;
            }

            transport.send(null, JSON.stringify(response));
        });
    };
});
