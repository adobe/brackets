'use strict';


var $$ = require('./common');


var repeat = function repeat(str, n) {
  var result = '', i;
  for (i = 0; i < n; i += 1) {
    result += str;
  }
  return result;
};


function Mark(name, index, line, column, buffer, pointer) {
  this.name = name;
  this.index = index;
  this.line = line;
  this.column = column;
  this.buffer = buffer;
  this.pointer = pointer;
}

Mark.prototype.getSnippet = function (indent, maxLength) {
  var head, start, tail, end, snippet;

  if (!this.buffer) {
    return null;
  }

  indent = indent || 4;
  maxLength = maxLength || 75;

  head = '';
  start = this.pointer;

  while (start > 0 && -1 === '\x00\r\n\x85\u2028\u2029'.indexOf(this.buffer[start - 1])) {
    start -= 1;
    if (this.pointer - start > (maxLength / 2 - 1)) {
      head = ' ... ';
      start += 5;
      break;
    }
  }

  tail = '';
  end = this.pointer;

  while (end < this.buffer.length && -1 === '\x00\r\n\x85\u2028\u2029'.indexOf(this.buffer[end])) {
    end += 1;
    if (end - this.pointer > (maxLength / 2 - 1)) {
      tail = ' ... ';
      end -= 5;
      break;
    }
  }

  snippet = this.buffer.slice(start, end);

  return repeat(' ', indent) + head + snippet + tail + '\n' +
    repeat(' ', indent + this.pointer - start + head.length) + '^';
};

Mark.prototype.toString = function () {
  var snippet = this.getSnippet(), where;

  where = ' in "' + this.name +
    '", line ' + (this.line + 1) +
    ', column ' + (this.column + 1);

  if (snippet) {
    where += ':\n' + snippet;
  }

  return where;
};


function YAMLError(message) {
  $$.extend(this, Error.prototype.constructor.call(this, message));
  this.name = 'YAMLError';
}
$$.inherits(YAMLError, Error);


function toStringCompact(self) {
  var str = "Error ";

  if (null !== self.problemMark) {
    str += "on line " + (self.problemMark.line + 1) + ", col " + (self.problemMark.column + 1) + ": ";
  }

  if (null !== self.problem) {
    str += self.problem;
  }

  if (null !== self.note) {
    str += self.note;
  }

  return str;
}

function toStringFull(self) {
  var lines = [];

  if (null !== self.context) {
    lines.push(self.context);
  }

  if (null !== self.contextMark &&
      (null === self.problem || null === self.problemMark ||
       self.contextMark.name !== self.problemMark.name ||
       self.contextMark.line !== self.problemMark.line ||
       self.contextMark.column !== self.problemMark.column)) {
    lines.push(self.contextMark.toString());
  }

  if (null !== self.problem) {
    lines.push(self.problem);
  }

  if (null !== self.problemMark) {
    lines.push(self.problemMark.toString());
  }

  if (null !== self.note) {
    lines.push(self.note);
  }

  return lines.join('\n');
}


function MarkedYAMLError(context, contextMark, problem, problemMark, note) {
  YAMLError.call(this);
  this.name = 'MarkedYAMLError';

  this.context = context || null;
  this.contextMark = contextMark || null;
  this.problem = problem || null;
  this.problemMark = problemMark || null;
  this.note = note || null;

  this.toString = function toString(compact) {
    return compact ? toStringCompact(this) : toStringFull(this);
  };
}
$$.inherits(MarkedYAMLError, YAMLError);


module.exports.Mark = Mark;
module.exports.YAMLError = YAMLError;
module.exports.MarkedYAMLError = MarkedYAMLError;


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////
