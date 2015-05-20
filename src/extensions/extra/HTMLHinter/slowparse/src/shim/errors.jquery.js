"use strict";

// This jQuery plugin adds functions that make it easy to display
// friendly tips to a user based on Slowparse errors. For more information
// on Slowparse errors, see the [error specification][spec].
//
// For examples of this plugin in use, consult its [test suite][].
//
//  [spec]: spec/
//  [test suite]: https://github.com/mozilla/slowparse/blob/gh-pages/test/test-errors.jquery.js

(function(jQuery) {
  var $ = jQuery;
  
  // ## jQuery Extensions
  
  jQuery.extend({
    // **jQuery.errorTemplates** is a selection that contains all our error
    // message templates.
    
    errorTemplates: $(),
    // **jQuery.loadErrors(*basePath*, *names*, *cb*)** loads a set of error
    // message templates.
    //
    // * *basePath* is the relative path containing the error message
    //   template HTML files.
    //
    // * *names* is an array of template files to load. For each `name`
    //   in this array, the file `errors.name.html` will be loaded from 
    //   *basePath*.
    //
    // * *cb* is a function that will be called once all the templates
    //   are loaded. Its first argument will be null only if no errors
    //   occurred.
    loadErrors: function(basePath, names, cb) {
      var reqs = names.map(function(name) {
        var url = basePath + "errors." + name + ".html";
        return jQuery.get(url);
      });
      jQuery.when.apply(jQuery, reqs).then(function() {
        reqs.forEach(function(req) {
          var div = $('<div></div>').html(req.responseText);
          $.errorTemplates = $.errorTemplates.add($(".error-msg", div));
        });
        cb(null);
      }, function() {
        cb("ERROR: At least one template file did not load.");
      });
    }
  });
  
  jQuery.fn.extend({
    // **jQuery.fn.errorHighlightInterval()** returns an object
    // containing `{start, end}` keys that describe the integral start and
    // end indexes of a `data-highlight` attribute on the first
    // element of the current selection.
    errorHighlightInterval: function() {
      var interval = $(this).attr("data-highlight").split(",");
      var start = parseInt(interval[0]);
      var end = interval[1] ? parseInt(interval[1]) : undefined;
      return {start: start, end: end};
    },
    
    // **jQuery.fn.eachErrorHighlight(*cb*)** calls the given callback on
    // every element with a `data-highlight` attribute in the current
    // selection. The callback is passed `(start, end, i)` arguments
    // which represent the integral start and end of the highlight, and
    // the array index of the element.
    eachErrorHighlight: function(cb) {
      $("[data-highlight]", this).each(function(i) {
        var interval = $(this).errorHighlightInterval();
        cb.call(this, interval.start, interval.end, i);
      });
      return this;
    },
    
    // **jQuery.fn.fillError(*error* [, *templates*])** fills the current selection with the
    // friendly error message for the given error object. For more
    // information on error objects, see the [error specification][spec].
    //
    // Optionally, a second argument containing a selection of all
    // available error templates can be provided. If not present, the
    // global selection of templates from `jQuery.errorTemplates` will
    // be used.
    //
    //   [spec]: spec/
    fillError: function(error, templates) {
      var selector = ".error-msg." + error.type;
      var template = (templates || $.errorTemplates).filter(selector);
      if (template.length == 0)
        throw new Error("Error template not found for " + error.type);
      this.html(_.template(template.html(), error, mustacheSettings)).show();
      return this;
    }
  });

  // ## Underscore.js Templating
  //
  // We define a private subset of [underscore.js][] that includes only
  // `_.escape()` and `_.template()`. This is done to avoid the need for
  // including underscore as a dependency.
  //
  // The `_.template()` function has been stripped of functionality to
  // interpolate and evaluate, since we don't need that functionality
  // for our error reporting.
  //
  //   [underscore.js]: http://documentcloud.github.com/underscore/  
  var _ = (function createUnderscoreTemplating() {
    // Certain characters need to be escaped so that they can be put into a
    // string literal.
    var escapes = {
      '\\': '\\',
      "'": "'",
      'r': '\r',
      'n': '\n',
      't': '\t',
      'u2028': '\u2028',
      'u2029': '\u2029'
    };

    for (var p in escapes) escapes[escapes[p]] = p;
    var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;
  
    var _ = {
      // Escape a string for HTML interpolation.
      escape: function escape(string) {
        return (''+string)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;')
          .replace(/\//g,'&#x2F;');
      },
  
      // JavaScript micro-templating, similar to John Resig's implementation.
      // Underscore templating handles arbitrary delimiters, preserves
      // whitespace, and correctly escapes quotes within interpolated code.
      template: function template(text, data, settings) {
        // Compile the template source, taking care to escape characters that
        // cannot be included in a string literal and then unescape them in
        // code blocks.
        var source = "__p+='" + text
          .replace(escaper, function(match) {
            return '\\' + escapes[match];
          })
          .replace(settings.escape || noMatch, function(match, code) {
            return "'+\n((__t=(" + unescape(code) + 
                   "))==null?'':_.escape(__t))+\n'";
          }) + "';\n";

        // If a variable is not specified, place data values in local scope.
        if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

        source = "var __t,__p='',__j=Array.prototype.join," +
          "print=function(){__p+=__j.call(arguments,'')};\n" +
          source + "return __p;\n";

        var render = new Function(settings.variable || 'obj', '_', source);
        if (data) return render(data, _);
        var template = function(data) {
          return render.call(this, data, _);
        };

        // Provide the compiled function source as a convenience for
        // precompilation.
        template.source = 'function(' + (settings.variable || 'obj') +
                          '){\n' + source + '}';

        return template;
      }
    };
    
    return _;
  })();
  
  // We want to use "mustache"-style templating, e.g. `hello there {{name}}`.
  var mustacheSettings = {
    escape: /\[\[(.+?)\]\]/g
  };
})(jQuery);
