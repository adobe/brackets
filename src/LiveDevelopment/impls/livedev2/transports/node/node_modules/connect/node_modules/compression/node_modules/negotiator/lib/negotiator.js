module.exports = Negotiator;
Negotiator.Negotiator = Negotiator;

function Negotiator(request) {
  if (!(this instanceof Negotiator)) return new Negotiator(request);
  this.request = request;
}

var set = { preferredCharset: [require('./charset.js'), 'accept-charset'],
            preferredEncoding: [require('./encoding.js'), 'accept-encoding'],
            preferredLanguage: [require('./language.js'), 'accept-language'],
            preferredMediaType: [require('./mediaType.js'), 'accept'] };

Object.keys(set).forEach(function (k) {
  var mh = set[k],
      method = mh[0],
      header = mh[1],
      singular = k,
      plural = k + 's';

  Negotiator.prototype[plural] = function (available) {
    return method(this.request.headers[header], available);
  };

  Negotiator.prototype[singular] = function(available) {
    var set = this[plural](available);
    if (set) return set[0];
  };
})
