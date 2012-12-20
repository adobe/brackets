// Scanner produces tokens of the following types:
//
// STREAM-START
// STREAM-END
// DIRECTIVE(name, value)
// DOCUMENT-START
// DOCUMENT-END
// BLOCK-SEQUENCE-START
// BLOCK-MAPPING-START
// BLOCK-END
// FLOW-SEQUENCE-START
// FLOW-MAPPING-START
// FLOW-SEQUENCE-END
// FLOW-MAPPING-END
// BLOCK-ENTRY
// FLOW-ENTRY
// KEY
// VALUE
// ALIAS(value)
// ANCHOR(value)
// TAG(value)
// SCALAR(value, plain, style)
//
// Read comments in the Scanner code for more details.


'use strict';


var $$ = require('./common');
var _errors = require('./errors');
var _tokens = require('./tokens');


var ESCAPE_REPLACEMENTS = {
  '0':    '\x00',
  'a':    '\x07',
  'b':    '\x08',
  't':    '\x09',
  '\t':   '\x09',
  'n':    '\x0A',
  'v':    '\x0B',
  'f':    '\x0C',
  'r':    '\x0D',
  'e':    '\x1B',
  ' ':    ' ', // \x20, but JSLint against it :))
  '\"':   '\"',
  '\\':   '\\',
  'N':    '\x85',
  '_':    '\xA0',
  'L':    '\u2028',
  'P':    '\u2029'
};

var ESCAPE_CODES = {
  'x':    2,
  'u':    4,
  'U':    8
};

var range = function (start, count) {
  var result = [];

  if (undefined === count) {
    count = start;
    start = 0;
  }

  while (0 < count) {
    result.push(start);
    count -= 1;
    start += 1;
  }

  return result;
};


function ScannerError() {
  _errors.MarkedYAMLError.apply(this, arguments);
  this.name = 'ScannerError';
}
$$.inherits(ScannerError, _errors.MarkedYAMLError);


// See below simple keys treatment.
function SimpleKey(tokenNumber, required, index, line, column, mark) {
  this.tokenNumber = tokenNumber;
  this.required = required;
  this.index = index;
  this.line = line;
  this.column = column;
  this.mark = mark;
}


function Scanner() {
  // It is assumed that Scanner and Reader will have a common descendant.
  // Reader do the dirty work of checking for BOM and converting the
  // input data to Unicode. It also adds NUL to the end.
  //
  // Reader supports the following methods
  //   this.peek(i=0)       # peek the next i-th character
  //   this.prefix(l=1)     # peek the next l characters
  //   this.forward(l=1)    # read the next l characters and move the pointer.

  // Had we reached the end of the stream?
  this.done = false;

  // The number of unclosed '{' and '['. `flowLevel == 0` means block
  // context.
  this.flowLevel = 0;

  // List of processed tokens that are not yet emitted.
  this.tokens = [];

  // Add the STREAM-START token.
  this.fetchStreamStart();

  // Number of tokens that were emitted through the `getToken` method.
  this.tokensTaken = 0;

  // The current indentation level.
  this.indent = -1;

  // Past indentation levels.
  this.indents = [];

  // Variables related to simple keys treatment.

  // A simple key is a key that is not denoted by the '?' indicator.
  // Example of simple keys:
  //   ---
  //   block simple key: value
  //   ? not a simple key:
  //   : { flow simple key: value }
  // We emit the KEY token before all keys, so when we find a potential
  // simple key, we try to locate the corresponding ':' indicator.
  // Simple keys should be limited to a single line and 1024 characters.

  // Can a simple key start at the current position? A simple key may
  // start:
  // - at the beginning of the line, not counting indentation spaces
  //       (in block context),
  // - after '{', '[', ',' (in the flow context),
  // - after '?', ':', '-' (in the block context).
  // In the block context, this flag also signifies if a block collection
  // may start at the current position.
  this.allowSimpleKey = true;

  // Keep track of possible simple keys. This is a dictionary. The key
  // is `flowLevel`; there can be no more that one possible simple key
  // for each level. The value is a SimpleKey record:
  //   (tokenNumber, required, index, line, column, mark)
  // A simple key may start with ALIAS, ANCHOR, TAG, SCALAR(flow),
  // '[', or '{' tokens.
  this.possibleSimpleKeys = {};
}

Scanner.prototype.checkToken = function checkToken() {
  var i;

  while (this.needMoreTokens()) {
    this.fetchMoreTokens();
  }

  if (this.tokens.length) {
    if (!arguments.length) {
      return true;
    }

    for (i = 0; i < arguments.length; i += 1) {
      if ($$.isInstanceOf(this.tokens[0], arguments[i])) {
        return true;
      }
    }
  }

  return false;
};

Scanner.prototype.peekToken = function peekToken() {
  // Return the next token, but do not delete if from the queue.

  while (this.needMoreTokens()) {
    this.fetchMoreTokens();
  }

  if (this.tokens.length) {
    return this.tokens[0];
  }

  return null;
};

Scanner.prototype.getToken = function getToken() {
  var token = null;

  // Return the next token.

  while (this.needMoreTokens()) {
    this.fetchMoreTokens();
  }

  if (this.tokens.length) {
    this.tokensTaken += 1;
    token = this.tokens.shift();
  }

  return token;
};

Scanner.prototype.needMoreTokens = function needMoreTokens() {
  if (this.done) {
    return false;
  }

  if (!this.tokens.length) {
    return true;
  }

  // The current token may be a potential simple key, so we
  // need to look further.

  this.stalePossibleSimpleKeys();
  if (this.nextPossibleSimpleKey() === this.tokensTaken) {
    return true;
  }

  return false;
};

