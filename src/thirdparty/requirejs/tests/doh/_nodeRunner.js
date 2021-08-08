
/*global doh: false, process: false */

var aps = Array.prototype.slice;

doh.debug = function () {
    //Could have multiple args, join them all together.
    var msg = aps.call(arguments, 0).join(' ');
    console.log(msg);
};

// Override the doh._report method to make it quit with an
// appropriate exit code in case of test failures.
var oldReport = doh._report;
doh._report = function () {
    oldReport.apply(doh, arguments);
    if (this._failureCount > 0 || this._errorCount > 0) {
        process.exit(1);
    }
};
