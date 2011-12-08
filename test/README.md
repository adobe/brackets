Overview
========

Unit testing for brackets uses JsTestDriver http://code.google.com/p/js-test-driver/.

Getting started
===============

Running Tests

1) Launch server: ./server.sh
2) Launch web browser and capture: http://localhost:9876/capture
3) Run all tests: ./test.sh

Adding New Tests

1) Create a new .js file
2) Create a TestCase that matches the file name (see core/DemoTest.js)
3) Edit jsTestDriver.conf and include the .js file path under the test heading

Known Issues
============

1) server.sh script should eventually open brackets-app by default with the capture URL
2) Add an option to auto launch an arbitrary browser when running server.sh