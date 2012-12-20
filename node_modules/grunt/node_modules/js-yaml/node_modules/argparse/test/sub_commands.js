/*global describe, it, before, after, beforeEach, afterEach*/


'use strict';

var assert = require('assert');

var ArgumentParser = require('../lib/argparse').ArgumentParser;

describe('ArgumentParser', function () {
  describe('sub-commands', function () {
    var parser;
    var args;
    var c1;
    var c2;

    beforeEach(function () {
      parser = new ArgumentParser({debug: true});
      var subparsers = parser.addSubparsers({
        title: 'subcommands',
        dest: 'subcommand_name'
      });
      c1 = subparsers.addParser('c1', {aliases: ['co']});
      c1.addArgument([ '-f', '--foo' ], {});
      c1.addArgument([ '-b', '--bar' ], {});
      c2 = subparsers.addParser('c2', {});
      c2.addArgument([ '--baz' ], {});
    });

    it("should store command name", function () {
      args = parser.parseArgs('c1 --foo 5'.split(' '));
      assert.equal(args.subcommand_name, 'c1');
    });

    it("should store command arguments", function () {
      args = parser.parseArgs('c1 --foo 5 -b4'.split(' '));
      assert.equal(args.foo, 5);
      assert.equal(args.bar, 4);
    });

    it("should have same behavior for alias and original command", function () {
      args = parser.parseArgs('c1 --foo 5 -b4'.split(' '));
      var aliasArgs = parser.parseArgs('co --foo 5 -b4'.split(' '));
      assert.equal(args.foo, aliasArgs.foo);
      assert.equal(args.bar, aliasArgs.bar);
    });

    it("should have different behavior for different commands", function () {
      assert.doesNotThrow(function () {
        parser.parseArgs('c1 --foo 5 -b4'.split(' '));
      });
      assert.throws(function () {
        parser.parseArgs('c2 --foo 5 -b4'.split(' '));
      });
      assert.doesNotThrow(function () {
        parser.parseArgs('c2 --baz 1'.split(' '));
      });
      assert.throws(function () {
        parser.parseArgs('c1 --baz 1'.split(' '));
      });
    });

    it("should drop down with 'Invalid choice' error if parse unrecognized command", function () {
      assert.throws(
        function () {parser.parseArgs('command --baz 1'.split(' ')); },
        /Invalid choice:/
      );
    });

    it("should drop down with empty args ('too few arguments' error)", function () {
      assert.throws(
        function () {parser.parseArgs([]); },
        /too few arguments/
      );
    });

    it("should support #setDefaults", function () {
      c1.setDefaults({spam: 1});
      c2.setDefaults({eggs: 2});
      args = parser.parseArgs(['c1']);
      assert.equal(args.spam, 1);
      assert.strictEqual(args.eggs, undefined);
      args = parser.parseArgs(['c2']);
      assert.equal(args.eggs, 2);
      assert.strictEqual(args.spam, undefined);
    });
  });
});
