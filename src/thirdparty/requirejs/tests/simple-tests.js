require({
        baseUrl: "./"
    },
    ["require", "map", "simple", "dimple", "func"],
    function(require, map, simple, dimple, func) {
        doh.register(
            "simple",
            [
                function colors(t){
                    t.is("map", map.name);
                    t.is("blue", simple.color);
                    t.is("dimple-blue", dimple.color);
                    t.is("You called a function", func());
                }
            ]
        );

        //In rhino there is no more simple tests, but in web browser there is.
        if (typeof moreSimpleTests === 'undefined') {
            doh.run();
        }
    }
);
