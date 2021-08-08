require({
        baseUrl: "../"
    },
    ["require", "simple"],
    function(require, simple) {
        doh.register(
            "dataMain",
            [
                function dataMain(t){
                    t.is("blue", simple.color);
                }
            ]
        );
        doh.run();
    }
);
