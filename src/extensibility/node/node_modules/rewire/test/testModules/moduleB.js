"use strict"; // run code in ES5 strict mode

var someOtherModule = require("./someOtherModule.js"),
    myNumber = 0,   // copy by value
    myObj = {},     // copy by reference
    env = "bla",
    fs;

// We need getters and setters for private vars to check if our injected setters and getters actual work
function setMyNumber(newNumber) {
    myNumber = newNumber;
}

function getMyNumber() {
    return myNumber;
}

function setMyObj(newObj) {
    myObj = newObj;
}

function getMyObj() {
    return myObj;
}

function readFileSync() {
    fs.readFileSync("bla.txt", "utf8");
}

function checkSomeGlobals() {
    var isLowerIE,
        typeOfGlobalFunc;

    if (typeof navigator !== "undefined") {
        isLowerIE = /MSIE [6-8]\.[0-9]/g.test(navigator.userAgent);
    }
    if (isLowerIE) {
        typeOfGlobalFunc = "object";
    } else {
        typeOfGlobalFunc = "function";
    }

    if (typeof global !== "object") {
        throw new ReferenceError("global is not an object");
    }
    if (typeof console !== "object") {
        throw new ReferenceError("console is not an object");
    }
    if (typeof require !== "function") {
        throw new ReferenceError("require is not a function");
    }
    if (typeof module !== "object") {
        throw new ReferenceError("module is not an object");
    }
    if (typeof exports !== "object") {
        throw new ReferenceError("exports is not an object");
    }
    if (module.exports === exports) {
        throw new Error("module.exports === exports returns true");
    }
    if (typeof __dirname !== "string") {
        throw new ReferenceError("__dirname is not a string");
    }
    if (typeof __filename !== "string") {
        throw new ReferenceError("__filename is not a string");
    }
    if (typeof setTimeout !== typeOfGlobalFunc) {
        throw new ReferenceError("setTimeout is not a function");
    }
    if (typeof clearTimeout !== typeOfGlobalFunc) {
        throw new ReferenceError("clearTimeout is not a function");
    }
    if (typeof setInterval !== typeOfGlobalFunc) {
        throw new ReferenceError("setInterval is not a function");
    }
    if (typeof clearInterval !== typeOfGlobalFunc) {
        throw new ReferenceError("clearInterval is not a function");
    }
    if (typeof Error !== "function") {
        throw new ReferenceError("Error is not a function");
    }
    if (typeof parseFloat !== "function") {
        throw new ReferenceError("parseFloat is not a function");
    }
    if (typeof parseInt !== "function") {
        throw new ReferenceError("parseInt is not a function");
    }
    if (typeof window === "undefined") {
        if (typeof process !== "object") {
            throw new ReferenceError("process is not an object");
        }
        if (typeof Buffer !== "function") {
            throw new ReferenceError("Buffer is not a function");
        }
    } else {
        if (typeof encodeURIComponent !== "function") {
            throw new ReferenceError("encodeURIComponent is not a function");
        }
        if (typeof decodeURIComponent !== "function") {
            throw new ReferenceError("decodeURIComponent is not a function");
        }
        if (typeof document !== "object") {
            throw new ReferenceError("document is not an object");
        }
    }
}

function getConsole() {
    return console;
}

function getFilename() {
    return __filename;
}

function getBuffer() {
    return Buffer;
}

function getDocument() {
    return document;
}

// different styles of exports in moduleA.js and moduleB.js
module.exports = {
    setMyNumber: setMyNumber,
    getMyNumber: getMyNumber,
    setMyObj: setMyObj,
    getMyObj: getMyObj,
    readFileSync: readFileSync,
    checkSomeGlobals: checkSomeGlobals,
    getConsole: getConsole,
    getFilename: getFilename,
    getBuffer: getBuffer,
    getDocument: getDocument,
    someOtherModule: someOtherModule
};
