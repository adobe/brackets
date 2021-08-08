/*jslint strict: false */
/*global define: false, module: false, require: false, window: false */

(function (define) {
    //The 'id' is optional, but recommended if this is
    //a popular web library that is used mostly in
    //non-AMD/Node environments.
    define(function (require) {
        //If have dependencies, get them here
        var tail = require('tail'),
            eye = require('eye');

        //Return the module definition.
        return {
            name: 'newt',
            eyeName: eye.name,
            tailName: tail.name
        };
    });
}(typeof define === 'function' && define.amd ? define : function (id, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        //Node
        module.exports = factory(require);
    } else {
        //Create a global function. Only works if
        //the code does not have dependencies, or
        //dependencies fit the call pattern below.
        window.myGlobal = factory(function (value) {
            return window[value];
        });
    }
}));
