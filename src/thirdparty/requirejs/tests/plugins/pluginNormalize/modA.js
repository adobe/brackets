define(function() {
  return {
    load: function(name, req, onload, config) {
      req([name + '-foo'], onload, onload.error);
    }
  }
});
