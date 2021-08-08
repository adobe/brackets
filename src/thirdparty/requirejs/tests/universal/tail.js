!function (name, definition) {
  if (typeof module != 'undefined') module.exports = definition()
  else if (typeof define == 'function' && typeof define.amd == 'object') define('tail', function(){return definition()})
  else this[name] = definition()
}('tail', function() {
    return {
        name: 'tail'
    }
})
