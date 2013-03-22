# node-clipboard

Easy to use utility for reading and writing to the system clipboard.

# usage

```
npm install clipboard
```

```javascript
var clipboard = require('clipboard');

// _Read_
var fromClipboard = clipboard.read();     // defaults to ascii
fromClipboard = clipboard.read('bitmap'); // buffer
fromClipboard = clipboard.readAll();      // all formats

// _Write_
clipboard.write('some text');
clipboard.write([
	{ format: 'ascii', value: 'some text' },
	{ format: 'unicode', value: '\u1059\u0000etc' },
	{ format: 'bitmap', value: someBuffer }
]);

// _Clear_
clipboard.clear();

// _Iterate_

// clipboard.formats() is a shortcut for:

var formats = clipboard.iterate(function(format, formatName, isCustom){
	return formatName;
});



// _JavaScript Objects_

// copies a v8 handle to the clipboard, not serialized
// also copies in the util.inspect text into 'ascii'
clipboard.write({ realJSObject: true });

// this will CRASH node if you try to paste it into another node process
var obj = clipboard.read('jsobject');

```

