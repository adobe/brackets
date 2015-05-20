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
