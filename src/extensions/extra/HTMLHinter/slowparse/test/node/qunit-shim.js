module.exports = function(Slowparse, jsdom) {

  var testcount = 0;
  var failCount = 0;

  var equal = function(a, b, testDescription) {
    var runner = this;
    if (a === b) return true;
    if (typeof a !== typeof b) throw new Error({
      message: "type inequality between "+JSON.stringify(a)+" and "+JSON.stringify(b),
      failure: testDescription,
      test: testcount++
    });
    if (a === undefined) return true;
    if (a === null && b === null) return true;
    // note we don't check number/string: the first === already caught them
    if (typeof a === "number") {
      // note that the following is only true in a testing context!
      if (isNaN(a) && isNaN(b)) return true;
    }
    if (typeof a === "string") {
      if (a === b) return true;
      throw new Error({
        message: "string inequality between ["+a+"] and ["+b+"]",
        failure: testDescription,
        test: testcount++
      });
    }
    if (typeof a === "function") {
      return a.toString() === b.toString();
    }
    if (typeof a === "object") {
      // special language construct
      if (a instanceof Array && b instanceof Array) {
        if(a.length !== b.length) return false;
        for(var i=a.length-1; i>=0; i--) {
          if (!equal(a[i],b[i])) {
            throw new Error({
              message: "array inequality for index "+i,
              failure: testDescription,
              test: testcount++
            });
          }
        }
        return true;
      }
      // generic object
      Object.keys(a).forEach(function(key) {
        if (!equal(a[key], b[key])) {
           throw new Error({
            message:"object inequality for property "+key,
            failure: testDescription,
            test: testcount++
          });
        }
      });
      return true;
    }
    throw new Error({
      message: "unable to compare: " + JSON.stringify(a) + " (" + typeof a + ") against " + JSON.stringify(b) + " (" + typeof b + ")",
      failure: testDescription,
      test: testcount++
    });
  };

  // QUnit shim
  var ok = function(a, testDescription) {
    if (!!a) return true;
    throw new Error({
      message: "value not ok",
      failure: testDescription,
      test: testcount++
    });
  };

  // QUnit shim
  var test = function(description, testfunction) {
    testcount = 1;
    try {
      testfunction.call(this);
      console.log("[pass] " + description);
    }
    catch (e) {
      failCount++;
      //console.log(JSON.stringify(e));
      console.log(" FAIL  " + description);
      console.log(JSON.stringify(e,false,2));
    }
  };

  // QUnit shim
  var asyncTest = function(description, testfunction) {
    setTimeout(function() { test(description, testfunction); }, 100);
  };

  var start = function(){};

  // Get the innerHTML of a document fragment.
  function documentFragmentHTML(doc) {
    var document = doc._ownerDocument;
    var div = document.createElement("div");
    for (var i = 0; i < doc.childNodes.length; i++) {
      div.appendChild(doc.childNodes[i].cloneNode(true));
    }
    return div.innerHTML;
  }

  // Ensure that an object containing {start,end} keys correspond
  // to a particular substring of HTML source code.
  function assertParseIntervals(html, node, name, map) {
    function getDottedProperty(obj, property) {
      var parts = property.split('.');
      parts.forEach(function(part) {
        var arrayIndexMatch = part.match(/^(.+)\[(\d+)\]$/);
        if (arrayIndexMatch)
          part = arrayIndexMatch[1];
        if (!(part in obj))
          return null;
        obj = obj[part];
        if (arrayIndexMatch)
          obj = obj[parseInt(arrayIndexMatch[2],10)];
      });
      return obj;
    }

    for (var dottedName in map) {
      var baseName = name + "." + dottedName;
      var interval = getDottedProperty(node, dottedName);
      ok(interval, baseName + " exists");
      if (interval) {
        equal(html.slice(interval.start, interval.end), map[dottedName],
              baseName + " start/end positions are correct");
      }
    }
  }

  // Parse the given HTML, ensure it has no errors, and return the
  // parsed document.
  function parseWithoutErrors(html, options) {
    options = options || {};
    var result = Slowparse.HTML(jsdom(html), html, options);
    ok(result.document, "document is returned");
    equal(result.error, null, "no errors are reported");
    return result.document;
  }

  // Test many snippets of valid HTML, passing the HTML and its document
  // to a callback function that does the actual testing. Useful for
  // testing that many different inputs result in the same output.
  function testManySnippets(name, htmlStrings, cb) {
    htmlStrings.forEach(function(html) {
      test(name + ": " + JSON.stringify(html), function() {
        cb(html, parseWithoutErrors(html));
      });
    });
  }

  // Test one or more snippets of CSS.
  function testStyleSheet(name, cssList, cb) {
    if (typeof(cssList) == "string")
      cssList = [cssList];

    cssList.forEach(function(css) {
      test(name + ": " + JSON.stringify(css), function() {
        var html = '<style>' + css + '</style>';
        var doc = parseWithoutErrors(html);
        var styleContents = doc.childNodes[0].childNodes[0];
        equal(styleContents.nodeValue, css);
        cb(html, css, styleContents);
      });
    });
  }

  return {
    ok: ok,
    equal: equal,
    test: test,
    asyncTest: asyncTest,
    start: start,
    documentFragmentHTML: documentFragmentHTML,
    assertParseIntervals: assertParseIntervals,
    parseWithoutErrors: parseWithoutErrors,
    testManySnippets: testManySnippets,
    testStyleSheet: testStyleSheet,
    getFailCount: function() { return failCount; }
  };
};
