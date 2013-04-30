/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global brackets, require */

var A1 = { propA : 1 },
    A2 = { propA : 2 },
    A3 = A2;

function funB(paramB1, paramB2) {
    'use strict';
    
    var B1 = { propB : 1 },
        B2 = { propB : 2 };

    function funC(paramC1, paramC2) {
        var C1 = { propC : 1 },
            C2 = { propC : 2 };

        B1.propB = 0;
        C1.propC = 0;
        B1.foo = 0;
        console.log("hello\\\" world!");
    }
    
    var s = "a string";
    var r = s;
    var t = r;

}

/**
 * @param {string} a
 * @param {number} b
 */
function funD(a, b) {
    "use strict";
    return {x: a, y: b};
}

require(["MyModule"], function (myModule) {
    'use strict';
    var x = myModule.a;
});

funB();
var x = A1;