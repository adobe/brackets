define("funcThree",
    ["funcFour"],
    function (four) {
        var three = function (arg) {
            return arg + "-" + require("funcFour").suffix();
        };

        three.suffix = function () {
            return "THREE_SUFFIX";
        };

        return three;
    }
);
