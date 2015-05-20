(function() {
  var template = document.createElement("div");
  var script = document.querySelector("script[type='text/html']");
  template.innerHTML = script.textContent;

  function exists(v) {
    return v!==null && v!==undefined;
  }

  function templatify(input, macros) {
    if (!macros) return input.replace(/\[\[[^\]]+\]\]/g, '');
    return input.replace(/\[\[([^\]]+)\]\]/g, function(a,b) {
      b = b.split(".");
      rep = macros[b[0]];
      b = b.slice(1);
      while(b && b.length>0 && rep) {
        rep = rep[b.splice(0,1)[0]];
      }
      if (exists(rep)) return rep;
      return '';
    });
  }

  var genericInterval = {
    name: "test",
    msg: "this is a test",
    value: "test",
    selector: "#test .test",
    property: "test",
    start: 0,
    end: 10
  };

  var genericObject = {
    name: "test",
    value: "test",
    start: 0,
    end: 10,
    openTag: genericInterval,
    closeTag: genericInterval,
    cssValue: genericInterval,
    cssSelector: genericInterval,
    cssProperty: genericInterval,
    cssDeclaration: genericInterval,
    cssKeyword: { start: 0, end: 0, value: "@test" },
    interval: genericInterval,
    error: genericInterval
  };

  var xhr = new XMLHttpRequest();
  xhr.open("GET", "en_US.json", true);
  xhr.onload = function() {
    try {
      var obj = JSON.parse(xhr.responseText);
      var errors = Object.keys(obj);
      var div = document.getElementById("entries");
      errors.forEach(function(error) {
        var p = template.cloneNode(true);
        p.querySelector("h1").id = error;
        p.querySelector("h1").textContent = error;
        p.querySelector("p").innerHTML = templatify(obj[error], genericObject);
        p.querySelector("pre").textContent = obj[error];
        div.appendChild(p);
      });
    } catch (e) {
      alert("ERROR: unable to decode locale string as JSON.");
    }
  }
  xhr.onerror = function() {
    alert("ERROR: could not load resource 'en_US.json'.");
  }
  xhr.send(null);
}());
