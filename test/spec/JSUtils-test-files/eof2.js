function unclosed() {
    var foo;
    if (foo) {
        alert("bar");
    }
    alert("something } else");
    