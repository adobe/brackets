/*jshint onevar: false, indent:4, expr: true */
/*global define */
define(function (require, exports, module) {
    "use strict";

    function queueFn(fn, queue) {
        queue.push(fn);
    }

    function runFn(fn) {
        fn.call(null);
    }

    function Queue() {
        this.items = [];
        this.exec = function(fn) {
            queueFn(fn, this.items);
        };
    }
    Queue.prototype.ready = function() {
        if (!this.items) {
            return;
        }

        this.items.forEach(function(fn) {
            fn.call(null);
        });

        this.items = null;
        this.exec = runFn;
    };

    module.exports = new Queue();
});
