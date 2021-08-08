require({
        baseUrl: "./"
    },
    ["a"],
    function(a) {
        doh.register(
            "isBrowser",
            [
                function isBrowser(t){
                    t.is(true, a.isBrowser);
                    t.is(true, requirejs.isBrowser);
                }
            ]
        );
        doh.run();
    }
);
