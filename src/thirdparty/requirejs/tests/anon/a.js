define(function (require) {
    var b =  require("sub/b");
    return {
        name: "a",
        bName: b.f()
    };
});
