/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, describe, it, xit, expect, beforeEach, afterEach, waitsFor, runs, $, brackets, waitsForDone */

function funD_file3(a, b) {
    'use strict';
    var f = function () {return {x: a, y: b}; };
    return f;
}
var kf3 = funD_file3(10, 20);
kf3();

var hope = {frenchçProp2: "test", frenchçProp1: " new value", frenchçfun:frenchçProp() };
function frenchçProp(){
};

function frenchçProp(){
}
frenchçProp();

var 測试 = "test";
測试 = "new value";
// 測 test code hint
function fun測试(){
}
fun測试();  // test function type

function nonAsciiTest() {
    var hope;  // unknown type
    hope["frenchçProp"] = "";
    hope.frenchçProp2 = "test";
    hope.frenchçProp = "frenchçProp";
    fun測试();
    var month = getMonthName(5);
    A1.propA = "test";
}

function frenchçProp(){};
frenchçProp();

function UserException(message) {
   this.message = message;
   this.name = "UserException";
}

function getMonthName(mo) {
   mo = mo-1; // Adjust month number for array index (1=Jan, 12=Dec)
   var months = new Array("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul",
      "Aug", "Sep", "Oct", "Nov", "Dec");
   if (months[mo] !== undefined) {
      return months[mo];
   } else {
      throw new UserException("InvalidMonthNo"); // test exception
   }
}

function callOtherMethods() {
    testTryCatch();
    
}
function testTryCatch() {
    "use strict";
    try {
        var myMonth = 15; // 15 is out of bound to raise the exception      
    } catch (e) {
        myMonth = 12;
        console.log(e.message + e.name); // test e, e.message, e.name
    }
    try {
        var myMonth = 15; // 15 is out of bound to raise the exception
    } catch (e2) {
        myMonth = 12; // test local variable
        console.log(e2.message + e2.name); // test e, e.message, e.name
    }
}