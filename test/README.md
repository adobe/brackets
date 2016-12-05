Overview
========

Unit testing for brackets uses [Jasmine](http://jasmine.github.io/1.3/introduction.html).

Getting started
===============

Running Tests

2 options for running tests:

1. Run brackets-app and click "Run Tests" from the menu (debugging and dev tools **not** supported)
1. Run jasmine.sh (only OSX is supported) or manually run Brackets-app with
   the argument file://path/to/brackets/test/SpecRunner.html.


Adding New Tests

1. Create a new .js file under spec/
1. Write the test (see spec/Editor-test.js or Jasmine documentation)
1. Edit SpecRunner.html and add the spec .js file in a new script tag

Known Issues
============

None