Scanner.prototype.fetchMoreTokens = function fetchMoreTokens() {
  var ch;

  // Eat whitespaces and comments until we reach the next token.
  this.scanToNextToken();

  // Remove obsolete possible simple keys.
  this.stalePossibleSimpleKeys();

  // Compare the current indentation and column. It may add some tokens
  // and decrease the current indentation level.
  this.unwindIndent(this.column);

  // Peek the next character.
  ch = this.peek();

  // Is it the end of stream?
  if (ch === '\x00') {
    return this.fetchStreamEnd();
  }

  // Is it a directive?
  if (ch === '%' && this.checkDirective()) {
    return this.fetchDirective();
  }

  // Is it the document start?
  if (ch === '-' && this.checkDocumentStart()) {
    return this.fetchDocumentStart();
  }

  // Is it the document end?
  if (ch === '.' && this.checkDocumentEnd()) {
    return this.fetchDocumentEnd();
  }

  // Note: the order of the following checks is NOT significant.

  // Is it the flow sequence start indicator?
  if (ch === '[') {
    return this.fetchFlowSequenceStart();
  }

  // Is it the flow mapping start indicator?
  if (ch === '{') {
    return this.fetchFlowMappingStart();
  }

  // Is it the flow sequence end indicator?
  if (ch === ']') {
    return this.fetchFlowSequenceEnd();
  }

  // Is it the flow mapping end indicator?
  if (ch === '}') {
    return this.fetchFlowMappingEnd();
  }

  // Is it the flow entry indicator?
  if (ch === ',') {
    return this.fetchFlowEntry();
  }

  // Is it the block entry indicator?
  if (ch === '-' && this.checkBlockEntry()) {
    return this.fetchBlockEntry();
  }

  // Is it the key indicator?
  if (ch === '?' && this.checkKey()) {
    return this.fetchKey();
  }

  // Is it the value indicator?
  if (ch === ':' && this.checkValue()) {
    return this.fetchValue();
  }

  // Is it an alias?
  if (ch === '*') {
    return this.fetchAlias();
  }

  // Is it an anchor?
  if (ch === '&') {
    return this.fetchAnchor();
  }

  // Is it a tag?
  if (ch === '!') {
    return this.fetchTag();
  }

  // Is it a literal scalar?
  if (ch === '|' && !this.flowLevel) {
    return this.fetchLiteral();
  }

  // Is it a folded scalar?
  if (ch === '>' && !this.flowLevel) {
    return this.fetchFolded();
  }

  // Is it a single quoted scalar?
  if (ch === '\'') {
    return this.fetchSingle();
  }

  // Is it a double quoted scalar?
  if (ch === '\"') {
    return this.fetchDouble();
  }

  // It must be a plain scalar then.
  if (this.checkPlain()) {
    return this.fetchPlain();
  }

  // No? It's an error. Let's produce a nice error message.
  throw new ScannerError("while scanning for the next token", null,
                         "found character " + ch + " that cannot start any token",
                         this.getMark());
};

Scanner.prototype.nextPossibleSimpleKey = function nextPossibleSimpleKey() {
  var minTokenNumber = null;

  // Return the number of the nearest possible simple key. Actually we
  // don't need to loop through the whole dictionary. We may replace it
  // with the following code:
  //   if (!this.possibleSimpleKeys.langth) {
  //     return null;
  //   }
  //   return this.possibleSimpleKeys[
  //     Math.min.apply({}, this.possibleSimpleKeys.keys())
  //   ].tokenNumber;

  $$.each(this.possibleSimpleKeys, function (key) {
    if (null === minTokenNumber || key.tokenNumber < minTokenNumber) {
      minTokenNumber = key.tokenNumber;
    }
  });

  return minTokenNumber;
};

Scanner.prototype.stalePossibleSimpleKeys = function stalePossibleSimpleKeys() {
  // Remove entries that are no longer possible simple keys. According to
  // the YAML specification, simple keys
  // - should be limited to a single line,
  // - should be no longer than 1024 characters.
  // Disabling this procedure will allow simple keys of any length and
  // height (may cause problems if indentation is broken though).
  $$.each(this.possibleSimpleKeys, function (key, level) {
    if (key.line !== this.line || 1024 < (this.index - key.index)) {
      if (key.required) {
        throw new ScannerError("while scanning a simple key", key.mark,
                               "could not found expected ':'", this.getMark());
      }
      delete this.possibleSimpleKeys[level];
    }
  }, this);
};

Scanner.prototype.savePossibleSimpleKey = function savePossibleSimpleKey() {
  var required, tokenNumber, key;

  // The next token may start a simple key. We check if it's possible
  // and save its position. This function is called for
  //   ALIAS, ANCHOR, TAG, SCALAR(flow), '[', and '{'.

  // Check if a simple key is required at the current position.
  required = (!this.flowLevel && this.indent === this.column);

  // A simple key is required only if it is the first token in the current
  // line. Therefore it is always allowed.
  if (!this.allowSimpleKey && required) {
    throw new _errors.YAMLError('Simple key is required');
  }

  // The next token might be a simple key. Let's save it's number and
  // position.
  if (this.allowSimpleKey) {
    this.removePossibleSimpleKey();
    tokenNumber = this.tokensTaken + this.tokens.length;
    key = new SimpleKey(tokenNumber, required, this.index, this.line,
                        this.column, this.getMark());
    this.possibleSimpleKeys[this.flowLevel] = key;
  }
};

Scanner.prototype.removePossibleSimpleKey = function removePossibleSimpleKey() {
  var key;

  // Remove the saved possible key position at the current flow level.

  if (undefined !== this.possibleSimpleKeys[this.flowLevel]) {
    key = this.possibleSimpleKeys[this.flowLevel];

    if (key.required) {
      throw new ScannerError("while scanning a simple key", key.mark,
                             "could not found expected ':'", this.getMark());
    }

    delete this.possibleSimpleKeys[this.flowLevel];
  }
};

Scanner.prototype.unwindIndent = function unwindIndent(column) {
  var mark;

  // In flow context, tokens should respect indentation.
  // Actually the condition should be `self.indent >= column` according to
  // the spec. But this condition will prohibit intuitively correct
  // constructions such as
  //   key : {
  //   }
  //  if self.flow_level and self.indent > column:
  //    raise ScannerError(None, None,
  //            "invalid intendation or unclosed '[' or '{'",
  //            self.get_mark())

  // In the flow context, indentation is ignored. We make the scanner less
  // restrictive then specification requires.

  if (this.flowLevel) {
    return;
  }

  // In block context, we may need to issue the BLOCK-END tokens.
  while (this.indent > column) {
    mark = this.getMark();
    this.indent = this.indents.pop();
    this.tokens.push(new _tokens.BlockEndToken(mark, mark));
  }
};

Scanner.prototype.addIndent = function addIndent(column) {
  // Check if we need to increase indentation.

  if (this.indent < column) {
    this.indents.push(this.indent);
    this.indent = column;
    return true;
  }

  return false;
};

Scanner.prototype.fetchStreamStart = function fetchStreamStart() {
  var mark;

  // We always add STREAM-START as the first token and STREAM-END as the
  // last token.

  // Read the token.
  mark = this.getMark();
  
  // Add STREAM-START.
  this.tokens.push(new _tokens.StreamStartToken(mark, mark, this.encoding));
};

Scanner.prototype.fetchStreamEnd = function fetchStreamEnd() {
  var mark;

  // Set the current intendation to -1.
  this.unwindIndent(-1);

  // Reset simple keys.
  this.removePossibleSimpleKey();
  this.allowSimpleKey = false;
  this.possibleSimpleKeys = {};

  // Read the token.
  mark = this.getMark();
  
  // Add STREAM-END.
  this.tokens.push(new _tokens.StreamEndToken(mark, mark));

  // The steam is finished.
  this.done = true;
};

