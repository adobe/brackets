"use strict"; // run code in ES5 strict mode

var pathUtil = require("path"),
    match,
    basePath;



match = __dirname.match(/(.*)[\\\/].+[\\\/]rewire[\\\/]lib[\\\/]/);
if (match === null) {
    return (/\.js$/);
} else {
    basePath = match[1];
    basePath.replace(/([\\\/])/g, "\\$1");
    return new RegExp()
}