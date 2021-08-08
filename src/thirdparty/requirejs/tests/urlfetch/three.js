define("three", {
    name: "three"
});

define("four", ["three"], function (three) {
    return {
        name: "four",
        threeName: "three"
    };
});
