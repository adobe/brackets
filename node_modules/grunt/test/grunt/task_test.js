'use strict';

var grunt = require('../../lib/grunt');

exports['task.normalizeMultiTaskFiles'] = {
  setUp: function(done) {
    this.cwd = process.cwd();
    process.chdir('test/fixtures/files');
    done();
  },
  tearDown: function(done) {
    process.chdir(this.cwd);
    done();
  },
  'normalize': function(test) {
    test.expect(6);
    var actual, expected;

    actual = grunt.task.normalizeMultiTaskFiles('src/*1.js', 'dist/built.js');
    expected = [
      {dest: 'dist/built.js', srcRaw: ['src/*1.js'], src: ['src/file1.js']}
    ];
    test.deepEqual(actual, expected, 'should normalize destTarget: srcString.');

    actual = grunt.task.normalizeMultiTaskFiles([['src/*1.js'], ['src/*2.js']], 'dist/built.js');
    expected = [
      {dest: 'dist/built.js', srcRaw: ['src/*1.js', 'src/*2.js'], src: ['src/file1.js', 'src/file2.js']}
    ];
    test.deepEqual(actual, expected, 'should normalize destTarget: srcArray.');

    actual = grunt.task.normalizeMultiTaskFiles({
      src: ['src/*1.js', 'src/*2.js'],
      dest: 'dist/built.js'
    }, 'target');
    expected = [
      {dest: 'dist/built.js', srcRaw: ['src/*1.js', 'src/*2.js'], src: ['src/file1.js', 'src/file2.js']}
    ];
    test.deepEqual(actual, expected, 'should normalize target: {src: srcStuff, dest: destStuff}.');

    actual = grunt.task.normalizeMultiTaskFiles({
      files: {
        'dist/built-a.js': 'src/*1.js',
        'dist/built-b.js': ['src/*1.js', [['src/*2.js']]]
      }
    }, 'target');
    expected = [
      {dest: 'dist/built-a.js', srcRaw: ['src/*1.js'], src: ['src/file1.js']},
      {dest: 'dist/built-b.js', srcRaw: ['src/*1.js', 'src/*2.js'], src: ['src/file1.js', 'src/file2.js']}
    ];
    test.deepEqual(actual, expected, 'should normalize target: {files: {destTarget: srcStuff, ...}}.');

    actual = grunt.task.normalizeMultiTaskFiles({
      files: [
        {'dist/built-a.js': 'src/*.whoops'},
        {'dist/built-b.js': [[['src/*1.js'], 'src/*2.js']]}
      ]
    }, 'target');
    expected = [
      {dest: 'dist/built-a.js', srcRaw: ['src/*.whoops'], src: []},
      {dest: 'dist/built-b.js', srcRaw: ['src/*1.js', 'src/*2.js'], src: ['src/file1.js', 'src/file2.js']}
    ];
    test.deepEqual(actual, expected, 'should normalize target: {files: [{destTarget: srcStuff}, ...]}.');

    actual = grunt.task.normalizeMultiTaskFiles({
      files: [
        {dest: 'dist/built-a.js', src: 'src/*2.js'},
        {dest: 'dist/built-b.js', src: ['src/*1.js', 'src/*2.js']}
      ]
    }, 'target');
    expected = [
      {dest: 'dist/built-a.js', srcRaw: ['src/*2.js'], src: ['src/file2.js']},
      {dest: 'dist/built-b.js', srcRaw: ['src/*1.js', 'src/*2.js'], src: ['src/file1.js', 'src/file2.js']}
    ];
    test.deepEqual(actual, expected, 'should normalize target: {files: [{src: srcStuff, dest: destStuff}, ...]}.');

    test.done();
  },
  'template processing': function(test) {
    test.expect(1);

    // Processing "TEST" recursively should return "123"
    grunt.config.set(['TEST'], '<%= TEST2.PROP %>');
    grunt.config.set(['TEST2'], {
      PROP: '<%= TEST2.PROP1 %><%= TEST2.PROP2 + TEST2.PROP3 %>',
      PROP1: '1',
      PROP2: '2',
      PROP3: '3'
    });

    var actual = grunt.task.normalizeMultiTaskFiles({
      files: [
        {dest: 'dist/built-<%= TEST %>-a.js', src: 'src/file?-<%= TEST %>.js'},
        {dest: 'dist/built-<%= TEST %>-b.js', src: ['src/*1-<%= TEST %>.js', 'src/*2-<%= TEST %>.js']}
      ]
    }, 'target');
    var expected = [
      {dest: 'dist/built-123-a.js', srcRaw: ['src/file?-123.js'], src: ['src/file1-123.js', 'src/file2-123.js']},
      {dest: 'dist/built-123-b.js', srcRaw: ['src/*1-123.js', 'src/*2-123.js'], src: ['src/file1-123.js', 'src/file2-123.js']}
    ];
    test.deepEqual(actual, expected, 'should process templates recursively.');

    test.done();
  }
};
