define("funcFour",
    ["require", "funcThree"],
    function (require) {
        var four = function (arg) {
            return "FOUR called with " + arg;
        };

        four.suffix = function () {
            return require("funcThree").suffix();
        };

        return four;
    }
);
