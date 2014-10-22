### 2.2.0

 * additional callback API to support multiple files with same field name
 * fix assertion crash when max field count is exceeded
 * fix assertion crash when client aborts an invalid request
 * (>=v0.10 only) unpipe the request when an error occurs to save resources.
 * update readable-stream to ~1.1.9
 * fix assertion crash when EMFILE occurrs
 * (no more assertions - only 'error' events)

### 2.1.9

 * relax content-type detection regex. (thanks amitaibu)

### 2.1.8

 * replace deprecated Buffer.write(). (thanks hueniverse)

### 2.1.7

 * add repository field to package.json

### 2.1.6

 * expose `hash` as an option to `Form`. (thanks wookiehangover)

### 2.1.5

 * fix possible 'close' event before all temp files are done

### 2.1.4

 * fix crash for invalid requests

### 2.1.3

 * add `file.size`

### 2.1.2

 * proper backpressure support
 * update s3 example

### 2.1.1

 * fix uploads larger than 2KB
 * fix both s3 and upload example
 * add part.byteCount and part.byteOffset

### 2.1.0 (recalled)

 * Complete rewrite. See README for changes and new API.

### v1.0.13

* Only update hash if update method exists (Sven Lito)
* According to travis v0.10 needs to go quoted (Sven Lito)
* Bumping build node versions (Sven Lito)
* Additional fix for empty requests (Eugene Girshov)
* Change the default to 1000, to match the new Node behaviour. (OrangeDog)
* Add ability to control maxKeys in the querystring parser. (OrangeDog)
* Adjust test case to work with node 0.9.x (Eugene Girshov)
* Update package.json (Sven Lito)
* Path adjustment according to eb4468b (Markus Ast)

### v1.0.12

* Emit error on aborted connections (Eugene Girshov)
* Add support for empty requests (Eugene Girshov)
* Fix name/filename handling in Content-Disposition (jesperp)
* Tolerate malformed closing boundary in multipart (Eugene Girshov)
* Ignore preamble in multipart messages (Eugene Girshov)
* Add support for application/json (Mike Frey, Carlos Rodriguez)
* Add support for Base64 encoding (Elmer Bulthuis)
* Add File#toJSON (TJ Holowaychuk)
* Remove support for Node.js 0.4 & 0.6 (Andrew Kelley)
* Documentation improvements (Sven Lito, Andre Azevedo)
* Add support for application/octet-stream (Ion Lupascu, Chris Scribner)
* Use os.tmpDir() to get tmp directory (Andrew Kelley)
* Improve package.json (Andrew Kelley, Sven Lito)
* Fix benchmark script (Andrew Kelley)
* Fix scope issue in incoming_forms (Sven Lito)
* Fix file handle leak on error (OrangeDog)

### v1.0.11

* Calculate checksums for incoming files (sreuter)
* Add definition parameters to "IncomingForm" as an argument (Math-)

### v1.0.10

* Make parts to be proper Streams (Matt Robenolt)

### v1.0.9

* Emit progress when content length header parsed (Tim Koschützki)
* Fix Readme syntax due to GitHub changes (goob)
* Replace references to old 'sys' module in Readme with 'util' (Peter Sugihara)

### v1.0.8

* Strip potentially unsafe characters when using `keepExtensions: true`.
* Switch to utest / urun for testing
* Add travis build

### v1.0.7

* Remove file from package that was causing problems when installing on windows. (#102)
* Fix typos in Readme (Jason Davies).

### v1.0.6

* Do not default to the default to the field name for file uploads where
  filename="".

### v1.0.5

* Support filename="" in multipart parts
* Explain unexpected end() errors in parser better

**Note:** Starting with this version, formidable emits 'file' events for empty
file input fields. Previously those were incorrectly emitted as regular file
input fields with value = "".

### v1.0.4

* Detect a good default tmp directory regardless of platform. (#88)

### v1.0.3

* Fix problems with utf8 characters (#84) / semicolons in filenames (#58)
* Small performance improvements
* New test suite and fixture system

### v1.0.2

* Exclude node\_modules folder from git
* Implement new `'aborted'` event
* Fix files in example folder to work with recent node versions
* Make gently a devDependency

[See Commits](https://github.com/felixge/node-formidable/compare/v1.0.1...v1.0.2)

### v1.0.1

* Fix package.json to refer to proper main directory. (#68, Dean Landolt)

[See Commits](https://github.com/felixge/node-formidable/compare/v1.0.0...v1.0.1)

### v1.0.0

* Add support for multipart boundaries that are quoted strings. (Jeff Craig)

This marks the beginning of development on version 2.0 which will include
several architectural improvements.

[See Commits](https://github.com/felixge/node-formidable/compare/v0.9.11...v1.0.0)

### v0.9.11

* Emit `'progress'` event when receiving data, regardless of parsing it. (Tim Koschützki)
* Use [W3C FileAPI Draft](http://dev.w3.org/2006/webapi/FileAPI/) properties for File class

**Important:** The old property names of the File class will be removed in a
future release.

[See Commits](https://github.com/felixge/node-formidable/compare/v0.9.10...v0.9.11)

### Older releases

These releases were done before starting to maintain the above Changelog:

* [v0.9.10](https://github.com/felixge/node-formidable/compare/v0.9.9...v0.9.10)
* [v0.9.9](https://github.com/felixge/node-formidable/compare/v0.9.8...v0.9.9)
* [v0.9.8](https://github.com/felixge/node-formidable/compare/v0.9.7...v0.9.8)
* [v0.9.7](https://github.com/felixge/node-formidable/compare/v0.9.6...v0.9.7)
* [v0.9.6](https://github.com/felixge/node-formidable/compare/v0.9.5...v0.9.6)
* [v0.9.5](https://github.com/felixge/node-formidable/compare/v0.9.4...v0.9.5)
* [v0.9.4](https://github.com/felixge/node-formidable/compare/v0.9.3...v0.9.4)
* [v0.9.3](https://github.com/felixge/node-formidable/compare/v0.9.2...v0.9.3)
* [v0.9.2](https://github.com/felixge/node-formidable/compare/v0.9.1...v0.9.2)
* [v0.9.1](https://github.com/felixge/node-formidable/compare/v0.9.0...v0.9.1)
* [v0.9.0](https://github.com/felixge/node-formidable/compare/v0.8.0...v0.9.0)
* [v0.9.0](https://github.com/felixge/node-formidable/compare/v0.8.0...v0.9.0)
* [v0.9.0](https://github.com/felixge/node-formidable/compare/v0.8.0...v0.9.0)
* [v0.9.0](https://github.com/felixge/node-formidable/compare/v0.8.0...v0.9.0)
* [v0.9.0](https://github.com/felixge/node-formidable/compare/v0.8.0...v0.9.0)
* [v0.9.0](https://github.com/felixge/node-formidable/compare/v0.8.0...v0.9.0)
* [v0.9.0](https://github.com/felixge/node-formidable/compare/v0.8.0...v0.9.0)
* [v0.9.0](https://github.com/felixge/node-formidable/compare/v0.8.0...v0.9.0)
* [v0.1.0](https://github.com/felixge/node-formidable/commits/v0.1.0)
