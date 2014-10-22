module.exports = compressible

compressible.specs =
compressible.specifications = require('./specifications.json')

compressible.regex =
compressible.regexp = /json|text|javascript|dart|ecmascript|xml/

compressible.get = get

function compressible(type) {
  if (!type || typeof type !== "string") return false
  var i = type.indexOf(';')
    , spec = compressible.specs[~i ? type.slice(0, i) : type]
  return spec ? spec.compressible : compressible.regex.test(type)
}

function get(type) {
  if (!type || typeof type !== "string") return {
    compressible: false,
    sources: [],
    notes: "Invalid type."
  }
  var spec = compressible.specs[type.split(';')[0]]
  return spec ? spec : {
    compressible: compressible.regex.test(type),
    sources: ["compressible.regex"],
    notes: "Automatically generated via regex."
  }
}