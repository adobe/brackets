# Slowparse, a friendlier HTML5 parser

Slowparse is an experimental JavaScript-based HTML5 parser born out of Mozilla Webmaking initiatives. A live demo of Slowparse can be found over at http://mozilla.github.io/slowparse

## Installing Slowparse

The Slowparse library can be used both in the browser and in environments that support commonjs requirements such as Node.js, by respectively including it as a script resource:
```
<script src="slowparse.js"></script>
```
or as module import, by installing it using npm:
```
$> npm install slowparse
```
After installing, Slowparse can then be required into your code like any other module:
```
var Slowparse = require("slowparse");
```

## Using Slowparse

To use Slowparse, call its `.HTML` function:

```
var result = Slowparse.HTML(document, '... html source here ...', options);
```

This function takes a DOM context as first argument, and HTML5 source code as second argument. The `options` object is optional, and if used can contain:

### options.errorDetectors

This is an array of "additional parsers" that will be called as 'detector(html, domBuilder.fragment)` when no errors are found by Slowparse. These can be useful when you have additional constraints on what HTML source is permitted in your own software that cannot or should not be dealt with by Slowparse itself.

This is mostly a convenience construction, and using it is equivalent to doing an `if (!result.error)` test and running the input through your own, additional parsers if no errors we found.

### options.disallowActiveAttributes

This option can be either `true` or `false`, and when `true` will blank out attributes when it sees any that start with `on` such as `onclick`, `onload`, etc.

This means the DOM formed during the Slowparse run is a tiny bit more secure, although you will still be responsible for checking for potentially harmful active content (Slowparse is not a security tool, and should be used as such).

### Validating HTML

Slowparse accepts both full HTML5 documents (starting at `<!doctype html>` and ending in `</html>`) as well as well formatted HTML5 fragments. Any input that does not pass HTML5 validation leads to a `result` output with an error property:
```
var result = Slowparse.HTML(document, '<a href+></a>');
console.log(result.error);
/*
  {
    type: 'INVALID_ATTR_NAME',
    start: 3,
    end: 8,
    attribute: { name: { value: "+" }},
    cursor: 3
  };
*/
```

There are a large number of errors that Slowparse can generate in order to indicate not just that a validation error occurred, but also what kind of error it was. The full list of reportable errors can currently be found in the [ParseErrorBuilders.js](./src/ParseErrorBuilders.js) file.

### Using validated HTML

If Slowparse yields a result without an `.error` property, the input HTML is considered valid HTML5 code, and can be injected into whatever context you need it injected into.
```
var input = "...";

var result = Slowparse.HTML(document, input);

if (!result.error) {
  activeContext.inject(input);
} else {
  notifyUserOfError(result.error);
}
```

Note that Slowparse generates an internal DOM for validation that can be tapped into, as `result.document`. If no options object with the `disallowActiveAttributes` is passed during parsing, this DOM should be identical to the one built by simply injecting your source code. If `disallowActiveAttributes:true` is used, this DOM will be the same as the one built by the browser, with the exception of `on...` attributes, which will have been forced empty to prevent certain immediate script actions from kicking in.

### Getting friendlier error messages

By default, Slowparse generates error objects. However, if you prefer human-readable error messages, the `./locale/` directory contains a file `en_US.json` that consists of English (US) localized error snippets. These are bits of HTML5 with templating variables that can be instantiated with the corresponding error object.

For example, if you are getting a `MISSING_CSS_BLOCK_CLOSER` error, the local file specifies the following human-friendly error:
```
<p>Missing block closer or next property:value; pair following
<em data-highlight='[[cssValue.start]],[[cssValue.end]]'>[[cssValue.value]]</em>.</p>
```
We can replace `[[cssValue.start]]` with Slowparse's `result.error.cssValue.start` and `[[cssValue.end]]` with `result.error.cssValue.end`, and the same for `cssValue.value`, to generate a functional error. For instance, if there is an error in a CSS block after a property `background:white`, with "white" on the 24th character in the stream, the error might resolve as:
```
<p>Missing block closer or next property:value; pair following
<em data-highlight='24,29'>white</em>.</p>
```
Note that Slowparse has no built in mechanism for generating these errors, but only provides you with the error objects as a result from parsing, and the locale file for resolving error objects to uninstantiated human readable HTML snippets.

## Working on Slowparse

The slowparse code is split up into modules, located in the `./src` directory, which are aggregated in `index.js` for constructing the slowparse library. This construction is handled by [browserify](https://www.npmjs.com/package/browserify), and runs every time the `npm test` command is run.

If you wish to help out on Slowparse, we try to keep Slowparse test-drive, so if you have bad code that is being parsed incorrectly, create a new test case in the `./test/test-slowparse.js` file. To see how tests work, simply open that file and have a look at the various tests already in place. Generally all you need to do is copy-paste a test case that's similar to what you're testing, and changing the description, input HTML, and test summary for pass/fail results.

Passing all tests is the basic prerequisite to a patch for Slowparse landing, so make sure your code comes with tests and all of them pass =)

