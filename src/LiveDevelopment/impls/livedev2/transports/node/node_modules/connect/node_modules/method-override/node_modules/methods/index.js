
var http = require('http');

if (http.METHODS) {
  module.exports = http.METHODS.map(function(method){
    return method.toLowerCase();
  });

  return;
}

module.exports = [
  'get',
  'post',
  'put',
  'head',
  'delete',
  'options',
  'trace',
  'copy',
  'lock',
  'mkcol',
  'move',
  'propfind',
  'proppatch',
  'unlock',
  'report',
  'mkactivity',
  'checkout',
  'merge',
  'm-search',
  'notify',
  'subscribe',
  'unsubscribe',
  'patch',
  'search'
];