Scanner.prototype.fetchDirective = function fetchDirective() {
  // Set the current intendation to -1.
  this.unwindIndent(-1);

  // Reset simple keys.
  this.removePossibleSimpleKey();
  this.allowSimpleKey = false;

  // Scan and add DIRECTIVE.
  this.tokens.push(this.scanDirective());
};

Scanner.prototype.fetchDocumentStart = function fetchDocumentStart() {
  this.fetchDocumentIndicator(_tokens.DocumentStartToken);
};

Scanner.prototype.fetchDocumentEnd = function fetchDocumentEnd() {
  this.fetchDocumentIndicator(_tokens.DocumentEndToken);
};

Scanner.prototype.fetchDocumentIndicator = function fetchDocumentIndicator(TokenClass) {
  var startMark, endMark;

  // Set the current intendation to -1.
  this.unwindIndent(-1);

  // Reset simple keys. Note that there could not be a block collection
  // after '---'.
  this.removePossibleSimpleKey();
  this.allowSimpleKey = false;

  // Add DOCUMENT-START or DOCUMENT-END.
  startMark = this.getMark();
  this.forward(3);
  endMark = this.getMark();

  this.tokens.push(new TokenClass(startMark, endMark));
};

Scanner.prototype.fetchFlowSequenceStart = function fetchFlowSequenceStart() {
  this.fetchFlowCollectionStart(_tokens.FlowSequenceStartToken);
};

Scanner.prototype.fetchFlowMappingStart = function fetchFlowMappingStart() {
  this.fetchFlowCollectionStart(_tokens.FlowMappingStartToken);
};

Scanner.prototype.fetchFlowCollectionStart = function fetchFlowCollectionStart(TokenClass) {
  var startMark, endMark;

  // '[' and '{' may start a simple key.
  this.savePossibleSimpleKey();

  // Increase the flow level.
  this.flowLevel += 1;

  // Simple keys are allowed after '[' and '{'.
  this.allowSimpleKey = true;

  // Add FLOW-SEQUENCE-START or FLOW-MAPPING-START.
  startMark = this.getMark();
  this.forward();
  endMark = this.getMark();

  this.tokens.push(new TokenClass(startMark, endMark));
};

Scanner.prototype.fetchFlowSequenceEnd = function fetchFlowSequenceEnd() {
  this.fetchFlowCollectionEnd(_tokens.FlowSequenceEndToken);
};

Scanner.prototype.fetchFlowMappingEnd = function fetchFlowMappingEnd() {
  this.fetchFlowCollectionEnd(_tokens.FlowMappingEndToken);
};

Scanner.prototype.fetchFlowCollectionEnd = function fetchFlowCollectionEnd(TokenClass) {
  var startMark, endMark;

  // Reset possible simple key on the current level.
  this.removePossibleSimpleKey();

  // Decrease the flow level.
  this.flowLevel -= 1;

  // No simple keys after ']' or '}'.
  this.allowSimpleKey = false;

  // Add FLOW-SEQUENCE-END or FLOW-MAPPING-END.
  startMark = this.getMark();
  this.forward();
  endMark = this.getMark();
  this.tokens.push(new TokenClass(startMark, endMark));
};

Scanner.prototype.fetchFlowEntry = function fetchFlowEntry() {
  var startMark, endMark;

  // Simple keys are allowed after ','.
  this.allowSimpleKey = true;

  // Reset possible simple key on the current level.
  this.removePossibleSimpleKey();

  // Add FLOW-ENTRY.
  startMark = this.getMark();
  this.forward();
  endMark = this.getMark();

  this.tokens.push(new _tokens.FlowEntryToken(startMark, endMark));
};

Scanner.prototype.fetchBlockEntry = function fetchBlockEntry() {
  var mark, startMark, endMark;

  // Block context needs additional checks.
  if (!this.flowLevel) {
    // Are we allowed to start a new entry?
    if (!this.allowSimpleKey) {
      throw new ScannerError(null, null,
                             "sequence entries are not allowed here",
                             this.getMark());
    }

    // We may need to add BLOCK-SEQUENCE-START.
    if (this.addIndent(this.column)) {
      mark = this.getMark();
      this.tokens.push(new _tokens.BlockSequenceStartToken(mark, mark));
    }
  }

  // else --------------------------------------------------------------------
  // It's an error for the block entry to occur in the flow context,
  // but we let the parser detect this.
  // -------------------------------------------------------------------------

  // Simple keys are allowed after '-'.
  this.allowSimpleKey = true;

  // Reset possible simple key on the current level.
  this.removePossibleSimpleKey();

  // Add BLOCK-ENTRY.
  startMark = this.getMark();
  this.forward();
  endMark = this.getMark();

  this.tokens.push(new _tokens.BlockEntryToken(startMark, endMark));
};

Scanner.prototype.fetchKey = function fetchKey() {
  var mark, startMark, endMark;

  // Block context needs additional checks.
  if (!this.flowLevel) {
    // Are we allowed to start a key (not nessesary a simple)?
    if (!this.allowSimpleKey) {
      throw new ScannerError(null, null,
                             "mapping keys are not allowed here",
                             this.getMark());
    }

    // We may need to add BLOCK-MAPPING-START.
    if (this.addIndent(this.column)) {
      mark = this.getMark();
      this.tokens.push(new _tokens.BlockMappingStartToken(mark, mark));
    }
  }

  // Simple keys are allowed after '?' in the block context.
  this.allowSimpleKey = !this.flowLevel;

  // Reset possible simple key on the current level.
  this.removePossibleSimpleKey();

  // Add KEY.
  startMark = this.getMark();
  this.forward();
  endMark = this.getMark();

  this.tokens.push(new _tokens.KeyToken(startMark, endMark));
};

Scanner.prototype.fetchValue = function fetchValue() {
  var key, mark, startMark, endMark;

  // Do we determine a simple key?
  if (undefined !== this.possibleSimpleKeys[this.flowLevel]) {
    // Add KEY.
    key = this.possibleSimpleKeys[this.flowLevel];
    delete this.possibleSimpleKeys[this.flowLevel];

    this.tokens.splice(key.tokenNumber - this.tokensTaken, 0,
                       new _tokens.KeyToken(key.mark, key.mark));

    // If this key starts a new block mapping, we need to add
    // BLOCK-MAPPING-START.
    if (!this.flowLevel) {
      if (this.addIndent(key.column)) {
        this.tokens.splice(key.tokenNumber - this.tokensTaken, 0,
                           new _tokens.BlockMappingStartToken(key.mark, key.mark));
      }
    }

    // There cannot be two simple keys one after another.
    this.allowSimpleKey = false;

  // It must be a part of a complex key.
  } else {

    // Block context needs additional checks.
    // (Do we really need them? They will be catched by the parser
    // anyway.)
    if (!this.flowLevel) {
      // We are allowed to start a complex value if and only if
      // we can start a simple key.
      if (!this.allowSimpleKey) {
        throw new ScannerError(null, null,
                               "mapping values are not allowed here",
                               this.getMark());
      }
    }

    // If this value starts a new block mapping, we need to add
    // BLOCK-MAPPING-START.  It will be detected as an error later by
    // the parser.
    if (!this.flowLevel) {
      if (this.addIndent(this.column)) {
        mark = this.getMark();
        this.tokens.push(new _tokens.BlockMappingStartToken(mark, mark));
      }
    }

    // Simple keys are allowed after ':' in the block context.
    this.allowSimpleKey = !this.flowLevel;

    // Reset possible simple key on the current level.
    this.removePossibleSimpleKey();
  }

  // Add VALUE.
  startMark = this.getMark();
  this.forward();
  endMark = this.getMark();

  this.tokens.push(new _tokens.ValueToken(startMark, endMark));
};

