define("funcOne",
    ["require", "funcTwo"],
    function (require) {
        var one = function (name) {
            this.name = name;
        };

        one.prototype.getName = function () {
            var inst = new (require("funcTwo"))("-NESTED");
            return this.name + inst.name;
        };

        return one;
    }
);
