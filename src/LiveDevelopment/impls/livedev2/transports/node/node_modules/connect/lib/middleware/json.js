
/*!
 * Connect - json
 * Copyright(c) 2010 Sencha Inc.
 * Copyright(c) 2011 TJ Holowaychuk
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var utils = require('../utils');
var getBody = require('raw-body');

/**
 * JSON:
 *
 * Parse JSON request bodies, providing the
 * parsed object as `req.body`.
 *
 * Options:
 *
 *   - `strict`  when `false` anything `JSON.parse()` accepts will be parsed
 *   - `reviver`  used as the second "reviver" argument for JSON.parse
 *   - `limit`  byte limit [1mb]
 *
 * @param {Object} options
 * @return {Function}
 * @api public
 */

exports = module.exports = function(options){
  options = options || {};
  var strict = options.strict !== false;
  var verify = typeof options.verify === 'function' && options.verify;

  return function json(req, res, next) {
    if (req._body) return next();
    req.body = req.body || {};

    if (!utils.hasBody(req)) return next();

    // check Content-Type
    if (!exports.regexp.test(utils.mime(req))) return next();

    // flag as parsed
    req._body = true;

    // parse
    getBody(req, {
      limit: options.limit || '1mb',
      length: req.headers['content-length'],
      encoding: 'utf8'
    }, function (err, buf) {
      if (err) return next(err);

      if (verify) {
        try {
          verify(req, res, buf)
        } catch (err) {
          if (!err.status) err.status = 403;
          return next(err);
        }
      }

      var first = buf.trim()[0];

      if (0 == buf.length) {
        return next(utils.error(400, 'invalid json, empty body'));
      }

      if (strict && '{' != first && '[' != first) return next(utils.error(400, 'invalid json'));
      try {
        req.body = JSON.parse(buf, options.reviver);
      } catch (err){
        err.body = buf;
        err.status = 400;
        return next(err);
      }
      next();
    })
  };
};

exports.regexp = /^application\/([\w!#\$%&\*`\-\.\^~]*\+)?json$/i;

