define("two", ["one", "three", "one"], function (one, three, one2) {
    return {
        name: "two",
        oneName: one.name,
        oneName2: one2.name,
        threeName: three.name
    };
});
