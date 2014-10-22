/*!
 * Connect - multipart
 * Copyright(c) 2010 Sencha Inc.
 * Copyright(c) 2011 TJ Holowaychuk
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var multiparty = require('multiparty')
  , _limit = require('./limit')
  , utils = require('../utils')
  , qs = require('qs');

/**
 * Multipart:
 *
 * Status: Deprecated. The multipart parser will be removed in Connect 3.0.
 * Please use one of the following parsers/middleware directly:
 *
 *   - [formidable](https://github.com/felixge/node-formidable)
 *   - [connect-multiparty](https://github.com/superjoe30/connect-multiparty) or [multiparty]
 *   - [connect-busboy](https://github.com/mscdex/connect-busboy) or [busboy](https://github.com/mscdex/busboy)
 *
 * Parse multipart/form-data request bodies,
 * providing the parsed object as `req.body`
 * and `req.files`.
 *
 * Configuration:
 *
 *  The options passed are merged with [multiparty](https://github.com/superjoe30/node-multiparty)'s
 *  `Form` object, allowing you to configure the upload directory,
 *  size limits, etc. For example if you wish to change the upload dir do the following.
 *
 *     app.use(connect.multipart({ uploadDir: path }));
 *
 * Options:
 *
 *   - `limit`  byte limit defaulting to [100mb]
 *   - `defer`  defers processing and exposes the multiparty form object as `req.form`.
 *              `next()` is called without waiting for the form's "end" event.
 *              This option is useful if you need to bind to the "progress" or "part" events, for example.
 *
 * Temporary Files:
 *
 *  By default temporary files are used, stored in `os.tmpDir()`. These
 *  are not automatically garbage collected, you are in charge of moving them
 *  or deleting them. When `defer` is not used and these files are created you
 *  may refernce them via the `req.files` object.
 *
 *     req.files.images.forEach(function(file){
 *       console.log('  uploaded : %s %skb : %s', file.originalFilename, file.size / 1024 | 0, file.path);
 *     });
 *
 *  It is highly recommended to monitor and clean up tempfiles in any production
 *  environment, you may use tools like [reap](https://github.com/visionmedia/reap)
 *  to do so.
 *
 * Streaming:
 *
 *  When `defer` is used files are _not_ streamed to tmpfiles, you may
 *  access them via the "part" events and stream them accordingly:
 *
 *     req.form.on('part', function(part){
 *       // transfer to s3 etc
 *       console.log('upload %s %s', part.name, part.filename);
 *       var out = fs.createWriteStream('/tmp/' + part.filename);
 *       part.pipe(out);
 *     });
 *
 *     req.form.on('close', function(){
 *       res.end('uploaded!');
 *     });
 *
 * @param {Object} options
 * @return {Function}
 * @api public
 */

exports = module.exports = function(options){
  options = options || {};

  if (process.env.NODE_ENV !== 'test') {
    console.warn('connect.multipart() will be removed in connect 3.0');
    console.warn('visit https://github.com/senchalabs/connect/wiki/Connect-3.0 for alternatives');
  }

  var limit = _limit(options.limit || '100mb');

  return function multipart(req, res, next) {
    if (req._body) return next();
    req.body = req.body || {};
    req.files = req.files || {};

    if (!utils.hasBody(req)) return next();

    // ignore GET
    if ('GET' == req.method || 'HEAD' == req.method) return next();

    // check Content-Type
    if ('multipart/form-data' != utils.mime(req)) return next();

    // flag as parsed
    req._body = true;

    // parse
    limit(req, res, function(err){
      if (err) return next(err);

      var form = new multiparty.Form(options)
        , data = {}
        , files = {}
        , done;

      Object.keys(options).forEach(function(key){
        form[key] = options[key];
      });

      function ondata(name, val, data){
        if (Array.isArray(data[name])) {
          data[name].push(val);
        } else if (data[name]) {
          data[name] = [data[name], val];
        } else {
          data[name] = val;
        }
      }

      form.on('field', function(name, val){
        ondata(name, val, data);
      });

      if (!options.defer) {
        form.on('file', function(name, val){
          val.name = val.originalFilename;
          val.type = val.headers['content-type'] || null;
          ondata(name, val, files);
        });
      }

      form.on('error', function(err){
        if (!options.defer) {
          err.status = 400;
          next(err);
        }
        done = true;
      });

      form.on('close', function(){
        if (done) return;
        try {
          req.body = qs.parse(data);
          req.files = qs.parse(files);
        } catch (err) {
          form.emit('error', err);
          return;
        }
        if (!options.defer) next();
      });

      form.parse(req);

      if (options.defer) {
        req.form = form;
        next();
      }
    });
  }
};
