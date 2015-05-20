!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.Slowparse=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// ### CSS Parsing
//
// `CSSParser` is our internal CSS token stream parser object. This object
// has references to the stream, as well as the HTML DOM builder that is
// used by the HTML parser.
module.exports = (function(){
  "use strict";

  var ParseError = require("./ParseError");

  //Define a property checker for https page
  var checkMixedContent = require("./checkMixedContent").mixedContent;

  function CSSParser(stream, domBuilder, warnings) {
    this.stream = stream;
    this.domBuilder = domBuilder;
    this.warnings = warnings;
  }

  CSSParser.prototype = {
    // We keep a list of all currently valid CSS properties (CSS1-CSS3).
    // This list does not contain vendor prefixes.
    cssProperties: [
      "alignment-adjust","alignment-baseline","animation","animation-delay",
      "animation-direction","animation-duration","animation-iteration-count",
      "animation-name","animation-play-state","animation-timing-function",
      "appearance","azimuth","backface-visibility","background",
      "background-attachment","background-clip","background-color",
      "background-image","background-origin","background-position",
      "background-repeat","background-size","baseline-shift","binding",
      "bleed","bookmark-label","bookmark-level","bookmark-state",
      "bookmark-target","border","border-bottom","border-bottom-color",
      "border-bottom-left-radius","border-bottom-right-radius",
      "border-bottom-style","border-bottom-width","border-collapse",
      "border-color","border-image","border-image-outset",
      "border-image-repeat","border-image-slice","border-image-source",
      "border-image-width","border-left","border-left-color",
      "border-left-style","border-left-width","border-radius","border-right",
      "border-right-color","border-right-style","border-right-width",
      "border-spacing","border-style","border-top","border-top-color",
      "border-top-left-radius","border-top-right-radius","border-top-style",
      "border-top-width","border-width","bottom","box-decoration-break",
      "box-shadow","box-sizing","break-after","break-before","break-inside",
      "caption-side","clear","clip","color","color-profile","column-count",
      "column-fill","column-gap","column-rule","column-rule-color",
      "column-rule-style","column-rule-width","column-span","column-width",
      "columns","content","counter-increment","counter-reset","crop","cue",
      "cue-after","cue-before","cursor","direction","display",
      "dominant-baseline","drop-initial-after-adjust",
      "drop-initial-after-align","drop-initial-before-adjust",
      "drop-initial-before-align","drop-initial-size","drop-initial-value",
      "elevation","empty-cells","filter","fit","fit-position","flex-align",
      "flex-flow","flex-line-pack","flex-order","flex-pack","float","float-offset",
      "font","font-family","font-size","font-size-adjust","font-stretch",
      "font-style","font-variant","font-weight","grid-columns","grid-rows",
      "hanging-punctuation","height","hyphenate-after","hyphenate-before",
      "hyphenate-character","hyphenate-lines","hyphenate-resource","hyphens",
      "icon","image-orientation","image-rendering","image-resolution",
      "inline-box-align","left","letter-spacing","line-break","line-height",
      "line-stacking","line-stacking-ruby","line-stacking-shift",
      "line-stacking-strategy","list-style","list-style-image",
      "list-style-position","list-style-type","margin","margin-bottom",
      "margin-left","margin-right","margin-top","marker-offset","marks",
      "marquee-direction","marquee-loop","marquee-play-count","marquee-speed",
      "marquee-style","max-height","max-width","min-height","min-width",
      "move-to","nav-down","nav-index","nav-left","nav-right","nav-up",
      "opacity","orphans","outline","outline-color","outline-offset",
      "outline-style","outline-width","overflow","overflow-style",
      "overflow-wrap","overflow-x","overflow-y","padding","padding-bottom",
      "padding-left","padding-right","padding-top","page","page-break-after",
      "page-break-before","page-break-inside","page-policy","pause",
      "pause-after","pause-before","perspective","perspective-origin",
      "phonemes","pitch","pitch-range","play-during","pointer-events",
      "position",
      "presentation-level","punctuation-trim","quotes","rendering-intent",
      "resize","rest","rest-after","rest-before","richness","right",
      "rotation","rotation-point","ruby-align","ruby-overhang",
      "ruby-position","ruby-span","src","size","speak","speak-header",
      "speak-numeral","speak-punctuation","speech-rate","stress","string-set",
      "tab-size","table-layout","target","target-name","target-new",
      "target-position","text-align","text-align-last","text-decoration",
      "text-decoration-color","text-decoration-line","text-decoration-skip",
      "text-decoration-style","text-emphasis","text-emphasis-color",
      "text-emphasis-position","text-emphasis-style","text-height",
      "text-indent","text-justify","text-outline","text-shadow",
      "text-space-collapse","text-transform","text-underline-position",
      "text-wrap","top","transform","transform-origin","transform-style",
      "transition","transition-delay","transition-duration",
      "transition-property","transition-timing-function","unicode-bidi",
      "vertical-align","visibility","voice-balance","voice-duration",
      "voice-family","voice-pitch","voice-pitch-range","voice-rate",
      "voice-stress","voice-volume","volume","white-space","widows","width",
      "word-break","word-spacing","word-wrap","z-index",
      // flexbox:
      "align-content", "align-items", "align-self", "flex", "flex-basis",
      "flex-direction", "flex-flow", "flex-grow", "flex-shrink", "flex-wrap",
      "justify-content"],

    // This helper verifies that a specific string is a known CSS property.
    // We include vendor-prefixed known CSS properties, like `-o-transition`.
    _knownCSSProperty: function(propertyName) {
      propertyName = propertyName.replace(/^-.+?-/,'');
      return this.cssProperties.indexOf(propertyName) > -1;
    },
    // #### The CSS Master Parse Function
    //
    // Here we process the token stream, assumed to have its pointer inside a
    // CSS element, and will try to parse the content inside it as CSS until
    // we hit the end of the CSS element.
    //
    // Any parse errors along the way will result in a `ParseError`
    // being thrown.
    parse: function() {
      // We'll use some instance variables to keep track of our parse
      // state:

      // * A list of the CSS rulesets for the CSS block.
      this.rules = [];

      // * A list of comment blocks inside the CSS.
      this.comments = [];

      // Parsing is based on finite states, and a call
      // to `_parseBlockType()` will run through any number
      // of states until it either throws an error,
      // or terminates cleanly.
      var sliceStart = this.stream.pos;
      this.stream.markTokenStartAfterSpace();
      this._parseBlockType();
      var sliceEnd = this.stream.pos;

      // If we get here, the CSS block has no errors,
      // and we report the start/end of the CSS block
      // in the stream, as well as the rules/comments
      // for the calling `HTMLparser` instance to work with.
      var cssBlock = {
        value: this.stream.text.slice(sliceStart, sliceEnd),
        parseInfo: {
          start: sliceStart,
          end: sliceEnd,
          rules: this.rules,
          comments: this.comments
        }
      };

      this.rules = null;
      this.comments = null;
      return cssBlock;
    },
    // #### CSS Comment Parsing
    //
    // Here we record the position of comments in *term* in the instance's
    // comment list, and return *term* with all its comments stripped.
    stripComments: function(term, startPos) {
      var pos,
          last = term.length,
          commentStart, commentEnd,
          prev, next,
          stripped = "";
      for (pos=0; pos < last; pos++) {
        if (term[pos] === '/' && pos<last-1 && term[pos+1] === '*') {
          commentStart = startPos + pos;
          pos += 3;
          while(pos < last-1 && term.substr(pos-1,2) !== "*/") {
            pos++;
          }
          if (pos >= last-1 && term.substr(pos-1,2) !== "*/")
            throw new ParseError("UNTERMINATED_CSS_COMMENT", commentStart);
          commentEnd = startPos + pos + 1;
          this.comments.push({start: commentStart, end: commentEnd});
        } else {
          stripped += term[pos];
        }
      }
      return stripped.trim();
    },
    // #### CSS Comment Filtering
    //
    // Here we filter a token so that its start and end positions
    // point to the content without leading and trailing comments,
    // with comments in the token.value completely removed.
    filterComments: function(token) {
      var text = token.value,
          tsize = text.length,
          ntsize,
          stripped = this.stripComments(text, token.interval.start);
      // strip leading comments
      text = text.replace(/^\s+/,"");
      text = text.replace(/^\/\*[\w\W]*?\*\/\s*/,'');
      ntsize = text.length;
      token.interval.start += tsize - ntsize;
      // strip trailing comments (=reverse and repeat previous)
      tsize = ntsize;
      text = text.split('').reverse().join('');
      text = text.replace(/^\s+/,"");
      text = text.replace(/^\/\*[\w\W]*?\*\/\s*/,'');
      // FIXME: this still fails comments like this: /* ... /* ... */,
      //        which is a single block. The problems is that in the
      //        reversed string this looks like /* ... */ ... */ which
      //        counts as one block plus left-over junk.
      ntsize = text.length;
      token.interval.end -= tsize - ntsize;
      // commit text change
      token.value = stripped;
    },
    _parseBlockType: function() {
      // Depending on our state, we may be coming from having just parsed
      // a rule. If that's the case, add it to our list of rules.
      if (this.currentRule) {
        this.rules.push(this.currentRule);
        this.currentRule = null;
      }

      // skip over comments, if there is one at this position
      this.stream.stripCommentBlock();

      // are we looking at an @block?
      if (this.stream.peek() === "@") {
        this.stream.eatCSSWhile(/[^\{]/);
        var token = this.stream.makeToken(),
            name = token.value.trim();

        // we currently support @keyframes (with prefixes)
        if(name.match(/@(-[^-]+-)?keyframes/)) {
          this.stream.next();
          this.nested = true;
          return this._parseSelector();
        }

        // and media queries
        if(name.match(/@media\s*\([^{)]+\)/)) {
          this.stream.next();
          this.nested = true;
          return this._parseSelector();
        }

        // and @font-face
        if(name === "@font-face") {
          this.stream.rewind(token.value.length);
          this.stream.markTokenStart();
          return this._parseSelector();
        }

        // anything else is completely unknown
        throw new ParseError("UNKOWN_CSS_KEYWORD", this, token.interval.start, token.interval.end, name);
      }

      this._parseSelector();
    },
    // #### CSS Selector Parsing
    //
    // A selector is a string, and terminates on `{`, which signals
    // the start of a CSS property/value pair (which may be empty).
    //
    // There are a few characters in selectors that are an immediate error:
    //
    // * `;`  Rule terminator (ERROR: missing block opener)
    // * `}`  End of css block (ERROR: missing block opener)
    // * `<`  End of `<style>` element, start of `</style>`
    //   (ERROR: css declaration has no body)
    //
    // Note that we cannot flag `:` as an error because pseudo-classes use
    // it as their prefix.
    _parseSelector: function() {
      // Gobble all characters that could be part of the selector.
      this.stream.eatCSSWhile(/[^\{;\}<]/);
      var token = this.stream.makeToken(),
          peek = this.stream.peek();

      // if we encounter } we're actually inside a block, like
      // @keyframes or the like, and need to try for a new block.
      if (peek === "}") {
        this.stream.next();
        return this._parseBlockType();
      }

      // If there was nothing to select, we're either done,
      // or an error occurred.
      if (token === null) {
        if (!this.stream.end() && this.stream.peek() === '<') {
          // if this is the start of <!-- make sure to throw an error
          if (this.stream.substream(2) !== "</") {
            throw new ParseError("HTML_CODE_IN_CSS_BLOCK", this, this.stream.pos-1, this.stream.pos);
          }
          return;
        }
        throw new ParseError("MISSING_CSS_SELECTOR", this, this.stream.pos-1, this.stream.pos);
      }

      // If we get here, we have a selector string.
      // Filter the token for comments before continueing.
      this.filterComments(token);
      var selector = token.value,
          selectorStart = token.interval.start,
          selectorEnd = token.interval.end;

      if (selector === '') {
        this._parseBlockType();
        return;
      }

      // Now we'll set up a ruleset object for this selector.
      this.currentRule = {
        selector: {
          value: selector,
          start: selectorStart,
          end: selectorEnd
        },
        declarations: {
          start: null,
          end: null,
          properties: []
        }
      };

      // Now we start to analyse whether we can continue,
      // or whether we're in a terminal state, based on the
      // next character in the stream.
      if (this.stream.end() || peek === '<') {
        if(!this.nested) {
          throw new ParseError("UNFINISHED_CSS_SELECTOR", this, selectorStart, selectorEnd, selector);
        }
        return;
      }

      if (!this.stream.end()) {
        var next = this.stream.next(),
            errorMsg = "[_parseBlockType] Expected {, }, ; or :, instead found " + next;
        if (next === '{') {
          // The only legal continuation after a selector is the opening
          // `{` character. If that's the character we see, we can mark the
          // start of the declarations block and start parsing them.
          this.currentRule.declarations.start = this.stream.pos-1;
          this._parseDeclaration(selector, selectorStart);
        } else if (next === ';' || next === '}') {
          // Otherwise, this is a parse error; we should have seen `{`
          // instead.
          throw new ParseError("MISSING_CSS_BLOCK_OPENER", this, selectorStart, selectorEnd, selector);
        } else {
          // We get here if an unexpected character was found.
          throw new ParseError("UNCAUGHT_CSS_PARSE_ERROR", this, token.interval.start, token.interval.end, errorMsg);
        }
      } else {
        // If the stream ended after the selector, we want the user to follow
        // up with `{`.
        throw new ParseError("MISSING_CSS_BLOCK_OPENER", this, selectorStart, selectorEnd, selector);
      }
    },
    // #### CSS Declaration Parsing
    //
    // A declaration is a `property: value;` pair. It can be empty,
    // in which case the next character must be `}`.
    _parseDeclaration: function(selector, selectorStart, value) {
      // First, we forward the stream to the next non-space character.
      this.stream.markTokenStartAfterSpace();
      var peek = this.stream.peek();
      if (peek === '}') {
        // If the next character is `}` then this is an empty block, and we
        // should move on to trying to read a new selector ruleset.
        this.stream.next();
        this.currentRule.declarations.end = this.stream.pos;
        this.stream.markTokenStartAfterSpace();
        this._parseBlockType();
      }
      // Administratively important: there are two ways for this function
      // to have been called. One is from `_parseBlockType()`, which is
      // "the normal way", the other from `_parseValue()`, after finding a
      // properly closed `property:value;` pair. In this case *value* will be
      // the last declaration's value, which will let us throw a sensible
      // debug error in case the stream is empty at this point, or points to
      // `</style>`.
      else if (value && (this.stream.end() || peek === '<')) {
        throw new ParseError("MISSING_CSS_BLOCK_CLOSER", this, selectorStart, selectorStart+value.length, value);
      }

      // If we're still in this function at this point, all is well
      // and we can move on to property parsing.
      else {
        this._parseProperty(selector, selectorStart);
      }
    },
    // #### CSS Property Parsing
    // There is a fixed list of CSS properties, and we must check two things:
    //
    // 1. Does the token string contain a syntax-legal property?
    // 2. Is that property in the set of known ones?
    //
    // Properties are terminated by `:`, but we might also see the following
    // characters, which should signal an error:
    //
    // * `;` rule terminator (ERROR: missing value)
    // * `}` end of CSS block (ERROR: missing value)
    // * `<` end of `<style>` element, start of `</style>`
    //   (ERROR: missing value)
    _parseProperty: function(selector, selectorStart) {
      this.stream.eatCSSWhile(/[^\{\}<;:]/);
      var token = this.stream.makeToken();

      if (token === null) {
        throw new ParseError("MISSING_CSS_PROPERTY", this, selectorStart, selectorStart + selector.length, selector);
      }

      this.filterComments(token);
      var property = token.value,
          propertyStart = token.interval.start,
          propertyEnd = token.interval.end;

      if (property === '') {
        this._parseDeclaration(selector, selectorStart);
        return;
      }

      var next = this.stream.next(),
          errorMsg = "[_parseProperty] Expected }, {, <, ; or :, instead found " + next;

      if (next === '{') {
        throw new ParseError("MISSING_CSS_BLOCK_CLOSER", this, selectorStart, propertyStart, selector);
      }


      if ((this.stream.end() && next !== ':') || next === '<' ||
          next === '}') {
        throw new ParseError("UNFINISHED_CSS_PROPERTY", this, propertyStart, propertyEnd, property);
      }

      // We record `property: value` pairs as we run through the stream,
      // which are added to the set of `property: value` pairs in the
      // instance's `rules.properties` array. The push happens when we have a
      // clean run in `_parseValue()`.
      this.currentProperty = {
        name: {
          value: property,
          start: propertyStart,
          end: propertyEnd
        }
      };

      // If we find a colon, we have a property and now need a value to go
      // along with it.
      if (next === ':') {
        // Before we continue, we must make sure the string we found is a real
        // CSS property.
        if (!( property && property.match(/^[a-z\-]+$/)) || !this._knownCSSProperty(property)) {
          throw new ParseError("INVALID_CSS_PROPERTY_NAME", this, propertyStart, propertyEnd, property);
        }
        this.stream.markTokenStartAfterSpace();
        this._parseValue(selector, selectorStart, property, propertyStart);
      }
      // Otherwise, anything else at this point constitutes an error.
      else if (next === ';') {
        throw new ParseError("MISSING_CSS_VALUE", this, propertyStart, propertyEnd, property);
      }
      else {
        throw new ParseError("UNCAUGHT_CSS_PARSE_ERROR", this, token.interval.start, token.interval.end, errorMsg);
      }
    },
    // #### CSS Value Parsing
    //
    // A value must end either in `;` or in `}`. However, we may also find:
    //
    // * `<` end of `<style>` element, start of `</style>`
    //   (ERROR: missing block closer)
    _parseValue: function(selector, selectorStart, property, propertyStart) {
      if(property === "content") {
        this.stream.findContentEnd();
      } else {
        this.stream.eatCSSWhile(/[^}<;]/);
      }
      var token = this.stream.makeToken();

      if(token === null) {
        throw new ParseError("MISSING_CSS_VALUE", this, propertyStart, propertyStart+property.length, property);
      }

      var next = (!this.stream.end() ? this.stream.next() : "end of stream"),
          errorMsg = "[_parseValue] Expected }, <, or ;, instead found "+next;

      this.filterComments(token);
      var value = token.value,
          valueStart = token.interval.start,
          valueEnd = token.interval.end;

      if (value === '') {
        throw new ParseError("MISSING_CSS_VALUE", this, this.stream.pos-1, this.stream.pos);
      }

      // At this point we can fill in the *value* part of the current
      // `property: value;` pair. However, we hold off binding it until
      // we are sure there are no parse errors.
      this.currentProperty.value = {
        value: value,
        start: valueStart,
        end: valueEnd
      };


      if ((this.stream.end() && next !== ';') || next === '<') {
        throw new ParseError("UNFINISHED_CSS_VALUE", this, valueStart,valueEnd, value);
      }

      //Add a new validator to check if there is mixed active content in css value
      if (checkMixedContent && value.match(/,?\s*url\(\s*['"]?http:\/\/.+\)/)) {
        valueStart = valueStart + value.indexOf('url');
        this.warnings.push(
          new ParseError("CSS_MIXED_ACTIVECONTENT", this, property, propertyStart, value, valueStart, valueEnd)
        );
      }

      if (next === ';') {
        // This is normal CSS rule termination; try to read a new
        // property/value pair.
        this._bindCurrentRule();
        this.stream.markTokenStartAfterSpace();
        this._parseDeclaration(selector, valueStart, value);
      }
      else if (next === '}') {
        // This is block level termination; try to read a new selector.
        this.currentRule.declarations.end = this.stream.pos;
        this._bindCurrentRule();
        this.stream.markTokenStartAfterSpace();
        this._parseBlockType();
      }
      else {
        throw new ParseError("UNCAUGHT_CSS_PARSE_ERROR", this, token.interval.start, token.interval.end, errorMsg);
      }
    },
    // This helper function binds the currrent `property: value` object
    // in the current ruleset, and resets it for the next selector block.
    _bindCurrentRule: function() {
      this.currentRule.declarations.properties.push(this.currentProperty);
      this.currentProperty = null;
    }
  };

  return CSSParser;

}());

},{"./ParseError":4,"./checkMixedContent":7}],2:[function(require,module,exports){
  // ### The DOM Builder
  //
  // The DOM builder is used to construct a DOM representation of the
  // HTML/CSS being parsed. Each node contains a `parseInfo` expando
  // property that contains information about the text extents of the
  // original source code that the DOM element maps to.
  //
  // The DOM builder is given a single document DOM object that will
  // be used to create all necessary DOM nodes.
module.exports = (function(){
  "use strict";

  function DOMBuilder(document, disallowActiveAttributes) {
    this.document = document;
    this.fragment = document.createDocumentFragment();
    this.currentNode = this.fragment;
    this.contexts = [];
    this.pushContext("html", 0);
    this.disallowActiveAttributes = disallowActiveAttributes;
  }

  DOMBuilder.prototype = {
    // This method pushes a new element onto the DOM builder's stack.
    // The element is appended to the currently active element and is
    // then made the new currently active element.
    pushElement: function(tagName, parseInfo, nameSpace) {
      var node = (nameSpace ? this.document.createElementNS(nameSpace,tagName)
                            : this.document.createElement(tagName));
      node.parseInfo = parseInfo;
      this.currentNode.appendChild(node);
      this.currentNode = node;
    },
    // This method pops the current element off the DOM builder's stack,
    // making its parent element the currently active element.
    popElement: function() {
      this.currentNode = this.currentNode.parentNode;
    },
    // record the cursor position for a context change (text/html/css/script)
    pushContext: function(context, position) {
      this.contexts.push({
        context: context,
        position: position
      });
    },
    // This method appends an HTML comment node to the currently active
    // element.
    comment: function(data, parseInfo) {
      var comment = this.document.createComment('');
      comment.nodeValue = data;
      comment.parseInfo = parseInfo;
      this.currentNode.appendChild(comment);
    },
    // This method appends an attribute to the currently active element.
    attribute: function(name, value, parseInfo) {
      var attrNode = this.document.createAttribute(name);
      attrNode.parseInfo = parseInfo;
      if (this.disallowActiveAttributes && name.substring(0,2).toLowerCase() === "on") {
        attrNode.nodeValue = "";
      } else {
        attrNode.nodeValue = value;
      }
      this.currentNode.attributes.setNamedItem(attrNode);
    },
    // This method appends a text node to the currently active element.
    text: function(text, parseInfo) {
      var textNode = this.document.createTextNode(text);
      textNode.parseInfo = parseInfo;
      this.currentNode.appendChild(textNode);
    }
  };

  return DOMBuilder;

}());

},{}],3:[function(require,module,exports){
// ### HTML Parsing
//
// The HTML token stream parser object has references to the stream,
// as well as a DOM builder that is used to construct the DOM while we
// run through the token stream.
module.exports = (function(){
  "use strict";

  var ParseError = require("./ParseError");
  var CSSParser = require("./CSSParser");

  // ### Character Entity Parsing
  //
  // We currently only parse the most common named character entities.
  var CHARACTER_ENTITY_REFS = {
    lt: "<",
    gt: ">",
    apos: "'",
    quot: '"',
    amp: "&"
  };

  // HTML attribute parsing rules are based on
  // http://www.w3.org/TR/2011/WD-html5-20110525/elements.html#attr-data
  // -> ref http://www.w3.org/TR/2011/WD-html5-20110525/infrastructure.html#xml-compatible
  //    -> ref http://www.w3.org/TR/REC-xml/#NT-NameChar
  // note: this lacks the final \\u10000-\\uEFFFF in the startchar set, because JavaScript
  //       cannot cope with unciode characters with points over 0xFFFF.
  var attributeNameStartChar = "A-Za-z_\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD";
  var nameStartChar = new RegExp("[" + attributeNameStartChar + "]");
  var attributeNameChar = attributeNameStartChar + "0-9\\-\\.\\u00B7\\u0300-\\u036F\\u203F-\\u2040:";
  var nameChar = new RegExp("[" + attributeNameChar + "]");

  //Define a property checker for https page
  var checkMixedContent = require("./checkMixedContent").mixedContent;

  //Define activeContent with tag-attribute pairs
  function isActiveContent (tagName, attrName) {
    if (attrName === "href") {
      return ["link"].indexOf(tagName) > -1;
    }
    if (attrName === "src") {
      return ["script", "iframe"].indexOf(tagName) > -1;
    }
    if (attrName === "data") {
      return ["object"].indexOf(tagName) > -1;
    }
    return false;
  }

  // the current active omittable html Element
  var activeTagNode = false;

  // the parent html Element for optional closing tag tags
  var parentTagNode = false;

  // 'foresee' if there is no more content in the parent element, and the
  // parent element is not an a element in the case of activeTag is a p element.
  function isNextTagParent(stream, parentTagName) {
    return stream.findNext(/<\/([\w\-]+)\s*>/, 1) === parentTagName;
  }

  // 'foresee' if the next tag is a close tag
  function isNextCloseTag(stream) {
    return stream.findNext(/<\/([\w\-]+)\s*>/, 1);
  }

  // Check exception for Tag omission rules: for p tag, if there is no more
  // content in the parent element and the parent element is not an a element.
  function allowsOmmitedEndTag(parentTagName, tagName) {
    if (tagName === "p") {
      return ["a"].indexOf(parentTagName) > -1;
    }
    return false;
  }

  function HTMLParser(stream, domBuilder) {
    this.warnings = [];
    this.stream = stream;
    this.domBuilder = domBuilder;
    this.cssParser = new CSSParser(stream, domBuilder, this.warnings);
  }

  // `replaceEntityRefs()` will replace named character entity references
  // (e.g. `&lt;`) in the given text string and return the result. If an
  // entity name is unrecognized, don't replace it at all. Writing HTML
  // would be surprisingly painful without this forgiving behavior.
  //
  // This function does not currently replace numeric character entity
  // references (e.g., `&#160;`).
  function replaceEntityRefs(text) {
    return text.replace(/&([A-Za-z]+);/g, function(ref, name) {
      name = name.toLowerCase();
      if (name in CHARACTER_ENTITY_REFS)
        return CHARACTER_ENTITY_REFS[name];
      return ref;
    });
  };

  HTMLParser.prototype = {
    // since SVG requires a slightly different code path,
    // we need to track whether we're in HTML or SVG mode.
    parsingSVG: false,

    // For SVG DOM elements, we need to know the SVG namespace.
    svgNameSpace: "http://www.w3.org/2000/svg",

    // HTML5 documents have a special doctype that we must use
    html5Doctype: "<!DOCTYPE html>",

    // Void HTML elements are the ones that don't need to have a closing tag.
    voidHtmlElements: ["area", "base", "br", "col", "command", "embed", "hr",
                       "img", "input", "keygen", "link", "meta", "param",
                       "source", "track", "wbr"],

    // Tag Omission Rules, based on the rules on optional tags as outlined in
    // http://www.w3.org/TR/html5/syntax.html#optional-tags

    // HTML elements that with omittable close tag
    omittableCloseTagHtmlElements: ["p", "li", "td", "th"],

    // HTML elements that paired with omittable close tag list
    omittableCloseTags: {
      "p": ["address", "article", "aside", "blockquote", "dir", "div", "dl",
            "fieldset", "footer", "form", "h1", "h2", "h3", "h4", "h5", "h6",
            "header", "hgroup", "hr", "main", "nav", "ol", "p", "pre",
            "section", "table", "ul"],
      "th": ["th", "td"],
      "td": ["th", "td"],
      "li": ["li"]
    },

    // We keep a list of all valid HTML5 elements.
    htmlElements: ["a", "abbr", "address", "area", "article", "aside",
                   "audio", "b", "base", "bdi", "bdo", "bgsound", "blink",
                   "blockquote", "body", "br", "button", "canvas", "caption",
                   "cite", "code", "col", "colgroup", "command", "datalist",
                   "dd", "del", "details", "dfn", "div", "dl", "dt", "em",
                   "embed", "fieldset", "figcaption", "figure", "footer",
                   "form", "frame", "frameset", "h1", "h2", "h3", "h4", "h5",
                   "h6", "head", "header", "hgroup", "hr", "html", "i",
                   "iframe", "img", "input", "ins", "kbd", "keygen", "label",
                   "legend", "li", "link", "main", "map", "mark", "marquee", "menu",
                   "meta", "meter", "nav", "nobr", "noscript", "object", "ol",
                   "optgroup", "option", "output", "p", "param", "pre",
                   "progress", "q", "rp", "rt", "ruby", "samp", "script",
                   "section", "select", "small", "source", "spacer", "span",
                   "strong", "style", "sub", "summary", "sup", "svg", "table",
                   "tbody", "td", "textarea", "tfoot", "th", "thead", "time",
                   "title", "tr", "track", "u", "ul", "var", "video", "wbr"],

    // HTML5 allows SVG elements
    svgElements:  ["a", "altglyph", "altglyphdef", "altglyphitem", "animate",
                   "animatecolor", "animatemotion", "animatetransform", "circle",
                   "clippath", "color-profile", "cursor", "defs", "desc",
                   "ellipse", "feblend", "fecolormatrix", "fecomponenttransfer",
                   "fecomposite", "feconvolvematrix", "fediffuselighting",
                   "fedisplacementmap", "fedistantlight", "feflood", "fefunca",
                   "fefuncb", "fefuncg", "fefuncr", "fegaussianblur", "feimage",
                   "femerge", "femergenode", "femorphology", "feoffset",
                   "fepointlight", "fespecularlighting", "fespotlight",
                   "fetile", "feturbulence", "filter", "font", "font-face",
                   "font-face-format", "font-face-name", "font-face-src",
                   "font-face-uri", "foreignobject", "g", "glyph", "glyphref",
                   "hkern", "image", "line", "lineargradient", "marker", "mask",
                   "metadata", "missing-glyph", "mpath", "path", "pattern",
                   "polygon", "polyline", "radialgradient", "rect", "script",
                   "set", "stop", "style", "svg", "switch", "symbol", "text",
                   "textpath", "title", "tref", "tspan", "use", "view", "vkern"],

    // HTML5 doesn't use namespaces, but actually it does. These are supported:
    attributeNamespaces: ["xlink", "xml"],

    // We also keep a list of HTML elements that are now obsolete, but
    // may still be encountered in the wild on popular sites.
    obsoleteHtmlElements: ["acronym", "applet", "basefont", "big", "center",
                           "dir", "font", "isindex", "listing", "noframes",
                           "plaintext", "s", "strike", "tt", "xmp"],

    webComponentElements: ["template", "shadow", "content"],

    // This is a helper function to determine whether a given string
    // is a custom HTML element as per Custom Elements spec
    // (see http://www.w3.org/TR/2013/WD-custom-elements-20130514/#terminology).
    _isCustomElement: function(tagName) {
      return tagName.search(/^[\w\d]+-[\w\d]+$/) > -1;
    },

    // This is a helper function to determine whether a given string
    // is a legal HTML5 element tag.
    _knownHTMLElement: function(tagName) {
      return this.voidHtmlElements.indexOf(tagName) > -1 ||
              this.htmlElements.indexOf(tagName) > -1 ||
              this.obsoleteHtmlElements.indexOf(tagName) > -1 ||
              this.webComponentElements.indexOf(tagName) > -1;
    },

    // This is a helper function to determine whether a given string
    // is a legal SVG element tag.
    _knownSVGElement: function(tagName) {
      return this.svgElements.indexOf(tagName) > -1;
    },

    // This is a helper function to determine whether a given string
    // is a void HTML element tag.
    _knownVoidHTMLElement: function(tagName) {
      return this.voidHtmlElements.indexOf(tagName) > -1;
    },

    // This is a helper function to determine whether a given string
    // is a HTML element tag which can optional omit its close tag.
    _knownOmittableCloseTagHtmlElement: function(tagName) {
      return this.omittableCloseTagHtmlElements.indexOf(tagName) > -1;
    },

    // This is a helper function to determine whether a given string
    // is in the list of ommittableCloseTags which enable an active tag omit its close tag.
    _knownOmittableCloseTags: function(activeTagName, foundTagName) {
      return this.omittableCloseTags[activeTagName].indexOf(foundTagName) > -1;
    },

    // This is a helper function to determine whether an attribute namespace
    // is supposed in the HTML spec. Currently these are "xlink" and "xml".
    _supportedAttributeNameSpace: function(ns) {
      return this.attributeNamespaces.indexOf(ns) !== -1;
    },

    // #### The HTML Master Parse Function
    //
    // The HTML master parse function works the same as the CSS
    // parser: it takes the token stream and will try to parse
    // the content as a sequence of HTML elements.
    //
    // Any parse errors along the way will result in the code
    // throwing a `ParseError`.
    parse: function() {
      // First we check to see if the beginning of our stream is
      // an HTML5 doctype tag. We're currently quite strict and don't
      // parse XHTML or other doctypes.
      if (this.stream.match(this.html5Doctype, true, true))
        this.domBuilder.fragment.parseInfo = {
          doctype: {
            start: 0,
            end: this.stream.pos
          }
        };

      // Next, we parse "tag soup", creating text nodes and diving into
      // tags as we find them.
      while (!this.stream.end()) {
        if (this.stream.peek() == '<') {
          this._buildTextNode();
          this._parseStartTag();
        } else
          this.stream.next();
      }

      this._buildTextNode();

      // At the end, it's possible we're left with an open tag, so
      // we test for that.
      if (this.domBuilder.currentNode != this.domBuilder.fragment)
        throw new ParseError("UNCLOSED_TAG", this);

      return {
        warnings: (this.warnings.length > 0 ? this.warnings : false)
      };
    },

    // This is a helper to build a DOM text node.
    _buildTextNode: function() {
      var token = this.stream.makeToken();
      if (token) {
        this.domBuilder.text(replaceEntityRefs(token.value), token.interval);
      }
    },

    // #### HTML Tag Parsing
    //
    // This is the entry point for parsing the beginning of an HTML tag.
    // It assumes the stream is on a `<` character.
    _parseStartTag: function() {
      if (this.stream.next() != '<')
        throw new Error('assertion failed, expected to be on "<"');

      if (this.stream.match('!--', true)) {
        this.domBuilder.pushContext("text", this.stream.pos);
        this._parseComment();
        this.domBuilder.pushContext("html", this.stream.pos);
        return;
      }

      this.stream.eat(/\//);
      this.stream.eatWhile(/[\w\d-]/);
      var token = this.stream.makeToken();
      var tagName = token.value.slice(1).toLowerCase();

      if (tagName === "svg")
        this.parsingSVG = true;

      // If the character after the `<` is a `/`, we're on a closing tag.
      // We want to report useful errors about whether the tag is unexpected
      // or doesn't match with the most recent opening tag.
      if (tagName[0] == '/') {
        activeTagNode = false;
        var closeTagName = tagName.slice(1).toLowerCase();
        if (closeTagName === "svg")
          this.parsingSVG = false;
        if (this._knownVoidHTMLElement(closeTagName))
          throw new ParseError("CLOSE_TAG_FOR_VOID_ELEMENT", this,
                               closeTagName, token);
        if (!this.domBuilder.currentNode.parseInfo)
          throw new ParseError("UNEXPECTED_CLOSE_TAG", this, closeTagName,
                               token);
        this.domBuilder.currentNode.parseInfo.closeTag = {
          start: token.interval.start
        };
        var openTagName = this.domBuilder.currentNode.nodeName.toLowerCase();
        if (closeTagName != openTagName)
          throw new ParseError("MISMATCHED_CLOSE_TAG", this, openTagName,
                               closeTagName, token);
        this._parseEndCloseTag();
      }

      else {
        if (tagName) {
          var badSVG = this.parsingSVG && !this._knownSVGElement(tagName);
          var badHTML = !this.parsingSVG && !this._knownHTMLElement(tagName) && !this._isCustomElement(tagName);
          if (badSVG || badHTML) {
            throw new ParseError("INVALID_TAG_NAME", tagName, token);
          }
        }
        else {
          throw new ParseError("INVALID_TAG_NAME", tagName, token);
        }

        var parseInfo = { openTag: { start: token.interval.start }};
        var nameSpace = (this.parsingSVG ? this.svgNameSpace : undefined);

        // If the preceding tag and the active tag is omittableCloseTag pairs,
        // we tell our DOM builder that we're done.
        if (activeTagNode && parentTagNode != this.domBuilder.fragment){
          var activeTagName = activeTagNode.nodeName.toLowerCase();
          if(this._knownOmittableCloseTags(activeTagName, tagName)) {
            this.domBuilder.popElement();
          }
        }
        // Store currentNode as the parentTagNode
        parentTagNode = this.domBuilder.currentNode;
        this.domBuilder.pushElement(tagName, parseInfo, nameSpace);

        if (!this.stream.end())
          this._parseEndOpenTag(tagName);
      }
    },
    // This helper parses HTML comments. It assumes the stream has just
    // passed the beginning `<!--` of an HTML comment.
    _parseComment: function() {
      var token;
      while (!this.stream.end()) {
        if (this.stream.match('-->', true)) {
          token = this.stream.makeToken();
          this.domBuilder.comment(token.value.slice(4, -3), token.interval);
          return;
        }
        this.stream.next();
      }
      token = this.stream.makeToken();
      throw new ParseError("UNTERMINATED_COMMENT", token);
    },
    // This helper parses CDATA content, which should be treated as raw text,
    // rather than being parsed for markup. It assumes the stream has just
    // passed the beginning `<tagname` of an HTML element.
    _parseCDATA: function(tagname) {
      var token,
           matchString = '</'+tagname+'>',
           text,
           textInterval = { start: 0, end: 0 },
           openTagEnd = this.domBuilder.currentNode.parseInfo.openTag.end,
           closeTagInterval;

      this.stream.makeToken();
      while (!this.stream.end()) {
        if (this.stream.match(matchString, true)) {
          token = this.stream.makeToken();
          text = token.value.slice(0, -matchString.length);
          closeTagInterval = {
            start: openTagEnd + text.length,
            end: token.interval.end
          };
          this.domBuilder.currentNode.parseInfo.closeTag = closeTagInterval;
          textInterval.start = token.interval.start;
          textInterval.end = token.interval.end - (closeTagInterval.end - closeTagInterval.start);
          this.domBuilder.text(text, textInterval);
          this.domBuilder.popElement();
          return;
        }
        this.stream.next();
      }
      throw new ParseError("UNCLOSED_TAG", this);
    },
    // This helper function checks if the current tag contains an attribute
    containsAttribute: function (stream) {
      return stream.eat(nameStartChar);
    },
    // This helper function parses the end of a closing tag. It expects
    // the stream to be right after the end of the closing tag's tag
    // name.
    _parseEndCloseTag: function() {
      this.stream.eatSpace();
      if (this.stream.next() != '>') {
        if(this.containsAttribute(this.stream)) {
          throw new ParseError("ATTRIBUTE_IN_CLOSING_TAG", this);
        } else {
          throw new ParseError("UNTERMINATED_CLOSE_TAG", this);
        }
      }
      var end = this.stream.makeToken().interval.end;
      this.domBuilder.currentNode.parseInfo.closeTag.end = end;
      this.domBuilder.popElement();
    },
    // This helper function parses the rest of an opening tag after
    // its tag name, looking for `attribute="value"` data until a
    // `>` is encountered.
    _parseEndOpenTag: function(tagName) {
      var tagMark = this.stream.pos,
          startMark = this.stream.pos;

      while (!this.stream.end()) {

        if (this.containsAttribute(this.stream)) {
          if (this.stream.peek !== "=") {
            this.stream.eatWhile(nameChar);
          }
          this._parseAttribute(tagName);
        }

        else if (this.stream.eatSpace()) {
          this.stream.makeToken();
          startMark = this.stream.pos;
        }

        else if (this.stream.peek() == '>' || this.stream.match("/>")) {
          var selfClosing = this.stream.match("/>", true);
          if (selfClosing) {
            if (!this.parsingSVG && !this._knownVoidHTMLElement(tagName))
              throw new ParseError("SELF_CLOSING_NON_VOID_ELEMENT", this,
                                   tagName);
          } else
            this.stream.next();
          var end = this.stream.makeToken().interval.end;
          this.domBuilder.currentNode.parseInfo.openTag.end = end;

          // If the opening tag represents a void element, there will not be
          // a closing element, so we tell our DOM builder that we're done.
          if (tagName && ((selfClosing && this._knownSVGElement(tagName)) || this._knownVoidHTMLElement(tagName)))
            this.domBuilder.popElement();

          // If the open tag represents a optional-omit-close-tag element, there may be
          // an optional closing element, so we save the currentNode into activeTag for next step check.
          activeTagNode = false;
          if (tagName && this._knownOmittableCloseTagHtmlElement(tagName)){
            activeTagNode = this.domBuilder.currentNode;
          }

          // If the opening tag represents a `<style>` element, we hand
          // off parsing to our CSS parser.
          if (!this.stream.end() && tagName === "style") {
            this.domBuilder.pushContext("css", this.stream.pos);
            var cssBlock = this.cssParser.parse();
            this.domBuilder.pushContext("html", this.stream.pos);
            this.domBuilder.text(cssBlock.value, cssBlock.parseInfo);
          }

          // If the opening tag represents a `<textarea>` element, we need
          // to parse all its contents as CDATA (unparsed character data)
          if (tagName && tagName === "script") {
            this.domBuilder.pushContext("javascript", this.stream.pos);
            this._parseCDATA("script");
            this.domBuilder.pushContext("html", this.stream.pos);
          }

          // If the opening tag represents a `<textarea>` element, we need
          // to parse all its contents as CDATA (unparsed character data)
          if (tagName && tagName === "textarea") {
            this.domBuilder.pushContext("text", this.stream.pos);
            this._parseCDATA("textarea");
            this.domBuilder.pushContext("html", this.stream.pos);
          }

          // if there is no more content in the parent element, we tell DOM builder that we're done.
          if(parentTagNode && parentTagNode != this.domBuilder.fragment) {
            var parentTagName = parentTagNode.nodeName.toLowerCase(),
                nextIsParent = isNextTagParent(this.stream, parentTagName),
                needsEndTag = !allowsOmmitedEndTag(parentTagName, tagName),
                optionalEndTag = this._knownOmittableCloseTagHtmlElement(parentTagName),
                nextTagCloses = isNextCloseTag(this.stream);
            if(nextIsParent && (needsEndTag || (optionalEndTag && nextTagCloses))) {
              if(this._knownOmittableCloseTagHtmlElement(tagName)) {
                this.domBuilder.popElement();
              }
            }
          }
          return;
        }

        // error cases: bad attribute name, or unclosed tag
        else {
          this.stream.eatWhile(/[^'"\s=<>]/);
          var attrToken = this.stream.makeToken();
          if (!attrToken) {
            this.stream.tokenStart = tagMark;
            attrToken = this.stream.makeToken();
            var peek = this.stream.peek();
            if(peek === "'" || peek === '"') {
              this.stream.next();
              this.stream.eatWhile(new RegExp("[^"+peek+"]"));
              this.stream.next();
              var token = this.stream.makeToken();
              throw new ParseError("UNBOUND_ATTRIBUTE_VALUE", this, token);
            }
            throw new ParseError("UNTERMINATED_OPEN_TAG", this);
          }
          attrToken.interval.start = startMark;
          throw new ParseError("INVALID_ATTR_NAME", this, attrToken);
        }
      }
    },
    // This helper function parses an HTML tag attribute. It expects
    // the stream to be right after the end of an attribute name.
    _parseAttribute: function(tagName) {
      var nameTok = this.stream.makeToken();
      nameTok.value = nameTok.value.toLowerCase();
      this.stream.eatSpace();
      // If the character after the attribute name is a `=`, then we
      // look for an attribute value; otherwise, this is a boolean
      // attribute.
      if (this.stream.peek() == '=') {
        this.stream.next();

        if(nameTok.value.indexOf(":") !== -1) {
          var parts = nameTok.value.split(":");
          if(parts.length > 2) {
            throw new ParseError("MULTIPLE_ATTR_NAMESPACES", this, nameTok);
          }
          var nameSpace = parts[0],
              attributeName = parts[1];
          if(!this._supportedAttributeNameSpace(nameSpace)) {
            throw new ParseError("UNSUPPORTED_ATTR_NAMESPACE", this, nameTok);
          }
        }


        // Currently, we only support quoted attribute values, even
        // though the HTML5 standard allows them to sometimes go unquoted.
        this.stream.eatSpace();
        this.stream.makeToken();
        var quoteType = this.stream.next();
        if (quoteType !== '"' && quoteType !== "'") {
          throw new ParseError("UNQUOTED_ATTR_VALUE", this);
        }
        if (quoteType === '"') {
          this.stream.eatWhile(/[^"]/);
        } else {
          this.stream.eatWhile(/[^']/);
        }
        if (this.stream.next() !== quoteType) {
          throw new ParseError("UNTERMINATED_ATTR_VALUE", this, nameTok);
        }
        var valueTok = this.stream.makeToken();

        //Add a new validator to check if there is a http link in a https page
        if (checkMixedContent && valueTok.value.match(/http:/) && isActiveContent(tagName, nameTok.value)) {
          this.warnings.push(
            new ParseError("HTTP_LINK_FROM_HTTPS_PAGE", this, nameTok, valueTok)
          );
        }

        var unquotedValue = replaceEntityRefs(valueTok.value.slice(1, -1));
        this.domBuilder.attribute(nameTok.value, unquotedValue, {
          name: nameTok.interval,
          value: valueTok.interval
        });
      } else {
        this.stream.makeToken();
        this.domBuilder.attribute(nameTok.value, '', {
          name: nameTok.interval
        });
      }
    }
  };

  HTMLParser.replaceEntityRefs = replaceEntityRefs;

  return HTMLParser;
}());
},{"./CSSParser":1,"./ParseError":4,"./checkMixedContent":7}],4:[function(require,module,exports){
// ### Errors
//
// `ParseError` is an internal error class used to indicate a parsing error.
// It never gets seen by Slowparse clients, as parse errors are an
// expected occurrence. However, they are used internally to simplify
// flow control.
//
// The first argument is the name of an error type, followed by
// arbitrary positional arguments specific to that error type. Every
// instance has a `parseInfo` property which contains the error
// object that will be exposed to Slowparse clients when parsing errors
// occur.
module.exports = (function() {
  "use strict";

  var ParseErrorBuilders = require("./ParseErrorBuilders");

  function ParseError(type) {
    this.name = "ParseError";
    if (!(type in ParseErrorBuilders))
      throw new Error("Unknown ParseError type: " + type);
    var args = [];
    for (var i = 1; i < arguments.length; i++)
      args.push(arguments[i]);
    var parseInfo = ParseErrorBuilders[type].apply(ParseErrorBuilders, args);

    /* This may seem a weird way of setting an attribute, but we want
     * to make the JSON serialize so the 'type' appears first, as it
     * makes our documentation read better. */
    parseInfo = ParseErrorBuilders._combine({
      type: type
    }, parseInfo);
    this.message = type;
    this.parseInfo = parseInfo;
  }

  ParseError.prototype = Error.prototype;

  return ParseError;
}());

},{"./ParseErrorBuilders":5}],5:[function(require,module,exports){
// `ParseErrorBuilders` contains Factory functions for all our types of
// parse errors, indexed by error type.
//
// Each public factory function returns a `parseInfo` object, sans the
// `type` property. For more information on each type of error,
// see the [error specification][].
//
//   [error specification]: spec/
module.exports = (function() {
  "use strict";

  var ParseErrorBuilders = {
    /* Create a new object that has the properties of both arguments
     * and return it. */
    _combine: function(a, b) {
      var obj = {}, name;
      for (name in a) {
        obj[name] = a[name];
      }
      for (name in b) {
        obj[name] = b[name];
      }
      return obj;
    },
    // These are HTML errors.
    UNCLOSED_TAG: function(parser) {
      var currentNode = parser.domBuilder.currentNode,
          openTag = this._combine({
            name: currentNode.nodeName.toLowerCase()
          }, currentNode.parseInfo.openTag);
      return {
        openTag: openTag,
        cursor: openTag.start
      };
    },
    INVALID_TAG_NAME: function(tagName, token) {
      var openTag = this._combine({
            name: tagName
          }, token.interval);
      return {
        openTag: openTag,
        cursor: openTag.start
      };
    },
    UNEXPECTED_CLOSE_TAG: function(parser, closeTagName, token) {
      var closeTag = this._combine({
            name: closeTagName
          }, token.interval);
      return {
        closeTag: closeTag,
        cursor: closeTag.start
      };
    },
    MISMATCHED_CLOSE_TAG: function(parser, openTagName, closeTagName, token) {
      var openTag = this._combine({
            name: openTagName
          }, parser.domBuilder.currentNode.parseInfo.openTag),
          closeTag = this._combine({
            name: closeTagName
          }, token.interval);
      return {
        openTag: openTag,
        closeTag: closeTag,
        cursor: closeTag.start
      };
    },
    ATTRIBUTE_IN_CLOSING_TAG: function(parser) {
      var currentNode = parser.domBuilder.currentNode;
      var end = parser.stream.pos;
      if (!parser.stream.end()) {
        end = parser.stream.makeToken().interval.start;
      }
      var closeTag = {
        name: currentNode.nodeName.toLowerCase(),
        start: currentNode.parseInfo.closeTag.start,
        end: end
      };
      return {
        closeTag: closeTag,
        cursor: closeTag.start
      };
    },
    CLOSE_TAG_FOR_VOID_ELEMENT: function(parser, closeTagName, token) {
      var closeTag = this._combine({
            name: closeTagName
          }, token.interval);
      return {
        closeTag: closeTag,
        cursor: closeTag.start
      };
    },
    UNTERMINATED_COMMENT: function(token) {
      var commentStart = token.interval.start;
      return {
        start: commentStart,
        cursor: commentStart
      };
    },
    UNTERMINATED_ATTR_VALUE: function(parser, nameTok) {
      var currentNode = parser.domBuilder.currentNode,
          openTag = this._combine({
            name: currentNode.nodeName.toLowerCase()
          }, currentNode.parseInfo.openTag),
          valueTok = parser.stream.makeToken(),
          attribute = {
            name: {
              value: nameTok.value,
              start: nameTok.interval.start,
              end: nameTok.interval.end
            },
            value: {
              start: valueTok.interval.start
            }
          };
      return {
        openTag: openTag,
        attribute: attribute,
        cursor: attribute.value.start
      };
    },
    UNQUOTED_ATTR_VALUE: function(parser) {
      var pos = parser.stream.pos;
      if (!parser.stream.end()) {
        pos = parser.stream.makeToken().interval.start;
      }
      return {
        start: pos,
        cursor: pos
      };
    },
    INVALID_ATTR_NAME: function(parser, attrToken) {
      return {
        start: attrToken.interval.start,
        end: attrToken.interval.end,
        attribute: {
          name: {
            value: attrToken.value
          }
        },
        cursor: attrToken.interval.start
      };
    },
    MULTIPLE_ATTR_NAMESPACES: function(parser, attrToken) {
      return {
        start: attrToken.interval.start,
        end: attrToken.interval.end,
        attribute: {
          name: {
            value: attrToken.value
          }
        },
        cursor: attrToken.interval.start
      };
    },
    UNSUPPORTED_ATTR_NAMESPACE: function(parser, attrToken) {
      return {
        start: attrToken.interval.start,
        end: attrToken.interval.end,
        attribute: {
          name: {
            value: attrToken.value
          }
        },
        cursor: attrToken.interval.start
      };
    },
    UNBOUND_ATTRIBUTE_VALUE: function(parser, valueToken) {
      return {
        value: valueToken.value,
        interval: valueToken.interval,
        cursor: valueToken.interval.start
      };
    },
    UNTERMINATED_OPEN_TAG: function(parser) {
      var currentNode = parser.domBuilder.currentNode,
          openTag = {
            start: currentNode.parseInfo.openTag.start,
            end: parser.stream.pos,
            name: currentNode.nodeName.toLowerCase()
          };
      return {
        openTag: openTag,
        cursor: openTag.start
      };
    },
    SELF_CLOSING_NON_VOID_ELEMENT: function(parser, tagName) {
      var start = parser.domBuilder.currentNode.parseInfo.openTag.start,
          end = parser.stream.makeToken().interval.end;
      return {
        name: tagName,
        start: start,
        end: end,
        cursor: start
      };
    },
    UNTERMINATED_CLOSE_TAG: function(parser) {
      var currentNode = parser.domBuilder.currentNode;
      var end = parser.stream.pos;
      if (!parser.stream.end()) {
        end = parser.stream.makeToken().interval.start;
      }
      var closeTag = {
            name: currentNode.nodeName.toLowerCase(),
            start: currentNode.parseInfo.closeTag.start,
            end: end
          };
      return {
        closeTag: closeTag,
        cursor: closeTag.start
      };
    },
    //Special error type for a http link does not work in a https page
    HTTP_LINK_FROM_HTTPS_PAGE: function(parser, nameTok, valueTok) {
      var currentNode = parser.domBuilder.currentNode,
          openTag = this._combine({
            name: currentNode.nodeName.toLowerCase()
          }, currentNode.parseInfo.openTag),
          attribute = {
            name: {
              value: nameTok.value,
              start: nameTok.interval.start,
              end: nameTok.interval.end
            },
            value: {
              start: valueTok.interval.start + 1,
              end: valueTok.interval.end - 1
            }
          };
      return {
        openTag: openTag,
        attribute: attribute,
        cursor: attribute.value.start
      };
    },
    // These are CSS errors.
    UNKOWN_CSS_KEYWORD: function(parser, start, end, value) {
      return {
        cssKeyword: {
          start: start,
          end: end,
          value: value
        },
        cursor: start
      };
    },
    MISSING_CSS_SELECTOR: function(parser, start, end) {
      return {
        cssBlock: {
          start: start,
          end: end
        },
        cursor: start
      };
    },
    UNFINISHED_CSS_SELECTOR: function(parser, start, end, selector) {
      return {
        cssSelector: {
          start: start,
          end: end,
          selector: selector
        },
        cursor: start
      };
    },
    MISSING_CSS_BLOCK_OPENER: function(parser, start, end, selector) {
      return {
        cssSelector: {
          start: start,
          end: end,
          selector: selector
        },
        cursor: start
      };
    },
    INVALID_CSS_PROPERTY_NAME: function(parser, start, end, property) {
      return {
        cssProperty: {
          start: start,
          end: end,
          property: property
        },
        cursor: start
      };
    },
    MISSING_CSS_PROPERTY: function(parser, start, end, selector) {
      return {
        cssSelector: {
          start: start,
          end: end,
          selector: selector
        },
        cursor: start
      };
    },
    UNFINISHED_CSS_PROPERTY: function(parser, start, end, property) {
      return {
        cssProperty: {
          start: start,
          end: end,
          property: property
        },
        cursor: start
      };
    },
    MISSING_CSS_VALUE: function(parser, start, end, property) {
      return {
        cssProperty: {
          start: start,
          end: end,
          property: property
        },
        cursor: start
      };
    },
    UNFINISHED_CSS_VALUE: function(parser, start, end, value) {
      return {
        cssValue: {
          start: start,
          end: end,
          value: value
        },
        cursor: start
      };
    },
    CSS_MIXED_ACTIVECONTENT: function(parser, property, propertyStart, value, valueStart, valueEnd) {
      var cssProperty = {
            property: property,
            start: propertyStart,
            end: propertyStart + property.length
          },
          cssValue = {
            value: value,
            start: valueStart,
            end: valueEnd
          };
      return {
        cssProperty: cssProperty,
        cssValue: cssValue,
        cursor: cssValue.start
      };
    },
    MISSING_CSS_BLOCK_CLOSER: function(parser, start, end, value) {
      return {
        cssValue: {
          start: start,
          end: end,
          value: value
        },
        cursor: start
      };
    },
    UNCAUGHT_CSS_PARSE_ERROR: function(parser, start, end, msg) {
      return {
        error: {
          start: start,
          end: end,
          msg: msg
        },
        cursor: start
      };
    },
    UNTERMINATED_CSS_COMMENT: function(start) {
      return {
        start: start,
        cursor: start
      };
    },
    HTML_CODE_IN_CSS_BLOCK: function(parser, start, end) {
      return {
        html: {
          start: start,
          end: end
        },
        cursor: start
      };
    }
  };

  return ParseErrorBuilders;

}());

},{}],6:[function(require,module,exports){
// ### Streams
//
// `Stream` is an internal class used for tokenization. The interface for
// this class is inspired by the analogous class in [CodeMirror][].
//
//   [CodeMirror]: http://codemirror.net/doc/manual.html#modeapi
module.exports = (function(){
  "use strict";

  var ParseError = require("./ParseError");
  var ParseErrorBuilders = require("./ParseErrorBuilders");

  function Stream(text) {
    this.text = text;
    this.pos = 0;
    this.tokenStart = 0;
  }

  Stream.prototype = {
    // `Stream.peek()` returns the next character in the stream without
    // advancing it. It will return `undefined` at the end of the text.
    peek: function() {
      return this.text[this.pos];
    },
    // `Stream.substream(len)` returns a substream from the stream
    // without advancing it, with length `len`.
    substream: function(len) {
      return this.text.substring(this.pos, this.pos + len);
    },
    // `Stream.next()` returns the next character in the stream and advances
    // it. It also returns `undefined` when no more characters are available.
    next: function() {
      if (!this.end())
        return this.text[this.pos++];
    },
    // `Stream.rewind()` rewinds the stream position by X places.
    rewind: function(x) {
      this.pos -= x;
      if (this.pos < 0) {
        this.pos = 0;
      }
    },
    // `Stream.end()` returns true only if the stream is at the end of the
    // text.
    end: function() {
      return (this.pos == this.text.length);
    },
    // `Stream.eat()` takes a regular expression. If the next character in
    // the stream matches the given argument, it is consumed and returned.
    // Otherwise, `undefined` is returned.
    eat: function(match) {
      if (!this.end() && this.peek().match(match))
        return this.next();
    },
    // `Stream.eatWhile()` repeatedly calls `eat()` with the given argument,
    // until it fails. Returns `true` if any characters were eaten.
    eatWhile: function(matcher) {
      var wereAnyEaten = false;
      while (!this.end()) {
        if (this.eat(matcher))
          wereAnyEaten = true;
        else
          return wereAnyEaten;
      }
    },
    // `Stream.eatSpace()` is a shortcut for `eatWhile()` when matching
    // white-space (including newlines).
    eatSpace: function() {
      return this.eatWhile(/[\s\n]/);
    },
    // `Stream.eatCSSWhile()` is like `eatWhile()`, but it
    // automatically deals with eating block comments like `/* foo */`.
    eatCSSWhile: function(matcher) {
      var wereAnyEaten = false,
          chr = '',
          peek = '',
          next = '';
      while (!this.end()) {
        chr = this.eat(matcher);
        if (chr)
          wereAnyEaten = true;
        else
          return wereAnyEaten;
        if (chr === '/') {
          peek = this.peek();
          if (peek === '*') {
            /* Block comment found. Gobble until resolved. */
            while(next !== '/' && !this.end()) {
              this.eatWhile(/[^*]/);
              this.next();
              next = this.next();
            }
            next = '';
          }
        }
      }
    },
    // CSS content values terminate on ; only when that ; is not
    // inside a quoted string.
    findContentEnd: function() {
      var quoted = false,
          c, _c;
      while(!this.end()) {
        c = this.next();
        if (c === '"' || c === "'") {
          if (quoted === false) quoted = c;
          else if (quoted === c && _c !== "\\") quoted = false;
          continue;
        }
        if (c === ';' && quoted === false) {
          break;
        }
        _c = c;
      }
      this.pos--;
    },
    // strip any CSS comment block starting at this position.
    // if there is no such block, don't do anything to the stream.
    stripCommentBlock: function() {
      if (this.substream(2) !== "/*") return;
      this.pos += 2;
      for(;!this.end(); this.pos++) {
        if(this.substream(2) === "*/") {
          this.pos += 2;
          break;
        }
      }
      this.eatSpace();
    },
    // `Stream.markTokenStart()` will set the start for the next token to
    // the current stream position (i.e., "where we are now").
    markTokenStart: function() {
      this.tokenStart = this.pos;
    },
    // `Stream.markTokenStartAfterSpace()` is a wrapper function for eating
    // up space, then marking the start for a new token.
    markTokenStartAfterSpace: function() {
      this.eatSpace();
      this.markTokenStart();
    },
    // `Stream.makeToken()` generates a JSON-serializable token object
    // representing the interval of text between the end of the last
    // generated token and the current stream position.
    makeToken: function() {
      if (this.pos == this.tokenStart)
        return null;
      var token = {
        value: this.text.slice(this.tokenStart, this.pos),
        interval: {
          start: this.tokenStart,
          end: this.pos
        }
      };
      this.tokenStart = this.pos;
      return token;
    },
    // `Stream.match()` acts like a multi-character eat—if *consume* is `true`
    // or not given—or a look-ahead that doesn't update the stream
    // position—if it is `false`. *string* must be a string. *caseFold* can
    // be set to `true` to make the match case-insensitive.
    match: function(string, consume, caseFold) {
      var substring = this.text.slice(this.pos, this.pos + string.length);
      if (caseFold) {
        string = string.toLowerCase();
        substring = substring.toLowerCase();
      }
      if (string == substring) {
        if (consume)
          this.pos += string.length;
        return true;
      }
      return false;
    },
    // `Stream.findNext()` is a look-ahead match that doesn't update the stream position
    // by a given regular expression
    findNext: function(pattern, groupNumber) {
      var currentPos = this.pos;
      this.eatWhile(/[^>]/);
      this.next();
      var nextPos = this.pos;
      this.pos = currentPos;
      var token = this.substream(nextPos - currentPos);
      var captureGroups = token.match(pattern);
      this.pos = currentPos;
      if(captureGroups) {
        return captureGroups[groupNumber];
      }
      return false;
    }
  };

  return Stream;
}());

},{"./ParseError":4,"./ParseErrorBuilders":5}],7:[function(require,module,exports){
//Define a property checker for https page
module.exports = {
  mixedContent: (typeof window !== "undefined" ? (window.location.protocol === "https:") : false)
};

},{}],8:[function(require,module,exports){
// Slowparse is a token stream parser for HTML and CSS text,
// recording regions of interest during the parse run and
// signaling any errors detected accompanied by relevant
// regions in the text stream, to make debugging easy. Each
// error type is documented in the [error specification][].
//
// Slowparse also builds a DOM as it goes, attaching metadata
// to each node build that points to where it came from in
// the original source.
//
// For more information on the rationale behind Slowparse, as
// well as its design goals, see the [README][].
//
// If [RequireJS] is detected, this file is defined as a module via
// `define()`. Otherwise, a global called `Slowparse` is exposed.
//
// ## Implementation
//
// Slowparse is effectively a finite state machine for
// HTML and CSS strings, and will switch between the HTML
// and CSS parsers while maintaining a single token stream.
//
//   [RequireJS]: http://requirejs.org/
//   [error specification]: spec/
//   [README]: https://github.com/mozilla/slowparse#readme
(function() {
  "use strict";

  var Stream = require("./Stream");
  var CSSParser = require("./CSSParser");
  var HTMLParser = require("./HTMLParser");
  var DOMBuilder = require("./DOMBuilder");

  // ### Exported Symbols
  //
  // `Slowparse` is the object that holds all exported symbols from
  // this library.
  var Slowparse = {
    // We export our list of recognized HTML elements and CSS properties
    // for clients to use if needed.
    HTML_ELEMENT_NAMES: HTMLParser.prototype.voidHtmlElements.concat(
                          HTMLParser.prototype.htmlElements.concat(
                            HTMLParser.prototype.obsoleteHtmlElements)),
    CSS_PROPERTY_NAMES: CSSParser.prototype.cssProperties,

    // We also export a few internal symbols for use by Slowparse's
    // testing suite.
    replaceEntityRefs: HTMLParser.replaceEntityRefs,
    Stream: Stream,

    // `Slowparse.HTML()` is the primary function we export. Given
    // a DOM document object (or a DOMBuilder instance) and a string
    // of HTML, we return an object with the following keys:
    //
    // * `document` is a DOM document fragment containing the DOM of
    //   the parsed HTML. If an error occurred while parsing, this
    //   document is incomplete, and represents what was built before
    //   the error was encountered.
    //
    // * `error` is a JSON-serializable object representing any error
    //   that occurred while parsing. If no errors occurred while parsing,
    //   its value is `null`. For a list of the types of errors that
    //   can be returned, see the [error specification][].
    //
    // An array of error detector functions can also be passed as a
    // third argument to this function. An error detector function takes
    // the HTML and generated document fragment as arguments and returns
    // an error object if an error is detected, or `undefined` otherwise.
    // This can be used for further error checking on the parsed document.
    //
    //   [error specification]: spec/
    HTML: function(document, html, options) {
      options = options || {};
      var stream = new Stream(html),
          domBuilder,
          parser,
          warnings = null,
          error = null,
          errorDetectors = options.errorDetectors || [],
          disallowActiveAttributes = (typeof options.disallowActiveAttributes === "undefined") ? false : options.disallowActiveAttributes;

      domBuilder = new DOMBuilder(document, disallowActiveAttributes);
      parser = new HTMLParser(stream, domBuilder);

      try {
        var _ = parser.parse();
        if (_.warnings) {
          warnings = _.warnings;
        }
      } catch (e) {
        if (e.parseInfo) {
          error = e.parseInfo;
        } else
          throw e;
      }

      errorDetectors.forEach(function(detector) {
        if (!error)
          error = detector(html, domBuilder.fragment) || null;
      });

      return {
        document: domBuilder.fragment,
        contexts: domBuilder.contexts,
        warnings: warnings,
        error: error
      };
    },
    // `Slowparse.findError()` just returns any error in the given HTML
    // string, or `null` if the HTML contains no errors.
    findError: function(html, errorDetectors) {
      return this.HTML(document, html, errorDetectors).error;
    }
  };

  // AMD context
  if (typeof define !== "undefined") {
    define(function() { return Slowparse; });
  }

  // Node.js context
  else if(typeof module !== "undefined" && module.exports) {
    module.exports = Slowparse;
  }

  // browser context
  else if (typeof window !== "undefined") {
    window.Slowparse = Slowparse;
  }
}());

},{"./CSSParser":1,"./DOMBuilder":2,"./HTMLParser":3,"./Stream":6}]},{},[8])(8)
});