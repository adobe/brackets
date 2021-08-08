define(
    [
        "exports",
        "./A",
        "./B",
        "./C"
    ],

    function (exports, A, B, C) {

        exports.name = "MyClass";

        exports.sayAll = function(){
            return [
                exports.say(),
                A.say(),
                B.say(),
                C.say()
            ].join(':');
        };

        exports.say = function(){
            return [exports.name, A.name, B.name, C.name].join(',');
        };

        return exports;

    }

);
