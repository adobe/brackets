require({
        baseUrl: "./",
        paths: {
            "array": "impl/array"
        }
    },
    ["require", "array"],
    function(require, array) {
        doh.register(
            "relativeModuleId",
            [
                function relativeModuleId(t){
                    t.is("impl/array", array.name);
                    t.is("util", array.utilName);
                }
            ]
        );

        doh.run();
    }
);
