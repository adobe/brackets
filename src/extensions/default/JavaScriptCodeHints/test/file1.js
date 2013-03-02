/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global brackets, $ */

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
}
