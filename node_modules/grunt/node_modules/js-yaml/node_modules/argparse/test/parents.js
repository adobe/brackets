/*global describe, it, before, after, beforeEach, afterEach*/


'use strict';

var assert = require('assert');

var ArgumentParser = require('../lib/argparse').ArgumentParser;

describe('ArgumentParser', function () {
  describe('sub-commands', function () {
    var parent_parser;
    var args;

    beforeEach(function () {
      parent_parser = new ArgumentParser({debug: true, addHelp: false});
      parent_parser.addArgument(['--parent']);
    });

    it("should parse args from parents parser", function () {
      var parser = new ArgumentParser({
        parents: [ parent_parser ],
      });
      parser.addArgument(['-f', '--foo']);

      args = parser.parseArgs('-f 1 --parent 2'.split(' '));
      assert.equal(args.foo, 1);
      assert.equal(args.parent, 2);

      args = parser.parseArgs('-f 1'.split(' '));
      assert.equal(args.foo, 1);
      assert.strictEqual(args.parent, null);
    });

    it("should throw error if has same args as parent", function () {
      var parser = new ArgumentParser({
        parents: [ parent_parser ],
      });
      parser.addArgument(['-f', '--foo']);

      assert.throws(function () {
        parent_parser.addArgument(['--parent']);
      });
    });
  });
});