Scanner.prototype.fetchAlias = function fetchAlias() {
  // ALIAS could be a simple key.
  this.savePossibleSimpleKey();

  // No simple keys after ALIAS.
  this.allowSimpleKey = false;

  // Scan and add ALIAS.
  this.tokens.push(this.scanAnchor(_tokens.AliasToken));
};

Scanner.prototype.fetchAnchor = function fetchAnchor() {
  // ANCHOR could start a simple key.
  this.savePossibleSimpleKey();

  // No simple keys after ANCHOR.
  this.allowSimpleKey = false;

  // Scan and add ANCHOR.
  this.tokens.push(this.scanAnchor(_tokens.AnchorToken));
};

Scanner.prototype.fetchTag = function fetchTag() {
  // TAG could start a simple key.
  this.savePossibleSimpleKey();

  // No simple keys after TAG.
  this.allowSimpleKey = false;

  // Scan and add TAG.
  this.tokens.push(this.scanTag());
};

Scanner.prototype.fetchLiteral = function fetchLiteral() {
  this.fetchBlockScalar('|');
};

Scanner.prototype.fetchFolded = function fetchFolded() {
  this.fetchBlockScalar('>');
};

Scanner.prototype.fetchBlockScalar = function fetchBlockScalar(style) {
  // A simple key may follow a block scalar.
  this.allowSimpleKey = true;

  // Reset possible simple key on the current level.
  this.removePossibleSimpleKey();

  // Scan and add SCALAR.
  this.tokens.push(this.scanBlockScalar(style));
};

Scanner.prototype.fetchSingle = function fetchSingle() {
  this.fetchFlowScalar('\'');
};

Scanner.prototype.fetchDouble = function fetchDouble() {
  this.fetchFlowScalar('"');
};

Scanner.prototype.fetchFlowScalar = function fetchFlowScalar(style) {
  // A flow scalar could be a simple key.
  this.savePossibleSimpleKey();

  // No simple keys after flow scalars.
  this.allowSimpleKey = false;

  // Scan and add SCALAR.
  this.tokens.push(this.scanFlowScalar(style));
};

Scanner.prototype.fetchPlain = function fetchPlain() {
  // A plain scalar could be a simple key.
  this.savePossibleSimpleKey();

  // No simple keys after plain scalars. But note that `scan_plain` will
  // change this flag if the scan is finished at the beginning of the
  // line.
  this.allowSimpleKey = false;

  // Scan and add SCALAR. May change `allow_simple_key`.
  this.tokens.push(this.scanPlain());
};

Scanner.prototype.checkDirective = function checkDirective() {
  // DIRECTIVE:    ^ '%' ...
  // The '%' indicator is already checked.
  return (this.column === 0);
};

Scanner.prototype.checkDocumentStart = function checkDocumentStart() {
  // DOCUMENT-START:   ^ '---' (' '|'\n')
  if (+this.column === 0 && this.prefix(3) === '---') {
    return (0 <= '\x00 \t\r\n\x85\u2028\u2029'.indexOf(this.peek(3)));
  }

  return false;
};

Scanner.prototype.checkDocumentEnd = function checkDocumentEnd() {
  // DOCUMENT-END:   ^ '...' (' '|'\n')
  if (+this.column === 0 && this.prefix(3) === '...') {
    return (0 <= '\x00 \t\r\n\x85\u2028\u2029'.indexOf(this.peek(3)));
  }

  return false;
};

Scanner.prototype.checkBlockEntry = function checkBlockEntry() {
  // BLOCK-ENTRY:    '-' (' '|'\n')
  return (0 <= '\x00 \t\r\n\x85\u2028\u2029'.indexOf(this.peek(1)));
};

Scanner.prototype.checkKey = function checkKey() {
  // KEY(flow context):  '?'
  if (this.flowLevel) {
    return true;
  }

  // KEY(block context):   '?' (' '|'\n')
  return 0 <= '\x00 \t\r\n\x85\u2028\u2029'.indexOf(this.peek(1));
};

Scanner.prototype.checkValue = function checkValue() {
  // VALUE(flow context):  ':'
  if (this.flowLevel) {
    return true;
  }

  // VALUE(block context): ':' (' '|'\n')
  return 0 <= '\x00 \t\r\n\x85\u2028\u2029'.indexOf(this.peek(1));
};

Scanner.prototype.checkPlain = function checkPlain() {
  // A plain scalar may start with any non-space character except:
  //   '-', '?', ':', ',', '[', ']', '{', '}',
  //   '#', '&', '*', '!', '|', '>', '\'', '\"',
  //   '%', '@', '`'.
  //
  // It may also start with
  //   '-', '?', ':'
  // if it is followed by a non-space character.
  //
  // Note that we limit the last rule to the block context (except the
  // '-' character) because we want the flow context to be space
  // independent.
  var ch = this.peek();
  return (
   -1 === '\x00 \t\r\n\x85\u2028\u2029-?:,[]{}#&*!|>\'\"%@`'.indexOf(ch) ||
   (
      -1 === '\x00 \t\r\n\x85\u2028\u2029'.indexOf(this.peek(1)) &&
      (
        ch === '-' || (!this.flowLevel && 0 <= '?:'.indexOf(ch))
      )
    )
  );
};

