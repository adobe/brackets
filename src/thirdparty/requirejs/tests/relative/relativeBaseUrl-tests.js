//Use a property on require so if the test runs in node, it is visible.
//Remove it when done with the test.
require.relativeBaseUrlCounter = 0;

require({
        baseUrl: requirejs.isBrowser ? "./" : "./relative/"
    },
    ["./top", "top"],
    function(top1, top2) {
        doh.register(
            "relativeBaseUrl",
            [
                function relativeBaseUrl(t){
                    t.is(top1.id, top2.id);
                    t.is(1, require.relativeBaseUrlCounter);

                    delete require.relativeBaseUrlCounter;
                }
            ]
        );

        doh.run();
    }
);
