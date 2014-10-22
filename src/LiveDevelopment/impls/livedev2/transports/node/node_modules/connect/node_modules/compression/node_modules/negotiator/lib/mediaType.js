module.exports = preferredMediaTypes;
preferredMediaTypes.preferredMediaTypes = preferredMediaTypes;

function parseAccept(accept) {
  return accept.split(',').map(function(e) {
    return parseMediaType(e.trim());
  }).filter(function(e) {
    return e && e.q > 0;
  });
};

function parseMediaType(s) {
  var match = s.match(/\s*(\S+)\/([^;\s]+)\s*(?:;(.*))?/);
  if (!match) return null;

  var type = match[1],
      subtype = match[2],
      full = "" + type + "/" + subtype,
      params = {},
      q = 1;

  if (match[3]) {
    params = match[3].split(';').map(function(s) {
      return s.trim().split('=');
    }).reduce(function (set, p) {
      set[p[0]] = p[1];
      return set
    }, params);

    if (params.q != null) {
      q = parseFloat(params.q);
      delete params.q;
    }
  }

  return {
    type: type,
    subtype: subtype,
    params: params,
    q: q,
    full: full
  };
}

function getMediaTypePriority(type, accepted) {
  return (accepted.filter(function(a) {
    return specify(type, a);
  }).sort(function (a, b) {
    // revsort
    return a.q > b.q ? -1 : 1;
  })[0] || {q:0}).q;
}

function specifies(spec, type) {
  return spec === '*' || spec === type;
}

function specify(type, spec) {
  var p = parseMediaType(type);

  if (spec.params) {
    var keys = Object.keys(spec.params);
    if (keys.some(function (k) {
      return !specifies(spec.params[k], p.params[k]);
    })) {
      // some didn't specify.
      return null;
    }
  }

  if (specifies(spec.type, p.type) &&
      specifies(spec.subtype, p.subtype)) {
    return spec;
  }
}

function preferredMediaTypes(accept, provided) {
  accept = parseAccept(accept || '');
  if (provided) {
    return provided.map(function(type) {
      return [type, getMediaTypePriority(type, accept)];
    }).filter(function(pair) {
      return pair[1] > 0;
    }).sort(function(a, b) {
      // revsort
      return a[1] === b[1] ? 0 : a[1] > b[1] ? -1 : 1;
    }).map(function(pair) {
      return pair[0];
    });

  } else {
    return accept.sort(function (a, b) {
      // revsort
      return a.q < b.q ? 1 : -1;
    }).map(function(type) {
      return type.full;
    });
  }
}


