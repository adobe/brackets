/*global process */

var request = require("request");

request({
    uri: "https://api.github.com/repos/mozilla/brackets/contents/" + process.argv[2],
    method: "GET",
    headers: {
        "User-Agent": "gideonthomas"
    }
}, function(err, res, body) {
    "use strict";

    if(!err && res.statusCode === 200) {
        try {
            var content = JSON.parse(body);
            process.stdout.write(content.sha);
        } catch(e) {
            console.error("Failed to convert response to JSON with: ", e);
            process.exit(1);
        }
    } else {
        console.error("Failed to get file contents with: ", err || body);
        process.exit(1);
    }
});
