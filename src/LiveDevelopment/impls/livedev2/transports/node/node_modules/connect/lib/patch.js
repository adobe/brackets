
/*!
 * Connect
 * Copyright(c) 2011 TJ Holowaychuk
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var http = require('http')
  , res = http.ServerResponse.prototype
  , setHeader = res.setHeader
  , _renderHeaders = res._renderHeaders
  , writeHead = res.writeHead;

// apply only once

if (!res._hasConnectPatch) {

  /**
   * Provide a public "header sent" flag
   * until node does.
   *
   * @return {Boolean}
   * @api public
   */

  res.__defineGetter__('headerSent', function(){
    return this._header;
  });

  /**
   * Set header `field` to `val`, special-casing
   * the `Set-Cookie` field for multiple support.
   *
   * @param {String} field
   * @param {String} val
   * @api public
   */

  res.setHeader = function(field, val){
    var key = field.toLowerCase()
      , prev;

    // special-case Set-Cookie
    if (this._headers && 'set-cookie' == key) {
      if (prev = this.getHeader(field)) {
          if (Array.isArray(prev)) {
              val = prev.concat(val);
          } else if (Array.isArray(val)) {
              val = val.concat(prev);
          } else {
              val = [prev, val];
          }
      }
    // charset
    } else if ('content-type' == key && this.charset) {
      val += '; charset=' + this.charset;
    }

    return setHeader.call(this, field, val);
  };

  /**
   * Proxy to emit "header" event.
   */

  res._renderHeaders = function(){
    if (!this._emittedHeader) this.emit('header');
    this._emittedHeader = true;
    return _renderHeaders.call(this);
  };

  res.writeHead = function(statusCode, reasonPhrase, headers){
    if (typeof reasonPhrase === 'object') headers = reasonPhrase;
    if (typeof headers === 'object') {
      Object.keys(headers).forEach(function(key){
        this.setHeader(key, headers[key]);
      }, this);
    }
    if (!this._emittedHeader) this.emit('header');
    this._emittedHeader = true;
    return writeHead.call(this, statusCode, reasonPhrase);
  };

  res._hasConnectPatch = true;
}
