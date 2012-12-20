'use strict';

var grunt = require('../../lib/grunt');

// Helper for testing stdout
var hooker = grunt.util.hooker;
var stdoutEqual = function(test, callback, expected) {
  var actual = '';
  // Hook process.stdout.write
  hooker.hook(process.stdout, 'write', {
    // This gets executed before the original process.stdout.write.
    pre: function(result) {
      // Concatenate uncolored result onto actual.
      actual += grunt.log.uncolor(result);
      // Prevent the original process.stdout.write from executing.
      return hooker.preempt();
    }
  });
  // Execute the logging code to be tested.
  callback();
  // Restore process.stdout.write to its original value.
  hooker.unhook(process.stdout, 'write');
  // Actually test the actually-logged stdout string to the expected value.
  test.equal(actual, expected);
};

exports['log'] = {
  'setUp': function(done) {
    grunt.log.muted = false;
    done();
  },
  'write': function(test) {
    test.expect(2);

    stdoutEqual(test, function() { grunt.log.write('foo'); }, 'foo');
    stdoutEqual(test, function() { grunt.log.writeln('foo'); }, 'foo\n');

    test.done();
  },
  'error': function(test) {
    test.expect(4);

    stdoutEqual(test, function() { grunt.log.error(); }, 'ERROR\n');
    stdoutEqual(test, function() { grunt.log.error('foo'); }, '>> foo\n');

    stdoutEqual(test, function() {
      grunt.log.errorlns(grunt.util._.repeat('foo', 30, ' '));
    }, '>> ' + grunt.util._.repeat('foo', 19, ' ') + '\n' +
      '>> ' + grunt.util._.repeat('foo', 11, ' ') + '\n');

    stdoutEqual(test, function() { grunt.log.fail('foo'); }, 'foo\n');

    test.done();
  },
  'ok': function(test) {
    test.expect(4);

    stdoutEqual(test, function() { grunt.log.ok(); }, 'OK\n');
    stdoutEqual(test, function() { grunt.log.ok('foo'); }, '>> foo\n');

    stdoutEqual(test, function() {
      grunt.log.oklns(grunt.util._.repeat('foo', 30, ' '));
    }, '>> ' + grunt.util._.repeat('foo', 19, ' ') + '\n' +
      '>> ' + grunt.util._.repeat('foo', 11, ' ') + '\n');

    stdoutEqual(test, function() { grunt.log.success('foo'); }, 'foo\n');

    test.done();
  },
  'header and subhead': function(test) {
    test.expect(2);

    stdoutEqual(test, function() { grunt.log.header('foo'); }, '\nfoo\n');
    stdoutEqual(test, function() { grunt.log.subhead('foo'); }, '\nfoo\n');

    test.done();
  },
  'debug': function(test) {
    test.expect(2);
    var debug = grunt.option('debug');

    grunt.option('debug', true);
    stdoutEqual(test, function() { grunt.log.debug('foo'); }, '[D] foo\n');

    grunt.option('debug', false);
    stdoutEqual(test, function() { grunt.log.debug('foo'); }, '');

    grunt.option('debug', debug);
    test.done();
  },
  'writetableln': function(test) {
    test.expect(1);

    stdoutEqual(test, function() {
      grunt.log.writetableln([10], [grunt.util._.repeat('foo', 10)]);
    }, 'foofoofoof\noofoofoofo\nofoofoofoo\n');

    test.done();
  },
  'writelns': function(test) {
    test.expect(1);

    stdoutEqual(test, function() {
      grunt.log.writelns(grunt.util._.repeat('foo', 30, ' '));
    }, grunt.util._.repeat('foo', 20, ' ') + '\n' +
      grunt.util._.repeat('foo', 10, ' ') + '\n');

    test.done();
  },
  'writeflags': function(test) {
    test.expect(1);

    stdoutEqual(test, function() {
      grunt.log.writeflags(['foo', 'bar'], 'test');
    }, 'test: foo, bar\n');

    test.done();
  }
};
