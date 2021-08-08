!function (name, definition) {
  if (typeof module != 'undefined') module.exports = definition()
  else if (typeof define == 'function' && typeof define.amd == 'object') define(name, definition)
  else this[name] = definition()
}('eye', function() {
    return {
        name: 'eye'
    }
})
