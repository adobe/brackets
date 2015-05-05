/*jshint globalstrict:true, node:true*/

"use strict";

var _ = require("lodash");
_.mixin(require("lodash-deep"));

var state = {
    socketServer: {
        state: "ERR_NODE_NOT_YET_STARTED",
        port: null
    }
};

module.exports = {
    get: function (key) { return _.deepGet(state, key); },
    set: function (key, value) { return _.deepSet(state, key, value); }
};
