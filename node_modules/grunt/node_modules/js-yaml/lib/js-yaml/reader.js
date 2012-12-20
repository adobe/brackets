'use strict';


var $$ = require('./common');
var _errors = require('./errors');


// "\x20-\x7E" -> " -~" for JSLint
var NON_PRINTABLE = new RegExp('[^\x09\x0A\x0D -~\x85\xA0-\uD7FF\uE000-\uFFFD]');


// IE 7-8 hack. As we use ONLY strings in browsers as input stream, there's no
// need for stream.slice() call and we can simply use stream.charAt() when we
// are running on that shit...
var getSingleChar = (undefined === ('a')[0]) ?
                    function (str, pos) { return str.charAt(pos); }
                  : function (str, pos) { return str[pos]; };


function ReaderError(name, position, character, encoding, reason) {
  _errors.YAMLError.apply(this);
  this.name = 'ReaderError';

  this.name = name;
  this.position = position;
  this.character = character;
  this.encoding = encoding;
  this.reason = reason;

  this.toString = function toString() {
    return 'unacceptable character ' + this.character + ': ' + this.reason +
      '\n in "' + this.name + '", position ' + this.position;
  };
}
$$.inherits(ReaderError, _errors.YAMLError);


function Reader(stream) {
  this.name = '<unicode string>';
  this.stream = null;
  this.streamPointer = 0;
  this.eof = true;
  this.buffer = '';
  this.pointer = 0;
  this.encoding = 'utf-8';
  this.index = 0;
  this.line = 0;
  this.column = 0;

  if ('string' === typeof stream) { // simple string
    this.name = '<unicode string>';
    this.checkPrintable(stream);
    this.buffer = stream + '\x00';
  } else {
    throw new _errors.YAMLError('Invalid source. String or buffer expected.');
  }
}

Reader.prototype.peek = function peek(index) {
  index = +index || 0;
  return getSingleChar(this.buffer, this.pointer + index);
};

Reader.prototype.prefix = function prefix(length) {
  length = +length || 1;
  return this.buffer.slice(this.pointer, this.pointer + length);
};

Reader.prototype.forward = function forward(length) {
  var ch;

  // WARNING!!! length default is <int:1>, but method cn be called with
  //            <int:0> which is absolutely NOT default length value, so
  //            that's why we have ternary operator instead of lazy assign.
  length = (undefined !== length) ? (+length) : 1;

  while (length) {
    ch = this.buffer[this.pointer];
    this.pointer += 1;
    this.index += 1;

    if (0 <= '\n\x85\u2028\u2029'.indexOf(ch) ||
        ('\r' === ch && '\n' !== this.buffer[this.pointer])) {
      this.line += 1;
      this.column = 0;
    } else if (ch !== '\uFEFF') {
      this.column += 1;
    }

    length -= 1;
  }
};

Reader.prototype.getMark = function getMark() {
  if (null === this.stream) {
    return new _errors.Mark(this.name, this.index, this.line, this.column,
                       this.buffer, this.pointer);
  } else {
    return new _errors.Mark(this.name, this.index, this.line, this.column,
                       null, null);
  }
};


Reader.prototype.checkPrintable = function checkPrintable(data) {
  var match = String(data).match(NON_PRINTABLE), position;

  if (match) {
    position = this.index + this.buffer.length - this.pointer + match.index;
    throw new ReaderError(this.name, position, match[0],
                          'unicode', 'special characters are not allowed');
  }
};


module.exports.Reader = Reader;


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////
