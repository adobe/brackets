module.exports = Negotiator;
Negotiator.Negotiator = Negotiator;

function Negotiator(request) {
  if (!(this instanceof Negotiator)) return new Negotiator(request);
  this.request = request;
}

var set = { charset: 'accept-charset',
            encoding: 'accept-encoding',
            language: 'accept-language',
            mediaType: 'accept' };


function capitalize(string){
  return string.charAt(0).toUpperCase() + string.slice(1);
}

Object.keys(set).forEach(function (k) {
  var header = set[k],
      method = require('./'+k+'.js'),
      singular = k,
      plural = k + 's';

  Negotiator.prototype[plural] = function (available) {
    return method(this.request.headers[header], available);
  };

  Negotiator.prototype[singular] = function(available) {
    var set = this[plural](available);
    if (set) return set[0];
  };

  // Keep preferred* methods for legacy compatibility
  Negotiator.prototype['preferred'+capitalize(plural)] = Negotiator.prototype[plural];
  Negotiator.prototype['preferred'+capitalize(singular)] = Negotiator.prototype[singular];
})
