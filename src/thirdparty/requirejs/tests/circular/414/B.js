define(
    [
        "exports",
        "./MyClass",
        "./A",
        "./C"
    ],

    function (exports, MyClass, A, C) {

        exports.name = "B";

        exports.say = function(){
            return [MyClass.name, A.name, exports.name, C.name].join(',');
        };

    }

);