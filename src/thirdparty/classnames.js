//    https://github.com/JedWatson/classnames
//
//    The MIT License (MIT)
//
//    Copyright (c) 2015 Jed Watson
//
//    Permission is hereby granted, free of charge, to any person obtaining a copy
//    of this software and associated documentation files (the "Software"), to deal
//    in the Software without restriction, including without limitation the rights
//    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
//    copies of the Software, and to permit persons to whom the Software is
//    furnished to do so, subject to the following conditions:
//
//    The above copyright notice and this permission notice shall be included in all
//    copies or substantial portions of the Software.
//
//    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
//    SOFTWARE.

define(function (require, exports, module) {
    "use strict";

    function classNames() {
        var classes = '';
        var arg;

        for (var i = 0; i < arguments.length; i++) {
            arg = arguments[i];
            if (!arg) {
                continue;
            }

            if ('string' === typeof arg || 'number' === typeof arg) {
                classes += ' ' + arg;
            } else if (Object.prototype.toString.call(arg) === '[object Array]') {
                classes += ' ' + classNames.apply(null, arg);
            } else if ('object' === typeof arg) {
                for (var key in arg) {
                    if (!arg.hasOwnProperty(key) || !arg[key]) {
                        continue;
                    }
                    classes += ' ' + key;
                }
            }
        }
        return classes.substr(1);
    }

    // safely export classNames in case the script is included directly on a page
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = classNames;
    }
    
});
