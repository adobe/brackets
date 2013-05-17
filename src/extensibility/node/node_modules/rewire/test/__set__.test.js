var expect = require("expect.js"),
    __set__ = require("../lib/__set__.js"),
    vm = require("vm"),

    expectReferenceError = expectError(ReferenceError),
    expectTypeError = expectError(TypeError);

function expectError(ErrConstructor) {
    return function expectReferenceError(err) {
        expect(err.constructor.name).to.be(ErrConstructor.name);
    };
}

describe("__set__", function () {
    var moduleFake;

    beforeEach(function () {
        moduleFake = {
            myValue: 0,    // copy by value
            myReference: {}       // copy by reference
        };

        vm.runInNewContext(
            "__set__ = " + __set__.toString() + "; " +
            "getValue = function () { return myValue; }; " +
            "getReference = function () { return myReference; }; ",
            moduleFake
        );
    });
    it("should set the new value when calling with varName, varValue", function () {
        expect(moduleFake.getValue()).to.be(0);
        moduleFake.__set__("myValue", undefined);
        expect(moduleFake.getValue()).to.be(undefined);
        moduleFake.__set__("myValue", null);
        expect(moduleFake.getValue()).to.be(null);
        moduleFake.__set__("myValue", 2);
        expect(moduleFake.getValue()).to.be(2);
        moduleFake.__set__("myValue", "hello");
        expect(moduleFake.getValue()).to.be("hello");
    });
    it("should set the new reference when calling with varName, varValue", function () {
        var newObj = { hello: "hello" },
            newArr = [1, 2, 3],
            regExp = /123/gi;

        function newFn() {
            console.log("hello");
        }

        expect(moduleFake.getReference()).to.eql({});
        moduleFake.__set__("myReference", newObj);
        expect(moduleFake.getReference()).to.be(newObj);
        moduleFake.__set__("myReference", newArr);
        expect(moduleFake.getReference()).to.be(newArr);
        moduleFake.__set__("myReference", newFn);
        expect(moduleFake.getReference()).to.be(newFn);
        moduleFake.__set__("myReference", regExp);
        expect(moduleFake.getReference()).to.be(regExp);
    });
    it("should set the new number and the new obj when calling with an env-obj", function () {
        var newObj = { hello: "hello" };

        expect(moduleFake.getValue()).to.be(0);
        expect(moduleFake.getReference()).to.eql({});
        moduleFake.__set__({
            myValue: 2,
            myReference: newObj
        });
        expect(moduleFake.getValue()).to.be(2);
        expect(moduleFake.getReference()).to.be(newObj);
    });
    it("should return undefined", function () {
        expect(moduleFake.__set__("myValue", 4)).to.be(undefined);
    });
    it("should throw a TypeError when passing misfitting params", function () {
        expect(function () {
            moduleFake.__set__();
        }).to.throwException(expectTypeError);
        expect(function () {
            moduleFake.__set__(undefined);
        }).to.throwException(expectTypeError);
        expect(function () {
            moduleFake.__set__(null);
        }).to.throwException(expectTypeError);
        expect(function () {
            moduleFake.__set__(true);
        }).to.throwException(expectTypeError);
        expect(function () {
            moduleFake.__set__(2);
        }).to.throwException(expectTypeError);
        expect(function () {
            moduleFake.__set__("");
        }).to.throwException(expectTypeError);
        expect(function () {
            moduleFake.__set__(function () {});
        }).to.throwException(expectTypeError);
        expect(function () {
            moduleFake.__set__({}, true);   // misfitting number of params
        }).to.throwException(expectTypeError);
        expect(function () {
            moduleFake.__set__("someVar");  // misfitting number of params
        }).to.throwException(expectTypeError);
    });
});