Scanner.prototype.scanToNextToken = function scanToNextToken() {
  var found = false;

  // We ignore spaces, line breaks and comments.
  // If we find a line break in the block context, we set the flag
  // `allow_simple_key` on.
  // The byte order mark is stripped if it's the first character in the
  // stream. We do not yet support BOM inside the stream as the
  // specification requires. Any such mark will be considered as a part
  // of the document.
  //
  // TODO: We need to make tab handling rules more sane. A good rule is
  //   Tabs cannot precede tokens
  //   BLOCK-SEQUENCE-START, BLOCK-MAPPING-START, BLOCK-END,
  //   KEY(block), VALUE(block), BLOCK-ENTRY
  // So the checking code is
  //   if <TAB>:
  //     self.allow_simple_keys = False
  // We also need to add the check for `allow_simple_keys == True` to
  // `unwind_indent` before issuing BLOCK-END.
  // Scanners for block, flow, and plain scalars need to be modified.

  if (this.index === 0 && this.peek() === '\uFEFF') {
    this.forward();
  }

  while (!found) {
    while (this.peek() === ' ') {
      this.forward();
    }

    if (this.peek() === '#') {
      while (-1 === '\x00\r\n\x85\u2028\u2029'.indexOf(this.peek())) {
        this.forward();
      }
    }

    if (this.scanLineBreak()) {
      if (!this.flowLevel) {
        this.allowSimpleKey = true;
      }
    } else {
      found = true;
    }
  }
};

Scanner.prototype.scanDirective = function scanDirective() {
  var startMark, endMark, name, value;

  // See the specification for details.
  startMark = this.getMark();
  this.forward();
  name = this.scanDirectiveName(startMark);
  value = null;

  if (name === 'YAML') {
    value = this.scanYamlDirectiveValue(startMark);
    endMark = this.getMark();
  } else if (name === 'TAG') {
    value = this.scanTagDirectiveValue(startMark);
    endMark = this.getMark();
  } else {
    endMark = this.getMark();

    while (-1 === '\x00\r\n\x85\u2028\u2029'.indexOf(this.peek())) {
      this.forward();
    }
  }

  this.scanDirectiveIgnoredLine(startMark);
  return new _tokens.DirectiveToken(name, value, startMark, endMark);
};

Scanner.prototype.scanDirectiveName = function scanDirectiveName(startMark) {
  var length, ch, value;

  // See the specification for details.
  length = 0;
  ch = this.peek(length);

  while (/^[0-9A-Za-z]/.test(ch) || 0 <= '-_'.indexOf(ch)) {
    length += 1;
    ch = this.peek(length);
  }

  if (!length) {
    throw new ScannerError("while scanning a directive", startMark,
        "expected alphabetic or numeric character, but found " + ch,
        this.getMark());
  }

  value = this.prefix(length);
  this.forward(length);
  ch = this.peek();

  if (-1 === '\x00 \r\n\x85\u2028\u2029'.indexOf(ch)) {
    throw new ScannerError("while scanning a directive", startMark,
        "expected alphabetic or numeric character, but found " + ch,
        this.getMark());
  }

  return value;
};

Scanner.prototype.scanYamlDirectiveValue = function scanYamlDirectiveValue(startMark) {
  var major, minor;

  // See the specification for details.

  while (this.peek() === ' ') {
    this.forward();
  }

  major = this.scanYamlDirectiveNumber(startMark);

  if (this.peek() !== '.') {
    throw new ScannerError("while scanning a directive", startMark,
        "expected a digit or '.', but found " + this.peek(),
        this.getMark());
  }

  this.forward();

  minor = this.scanYamlDirectiveNumber(startMark);

  if (-1 === '\x00 \r\n\x85\u2028\u2029'.indexOf(this.peek())) {
    throw new ScannerError("while scanning a directive", startMark,
        "expected a digit or ' ', but found " + this.peek(),
        this.getMark());
  }

  return [major, minor];
};

Scanner.prototype.scanYamlDirectiveNumber = function scanYamlDirectiveNumber(startMark) {
  var ch, length, value;

  // See the specification for details.

  ch = this.peek();

  if (!/^[0-9]/.test(ch)) {
    throw new ScannerError("while scanning a directive", startMark,
        "expected a digit, but found " + ch, this.getMark());
  }

  length = 0;

  while (/^[0-9]/.test(this.peek(length))) {
    length += 1;
  }

  value = +(this.prefix(length));
  this.forward(length);

  return value;
};

Scanner.prototype.scanTagDirectiveValue = function scanTagDirectiveValue(startMark) {
  var handle, prefix;

  // See the specification for details.
  while (this.peek() === ' ') {
    this.forward();
  }

  handle = this.scanTagDirectiveHandle(startMark);

  while (this.peek() === ' ') {
    this.forward();
  }

  prefix = this.scanTagDirectivePrefix(startMark);

  return [handle, prefix];
};

Scanner.prototype.scanTagDirectiveHandle = function scanTagDirectiveHandle(startMark) {
  var value, ch;

  // See the specification for details.
  value = this.scanTagHandle('directive', startMark);
  ch = this.peek();

  if (ch !== ' ') {
    throw new ScannerError("while scanning a directive", startMark,
        "expected ' ', but found " + ch, this.getMark());
  }

  return value;
};

Scanner.prototype.scanTagDirectivePrefix = function scanTagDirectivePrefix(startMark) {
  var value, ch;

  // See the specification for details.
  value = this.scanTagUri('directive', startMark);
  ch = this.peek();

  if (-1 === '\x00 \r\n\x85\u2028\u2029'.indexOf(ch)) {
    throw new ScannerError("while scanning a directive", startMark,
                           "expected ' ', but found " + ch, this.getMark());
  }

  return value;
};

Scanner.prototype.scanDirectiveIgnoredLine = function scanDirectiveIgnoredLine(startMark) {
  var ch;

  // See the specification for details.
  while (this.peek() === ' ') {
    this.forward();
  }

  if (this.peek() === '#') {
    while (-1 === '\x00\r\n\x85\u2028\u2029'.indexOf(this.peek())) {
      this.forward();
    }
  }

  ch = this.peek();

  if (-1 === '\x00\r\n\x85\u2028\u2029'.indexOf(ch)) {
    throw new ScannerError("while scanning a directive", startMark,
        "expected a comment or a line break, but found " + ch,
        this.getMark());
  }

  this.scanLineBreak();
};

Scanner.prototype.scanAnchor = function scanAnchor(TokenClass) {
  var startMark, indicator, name, length, ch, value;

  // The specification does not restrict characters for anchors and
  // aliases. This may lead to problems, for instance, the document:
  //   [ *alias, value ]
  // can be interpteted in two ways, as
  //   [ "value" ]
  // and
  //   [ *alias , "value" ]
  // Therefore we restrict aliases to numbers and ASCII letters.

  startMark = this.getMark();
  indicator = this.peek();
  name = (indicator === '*') ? 'alias' : 'anchor';

  this.forward();
  length = 0;
  ch = this.peek(length);

  while (/^[0-9A-Za-z]/.test(ch) || 0 <= '-_'.indexOf(ch)) {
    length += 1;
    ch = this.peek(length);
  }
    
  if (!length) {
    throw new ScannerError("while scanning an " + name, startMark,
        "expected alphabetic or numeric character, but found " + ch,
        this.getMark());
  }

  value = this.prefix(length);
  this.forward(length);
  ch = this.peek();

  if (-1 === '\x00 \t\r\n\x85\u2028\u2029?:,]}%@`'.indexOf(ch)) {
    throw new ScannerError("while scanning an " + name, startMark,
        "expected alphabetic or numeric character, but found " + ch,
        this.getMark());
  }

  return new TokenClass(value, startMark, this.getMark());
};

