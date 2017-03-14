// Don't run code in ES5 strict mode.
// In case this module was in strict mode, all other modules called by this would also be strict.
// But when testing if the strict mode is preserved, we must ensure that this module is NOT strict.

var expect = require("expect.js"),
    fs = require("fs"),
    path = require("path");

var rewire;

describe("rewire", function () {
    before(function () {
        var fakeNodeModules = path.resolve(__dirname, "testModules/fake_node_modules");

        if (fs.existsSync(fakeNodeModules)) {
            fs.renameSync(fakeNodeModules, path.resolve(__dirname, "testModules/node_modules"));
        }
    });
    it("should keep not leak globals", function () {
        // This test should run first, as the global space may be already polluted if 
        //   require("../") is run before this test.
        var originalGlobalKeys = Object.keys(global),
            rewire = require("../"),
            emptyModule = rewire("./testModules/emptyModule.js");
        expect(Object.keys(global)).to.eql(originalGlobalKeys);
    });
    it("should pass all shared test cases", function () {
        require("./testModules/sharedTestCases.js");
    });
    it("should also work with CoffeeScript", function () {
        var coffeeModule;

        rewire = require("../");
        coffeeModule = rewire("./testModules/module.coffee");
        coffeeModule.__set__("fs", {
            readFileSync: function () {
                return "It works!";
            }
        });
        expect(coffeeModule.readFileSync()).to.be("It works!");
    });
});