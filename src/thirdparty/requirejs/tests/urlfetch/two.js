define("one", {
    name: "one"
});

define("two", ["one"], function (one) {
    return {
        name: "two",
        oneName: "one"
    };
});
