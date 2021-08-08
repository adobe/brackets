
if (typeof define !== 'function') { var define = window.badDefine; }

define("two.js script");
setTimeout(function () {
    define("two.js timeout, expected");
}, 13);