# stream-counter

Keep track of how many bytes have been written to a stream.

## Usage

```js
var StreamCounter = require('stream-counter');
var counter = new StreamCounter();
counter.on('progress', function() {
  console.log("progress", counter.bytes);
});
fs.createReadStream('foo.txt').pipe(counter);
```
