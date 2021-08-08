(function () {

    function define(msg) {
        log('STILL GOOD, inner define: ' + msg);
    }

    if (typeof define !== 'function') { var define = window.badDefine; }

    define("four.js script");


}());

