// Don't run code in ES5 strict mode.
// In case this module was in strict mode, all other modules called by this would also be strict.
// But when testing if the strict mode is preserved, we must ensure that this module is NOT strict.

// These shared test cases are used to check if the provided implementation of rewire is compatible
// with the original rewire. Since you can use rewire with client-side bundlers like webpack we need
// to test the implementation there again.
// @see https://github.com/jhnns/rewire-webpack

var expect = require("expect.js"),
    rewire = require("rewire"),
    __set__Src = require("../../lib/__set__.js").toString(),
    __get__Src = require("../../lib/__get__.js").toString(),
    __with__Src = require("../../lib/__with__.js").toString();

function checkForTypeError(err) {
    expect(err.constructor).to.be(TypeError);
}

describe("rewire " + (typeof testEnv === "undefined"? "(node)": "(" + testEnv + ")"), function () {

    it("should work like require()", function () {
        rewire("./moduleA.js").getFilename();
        require("./moduleA.js").getFilename();
        expect(rewire("./moduleA.js").getFilename()).to.eql(require("./moduleA.js").getFilename());
        expect(rewire("../testModules/someOtherModule.js").filename).to.eql(require("../testModules/someOtherModule.js").filename);
    });

    it("should return a fresh instance of the module", function () {
        var someOtherModule = require("./someOtherModule.js"),
            rewiredSomeOtherModule;

        someOtherModule.fs = "This has been modified";
        rewiredSomeOtherModule = rewire("./someOtherModule.js");
        expect(rewiredSomeOtherModule.fs).not.to.be("This has been modified");
    });

    it("should not cache the rewired module", function () {
        var rewired,
            someOtherModule = require("./someOtherModule.js");

        someOtherModule.fs = "This has been changed";

        rewired = rewire("./someOtherModule.js");
        expect(someOtherModule).not.to.be(rewired);
        expect(require("./moduleA.js").someOtherModule).not.to.be(rewired);
        expect(require("./moduleA.js").someOtherModule).to.be(someOtherModule);
        expect(require("./moduleA.js").someOtherModule.fs).to.be("This has been changed");
    });

    // By comparing the src we can ensure that the provided __set__ function is our tested implementation
    it("should modify the module so it provides the __set__ - function", function () {
        expect(rewire("./moduleA.js").__set__.toString()).to.be(__set__Src);
        expect(rewire("./moduleB.js").__set__.toString()).to.be(__set__Src);
    });

    // By comparing the src we can ensure that the provided __set__ function is our tested implementation
    it("should modify the module so it provides the __get__ - function", function () {
        expect(rewire("./moduleA.js").__get__.toString()).to.be(__get__Src);
        expect(rewire("./moduleB.js").__get__.toString()).to.be(__get__Src);
    });

    // By comparing the src we can ensure that the provided __set__ function is our tested implementation
    it("should modify the module so it provides the __with__ - function", function () {
        expect(rewire("./moduleA.js").__with__.toString()).to.be(__with__Src);
        expect(rewire("./moduleB.js").__with__.toString()).to.be(__with__Src);
    });

    it("should provide __set__ as a non-enumerable property", function () {
        expect(Object.keys(rewire("./moduleA.js")).indexOf("__set__")).to.be(-1)
    });

    it("should provide __get__ as a non-enumerable property", function () {
        expect(Object.keys(rewire("./moduleA.js")).indexOf("__get__")).to.be(-1)
    });

    it("should provide __with__ as a non-enumerable property", function () {
        expect(Object.keys(rewire("./moduleA.js")).indexOf("__with__")).to.be(-1)
    });

    it("should not influence other modules", function () {
        rewire("./moduleA.js");

        expect(require("./someOtherModule.js").__set__).to.be(undefined);
        expect(require("./someOtherModule.js").__get__).to.be(undefined);
        expect(require("./someOtherModule.js").__with__).to.be(undefined);
    });

    it("should not override/influence global objects by default", function () {
        // This should throw no exception
        rewire("./moduleA.js").checkSomeGlobals();
        rewire("./moduleB.js").checkSomeGlobals();
    });

    // This is just an integration test for the __set__ method
    // You can find a full test for __set__ under /test/__set__.test.js
    it("should provide a working __set__ method", function () {
        var rewiredModuleA = rewire("./moduleA.js"),
            newObj = {};

        expect(rewiredModuleA.getMyNumber()).to.be(0);
        rewiredModuleA.__set__("myNumber", 2);
        expect(rewiredModuleA.getMyNumber()).to.be(2);
        rewiredModuleA.__set__("myObj", newObj);
        expect(rewiredModuleA.getMyObj()).to.be(newObj);
        rewiredModuleA.__set__("env", "ENVENV");
    });

    // This is just an integration test for the __get__ method
    // You can find a full test for __get__ under /test/__get__.test.js
    it("should provide a working __get__ method", function () {
        var rewiredModuleA = rewire("./moduleA.js");

        expect(rewiredModuleA.__get__("myNumber")).to.be(rewiredModuleA.getMyNumber());
        expect(rewiredModuleA.__get__("myObj")).to.be(rewiredModuleA.getMyObj());
    });

    // This is just an integration test for the __with__ method
    // You can find a full test for __with__ under /test/__with__.test.js
    it("should provide a working __with__ method", function () {
        var rewiredModuleA = rewire("./moduleA.js"),
            newObj = {};

        expect(rewiredModuleA.getMyNumber()).to.be(0);
        expect(rewiredModuleA.getMyObj()).to.not.be(newObj);

        rewiredModuleA.__with__({
            myNumber: 2,
            myObj: newObj
        })(function () {
            expect(rewiredModuleA.getMyNumber()).to.be(2);
            expect(rewiredModuleA.getMyObj()).to.be(newObj);
        });

        expect(rewiredModuleA.getMyNumber()).to.be(0);
        expect(rewiredModuleA.getMyObj()).to.not.be(newObj);
    });

    it("should provide the ability to inject mocks", function (done) {
        var rewiredModuleA = rewire("./moduleA.js"),
            mockedFs = {
                readFileSync: function (file) {
                    expect(file).to.be("bla.txt");
                    done();
                }
            };

        rewiredModuleA.__set__("fs", mockedFs);
        rewiredModuleA.readFileSync();
    });

    it("should not influence other modules when injecting mocks", function () {
        var rewiredModuleA = rewire("./moduleA.js"),
            someOtherModule,
            mockedFs = {};

        rewiredModuleA.__set__("fs", mockedFs);
        someOtherModule = require("./someOtherModule.js");
        expect(someOtherModule.fs).not.to.be(mockedFs);
    });

    it("should provide the ability to mock global objects just within the module", function () {
        var rewiredModuleA = rewire("./moduleA.js"),
            rewiredModuleB = rewire("./moduleB.js"),
            consoleMock = {},
            bufferMock = {},
            documentMock = {},
            newFilename = "myFile.js";

        rewiredModuleA.__set__({
            console: consoleMock,
            __filename: newFilename
        });
        expect(rewiredModuleA.getConsole()).to.be(consoleMock);
        expect(rewiredModuleB.getConsole()).not.to.be(consoleMock);
        expect(console).not.to.be(consoleMock);
        expect(rewiredModuleA.getFilename()).to.be(newFilename);
        expect(rewiredModuleB.getFilename()).not.to.be(newFilename);
        expect(console).not.to.be(newFilename);
        if (typeof window === "undefined") {
            rewiredModuleA.__set__("Buffer", bufferMock);
            expect(rewiredModuleA.getBuffer()).to.be(bufferMock);
            expect(rewiredModuleB.getBuffer()).not.to.be(bufferMock);
            expect(Buffer).not.to.be(bufferMock);
        } else {
            rewiredModuleA.__set__("document", documentMock);
            expect(rewiredModuleA.getDocument()).to.be(documentMock);
            expect(rewiredModuleB.getDocument() === documentMock).to.be(false);
            expect(document === documentMock).to.be(false);
        }
    });

    it("should be possible to mock global objects that are added on runtime", function () {
        var rewiredModule;

        if (typeof window === "undefined") {
            global.someGlobalVar = "test";
            rewiredModule = rewire("./moduleA.js");
            rewiredModule.__set__("someGlobalVar", "other value");
            expect(global.someGlobalVar).to.be("test");
            expect(rewiredModule.__get__("someGlobalVar")).to.be("other value");
            delete global.someGlobalVar;
        } else {
            window.someGlobalVar = "test";
            rewiredModule = rewire("./moduleA.js");
            rewiredModule.__set__("someGlobalVar", "other value");
            expect(window.someGlobalVar).to.be("test");
            expect(rewiredModule.__get__("someGlobalVar")).to.be("other value");
            if (typeof navigator !== "undefined" && /MSIE [6-8]\.[0-9]/g.test(navigator.userAgent) === false) {
                delete window.someGlobalVar;
            }
        }
    });

    it("should not be a problem to have a comment on file end", function () {
        var rewired = rewire("./emptyModule.js");

        rewired.__set__("someVar", "hello");
        expect(rewired.__get__("someVar")).to.be("hello");
    });

    it("should not influence the original require if nothing has been required within the rewired module", function () {
        rewire("./emptyModule.js"); // nothing happens here because emptyModule doesn't require anything
        expect(require("./moduleA.js").__set__).to.be(undefined); // if restoring the original node require didn't worked, the module would have a setter
    });

    it("subsequent calls of rewire should always return a new instance", function () {
        expect(rewire("./moduleA.js")).not.to.be(rewire("./moduleA.js"));
    });

    it("should preserve the strict mode", function () {
        var strictModule = rewire("./strictModule.js");

        expect(function () {
            strictModule.doSomethingUnstrict();
        }).to.throwException(checkForTypeError);
    });

    it("should not modify line numbers in stack traces", function () {
        var throwError = rewire("./throwError.js");

        try {
            throwError();
        } catch (err) {
            if (err.stack) {
                expect(err.stack.split("\n")[1]).to.match(/:2:11/);
            }
        }
    });

    it("should throw a TypeError if the path is not a string", function () {
        expect(function () {
            rewire(null);
        }).to.throwException(checkForTypeError);
    });

});