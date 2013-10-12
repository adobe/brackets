//     Splearch 0.0.1
//     (c) 2012 Stephen Belanger
//     Splearch may be freely distributed under the MIT license.

// Splearch provides a simplified abstraction of regex searching to locate
// patterns in a string. It works very similar to how Dir.glob does in ruby
// in that * matches word characters, ** matches all characters, and braces
// can be used to expand lists to multiple matching possibilities.
// 
// Usage
// -------------
//     Splearch('foo.{bar,baz*}.buz{1..5}')
//     Splearch('foo.*.bux', {
//       braces: false // Can be broken down to 'ranges' and 'lists'
//       , double_splats: false
//     })
//
// Splearch was retrieved from here: https://raw.github.com/Qard/splearch/master/index.js
// It has been modified with an AMD wrapper and support for "?" in wildcards.

define(function (require, exports, module) {
    function Splearch (search, options) {
      options || (options = {})
    
      // First of all, we need to convert the string to lowercase and escape
      // regex characters.
      var str = search.toLowerCase().replace(/[-[\]()+\\^$|#\s]/g, "\\$&")
    
      // Brace expansion and multi-splat support are both optional, but are
      // enabled by default. Ranges are parsed separately from lists and
      // before them, so we can nest ranges within lists like {a,{1..3},c}
      if (options.braces !== false) {
        if (options.ranges !== false) { str = Splearch.replaceRanges(str) }
        if (options.lists !== false) { str = Splearch.replaceLists(str) }
      }
      if (options.double_splats !== false) {
        str = str.replace(/\*\*/g, '.+')
      }
      if (options.question_mark !== false) {
        str = str.replace(/\?/g, ".");
      }
      
      // Lastly, we replace single splats and then build and return a regex object.
      return new RegExp('^' + str.replace(/\*/g, '\\w*'), 'i')
    }
    
    // You can use the range replacer directly, if you so desire; though it's 
    // not recommended. Note than number ordering is preserved in the final
    // string, so {0..9} becomes [0-9], which matches any number.
    Splearch.replaceRanges = function (str) {
      var new_str = str, ranges = new_str.match(/{([^\{\.]*\.\.[^\}]*)}/g) || []
    
      for (var i = 0; i < ranges.length; i++) {
        var block = ranges[i], rep = block
          .replace(/([^{\.])\.\./, '\$1-')
          .replace(/{([^\-]*\-[^}])}/, '[\$1]')
    
        if (block !== rep) { new_str = new_str.replace(block, rep) }
      }
      
      return new_str
    }
    
    // You can also use the list replacer directly, if you so desire; though,
    // again, it's not recommended. Lists should be replaced after ranges,
    // if you want to support nesting ranges within lists. A list can contain
    // any number of values, separated by commas, including ranges and single
    // or double splats.
    Splearch.replaceLists = function (str) {
      var new_str = str, lists = new_str.match(/{([^\{\}]*)}/g) || []
    
      for (var i = 0; i < lists.length; i++) {
        var block = lists[i], rep = block
          .replace(/([^{,]*)*,/g, '\$1|')
          .replace(/{([^}]*)}/, '(\$1)')
    
        if (block !== rep) { new_str = new_str.replace(block, rep) }
      }
      
      return new_str
    }
    
    // Splearch also supports CommonJS, so it works in browsers, and in node.js!
    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
      module.exports = Splearch
    }
});