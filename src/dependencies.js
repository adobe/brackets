window.setTimeout(function () {
    var deps = { "Mustache": window.Mustache, "jQuery": window.$, "CodeMirror": window.CodeMirror, "RequireJS": window.require };
    var key, allOK = true;
    for (key in deps) {
        if (!deps[key]) {
            allOK = false;
            break;
        }
    }
    if (allOK) {
        return;
    }
    document.write("<h1>Missing libraries</h1>");
    document.write("<p>Oops! One or more required libraries could not be found.</p>");
    document.write("<ul>");
    for (key in deps) {
        if (!deps[key]) {
            document.write("<li>" + key + "</li>");
        }
    }
    document.write("</ul>");
    document.write("<p>If you're running from a local copy of the Brackets source, please make sure submodules are updated by running:</p>");
    document.write("<pre>git submodule update --init</pre>");
    document.write("<p>If you're still having problems, please contact us via one of the channels mentioned at the bottom of the <a target=\"blank\" href=\"../README.md\">README</a>.</p>");
    document.write("<p><a href=\"#\" onclick=\"window.location.reload()\">Reload Brackets</a></p>");
}, 1000);