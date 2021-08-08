require.config({
    config: {
        foo: {
            related: 'bar'
        }
    }
});

require(["foo"], function (foo) {
    doh.register(
        "specialDeps",
        [
            function specialDeps(t) {
                t.is("foo", foo.name);
                t.is("bar", foo.related);
            }
        ]
    );
    doh.run();
});
