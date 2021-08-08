/*jslint strict: false */
/*global define: false, module: false, require: false, window: false */

(function (define) {
    //The 'id' is optional, but recommended if this is
    //a popular web library that is used mostly in
    //non-AMD/Node environments.
    define('spell', function (require) {
        //If have dependencies, get them here
        var newt = require('newt');

        //Return the module definition.
        return {
            name: 'spell',
            newtName: newt.name,
            tailName: newt.tailName,
            eyeName: newt.eyeName
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
