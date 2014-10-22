
# node-range-parser

  Range header field parser.

## Example:

```js
assert(-1 == parse(200, 'bytes=500-20'));
assert(-2 == parse(200, 'bytes=malformed'));
parse(200, 'bytes=0-499').should.eql(arr('bytes', [{ start: 0, end: 199 }]));
parse(1000, 'bytes=0-499').should.eql(arr('bytes', [{ start: 0, end: 499 }]));
parse(1000, 'bytes=40-80').should.eql(arr('bytes', [{ start: 40, end: 80 }]));
parse(1000, 'bytes=-500').should.eql(arr('bytes', [{ start: 500, end: 999 }]));
parse(1000, 'bytes=-400').should.eql(arr('bytes', [{ start: 600, end: 999 }]));
parse(1000, 'bytes=500-').should.eql(arr('bytes', [{ start: 500, end: 999 }]));
parse(1000, 'bytes=400-').should.eql(arr('bytes', [{ start: 400, end: 999 }]));
parse(1000, 'bytes=0-0').should.eql(arr('bytes', [{ start: 0, end: 0 }]));
parse(1000, 'bytes=-1').should.eql(arr('bytes', [{ start: 999, end: 999 }]));
parse(1000, 'items=0-5').should.eql(arr('items', [{ start: 0, end: 5 }]));
parse(1000, 'bytes=40-80,-1').should.eql(arr('bytes', [{ start: 40, end: 80 }, { start: 999, end: 999 }]));
```

## Installation

```
$ npm install range-parser
```

## License 

(The MIT License)

Copyright (c) 2012 TJ Holowaychuk &lt;tj@vision-media.ca&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.