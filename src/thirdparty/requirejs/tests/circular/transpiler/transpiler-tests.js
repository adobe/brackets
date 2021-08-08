require({
        baseUrl: requirejs.isBrowser ? './' : './circular/transpiler',
        paths: {
            'text': '../../../../text/text',
            'refine': '../../plugins/fromText/refine'
        }
    },
    ["require", "refine!a", "refine!b", "refine!d"],
    function(require, a, b, d) {
        doh.register(
            "circularTranspiler",
            [
                function circularTranspiler(t) {
                    t.is("a", a.name);
                    t.is("b", a.b.name);
                    t.is("c", a.b.c.name);
                    t.is("b", b.name);
                    t.is("c", b.c.name);
                    t.is("ed", d());
                 }
            ]
        );
        doh.run();
    }
);
