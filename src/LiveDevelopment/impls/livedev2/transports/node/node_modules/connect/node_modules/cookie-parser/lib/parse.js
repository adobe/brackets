var signature = require('cookie-signature');

/**
 * Parse signed cookies, returning an object
 * containing the decoded key/value pairs,
 * while removing the signed key from `obj`.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

exports.signedCookies = function(obj, secret){
  var ret = {};
  Object.keys(obj).forEach(function(key){
    var val = obj[key];
    if (0 == val.indexOf('s:')) {
      val = signature.unsign(val.slice(2), secret);
      if (val) {
        ret[key] = val;
        delete obj[key];
      }
    }
  });
  return ret;
};

/**
 * Parse JSON cookies.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

exports.JSONCookies = function(obj){
  Object.keys(obj).forEach(function(key){
    var val = obj[key];
    var res = exports.JSONCookie(val);
    if (res) obj[key] = res;
  });
  return obj;
};

/**
 * Parse JSON cookie string
 *
 * @param {String} str
 * @return {Object} Parsed object or null if not json cookie
 * @api private
 */

exports.JSONCookie = function(str) {
  if (0 == str.indexOf('j:')) {
    try {
      return JSON.parse(str.slice(2));
    } catch (err) {
      // no op
    }
  }
};