Scanner.prototype.scanTag = function scanTag() {
  var startMark, ch, handle, suffix, length, useHandle;

  // See the specification for details.
  startMark = this.getMark();
  ch = this.peek(1);

  if (ch === '<') {
    handle = null;
    this.forward(2);
    suffix = this.scanTagUri('tag', startMark);

    if (this.peek() !== '>') {
      throw new ScannerError("while parsing a tag", startMark,
          "expected '>', but found " + this.peek(),
          this.getMark());
    }

    this.forward();
  } else if (0 <= '\x00 \t\r\n\x85\u2028\u2029'.indexOf(ch)) {
    handle = null;
    suffix = '!';

    this.forward();
  } else {
    length = 1;
    useHandle = false;

    while (-1 === '\x00 \r\n\x85\u2028\u2029'.indexOf(ch)) {
      if (ch === '!') {
        useHandle = true;
        break;
      }

      length += 1;
      ch = this.peek(length);
    }

    if (useHandle) {
      handle = this.scanTagHandle('tag', startMark);
    } else {
      handle = '!';
      this.forward();
    }

    suffix = this.scanTagUri('tag', startMark);
  }

  ch = this.peek();

  if (-1 === '\x00 \r\n\x85\u2028\u2029'.indexOf(ch)) {
    throw new ScannerError("while scanning a tag", startMark,
                           "expected ' ', but found " + ch, this.getMark());
  }

  return new _tokens.TagToken([handle, suffix], startMark, this.getMark());
};

Scanner.prototype.scanBlockScalar = function scanBlockScalar(style) {
  var folded, chunks, startMark, endMark, chomping, increment = null,
      minIndent, maxIndent, indent, breaks, lineBreak, leadingNonSpace,
      tuple, length;
  // See the specification for details.

  folded = (style === '>');
  chunks = [];
  startMark = this.getMark();

  // Scan the header.
  this.forward();
  tuple = this.scanBlockScalarIndicators(startMark);
  chomping = tuple[0];
  increment = tuple[1] || null;
  this.scanBlockScalarIgnoredLine(startMark);

  // Determine the indentation level and go to the first non-empty line.
  minIndent = this.indent + 1;

  if (minIndent < 1) {
    minIndent = 1;
  }

  if (null === increment) {
    tuple = this.scanBlockScalarIndentation();
    breaks = tuple[0];
    maxIndent = tuple[1];
    endMark = tuple[2];
    indent = Math.max(minIndent, maxIndent);
  } else {
    indent = minIndent + increment - 1;
    tuple = this.scanBlockScalarBreaks(indent);
    breaks = tuple[0];
    endMark = tuple[1];
  }

  lineBreak = '';

  // Scan the inner part of the block scalar.
  while (+this.column === indent && this.peek() !== '\x00') {
    chunks = chunks.concat(breaks);
    leadingNonSpace = -1 === ' \t'.indexOf(this.peek());
    length = 0;

    while (-1 === '\x00\r\n\x85\u2028\u2029'.indexOf(this.peek(length))) {
      length += 1;
    }

    chunks.push(this.prefix(length));
    this.forward(length);
    lineBreak = this.scanLineBreak();

    tuple = this.scanBlockScalarBreaks(indent);
    breaks = tuple[0];
    endMark = tuple[1];

    if (+this.column !== indent || this.peek() === '\x00') {
      break;
    }

    // Unfortunately, folding rules are ambiguous.
    //
    // This is the folding according to the specification:

    if (folded && lineBreak === '\n' && leadingNonSpace && -1 === ' \t'.indexOf(this.peek())) {
      if (!breaks || !breaks.length) {
        chunks.push(' ');
      }
    } else {
      chunks.push(lineBreak);
    }
    
    // This is Clark Evans's interpretation (also in the spec
    // examples):
    //
    //if folded and line_break == '\n':
    //  if not breaks:
    //    if this.peek() not in ' \t':
    //      chunks.append(' ')
    //    else:
    //      chunks.append(line_break)
    //else:
    //  chunks.append(line_break)
  }

  // Chomp the tail.
  if (false !== chomping) {
    chunks.push(lineBreak);
  }

  if (true === chomping) {
    chunks = chunks.concat(breaks);
  }

  // We are done.
  return new _tokens.ScalarToken(chunks.join(''), false, startMark, endMark, style);
};

Scanner.prototype.scanBlockScalarIndicators = function scanBlockScalarIndicators(startMark) {
  var chomping = null, increment = null, ch = this.peek();

  // See the specification for details.
  if (0 <= '+-'.indexOf(ch)) {
    chomping = (ch === '+');
    this.forward();
    ch = this.peek();

    if (0 <= '0123456789'.indexOf(ch)) {
      increment = +ch;
      if (increment === 0) {
        throw new ScannerError("while scanning a block scalar", startMark,
            "expected indentation indicator in the range 1-9, but found 0",
            this.getMark());
      }
      this.forward();
    }
  } else if (0 <= '0123456789'.indexOf(ch)) {
    increment = +ch;
    if (increment === 0) {
      throw new ScannerError("while scanning a block scalar", startMark,
          "expected indentation indicator in the range 1-9, but found 0",
          this.getMark());
    }

    this.forward();
    ch = this.peek();

    if (0 <= '+-'.indexOf(ch)) {
      chomping = (ch === '+');
      this.forward();
    }
  }

  ch = this.peek();

  if (-1 === '\x00 \r\n\x85\u2028\u2029'.indexOf(ch)) {
    throw new ScannerError("while scanning a block scalar", startMark,
        "expected chomping or indentation indicators, but found " + ch,
        this.getMark());
  }

  return [chomping, increment];
};

Scanner.prototype.scanBlockScalarIgnoredLine = function scanBlockScalarIgnoredLine(startMark) {
  var ch;

  // See the specification for details.
  while (this.peek() === ' ') {
    this.forward();
  }

  if (this.peek() === '#') {
    while (-1 === '\x00\r\n\x85\u2028\u2029'.indexOf(this.peek())) {
      this.forward();
    }
  }

  ch = this.peek();

  if (-1 === '\x00\r\n\x85\u2028\u2029'.indexOf(ch)) {
    throw new ScannerError("while scanning a block scalar", startMark,
        "expected a comment or a line break, but found " + ch,
        this.getMark());
  }

  this.scanLineBreak();
};

