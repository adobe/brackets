/*global describe, it, before, after, beforeEach, afterEach*/


'use strict';

var assert = require('assert');

var ArgumentParser = require('../lib/argparse').ArgumentParser;

describe('ArgumentParser', function () {
  describe('sub-commands', function () {
    var parser;
    var args;

    beforeEach(function () {
      parser = new ArgumentParser({debug: true});
    });

    it("should store correct choice(choices defined as string)", function () {
      parser.addArgument(['--foo'], {choices: 'abc'});
      args = parser.parseArgs('--foo a'.split(' '));
      assert.equal(args.foo, 'a');
    });

    it("should drop down with 'Invalid choice' error for incorrect choices(choices defined as string)", function () {
      parser.addArgument(['--foo'], {choices: 'abc'});
      assert.throws(
        function () {
          args = parser.parseArgs('--foo e'.split(' '));
          console.dir(args);
        },
        /Invalid choice:/
      );
      assert.throws(
        function () {
          args = parser.parseArgs('--foo 0'.split(' '));
          console.dir(args);
        },
        /Invalid choice:/
      );
    });


    it("should store correct choice(choices defined as array)", function () {
      parser.addArgument(['--foo'], {choices: ['a', 'abc', 'd']});
      args = parser.parseArgs('--foo abc'.split(' '));
      assert.equal(args.foo, 'abc');
    });

    it("should drop down with 'Invalid choice' error for incorrect choices(choices defined as array)", function () {
      parser.addArgument(['--foo'], {choices: ['a', 'abc', 'd']});
      assert.throws(
        function () {
          args = parser.parseArgs('--foo e'.split(' '));
          console.dir(args);
        },
        /Invalid choice:/
      );
      assert.throws(
        function () {
          args = parser.parseArgs('--foo 0'.split(' '));
          console.dir(args);
        },
        /Invalid choice:/
      );
    });
  });
});
