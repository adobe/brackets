define(
    [
        "exports",
        "./MyClass",
        "./A",
        "./B"
    ],

    function (exports, MyClass, A, B) {

        exports.name = "C";

        exports.say = function(){
            return [MyClass.name, A.name, B.name, exports.name].join(',');
        };

    }

);

