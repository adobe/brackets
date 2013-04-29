# Jasmine Reporters

Jasmine Reporters is a collection of javascript jasmine.Reporter classes that can be used with
the [JasmineBDD testing framework](http://pivotal.github.com/jasmine/).

Included reporters:

* ConsoleReporter - Report test results to the browser console.
* JUnitXmlReporter - Report test results to a file (using Rhino or PyPhantomJS) in JUnit XML Report format.
* TapReporter - Test Anything Protocol, report tests results to console.
* TeamcityReporter - Basic reporter that outputs spec results to for the Teamcity build system.


## Usage

Examples are included in the test directory that show how to use the reporters,
as well a basic runner scripts for Rhino + envjs, and a basic runner for 
[PhantomJS](https://github.com/ariya/phantomjs) (using PyPhantomJS and the
saveToFile plugin). Either of these methods could be used in a Continuous
Integration project for running headless tests and generating JUnit XML output.

### Rhino + EnvJS

Everything needed to run the tests in Rhino + EnvJS is included in this
repository inside the `ext` directory, specifically Rhino 1.7r2 and envjs 1.2
for Rhino.

### PhantomJS, PyPhantomJS

PhantomJS is included as a submodule inside the `ext` directory. The included
example runner makes use of PyPhantomJS to execute the headless tests and
save XML output to the filesystem.

While PhantomJS and PyPhantomJS both run on MacOS / Linux / Windows, there are
specific dependencies for each platform. Specifics on installing these are not
included here, but is left as an exercise for the reader. The [PhantomJS](https://github.com/ariya/phantomjs)
project contains links to various documentation, including installation notes.

Here is how I got it working in MacOSX 10.6 (YMMV):

* ensure you are using Python 2.6+
* install Xcode (this gives you make, et al)
* install qt (this gives you qmake, et al)
  * this may be easiest via [homebrew](https://github.com/mxcl/homebrew)
  * `brew install qt`
* install the python sip module
  * `pip install sip # this will fail to fully install sip, keep going`
  * `cd build/sip`
  * `python configure.py`
  * `make && sudo make install`
* install the python pyqt module
  * `pip install pyqt # this will fail to fully install pyqt, keep going`
  * `cd build/pyqt`
  * `python configure.py`
  * `make && sudo make install`
