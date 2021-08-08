require({
        baseUrl: requirejs.isBrowser ? "./" : "./remoteUrls/"
    },
    ["require", "jqwrap"],
    function(require, jqwrap) {
        doh.register(
            "remoteUrls",
            [
                function remoteUrls(t){
                    t.is(true, jqwrap.isFunction);
                }
            ]
        );

        doh.run();
    }
);
