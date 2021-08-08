# RequireJS

RequireJS loads plain JavaScript files as well as more defined modules. It is
optimized for in-browser use, including in
[a Web Worker](http://requirejs.org/docs/api.html#webworker), but it can be used
in other JavaScript environments, like Rhino and
[Node](http://requirejs.org/docs/node.html). It implements the
[Asynchronous Module](https://github.com/amdjs/amdjs-api/wiki/AMD)
API.

RequireJS uses plain script tags to load modules/files, so it should allow for
easy debugging. It can be used
[simply to load existing JavaScript files](http://requirejs.org/docs/api.html#jsfiles),
so you can add it to your existing project without having to re-write your
JavaScript files.

RequireJS includes [an optimization tool](http://requirejs.org/docs/optimization.html)
you can run as part of your packaging steps for deploying your code. The
optimization tool can combine and minify your JavaScript files to allow for
better performance.

If the JavaScript file defines a JavaScript module via
[define()](http://requirejs.org/docs/api.html#define), then there are other benefits
RequireJS can offer: [improvements over traditional CommonJS modules](http://requirejs.org/docs/commonjs.html)
and [loading multiple versions](http://requirejs.org/docs/api.html#multiversion)
of a module in a page. RequireJS also has a plugin system that supports features like
[i18n string bundles](http://requirejs.org/docs/api.html#i18n), and
[text file dependencies](http://requirejs.org/docs/api.html#text).

RequireJS does not have any dependencies on a JavaScript framework.
It is dual-licensed -- new BSD or MIT.

The standard require.js file is around 5.5KB when minified via Closure Compiler
and gzipped.

RequireJS works in IE 6+, Firefox 2+, Safari 3.2+, Chrome 3+, and Opera 10+.

[Latest Release](http://requirejs.org/docs/download.html)

## Directories

* **dist**: Scripts and assets to generate the requirejs.org docs, and for
generating a require.js release.
* **docs**: The raw HTML files for the requirejs.org docs. Only includes the
body of each page. Files in **dist** are used to generate a complete HTML page.
* **tests**: Tests for require.js.
* **testBaseUrl.js**: A file used in the tests inside **tests**. Purposely
placed outside the tests directory for testing paths that go outside a baseUrl.
* **updatesubs.sh**: Updates projects that depend on require.js Assumes the
projects are siblings to this directory and have specific names. Useful to
copy require.js to dependent projects easily while in development.

## Tests

This repo assumes some other repos are checked out as siblings to this repo:

    git clone https://github.com/requirejs/text.git
    git clone https://github.com/requirejs/i18n.git
    git clone https://github.com/requirejs/domReady.git
    git clone https://github.com/requirejs/requirejs.git

So when the above clones are done, the directory structure should look like:

* domReady
* i18n
* text
* requirejs (this repo)

You will need to be connected to the internet because the JSONP and
remoteUrls tests access the internet to complete their tests.

Serve the directory with these 4 siblings from a web server. It can be a local web server.

Open requirejs/tests/index.html in all the browsers, click the arrow button to run all
the tests.
