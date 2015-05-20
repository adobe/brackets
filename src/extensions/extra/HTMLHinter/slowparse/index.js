var xhr = new XMLHttpRequest();
xhr.open("GET", "locale/en_US.json", true);
xhr.onreadystatechange = function() {
  if(xhr.readyState !== 4 || (xhr.status !== 0 && xhr.status !== 200)) return;

  var strings = xhr.responseText;
  var stringmap = JSON.parse(strings);

  var input = document.querySelector(".text.pane"),
      errors = document.querySelector(".error.pane"),
      preview = document.querySelector(".preview.pane");

  var frame = document.createElement("iframe");
  preview.innerHTML = "";
  preview.appendChild(frame);
  var fdoc = frame.contentDocument;

  var bePre = function(v) { return v.replace(/</g,'&lt;').replace(/>/g,'&gt;'); };
  var unPre = function(v) { return v.replace(/&lt;/g,'<').replace(/&gt;/g,'>'); };

  var hoverHandler = function(basedata) {
    return function(evt) {
      var target = evt.target;
      var hl = target.getAttribute("data-highlight");
      if(!hl) return;
      var values = hl.split(",").map(function(v) { return parseInt(v,10); });
      var start = values[0];
      var end = values[1];
      var pre = fdoc.querySelector("pre");
      var marked = basedata;
      var marked = bePre(marked.slice(0,start) + "<highlight>" + marked.slice(start, end) + "</highlight>" + marked.slice(end));
      marked = marked.replace("&lt;highlight&gt;", "<span class='highlight'>");
      marked = marked.replace("&lt;/highlight&gt;", "</span>");
      pre.innerHTML = marked;
    };
  };


  var setPreview = function(data, original) {
    fdoc.open();
    fdoc.write(data);
    fdoc.write("<style>hr { border: solid grey; width: 100%; margin: 0; border-width: 1px 0 0 0; } span.highlight { background: pink; } em[data-highlight] { cursor: pointer; }</style>");
    fdoc.close();
    fdoc.addEventListener("mouseover", hoverHandler(original));
  };

  var resolveError = function(data, error, map) {
    var template = map[error.type];
    var errorHTML = template.replace(/\[\[([^\]]+)\]\]/g, function(_, term) {
      var terms = term.indexOf(".") > -1 ? term.split(".") : [term];
      var value = error;
      while(terms.length > 0) {
        value = value[terms.splice(0,1)[0]];
      }
      return value;
    });
    var suffix = "\n<hr>\n<pre class='hl-target'>\n" + bePre(data) + "</pre>";
    errorHTML += suffix;
    return errorHTML
  };

  var timeout = false;

  var update = function() {
    var data = input.value;
    var result = Slowparse.HTML(document, data);
    if (result.error) {
      errors.textContent = JSON.stringify(result.error, false, 2);
      setPreview(resolveError(data, result.error, stringmap), data);
    } else {
      errors.textContent = '';
      setPreview(data);
    }
  };

  input.addEventListener("keyup", function(evt) {
    setTimeout(update, 100);
  });

  update();
}
xhr.send(null);
