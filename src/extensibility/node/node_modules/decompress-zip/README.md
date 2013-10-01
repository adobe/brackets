# decompress-zip [![Build Status](https://secure.travis-ci.org/bower/decompress-zip.png?branch=master)](http://travis-ci.org/bower/decompress-zip)

Extract files from a ZIP archive

## Usage

### .extract(options)

Extracts the contents of the ZIP archive `file`.

Returns an EventEmitter with two possible events - `error` on an error, and `extract` when the extraction has completed. The value passed to the `extract` event is a basic log of each file and how it was compressed.

The default value for `options` is `{ path: '.' }`. Currently `path` is the
only option, and is the output path for the extraction.

```js
var DecompressZip = require('decompress-zip');
var unzipper = new DecompressZip(filename)

unzipper.on('error', function (err) {
    console.log('Caught an error');
});

unzipper.on('extract', function (log) {
    console.log('Finished extracting');
});

unzipper.extract({
	path: 'some/path'
});
```

If `path` does not exist, decompress-zip will attempt to create it first.

### .list()

Much like extract, except:
- the success event is `list`
- the data for the event is an array of paths
- no files are actually extracted
- there are no options

```js
var DecompressZip = require('decompress-zip');
var unzipper = new DecompressZip(filename)

unzipper.on('error', function (err) {
    console.log('Caught an error');
});

unzipper.on('list', function (files) {
    console.log('The archive contains:');
    console.log(files);
});

unzipper.list();
```

## License

Released under the [MIT License](http://www.opensource.org/licenses/mit-license.php).
