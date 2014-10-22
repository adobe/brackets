var cookie = require('cookie');
var parse = require('./lib/parse');

/**
 * Parse _Cookie_ header and populate `req.cookies`
 * with an object keyed by the cookie names. Optionally
 * you may enabled signed cookie support by passing
 * a `secret` string, which assigns `req.secret` so
 * it may be used by other middleware.
 *
 * Examples:
 *
 *     connect()
 *       .use(connect.cookieParser('optional secret string'))
 *       .use(function(req, res, next){
 *         res.end(JSON.stringify(req.cookies));
 *       })
 *
 * @param {String} secret
 * @return {Function}
 * @api public
 */

module.exports = function cookieParser(secret, opt){
  return function cookieParser(req, res, next) {
    if (req.cookies) return next();
    var cookies = req.headers.cookie;

    req.secret = secret;
    req.cookies = {};
    req.signedCookies = {};

    if (cookies) {
      try {
        req.cookies = cookie.parse(cookies, opt);
        if (secret) {
          req.signedCookies = parse.signedCookies(req.cookies, secret);
          req.signedCookies = parse.JSONCookies(req.signedCookies);
        }
        req.cookies = parse.JSONCookies(req.cookies);
      } catch (err) {
        err.status = 400;
        return next(err);
      }
    }
    next();
  };
};