Scanner.prototype.scanBlockScalarIndentation = function scanBlockScalarIndentation() {
  var chunks, maxIndent, endMark;
  // See the specification for details.
  chunks = [];
  maxIndent = 0;
  endMark = this.getMark();

  while (0 <= ' \r\n\x85\u2028\u2029'.indexOf(this.peek())) {
    if (this.peek() !== ' ') {
      chunks.push(this.scanLineBreak());
      endMark = this.getMark();
    } else {
      this.forward();
      if (this.column > maxIndent) {
        maxIndent = this.column;
      }
    }
  }

  return [chunks, maxIndent, endMark];
};

Scanner.prototype.scanBlockScalarBreaks = function scanBlockScalarBreaks(indent) {
  var chunks, endMark;
  // See the specification for details.
  chunks = [];
  endMark = this.getMark();

  while (this.column < indent && this.peek() === ' ') {
    this.forward();
  }

  while (0 <= '\r\n\x85\u2028\u2029'.indexOf(this.peek())) {
    chunks.push(this.scanLineBreak());
    endMark = this.getMark();

    while (this.column < indent && this.peek() === ' ') {
      this.forward();
    }
  }

  return [chunks, endMark];
};

Scanner.prototype.scanFlowScalar = function scanFlowScalar(style) {
  var dbl, chunks, startMark, quote, endMark;
  // See the specification for details.
  // Note that we loose indentation rules for quoted scalars. Quoted
  // scalars don't need to adhere indentation because " and ' clearly
  // mark the beginning and the end of them. Therefore we are less
  // restrictive then the specification requires. We only need to check
  // that document separators are not included in scalars.
  dbl = (style === '"');
  chunks = [];
  startMark = this.getMark();
  quote = this.peek();
  this.forward();

  chunks = chunks.concat(this.scanFlowScalarNonSpaces(dbl, startMark));

  while (this.peek() !== quote) {
    chunks = chunks.concat(this.scanFlowScalarSpaces(dbl, startMark));
    chunks = chunks.concat(this.scanFlowScalarNonSpaces(dbl, startMark));
  }

  this.forward();
  endMark = this.getMark();

  return new _tokens.ScalarToken(chunks.join(''), false, startMark, endMark, style);
};

Scanner.prototype.scanFlowScalarNonSpaces = function scanFlowScalarNonSpaces(dbl, startMark) {
  var self = this, chunks, length, ch, code, validator;

  validator = function (k) {
    if (-1 === '0123456789ABCDEFabcdef'.indexOf(self.peek(k))) {
      throw new ScannerError("while scanning a double-quoted scalar", startMark,
          "expected escape sequence of " + length + " hexdecimal numbers, but found " + self.peek(k),
          self.getMark());
    }
  };

  // See the specification for details.
  chunks = [];
  while (true) {
    length = 0;

    while (-1 === '\'\"\\\x00 \t\r\n\x85\u2028\u2029'.indexOf(this.peek(length))) {
      length += 1;
    }

    if (length) {
      chunks.push(this.prefix(length));
      this.forward(length);
    }

    ch = this.peek();

    if (!dbl && ch === '\'' && this.peek(1) === '\'') {
      chunks.push('\'');
      this.forward(2);
    } else if ((dbl && ch === '\'') || (!dbl && 0 <= '\"\\'.indexOf(ch))) {
      chunks.push(ch);
      this.forward();
    } else if (dbl && ch === '\\') {
      this.forward();
      ch = this.peek();

      if (ESCAPE_REPLACEMENTS.hasOwnProperty(ch)) {
        chunks.push(ESCAPE_REPLACEMENTS[ch]);
        this.forward();
      } else if (ESCAPE_CODES.hasOwnProperty(ch)) {
        length = ESCAPE_CODES[ch];
        this.forward();
        range(length).forEach(validator);
        code = parseInt(this.prefix(length), 16);
        chunks.push(String.fromCharCode(code));
        this.forward(length);
      } else if (0 <= '\r\n\x85\u2028\u2029'.indexOf(ch)) {
        this.scanLineBreak();
        chunks = chunks.concat(this.scanFlowScalarBreaks(dbl, startMark));
      } else {
        throw new ScannerError("while scanning a double-quoted scalar", startMark,
                               "found unknown escape character " + ch, this.getMark());
      }
    } else {
      return chunks;
    }
  }
};

Scanner.prototype.scanFlowScalarSpaces = function scanFlowScalarSpaces(dbl, startMark) {
  var chunks, length, whitespaces, ch, lineBreak, breaks;
  // See the specification for details.
  chunks = [];
  length = 0;

  while (0 <= ' \t'.indexOf(this.peek(length))) {
    length += 1;
  }

  whitespaces = this.prefix(length);
  this.forward(length);
  ch = this.peek();

  if (ch === '\x00') {
    throw new ScannerError("while scanning a quoted scalar", startMark,
                           "found unexpected end of stream", this.getMark());
  } else if (0 <= '\r\n\x85\u2028\u2029'.indexOf(ch)) {
    lineBreak = this.scanLineBreak();
    breaks = this.scanFlowScalarBreaks(dbl, startMark);

    if (lineBreak !== '\n') {
      chunks.push(lineBreak);
    } else if (!breaks) {
      chunks.push(' ');
    }

    chunks = chunks.concat(breaks);
  } else {
    chunks.push(whitespaces);
  }

  return chunks;
};

Scanner.prototype.scanFlowScalarBreaks = function scanFlowScalarBreaks(dbl, startMark) {
  var chunks = [], prefix;

  // See the specification for details.

  while (true) {
    // Instead of checking indentation, we check for document
    // separators.
    prefix = this.prefix(3);

    if ((prefix === '---' || prefix === '...') && 0 <= '\x00 \t\r\n\x85\u2028\u2029'.indexOf(this.peek(3))) {
      throw new ScannerError("while scanning a quoted scalar", startMark,
                             "found unexpected document separator", this.getMark());
    }

    while (0 <= ' \t'.indexOf(this.peek())) {
      this.forward();
    }

    if (0 <= '\r\n\x85\u2028\u2029'.indexOf(this.peek())) {
      chunks.push(this.scanLineBreak());
    } else {
      return chunks;
    }
  }
};

