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

var arr = [];
arr["my-key"] = 1;
arr["for"] = 10;

function MClass() {
    "use strict";
}
MClass.prototype.calc = function (a4, b4) {
    "use strict";
    return a4 + b4;
};

var ins1 = new MClass();
ins1.calc(10, 10);

var Person = function (name) {
    "use strict";
    this.name = name;
};

Person.prototype.getName = function () {
    "use strict";
    return this.name;
};

var Customer = function (name) {
    "use strict";
    this.name = name;
};

Customer.prototype = new Person();

var myCustomer = new Customer('Dream Inc.');
myCustomer.getName();

Customer.prototype.setAmountDue = function (amountDue) {
    "use strict";
    this.amountDue = amountDue;
};
Customer.prototype.getAmountDue = function () {
    "use strict";
    return this.amountDue;
};

function testInnerFunc() {
    "use strict";
    var t = "test";
    function innerFunc(arg) {
        return {t: function () {return arg; }};
    }
    var t2 = innerFunc("test").t().toLocaleLowerCase();
    
}

/**
 * @param {boolean} a
 * @param {Date} b
 */

function funTypeAn1(a, b) {
    "use strict";
    return {x: a, y: b};
}

/**
 * @param {function(): number} f
 */
function funFuncArg(f) {
    "use strict";
    return f();
}

function testRef1() {
    "use strict";
    return 100;
}

funFuncArg(testRef1); //also test return type
    
/**
 * @param {function(string,number): string} f
 */
function funFunc2Arg(f) {
    "use strict";
    var s = "test";
    return f(s, 10);
}

function testRef2(s, n) {
    "use strict";
    return s + n;
}

funFunc2Arg(testRef2);

var funArr = [];
funArr.index1 = testRef1;
funArr.index2 = testRef2;

var _A1 = A1;

var s = "", // string type
    help;   // unknown type

function testNonAscii() {
    "use strict";
    var hope;  // unknown type
    hope["frenchçProp"] = "";
    
}

require(["MyModule"], function (myModule) {
    'use strict';
    var x = myModule.c;
});


/**
 *  Test record type google annoations.
 *
 *  @param {{index: number, name: string}} t
 */
function testRecordTypeAnnotation(t) {
    'use strict';
    
}

// More parameter hint testing
function functionHintTesting() {
    "use strict";

    // function with record type argument
    testRecordTypeAnnotation();
    
    // function with a function argument
    arr.sort();

    // function with array argument
    arr.concat();

    s.lastIndexOf(s, 5);

}

/**
 *  Test Array annotation
 * 
 *  @param {Array.<string>} a
 */
function testArrayAnnotation(a) {
    "use strict";
    
}

testArrayAnnotation();

/**
 *  Test multiple optional args
 *
 * @param {number=} a
 * @param {string=} b
 *
 */
function testOptionalArgs(a, b) {
    "use strict";
    
}

testOptionalArgs();

/* Add large comment to make this test over 250 lines which will trigger
 *  partial updates to be used.
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 * end of large comment
 */
