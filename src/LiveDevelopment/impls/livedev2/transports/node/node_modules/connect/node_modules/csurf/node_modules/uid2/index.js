/**
 * Module dependencies
 */

var crypto = require('crypto');

/**
 * 62 characters in the ascii range that can be used in URLs without special
 * encoding.
 */
var UIDCHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/**
 * Make a Buffer into a string ready for use in URLs
 *
 * @param {String}
 * @returns {String}
 * @api private
 */
function tostr(bytes) {
  var chars, r, i;

  r = [];
  for (i = 0; i < bytes.length; i++) {
    r.push(UIDCHARS[bytes[i] % UIDCHARS.length]);
  }

  return r.join('');
}

/**
 * Generate an Unique Id
 *
 * @param {Number} length  The number of chars of the uid
 * @param {Number} cb (optional)  Callback for async uid generation
 * @api public
 */

function uid(length, cb) {

  if (typeof cb === 'undefined') {
    return tostr(crypto.pseudoRandomBytes(length));
  } else {
    crypto.pseudoRandomBytes(length, function(err, bytes) {
       if (err) return cb(err);
       cb(null, tostr(bytes));
    })
  }
}

/**
 * Exports
 */

module.exports = uid;
