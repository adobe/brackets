var expect = require("expect.js"),
    __with__ = require("../lib/__with__.js"),
    __set__ = require("../lib/__set__.js"),
    vm = require("vm"),

    expectTypeError = expectError(TypeError);

function expectError(ErrConstructor) {
    return function expectReferenceError(err) {
        expect(err.constructor.name).to.be(ErrConstructor.name);
    };
}

describe("__with__", function() {
    var moduleFake,
        newObj;

    beforeEach(function () {
        moduleFake = {
            module: {
                exports: {}
            },
            myValue: 0,    // copy by value
            myReference: {}       // copy by reference
        };

        newObj = { hello: "hello" };

        vm.runInNewContext(
            //__with__ requires __set__ to be present on module.exports
            "module.exports.__set__ = " + __set__.toString() + "; " +
            "__with__ = " + __with__.toString() + "; " +
            "getValue = function () { return myValue; }; " +
            "getReference = function () { return myReference; }; ",
            moduleFake
        );
    });

    it("should return a function", function () {
        expect(moduleFake.__with__({
            myValue: 2,
            myReference: newObj
        })).to.be.a("function");
    });

    it("should return a function that can be invoked with a callback which guarantees __set__'s undo function is called for you at the end", function () {
        expect(moduleFake.getValue()).to.be(0);
        expect(moduleFake.getReference()).to.eql({});

        moduleFake.__with__({
            myValue: 2,
            myReference: newObj
        })(function () {
            // changes will be visible from within this callback function
            expect(moduleFake.getValue()).to.be(2);
            expect(moduleFake.getReference()).to.be(newObj);
        });

        // undo will automatically get called for you after returning from your callback function
        expect(moduleFake.getValue()).to.be(0);
        expect(moduleFake.getReference()).to.eql({});
    });

    it("should also accept a variable name and a variable value (just like __set__)", function () {
        expect(moduleFake.getValue()).to.be(0);

        moduleFake.__with__("myValue", 2)(function () {
            expect(moduleFake.getValue()).to.be(2);
        });

        expect(moduleFake.getValue()).to.be(0);

        expect(moduleFake.getReference()).to.eql({});

        moduleFake.__with__("myReference", newObj)(function () {
            expect(moduleFake.getReference()).to.be(newObj);
        });

        expect(moduleFake.getReference()).to.eql({});
    });

    it("should still revert values if the callback throws an exception", function(){
        expect(function withError() {
            moduleFake.__with__({
                myValue: 2,
                myReference: newObj
            })(function () {
                throw new Error("something went wrong...");
            });
        }).to.throwError();
        expect(moduleFake.getValue()).to.be(0);
        expect(moduleFake.getReference()).to.eql({});
    });

    it("should throw an error if something other than a function is passed as the callback", function() {
        var withFunction = moduleFake.__with__({
                myValue: 2,
                myReference: newObj
            });

        function callWithFunction() {
            var args = arguments;

            return function () {
                withFunction.apply(null, args);
            };
        }

        expect(callWithFunction(1)).to.throwError(expectTypeError);
        expect(callWithFunction("a string")).to.throwError(expectTypeError);
        expect(callWithFunction({})).to.throwError(expectTypeError);
        expect(callWithFunction(function(){})).to.not.throwError(expectTypeError);
    });

    describe("using promises", function () {
        var promiseFake;

        beforeEach(function () {
            promiseFake = {
                then: function (onResolve, onReject) {
                    promiseFake.onResolve = onResolve;
                    promiseFake.onReject = onReject;
                }
            };
        });

        it("should pass the returned promise through", function () {
            var fn = moduleFake.__with__({});

            expect(fn(function () {
                return promiseFake;
            })).to.equal(promiseFake);
        });

        it("should not undo any changes until the promise has been resolved", function () {
            expect(moduleFake.getValue()).to.be(0);
            expect(moduleFake.getReference()).to.eql({});

            moduleFake.__with__({
                myValue: 2,
                myReference: newObj
            })(function () {
                return promiseFake;
            });

            // the change should still be present at this point
            expect(moduleFake.getValue()).to.be(2);
            expect(moduleFake.getReference()).to.be(newObj);

            promiseFake.onResolve();

            // now everything should be back to normal
            expect(moduleFake.getValue()).to.be(0);
            expect(moduleFake.getReference()).to.eql({});
        });

        it("should also undo any changes if the promise has been rejected", function () {
            expect(moduleFake.getValue()).to.be(0);
            expect(moduleFake.getReference()).to.eql({});

            moduleFake.__with__({
                myValue: 2,
                myReference: newObj
            })(function () {
                return promiseFake;
            });

            // the change should still be present at this point
            expect(moduleFake.getValue()).to.be(2);
            expect(moduleFake.getReference()).to.be(newObj);

            promiseFake.onReject();

            // now everything should be back to normal
            expect(moduleFake.getValue()).to.be(0);
            expect(moduleFake.getReference()).to.eql({});
        });

        it("should ignore any returned value which doesn't provide a then()-method", function () {
            expect(moduleFake.getValue()).to.be(0);
            expect(moduleFake.getReference()).to.eql({});

            moduleFake.__with__({
                myValue: 2,
                myReference: newObj
            })(function () {
                return {};
            });

            expect(moduleFake.getValue()).to.be(0);
            expect(moduleFake.getReference()).to.eql({});
        });

    });

});
