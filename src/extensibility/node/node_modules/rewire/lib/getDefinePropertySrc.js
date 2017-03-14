"use strict";

var __get__ = require("./__get__.js");
var __set__ = require ("./__set__.js");
var __with__ = require("./__with__.js");

var srcs = {
    "__get__": __get__.toString(),
    "__set__": __set__.toString(),
    "__with__": __with__.toString()
};

function getDefinePropertySrc() {
    var src;

    src = Object.keys(srcs).reduce(function forEachSrc(preValue, value) {
        return preValue += "Object.defineProperty(module.exports, '" +
            value +
            "', {enumerable: false, value: " +
            srcs[value] +
            "}); ";
    }, "");

    return src;
}

module.exports = getDefinePropertySrc;