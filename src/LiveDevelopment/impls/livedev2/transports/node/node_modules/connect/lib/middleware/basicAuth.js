/*!
 * Connect - basicAuth
 * Copyright(c) 2010 Sencha Inc.
 * Copyright(c) 2011 TJ Holowaychuk
 * MIT Licensed
 */

/**
 * Basic Auth:
 *
 * Enfore basic authentication by providing a `callback(user, pass)`,
 * which must return `true` in order to gain access. Alternatively an async
 * method is provided as well, invoking `callback(user, pass, callback)`. Populates
 * `req.user`. The final alternative is simply passing username / password
 * strings.
 *
 * See [basic-auth-connect](https://github.com/expressjs/basic-auth-connect)
 *
 * @param {Function|String} callback or username
 * @param {String} realm
 * @api public
 */

module.exports = require('basic-auth-connect');
