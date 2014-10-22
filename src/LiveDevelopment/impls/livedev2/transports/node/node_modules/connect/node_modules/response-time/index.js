
/*!
 * Connect - responseTime
 * Copyright(c) 2011 TJ Holowaychuk
 * MIT Licensed
 */

/**
 * Reponse time:
 *
 * Adds the `X-Response-Time` header displaying the response
 * duration in milliseconds.
 *
 * @return {Function}
 * @api public
 */

module.exports = function responseTime(){
  return function(req, res, next){
    next = next || noop;
    if (res._responseTime) return next();
    var writeHead = res.writeHead;
    var start = Date.now();
    res._responseTime = true;
    res.writeHead = function(){
      var duration = Date.now() - start;
      res.setHeader('X-Response-Time', duration + 'ms');
      writeHead.apply(res, arguments);
    };
    next();
  };
};

function noop() {};