Scanner.prototype.scanPlain = function scanPlain() {
  var ch, chunks, startMark, endMark, indent, spaces, length;

  // See the specification for details.
  // We add an additional restriction for the flow context:
  //   plain scalars in the flow context cannot contain ',', ':' and '?'.
  // We also keep track of the `allow_simple_key` flag here.
  // Indentation rules are loosed for the flow context.

  chunks = [];
  startMark = this.getMark();
  endMark = startMark;
  indent = this.indent + 1;
  spaces = [];

  // We allow zero indentation for scalars, but then we need to check for
  // document separators at the beginning of the line.
  //if indent == 0:
  //  indent = 1

  while (true) {
    length = 0;

    if (this.peek() === '#') {
      break;
    }

    while (true) {
      ch = this.peek(length);

      if (0 <= '\x00 \t\r\n\x85\u2028\u2029'.indexOf(ch) || (
            !this.flowLevel && ch === ':' &&
            0 <= '\x00 \t\r\n\x85\u2028\u2029'.indexOf(this.peek(length + 1))
          ) || (this.flowLevel && 0 <= ',:?[]{}'.indexOf(ch))) {
        break;
      }

      length += 1;
    }

    // It's not clear what we should do with ':' in the flow context.
    if (this.flowLevel && ch === ':' && -1 === '\x00 \t\r\n\x85\u2028\u2029,[]{}'.indexOf(this.peek(length + 1))) {
      this.forward(length);
      throw new ScannerError("while scanning a plain scalar", startMark,
        "found unexpected ':'", this.getMark(),
        "Please check http://pyyaml.org/wiki/YAMLColonInFlowContext for details.");
    }

    if (length === 0) {
      break;
    }

    this.allowSimpleKey = false;
    chunks = chunks.concat(spaces);
    chunks.push(this.prefix(length));

    this.forward(length);
    endMark = this.getMark();
    spaces = this.scanPlainSpaces(indent, startMark);

    if (!Array.isArray(spaces) || !spaces.length || this.peek() === '#' ||
        (!this.flowLevel && this.column < indent)) {
      break;
    }
  }

  return new _tokens.ScalarToken(chunks.join(''), true, startMark, endMark);
};

Scanner.prototype.scanPlainSpaces = function scanPlainSpaces() {
  var chunks, length, whitespaces, ch, prefix, breaks, lineBreak;

  // See the specification for details.
  // The specification is really confusing about tabs in plain scalars.
  // We just forbid them completely. Do not use tabs in YAML!

  chunks = [];
  length = 0;

  while (this.peek(length) === ' ') {
    length += 1;
  }

  whitespaces = this.prefix(length);
  this.forward(length);
  ch = this.peek();

  if (0 <= '\r\n\x85\u2028\u2029'.indexOf(ch)) {
    lineBreak = this.scanLineBreak();
    this.allowSimpleKey = true;
    prefix = this.prefix(3);

    if ((prefix === '---' || prefix === '...') &&
        0 <= '\x00 \t\r\n\x85\u2028\u2029'.indexOf(this.peek(3))) {
      return;
    }

    breaks = [];

    while (0 <= ' \r\n\x85\u2028\u2029'.indexOf(this.peek())) {
      if (this.peek() === ' ') {
        this.forward();
      } else {
        breaks.push(this.scanLineBreak());
        prefix = this.prefix(3);

        if ((prefix === '---' || prefix === '...') &&
            0 <= '\x00 \t\r\n\x85\u2028\u2029'.indexOf(this.peek(3))) {
          return;
        }
      }
    }

    if (lineBreak !== '\n') {
      chunks.push(lineBreak);
    } else if (!breaks || !breaks.length) {
      chunks.push(' ');
    }

    chunks = chunks.concat(breaks);
  } else if (whitespaces) {
    chunks.push(whitespaces);
  }

  return chunks;
};

Scanner.prototype.scanTagHandle = function scanTagHandle(name, startMark) {
  var ch, length, value;

  // See the specification for details.
  // For some strange reasons, the specification does not allow '_' in
  // tag handles. I have allowed it anyway.

  ch = this.peek();

  if (ch !== '!') {
    throw new ScannerError("while scanning a " + name, startMark,
                           "expected '!', but found " + ch, this.getMark());
  }

  length = 1;
  ch = this.peek(length);

  if (ch !== ' ') {
    while (/^[0-9A-Za-z]/.test(ch) || 0 <= '-_'.indexOf(ch)) {
      length += 1;
      ch = this.peek(length);
    }

    if (ch !== '!') {
      this.forward(length);
      throw new ScannerError("while scanning a " + name, startMark,
                             "expected '!', but found " + ch, this.getMark());
    }

    length += 1;
  }

  value = this.prefix(length);
  this.forward(length);

  return value;
};

Scanner.prototype.scanTagUri = function scanTagUri(name, startMark) {
  var chunks, length, ch;

  // See the specification for details.
  // Note: we do not check if URI is well-formed.

  chunks = [];
  length = 0;
  ch = this.peek(length);

  while (/^[0-9A-Za-z]/.test(ch) || 0 <= '-;/?:@&=+$,_.!~*\'()[]%'.indexOf(ch)) {
    if (ch === '%') {
      chunks.push(this.prefix(length));
      this.forward(length);
      length = 0;
      chunks.push(this.scanUriEscapes(name, startMark));
    } else {
      length += 1;
    }

    ch = this.peek(length);
  }

  if (length) {
    chunks.push(this.prefix(length));
    this.forward(length);
    length = 0;
  }

  if (!chunks.length) {
    throw new ScannerError("while parsing a " + name, startMark,
        "expected URI, but found " + ch, this.getMark());
  }

  return chunks.join('');
};

Scanner.prototype.scanUriEscapes = function scanUriEscapes(name, startMark) {
  var self = this, codes, mark, value, validator;

  // See the specification for details.
  codes = [];
  mark = this.getMark();

  validator = function (k) {
    if (-1 === '0123456789ABCDEFabcdef'.indexOf(self.peek(k))) {
      throw new ScannerError("while scanning a " + name, startMark,
        "expected URI escape sequence of 2 hexdecimal numbers, but found " + self.peek(k),
        self.getMark());
    }
  };

  while (this.peek() === '%') {
    this.forward();
    range(2).forEach(validator);
    codes.push(parseInt(this.prefix(2), 16));
    this.forward(2);
  }

  try {
    value = (new Buffer(codes)).toString('utf8');
  } catch (err) {
    throw new ScannerError("while scanning a " + name, startMark, err.toString(), mark);
  }

  return value;
};

Scanner.prototype.scanLineBreak = function scanLineBreak() {
  var ch;

  // Transforms:
  //   '\r\n'    :   '\n'
  //   '\r'    :   '\n'
  //   '\n'    :   '\n'
  //   '\x85'    :   '\n'
  //   '\u2028'  :   '\u2028'
  //   '\u2029   :   '\u2029'
  //   default   :   ''
  
  ch = this.peek();

  if (0 <= '\r\n\x85'.indexOf(ch)) {
    if (this.prefix(2) === '\r\n') {
      this.forward(2);
    } else {
      this.forward();
    }

    return '\n';
  } else if (0 <= '\u2028\u2029'.indexOf(ch)) {
    this.forward();
    return ch;
  }

  return '';
};


module.exports.Scanner = Scanner;


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////
