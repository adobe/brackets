/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, describe, it, xit, expect, beforeEach, afterEach, waitsFor, runs, $, brackets, waitsForDone */

function nonAsciiTest() {
    var hope;  // unknown type
    var month = getMonthName(5);
    A1.propA = "test";
}

function getMonthName(mo) {
   mo = mo-1; // Adjust month number for array index (1=Jan, 12=Dec)
   var months = new Array("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul",
      "Aug", "Sep", "Oct", "Nov", "Dec");
   if (months[mo] !== undefined) {
      return months[mo];
   } else {
      return null;
   }
}

