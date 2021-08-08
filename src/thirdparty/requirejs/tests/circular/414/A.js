define(
    [
        "exports",
        "./MyClass",
        "./B",
        "./C"
    ],

    function (exports, MyClass, B, C) {

        exports.name = "A";

        exports.say = function(){
            return [MyClass.name, exports.name, B.name, C.name].join(',');
        };

    }

);
